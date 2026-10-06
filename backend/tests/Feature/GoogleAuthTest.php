<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;
use Mockery;
use Tests\TestCase;

final class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.client_id' => 'google-client-id.apps.googleusercontent.com',
            'services.google.client_secret' => 'google-client-secret',
            'services.google.redirect' => 'http://127.0.0.1:8000/api/v1/auth/google/callback',
        ]);
    }

    private function mockGoogle(string $id, string $email, string $name = 'Google User'): void
    {
        $google = new GoogleUser;
        $google->id = $id;
        $google->email = $email;
        $google->name = $name;
        $provider = Mockery::mock();
        $provider->shouldReceive('stateless')->once()->andReturnSelf();
        $provider->shouldReceive('user')->once()->andReturn($google);
        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);
    }

    private function callGoogleCallback(string $state = 'safe-state', string $intent = 'sign_in', bool $expectsJson = true)
    {
        Cache::put('oauth:google:state:'.hash('sha256', $state), [
            'intent' => $intent,
        ], 600);

        $url = '/api/v1/auth/google/callback?state='.$state.'&code=google-code';

        return $expectsJson ? $this->getJson($url) : $this->get($url);
    }

    public function test_google_redirect_stores_intent_in_cache(): void
    {
        $response = $this->getJson('/api/v1/auth/google/redirect?intent=sign_up')->assertOk();
        $targetUrl = $response->json('data.url');
        $this->assertNotEmpty($targetUrl);

        parse_str((string) parse_url($targetUrl, PHP_URL_QUERY), $queryParams);
        $this->assertArrayHasKey('state', $queryParams);

        $cached = Cache::get('oauth:google:state:'.hash('sha256', $queryParams['state']));
        $this->assertIsArray($cached);
        $this->assertSame('sign_up', $cached['intent']);
    }

    public function test_sign_up_intent_with_new_account_succeeds(): void
    {
        $this->mockGoogle('google-1', 'newgoogle@example.com', 'New Google');
        $response = $this->callGoogleCallback('state-signup-new', 'sign_up')
            ->assertOk()
            ->assertJsonStructure(['data' => ['code']]);

        $user = User::whereEmail('newgoogle@example.com')->firstOrFail();
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertNull($user->password);
        $this->assertSame('google-1', $user->google_id);
        $this->assertSame('google', AnalyticsEvent::where('event_name', 'signup_completed')->firstOrFail()->properties['method']);

        $code = $response->json('data.code');
        $this->postJson('/api/v1/auth/google/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'email'], 'meta' => ['token']]);
        $this->postJson('/api/v1/auth/google/exchange', ['code' => $code])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'oauth_code_invalid');
    }

    public function test_sign_up_intent_with_existing_account_fails(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $this->mockGoogle('google-existing', 'existing@example.com', 'Existing User');

        // JSON client test -> 422 account_already_exists
        $this->callGoogleCallback('state-signup-exists', 'sign_up', expectsJson: true)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'account_already_exists');

        // Browser web redirect test -> redirects to /register with error query params
        $this->mockGoogle('google-existing-web', 'existing@example.com', 'Existing User');
        $this->callGoogleCallback('state-signup-exists-web', 'sign_up', expectsJson: false)
            ->assertRedirect()
            ->assertRedirectContains('/register?oauth_code=account_already_exists');
    }

    public function test_sign_in_intent_with_existing_account_succeeds(): void
    {
        $existing = User::factory()->unverified()->create(['email' => 'same@example.com', 'google_id' => null]);
        $this->mockGoogle('google-2', 'same@example.com', $existing->name);

        $response = $this->callGoogleCallback('state-signin-exists', 'sign_in')
            ->assertOk()
            ->assertJsonStructure(['data' => ['code']]);

        $this->assertDatabaseCount('users', 1);
        $this->assertSame('google-2', $existing->fresh()->google_id);
        $this->assertTrue($existing->fresh()->hasVerifiedEmail());
        $this->assertNotNull($response->json('data.code'));
    }

    public function test_sign_in_intent_with_nonexistent_account_fails(): void
    {
        $this->mockGoogle('google-ghost', 'ghost@example.com', 'Ghost User');

        // JSON client test -> 422 account_not_found
        $this->callGoogleCallback('state-signin-ghost', 'sign_in', expectsJson: true)
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'account_not_found');

        // Browser web redirect test -> redirects to /login with error query params
        $this->mockGoogle('google-ghost-web', 'ghost@example.com', 'Ghost User');
        $this->callGoogleCallback('state-signin-ghost-web', 'sign_in', expectsJson: false)
            ->assertRedirect()
            ->assertRedirectContains('/login?oauth_code=account_not_found');
    }

    public function test_google_callback_rejects_missing_or_replayed_state(): void
    {
        $this->getJson('/api/v1/auth/google/callback?state=bad&code=x')
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'oauth_state_invalid');
    }

    public function test_google_callback_rejects_provider_identity_without_email(): void
    {
        $this->mockGoogle('google-no-email', '', 'No Email');
        $this->callGoogleCallback('state-no-email', 'sign_in')
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'oauth_email_missing');
        $this->assertDatabaseCount('users', 0);
    }
}
