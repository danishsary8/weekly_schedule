<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\GoogleExchangeRequest;
use App\Http\Resources\UserResource;
use App\Services\GoogleAuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use RuntimeException;

final class GoogleAuthController extends Controller
{
    public function __construct(private readonly GoogleAuthService $google) {}

    public function redirect(Request $request): JsonResponse
    {
        if (empty(config('services.google.client_id')) || empty(config('services.google.client_secret')) || empty(config('services.google.redirect'))) {
            return ApiResponse::error('oauth_not_configured', 'Google sign-in is not fully configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in the backend .env file.', 503);
        }

        $intent = $request->string('intent')->value() === 'sign_up' ? 'sign_up' : 'sign_in';

        return ApiResponse::success(['url' => $this->google->authorizationUrl($intent)]);
    }

    public function callback(Request $request): JsonResponse|RedirectResponse
    {
        try {
            $code = $this->google->callback((string) $request->query('state', ''));
        } catch (RuntimeException $exception) {
            [$error,$message] = array_pad(explode('|', $exception->getMessage(), 2), 2, 'Google sign-in could not be completed.');

            return $this->failure($request, $error, $message);
        }
        if ($request->expectsJson()) {
            return ApiResponse::success(['code' => $code]);
        }

        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').'/auth/google/callback?code='.urlencode($code));
    }

    public function exchange(GoogleExchangeRequest $request): JsonResponse
    {
        $result = $this->google->exchange($request->string('code')->value());
        if ($result === null) {
            return ApiResponse::error('oauth_code_invalid', 'This Google sign-in code is invalid or expired.', 422);
        }

        return ApiResponse::success(new UserResource($result['user']), ['token' => $result['token'], 'token_type' => 'Bearer']);
    }

    private function failure(Request $request, string $code, string $message): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return ApiResponse::error($code, $message, 422);
        }

        $path = $code === 'account_already_exists' ? '/register' : '/login';
        $query = http_build_query([
            'oauth_code' => $code,
            'oauth_provider' => 'Google',
            'oauth_error' => $message,
        ]);

        return redirect()->away(rtrim((string) config('app.frontend_url'), '/').$path.'?'.$query);
    }
}
