from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.documents import Document
from django_elasticsearch_dsl.fields import TextField
from .models import Product, AttributeValue


@registry.register_document
class ProductDocument(Document):
    category = TextField(attr='category.name')
    attributes_flat = TextField()

    class Index:
        name = 'products'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }

    class Django:
        model = Product

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
            attributes = AttributeValue.objects.filter(
                variants__id__in=variant_ids
            ).values_list('value', flat=True)

            return " ".join(list(set(attributes)))
        except:
            return ""
