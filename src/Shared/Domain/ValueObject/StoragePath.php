<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class StoragePath
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        $value = trim($value);

        if (
            $value === ''
            || str_starts_with($value, '/')
            || str_starts_with($value, '\\')
            || preg_match('/^[A-Za-z]:[\\\\\\/]/', $value) === 1
            || str_contains($value, '..')
        ) {
            throw new InvalidArgumentException('Storage path must be relative and must not contain parent directory traversal.');
        }

        return new self(trim($value, '/'));
    }

    public function value(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
