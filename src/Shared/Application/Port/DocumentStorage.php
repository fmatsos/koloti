<?php

declare(strict_types=1);

namespace App\Shared\Application\Port;

use App\Shared\Domain\ValueObject\StoragePath;

interface DocumentStorage
{
    public function store(StoragePath $path, string $contents): void;

    public function read(StoragePath $path): string;

    public function delete(StoragePath $path): void;
}
