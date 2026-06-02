<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class PhoneNumber
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        $value = preg_replace('/[\s().-]+/', '', trim($value)) ?? '';

        if (!preg_match('/^\+?[1-9][0-9]{6,14}$/', $value)) {
            throw new InvalidArgumentException('Phone number is invalid.');
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
