<?php

declare(strict_types=1);

use App\Shared\Domain\ValueObject\AggregateId;
use App\Shared\Domain\ValueObject\DateRange;
use App\Shared\Domain\ValueObject\EmailAddress;
use App\Shared\Domain\ValueObject\HumanLogin;
use App\Shared\Domain\ValueObject\QuorumPercentage;
use App\Shared\Domain\ValueObject\StoragePath;
use App\Shared\Domain\ValueObject\VoteWeight;

final readonly class TestAggregateId extends AggregateId
{
}

it('accepts valid email addresses and normalizes surrounding whitespace', function (): void {
    $email = EmailAddress::fromString('  Owner@Example.COM  ');

    expect($email->value())->toBe('owner@example.com')
        ->and((string) $email)->toBe('owner@example.com');
});

it('rejects invalid email addresses', function (string $value): void {
    EmailAddress::fromString($value);
})->with([
    '',
    'not-an-email',
    'owner@example',
    'owner @example.com',
])->throws(InvalidArgumentException::class);

it('accepts human logins with predictable lowercase formatting', function (): void {
    $login = HumanLogin::fromString('  Jane.Doe-42  ');

    expect($login->value())->toBe('jane.doe-42')
        ->and((string) $login)->toBe('jane.doe-42');
});

it('rejects malformed human logins', function (string $value): void {
    HumanLogin::fromString($value);
})->with([
    '',
    'ab',
    '42-jane',
    'jane doe',
    'jane/doe',
])->throws(InvalidArgumentException::class);

it('only accepts positive vote weights', function (): void {
    expect(VoteWeight::fromInt(1)->value())->toBe(1)
        ->and(VoteWeight::fromInt(7)->value())->toBe(7);
});

it('rejects non-positive vote weights', function (): void {
    VoteWeight::fromInt(0);
})->throws(InvalidArgumentException::class);

it('bounds quorum percentages from one to one hundred', function (): void {
    expect(QuorumPercentage::fromInt(1)->value())->toBe(1)
        ->and(QuorumPercentage::fromInt(50)->value())->toBe(50)
        ->and(QuorumPercentage::fromInt(100)->value())->toBe(100);
});

it('rejects quorum percentages outside the inclusive range', function (int $value): void {
    QuorumPercentage::fromInt($value);
})->with([0, 101])->throws(InvalidArgumentException::class);

it('keeps date ranges immutable and ordered', function (): void {
    $start = new DateTime('2026-01-10 09:00:00');
    $end = new DateTime('2026-01-20 18:00:00');

    $range = DateRange::fromDates($start, $end);
    $start->modify('+10 days');

    expect($range->start()->format('Y-m-d'))->toBe('2026-01-10')
        ->and($range->end()->format('Y-m-d'))->toBe('2026-01-20')
        ->and($range->contains(new DateTimeImmutable('2026-01-15')))->toBeTrue()
        ->and($range->contains(new DateTimeImmutable('2026-01-25')))->toBeFalse();
});

it('rejects date ranges with an end before the start', function (): void {
    DateRange::fromDates(new DateTimeImmutable('2026-02-01'), new DateTimeImmutable('2026-01-31'));
})->throws(InvalidArgumentException::class);

it('accepts normalized relative storage paths', function (): void {
    $path = StoragePath::fromString(' documents/2026/report.pdf ');

    expect($path->value())->toBe('documents/2026/report.pdf')
        ->and((string) $path)->toBe('documents/2026/report.pdf');
});

it('rejects absolute or traversing storage paths', function (string $value): void {
    StoragePath::fromString($value);
})->with([
    '',
    '/etc/passwd',
    '\\server\\share\\file.pdf',
    'C:\\Windows\\system.ini',
    '../documents/report.pdf',
    'documents/../report.pdf',
])->throws(InvalidArgumentException::class);

it('validates aggregate ids as UUID strings', function (): void {
    $id = TestAggregateId::fromString('018f1f56-7fc2-7b2d-8e0a-94f48105f42f');

    expect($id->value())->toBe('018f1f56-7fc2-7b2d-8e0a-94f48105f42f')
        ->and((string) $id)->toBe('018f1f56-7fc2-7b2d-8e0a-94f48105f42f');
});

it('rejects malformed aggregate ids', function (): void {
    TestAggregateId::fromString('not-a-uuid');
})->throws(InvalidArgumentException::class);
