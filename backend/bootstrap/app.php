<?php

declare(strict_types=1);

use App\Exceptions\ApiException;
use App\Http\Middleware\EnsureAnalyticsAdmin;
use App\Http\Middleware\RequireVerifiedEmail;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Sentry\Laravel\Integration as SentryIntegration;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API routes are stateless; Sanctum tokens travel in the Authorization header.
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
        $middleware->alias([
            'verified.api' => RequireVerifiedEmail::class,
            'analytics.admin' => EnsureAnalyticsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        SentryIntegration::handles($exceptions);
        $exceptions->dontReport([
            ApiException::class,
            ValidationException::class,
            AuthenticationException::class,
            AuthorizationException::class,
            ModelNotFoundException::class,
            NotFoundHttpException::class,
            TooManyRequestsHttpException::class,
        ]);
        /*
         * Central API error rendering. Every failure funnels through here so the
         * error envelope is guaranteed consistent instead of being rebuilt in
         * individual controllers.
         */
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            // Domain exceptions carry their own code/status/details.
            if ($e instanceof ApiException) {
                return ApiResponse::error($e->errorCode(), $e->getMessage(), $e->status(), $e->details());
            }

            if ($e instanceof HttpResponseException) {
                return $e->getResponse();
            }

            if ($e instanceof ValidationException) {
                return ApiResponse::error(
                    'validation_failed',
                    'The given data was invalid.',
                    HttpResponse::HTTP_UNPROCESSABLE_ENTITY,
                    $e->errors(),
                );
            }

            if ($e instanceof AuthenticationException) {
                return ApiResponse::error(
                    'unauthenticated',
                    'Authentication is required to access this resource.',
                    HttpResponse::HTTP_UNAUTHORIZED,
                );
            }

            if ($e instanceof AuthorizationException) {
                return ApiResponse::error(
                    'forbidden',
                    'You are not allowed to perform this action.',
                    HttpResponse::HTTP_FORBIDDEN,
                );
            }

            if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
                return ApiResponse::error(
                    'not_found',
                    'The requested resource was not found.',
                    HttpResponse::HTTP_NOT_FOUND,
                );
            }

            if ($e instanceof TooManyRequestsHttpException) {
                $headers = $e->getHeaders();

                return ApiResponse::error(
                    'too_many_requests',
                    'Request limit reached. Please wait before trying again.',
                    HttpResponse::HTTP_TOO_MANY_REQUESTS,
                    ['retry_after' => (int) ($headers['Retry-After'] ?? 60)],
                )->withHeaders($headers);
            }

            if ($e instanceof HttpExceptionInterface) {
                return ApiResponse::error(
                    'http_error',
                    $e->getMessage() !== '' ? $e->getMessage() : 'Request could not be completed.',
                    $e->getStatusCode(),
                );
            }

            // Unexpected failures: never leak stack traces in production.
            $debug = (bool) config('app.debug');

            return ApiResponse::error(
                'server_error',
                $debug ? $e->getMessage() : 'An unexpected server error occurred.',
                HttpResponse::HTTP_INTERNAL_SERVER_ERROR,
                $debug ? ['exception' => $e::class] : [],
            );
        });
    })->create();
