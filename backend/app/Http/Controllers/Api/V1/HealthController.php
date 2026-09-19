<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

final class HealthController extends Controller
{
    /**
     * Liveness probe, plus a one-word verdict on the database.
     *
     * Public and unauthenticated by design.
     *
     * Why the database is reported here
     * ---------------------------------
     * This endpoint used to answer `{"status":"ok"}` without touching anything,
     * which made it useless for the failure that actually happens in production:
     * the container boots, Apache serves, health says "ok", and every endpoint
     * that reads data returns 500 because the database host does not resolve.
     * With APP_DEBUG off the cause is invisible from outside, so diagnosing it
     * meant reading deploy logs.
     *
     * The status stays 200 even when the database is down. This path is wired to
     * Render's health check, and failing it would take a container that is
     * otherwise healthy out of service — losing the very endpoint that explains
     * what is wrong. It reports; it does not judge.
     *
     * Only the word "unavailable" is exposed. Driver messages can carry hostnames
     * and credentials, so they stay in the log.
     */
    public function __invoke(): JsonResponse
    {
        return ApiResponse::success([
            'status' => 'ok',
            'database' => $this->databaseStatus(),
        ]);
    }

    private function databaseStatus(): string
    {
        try {
            DB::connection()->select('select 1');

            return 'ok';
        } catch (Throwable) {
            return 'unavailable';
        }
    }
}
