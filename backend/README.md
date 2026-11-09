# Backend – Django 5 + Django REST Framework

See the [main README](../README.md) for the full project description and the Docker setup.

Useful commands (inside the `backend` container):

```bash
python manage.py migrate
python manage.py seed_db --amount=50        # sample products
python manage.py search_index --rebuild -f  # rebuild Elasticsearch index
pytest --cov                                # run tests with coverage
```

API documentation: `http://localhost:8000/api/docs/` (Swagger) and `/api/redoc/`.
