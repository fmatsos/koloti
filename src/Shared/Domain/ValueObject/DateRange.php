<?php

declare(strict_types=1);

namespace App\Shared\Domain\ValueObject;

use DateTimeImmutable;
use DateTimeInterface;
use InvalidArgumentException;

final readonly class DateRange
{
    private function __construct(
        private DateTimeImmutable $start,
        private DateTimeImmutable $end,
    ) {
    }

    public static function fromDates(DateTimeInterface $start, DateTimeInterface $end): self
    {
        $start = DateTimeImmutable::createFromInterface($start);
        $end = DateTimeImmutable::createFromInterface($end);

        if ($end < $start) {
            throw new InvalidArgumentException('Date range end must be greater than or equal to start.');
        }

        return new self($start, $end);
    }

    public function start(): DateTimeImmutable
    {
        return $this->start;
    }

    public function end(): DateTimeImmutable
    {
        return $this->end;
    }

    public function contains(DateTimeInterface $date): bool
    {
        $date = DateTimeImmutable::createFromInterface($date);

        return $date >= $this->start && $date <= $this->end;
    }
}
