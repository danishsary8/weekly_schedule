<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ChecklistItem;
use App\Models\ChecklistLog;
use App\Models\DayGroup;
use App\Models\NotificationSetting;
use App\Models\PrayerTimeCache;
use App\Models\TimelineEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_deletion_requires_authentication(): void
    {
        $this->deleteJson('/api/v1/account', ['confirmation' => 'DELETE'])->assertUnauthorized()->assertJsonPath('error.code', 'unauthenticated');
    }

    public function test_account_deletion_requires_exact_confirmation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->deleteJson('/api/v1/account', ['confirmation' => 'delete'])->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_account_deletion_permanently_removes_every_owned_record(): void
    {
        $user = User::factory()->create(['email' => 'delete@example.com']);
        $group = DayGroup::create(['user_id' => $user->id, 'name' => 'Private routine', 'color' => '#0F766E', 'sort_order' => 0]);
        $group->syncWeekdays([1]);
        $entry = TimelineEntry::create(['day_group_id' => $group->id, 'start_time' => '09:00', 'end_time' => '10:00', 'category' => 'Life', 'description' => 'Private block']);
        $item = ChecklistItem::create(['day_group_id' => $group->id, 'label' => 'Private habit']);
        ChecklistLog::create(['user_id' => $user->id, 'checklist_item_id' => $item->id, 'log_date' => '2026-08-03', 'is_checked' => true]);
        NotificationSetting::create(['user_id' => $user->id]);
        PrayerTimeCache::create(['user_id' => $user->id, 'cache_date' => '2026-08-03', 'latitude' => 11.5, 'longitude' => 104.9, 'fajr' => '05:00', 'dhuhr' => '12:00', 'asr' => '15:30', 'maghrib' => '18:15', 'isha' => '19:30']);
        $user->createToken('existing-session');
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'hashed-token', 'created_at' => now()]);
        DB::table('sessions')->insert(['id' => 'session-id', 'user_id' => $user->id, 'ip_address' => '127.0.0.1', 'user_agent' => 'test', 'payload' => 'payload', 'last_activity' => time()]);
        Sanctum::actingAs($user);
        $this->deleteJson('/api/v1/account', ['confirmation' => 'DELETE'])->assertOk();
        foreach (['users', 'day_groups', 'day_group_weekdays', 'timeline_entries', 'checklist_items', 'checklist_logs', 'notification_settings', 'prayer_time_cache', 'personal_access_tokens', 'password_reset_tokens', 'sessions'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }
}
