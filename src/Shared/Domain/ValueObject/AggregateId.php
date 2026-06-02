<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use App\Shared\Domain\Exception\InvalidValueObject;

abstract readonly class AggregateId
{
    final protected function __construct(private string $value)
    {
    }

    public static function fromString(string $value): static
    {
        $value = trim($value);

        if (1 !== preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value)) {
            throw new InvalidValueObject('Aggregate id must be a valid UUID.');
        }

        return new static($value);
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
