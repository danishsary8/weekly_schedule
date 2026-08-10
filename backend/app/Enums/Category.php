<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mirrors the frontend's CATEGORIES config exactly.
 */
enum Category: string
{
    case Faith = 'Faith';
    case Career = 'Career';
    case Health = 'Health';
    case Language = 'Language';
    case Life = 'Life';
    case Rest = 'Rest';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $c): string => $c->value, self::cases());
    }
}
