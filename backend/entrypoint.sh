#!/bin/bash

set -e

while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 0.5
done
echo "PostgreSQL works!"

while ! nc -z elasticsearch 9200; do
  sleep 0.5
done
echo "Elasticsearch works!"

sleep 10


# shellcheck disable=SC2199
if [[ "$@" == *"runserver"* ]]; then
    python manage.py migrate

    DATA_EXISTS=$(python manage.py shell -c "from products.models import Product; print(Product.objects.exists())")

    if [ "$DATA_EXISTS" = "False" ]; then
        python manage.py seed_db --amount=50
    fi

    python manage.py search_index --delete -f || true
    python manage.py search_index --rebuild -f
fi


#python manage.py migrate
#
#DATA_EXISTS=$(python manage.py shell -c "from products.models import Product; print(Product.objects.exists())")

#if [ "$DATA_EXISTS" = "False" ]; then
#    python manage.py seed_db --amount=50
#fi

#python manage.py search_index --delete -f || true
#python manage.py search_index --rebuild -f

exec "$@"