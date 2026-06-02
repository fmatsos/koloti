<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class HumanLogin
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        $value = strtolower(trim($value));

        if (!preg_match('/^[a-z][a-z0-9._-]{2,31}$/', $value)) {
            throw new InvalidArgumentException('Human login must be 3 to 32 lowercase letters, numbers, dots, underscores, or dashes, starting with a letter.');
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
