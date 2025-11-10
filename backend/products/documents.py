# products/documents.py
from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.documents import Document
from django_elasticsearch_dsl.fields import TextField
# Usuwamy importy analizatorów synonimów, których już nie używamy
# from elasticsearch_dsl import analyzer, token_filter

from .models import Product, AttributeValue


# Usuwamy definicje analizatorów i synonimów

@registry.register_document
class ProductDocument(Document):
    """
    Indeks Elasticsearch dla Produktu (wersja przywrócona, bez i18n).
    """

    # Pole 'category' (pobiera 'name' z relacji)
    category = TextField(attr='category.name')

    # Pole 'attributes_flat' (pobierane przez 'prepare_')
    attributes_flat = TextField()

    # --- USUWAMY RĘCZNE DEFINICJE 'name' i 'description' ---
    # name = TextField(...) <-- USUNIĘTE
    # description = TextField() <-- USUNIĘTE

    class Index:
        name = 'products'
        # Wracamy do prostych ustawień (bez niestandardowego analizatora)
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }

    class Django:
        model = Product

        # --- PRZYWRACAMY 'fields' ---
        # Mówimy, aby 'name' i 'description' były indeksowane
        # automatycznie z modelu Product
        fields = [
            'name',
            'description',
        ]

    # --- USUWAMY METODY 'prepare_name' i 'prepare_description' ---

    def prepare_attributes_flat(self, instance):
        """
        Zbiera 'value' atrybutów (wersja bez tłumaczeń).
        """
        try:
            variant_ids = instance.variants.values_list('id', flat=True)
            # Wracamy do pobierania prostego pola 'value'
            attributes = AttributeValue.objects.filter(
                variants__id__in=variant_ids
            ).values_list('value', flat=True)
            return " ".join(list(set(attributes)))
        except:
            return ""