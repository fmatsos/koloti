<?php

declare(strict_types=1);

use App\Shared\Application\Bus\CommandBus;
use App\Shared\Application\Bus\QueryBus;
use App\Shared\Infrastructure\Bus\MessengerCommandBus;
use App\Shared\Infrastructure\Bus\MessengerQueryBus;
use Symfony\Component\Messenger\Envelope;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Messenger\Stamp\HandledStamp;
use Symfony\Component\Yaml\Yaml;

final class RecordingMessageBus implements MessageBusInterface
{
    public object|null $dispatchedMessage = null;

    public function __construct(private readonly mixed $handledResult = null)
    {
    }

    public function dispatch(object $message, array $stamps = []): Envelope
    {
        $this->dispatchedMessage = $message;
        $envelope = new Envelope($message);

        if ($this->handledResult === null) {
            return $envelope;
        }

        return $envelope->with(new HandledStamp($this->handledResult, 'test_handler'));
    }
}

it('dispatches commands through Symfony Messenger without returning a result', function (): void {
    $messenger = new RecordingMessageBus();
    $command = new stdClass();

    $bus = new MessengerCommandBus($messenger);

    expect($bus)->toBeInstanceOf(CommandBus::class)
        ->and($bus->dispatch($command))->toBeNull()
        ->and($messenger->dispatchedMessage)->toBe($command);
});

it('returns the handled result for queries dispatched through Symfony Messenger', function (): void {
    $messenger = new RecordingMessageBus(['answer' => 42]);
    $query = new stdClass();

    $bus = new MessengerQueryBus($messenger);

    expect($bus)->toBeInstanceOf(QueryBus::class)
        ->and($bus->ask($query))->toBe(['answer' => 42])
        ->and($messenger->dispatchedMessage)->toBe($query);
});

it('configures command and query messenger buses with validation and transaction middleware', function (): void {
    $config = Yaml::parseFile(dirname(__DIR__, 3).'/config/packages/messenger.yaml');
    $messenger = $config['framework']['messenger'] ?? [];

    expect($messenger['default_bus'] ?? null)->toBe('command.bus')
        ->and($messenger['buses']['command.bus']['middleware'] ?? [])->toBe([
            'validation',
            'doctrine_transaction',
        ])
        ->and($messenger['buses']['query.bus']['middleware'] ?? [])->toBe([
            'validation',
        ]);
});
