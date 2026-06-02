<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class EmailAddress
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        $value = strtolower(trim($value));

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Email address is invalid.');
        }

        return new self($value);
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
