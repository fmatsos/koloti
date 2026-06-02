<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class VoteWeight
{
    private function __construct(private int $value)
    {
    }

    public static function fromInt(int $value): self
    {
        if ($value <= 0) {
            throw new InvalidArgumentException('Vote weight must be positive.');
        }

        return new self($value);
    }

    public function value(): int
    {
        return $this->value;
    }
}
