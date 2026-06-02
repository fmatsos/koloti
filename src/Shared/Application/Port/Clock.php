<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

use DateTimeImmutable;

interface Clock
{
    public function now(): DateTimeImmutable;
}
