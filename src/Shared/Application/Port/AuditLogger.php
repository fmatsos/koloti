<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

interface AuditLogger
{
    /**
     * @param array<string, mixed> $context
     */
    public function log(string $event, array $context = []): void;
}
