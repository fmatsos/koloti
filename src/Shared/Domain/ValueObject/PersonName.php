<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class PersonName
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        $value = trim(preg_replace('/\s+/', ' ', $value) ?? '');

        if ($value === '' || mb_strlen($value) > 120) {
            throw new InvalidArgumentException('Person name must be between 1 and 120 characters.');
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
