<?php

declare(strict_types=1);

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

if (file_exists(dirname(__DIR__).'/config/secrets/prod/prod.decrypt.private.php')) {
    require dirname(__DIR__).'/config/secrets/prod/prod.decrypt.private.php';
}

(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
