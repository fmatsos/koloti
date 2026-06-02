<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

interface MarkdownRenderer
{
    public function render(string $markdown): string;
}
