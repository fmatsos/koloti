FROM dunglas/frankenphp:1-php8.4 AS app

WORKDIR /app

RUN install-php-extensions \
    intl \
    opcache \
    pdo_pgsql \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/frankenphp/Caddyfile /etc/caddy/Caddyfile
COPY composer.json composer.lock ./
COPY bin/ bin/
COPY config/ config/
COPY importmap.php ./
COPY public/ public/
COPY src/ src/
COPY templates/ templates/
COPY assets/ assets/

# FrankenPHP serves the Symfony front controller at public/index.php.
RUN composer install --no-interaction --no-progress --prefer-dist --optimize-autoloader --no-dev

ENV APP_ENV=prod
ENV SERVER_NAME=:80
ENV DOCUMENT_STORAGE_PATH=/app/var/storage/documents

RUN mkdir -p var/cache var/log var/storage/documents

EXPOSE 80
