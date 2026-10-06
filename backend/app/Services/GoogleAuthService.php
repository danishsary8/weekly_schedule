<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NotificationSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use RuntimeException;

final class GoogleAuthService
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function authorizationUrl(string $intent = 'sign_in'): string
    {
        $intent = $intent === 'sign_up' ? 'sign_up' : 'sign_in';
        $state = Str::random(64);
        Cache::put('oauth:google:state:'.hash('sha256', $state), [
            'intent' => $intent,
        ], now()->addMinutes(10));

        return Socialite::driver('google')->stateless()->with(['state' => $state, 'prompt' => 'select_account'])->redirect()->getTargetUrl();
    }

    public function callback(string $state): string
    {
        $statePayload = $state === '' ? null : Cache::pull('oauth:google:state:'.hash('sha256', $state));
        if (! is_array($statePayload)) {
            throw new RuntimeException('oauth_state_invalid|Google sign-in expired or could not be verified. Please try again.');
        }
        $intent = ($statePayload['intent'] ?? 'sign_in') === 'sign_up' ? 'sign_up' : 'sign_in';

        try {
            $google = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable) {
            throw new RuntimeException('oauth_failed|Google sign-in could not be completed. Please try again.');
        }

        $email = strtolower((string) $google->getEmail());
        $googleId = (string) $google->getId();
        if ($email === '' || ! $googleId) {
            throw new RuntimeException('oauth_email_missing|Google did not provide a usable verified email address.');
        }

        $result = DB::transaction(function () use ($google, $email, $googleId, $intent): array {
            $user = User::withTrashed()
                ->where('email', $email)
                ->orWhere('google_id', $googleId)
                ->first();

            if ($user?->trashed()) {
                abort(403, 'This account is unavailable.');
            }

            if ($intent === 'sign_up' && $user) {
                throw new RuntimeException('account_already_exists|A Loomora account already exists for this Google account. Please sign in instead.');
            }

            if ($intent === 'sign_in' && ! $user) {
                throw new RuntimeException("account_not_found|We couldn't find a Loomora account for that Google account. Please create an account first.");
            }

            $created = ! $user;
            if ($created) {
                $user = User::forceCreate([
                    'name' => $google->getName() ?: Str::before($email, '@'),
                    'email' => $email,
                    'password' => null,
                    'google_id' => $googleId,
                    'email_verified_at' => now(),
                    'terms_accepted_at' => now(),
                ]);
                NotificationSetting::create(['user_id' => $user->id]);
            } else {
                $user->forceFill([
                    'google_id' => $googleId,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                    'terms_accepted_at' => $user->terms_accepted_at ?? now(),
                ])->save();
                $user->notificationSetting()->firstOrCreate([]);
            }

            return ['user' => $user, 'created' => $created];
        });

        /** @var User $user */
        $user = $result['user'];
        if ($result['created']) {
            $this->analytics->signupCompleted('google', (int) $user->id);
        }

        $code = Str::random(80);
        Cache::put('oauth:google:handoff:'.hash('sha256', $code), [
            'user_id' => $user->id,
            'token' => $user->createToken('google-web')->plainTextToken,
        ], now()->addMinutes(2));

        return $code;
    }

    public function exchange(string $code): ?array
    {
        $handoff = Cache::pull('oauth:google:handoff:'.hash('sha256', $code));
        if (! is_array($handoff)) {
            return null;
        }

        return ['user' => User::findOrFail($handoff['user_id']), 'token' => $handoff['token']];
    }
}
