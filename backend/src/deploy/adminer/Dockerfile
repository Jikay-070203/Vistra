FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev pkg-config \
    && docker-php-ext-install pdo_sqlite \
    && apt-get purge -y --auto-remove libsqlite3-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY index.php /var/www/html/index.php

EXPOSE 80

