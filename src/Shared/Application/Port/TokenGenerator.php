<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

use App\Shared\Domain\ValueObject\ActivationToken;

interface TokenGenerator
{
    public function generateActivationToken(): ActivationToken;
}
