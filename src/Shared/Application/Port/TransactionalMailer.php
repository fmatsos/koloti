<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

interface TransactionalMailer
{
    public function send(object $message): void;
}
