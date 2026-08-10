<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class HealthController extends Controller
{
    /**
     * Lightweight liveness probe. Public (unauthenticated) by design.
     */
    public function __invoke(): JsonResponse
    {
        return ApiResponse::success(['status' => 'ok']);
    }
}
