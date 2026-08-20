<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
            'password_confirmation' => 'Str0ng-Routine-Pass!42',
            'terms_accepted' => true,
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'created_at'],
                'meta' => ['token', 'token_type'],
            ])
            ->assertJsonPath('data.email', 'student@example.com')
            ->assertJsonPath('meta.token_type', 'Bearer');

        $this->assertDatabaseHas('users', ['email' => 'student@example.com']);

        // Password must never be returned, and must be hashed at rest.
        $response->assertJsonMissingPath('data.password');
        $this->assertNotSame('Str0ng-Routine-Pass!42', User::first()->password);

        // Defaults are provisioned on registration.
        $this->assertDatabaseCount(NotificationSetting::class, 1);
        $this->assertDatabaseCount('day_groups', 0);
    }

    public function test_register_rejects_duplicate_email_with_422_envelope(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Someone Else',
            'email' => 'taken@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
            'password_confirmation' => 'Str0ng-Routine-Pass!42',
            'terms_accepted' => true,
        ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed')
            ->assertJsonStructure(['error' => ['code', 'message', 'details' => ['email']]]);
    }

    public function test_register_rejects_password_shorter_than_eight_characters(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Weak Pass',
            'email' => 'weak@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
            'terms_accepted' => true,
        ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'validation_failed');
    }

    public function test_login_returns_token_for_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
        ])
            ->assertOk()
            ->assertJsonPath('data.email', 'login@example.com')
            ->assertJsonStructure(['data' => ['id', 'email'], 'meta' => ['token', 'token_type']]);
    }

    public function test_login_with_wrong_password_returns_401_envelope(): void
    {
        User::factory()->create([
            'email' => 'login@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'login@example.com',
            'password' => 'totally-wrong-password',
        ])
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'invalid_credentials')
            ->assertJsonStructure(['error' => ['code', 'message']]);
    }

    public function test_full_register_login_access_logout_flow(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Flow User',
            'email' => 'flow@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
            'password_confirmation' => 'Str0ng-Routine-Pass!42',
            'terms_accepted' => true,
        ])->assertCreated();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'flow@example.com',
            'password' => 'Str0ng-Routine-Pass!42',
        ])->assertOk()->json('meta.token');

        $this->assertIsString($token);

        // Token grants access to a protected endpoint.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'flow@example.com');

        // Logout revokes that token.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('data.message', 'Logged out successfully.');

        $this->assertDatabaseCount('personal_access_tokens', 1); // registration token remains
    }

    public function test_unauthenticated_me_returns_401_not_a_stack_trace(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('error.code', 'unauthenticated')
            ->assertJsonMissingPath('exception');
    }

    public function test_health_endpoint_is_public(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson(['data' => ['status' => 'ok']]);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }
}
