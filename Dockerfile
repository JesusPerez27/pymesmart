FROM php:8.2-apache

RUN docker-php-ext-install mysqli && a2enmod rewrite

WORKDIR /var/www/html
COPY . /var/www/html

RUN chmod +x /var/www/html/docker/start.sh

CMD ["/var/www/html/docker/start.sh"]
