# products/documents.py
from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.documents import Document
from django_elasticsearch_dsl.fields import TextField
from .models import Product, AttributeValue


@registry.register_document
class ProductDocument(Document):
    # Pole 'category' - pobiera nazwę kategorii
    category = TextField(attr='category.name')

    # Pole 'attributes_flat' - zbiera atrybuty (np. "drewno", "akryl")
    attributes_flat = TextField()

    class Index:
        name = 'products'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }

    class Django:
        model = Product

        # Automatycznie indeksuj te pola z modelu Product
        fields = [
            'name',
            'description',
        ]

    def prepare_attributes_flat(self, instance):
        """
        Zbiera unikalne wartości atrybutów ze wszystkich wariantów
        danego produktu i łączy je w jeden tekst do przeszukiwania.
        """
        try:
            variant_ids = instance.variants.values_list('id', flat=True)
            # Pobieramy wartości atrybutów powiązane z tymi wariantami
            attributes = AttributeValue.objects.filter(
                variants__id__in=variant_ids
            ).values_list('value', flat=True)

            # Łączymy unikalne wartości w jeden string
            return " ".join(list(set(attributes)))
        except:
            return ""
