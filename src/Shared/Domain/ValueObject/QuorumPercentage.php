<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use InvalidArgumentException;

final readonly class QuorumPercentage
{
    private function __construct(private int $value)
    {
    }

    public static function fromInt(int $value): self
    {
        if ($value < 1 || $value > 100) {
            throw new InvalidArgumentException('Quorum percentage must be between 1 and 100.');
        }

        return new self($value);
    }

    public function value(): int
    {
        return $this->value;
    }
}
