<?php

declare(strict_types=1);

function projectPath(string $path): string
{
    return dirname(__DIR__).DIRECTORY_SEPARATOR.$path;
}

function fileText(string $path): string
{
    $fullPath = projectPath($path);

    expect($fullPath)->toBeFile();

    return file_get_contents($fullPath) ?: '';
}

it('declares the Symfony 8 PHP 8.4 runtime and development tooling in composer', function (): void {
    $composer = json_decode(fileText('composer.json'), true, flags: JSON_THROW_ON_ERROR);

    expect($composer['require']['php'] ?? null)->toBe('^8.4')
        ->and($composer['require']['symfony/framework-bundle'] ?? null)->toStartWith('^8.0')
        ->and($composer['require']['symfony/runtime'] ?? null)->toStartWith('^8.0')
        ->and($composer['require']['doctrine/orm'] ?? null)->not->toBeNull()
        ->and($composer['require']['doctrine/doctrine-migrations-bundle'] ?? null)->not->toBeNull()
        ->and($composer['require']['symfonycasts/tailwind-bundle'] ?? null)->not->toBeNull()
        ->and($composer['require']['league/commonmark'] ?? null)->not->toBeNull()
        ->and($composer['require']['symfony/html-sanitizer'] ?? null)->not->toBeNull()
        ->and($composer['require-dev']['pestphp/pest'] ?? null)->not->toBeNull()
        ->and($composer['require-dev']['phpstan/phpstan'] ?? null)->not->toBeNull()
        ->and($composer['require-dev']['phpstan/phpstan-symfony'] ?? null)->not->toBeNull()
        ->and($composer['require-dev']['doctrine/doctrine-fixtures-bundle'] ?? null)->not->toBeNull()
        ->and($composer['scripts']['validate'] ?? [])->toContain('composer validate --strict');
});

it('boots Symfony through Runtime from the public front controller', function (): void {
    $index = fileText('public/index.php');

    expect($index)->toContain('vendor/autoload_runtime.php')
        ->and($index)->toContain('App\\Kernel')
        ->and(projectPath('bin/console'))->toBeFile()
        ->and(projectPath('config/bundles.php'))->toBeFile()
        ->and(projectPath('config/packages/framework.yaml'))->toBeFile()
        ->and(projectPath('config/packages/asset_mapper.yaml'))->toBeFile()
        ->and(fileText('templates/base.html.twig'))->toContain("importmap('app')");
});

it('defines Symfony environment variables without Supabase runtime coupling', function (): void {
    $env = fileText('.env.example');

    expect($env)->toContain('APP_ENV=')
        ->and($env)->toContain('APP_SECRET=')
        ->and($env)->toContain('DATABASE_URL=')
        ->and($env)->toContain('MAILER_DSN=')
        ->and($env)->toContain('SERVER_NAME=')
        ->and($env)->toContain('DOCUMENT_STORAGE_PATH=')
        ->and($env)->not->toContain('SUPABASE');
});

it('configures FrankenPHP Caddy to serve Symfony from public index without worker mode', function (): void {
    $dockerfile = fileText('Dockerfile');
    $caddyfile = fileText('docker/frankenphp/Caddyfile');

    expect($dockerfile)->toContain('FROM dunglas/frankenphp')
        ->and($dockerfile)->toContain('public/index.php')
        ->and($caddyfile)->toContain('root * /app/public')
        ->and($caddyfile)->toContain('php_server')
        ->and($caddyfile)->toContain('public/index.php')
        ->and($caddyfile)->toContain('Worker mode is intentionally disabled')
        ->and($caddyfile)->not->toContain('worker ');
});

it('defines app database and persistent document storage services in compose files', function (): void {
    $compose = fileText('compose.yaml');
    $override = fileText('compose.override.yaml');

    expect($compose)->toContain('app:')
        ->and($compose)->toContain('database:')
        ->and($compose)->toContain('postgres:')
        ->and($compose)->toContain('pg_isready')
        ->and($compose)->toContain('database_data:')
        ->and($compose)->toContain('documents_data:')
        ->and($compose)->toContain('/app/var/storage/documents')
        ->and($compose)->toContain('SERVER_NAME')
        ->and($override)->toContain('SERVER_NAME')
        ->and($override)->toContain('APP_ENV: dev');
});
