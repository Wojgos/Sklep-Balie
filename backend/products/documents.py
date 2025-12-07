from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.documents import Document
from django_elasticsearch_dsl.fields import TextField
from .models import Product, AttributeValue


@registry.register_document
class ProductDocument(Document):
    name = TextField()
    description = TextField()

    category = TextField(attr='category.safe_translation_getter("name", any_language=True)')
    attributes_flat = TextField()

    class Index:
        name = 'products'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }

    class Django:
        model = Product
        fields = []

    def prepare_name(self, instance):
        """
        Indeksujemy nazwę we wszystkich dostępnych językach.
        Dzięki temu wpisanie "Balia" lub "Hot Tub" znajdzie ten sam produkt.
        """
        return [t.name for t in instance.translations.all()]

    def prepare_description(self, instance):
        """Indeksujemy opisy we wszystkich językach."""
        return [t.description for t in instance.translations.all()]

    def prepare_attributes_flat(self, instance):
        """
        Zbiera wartości atrybutów ze wszystkich wariantów i wszystkich języków.
        """
        try:
            variant_ids = instance.variants.values_list('id', flat=True)
            all_values = AttributeValue.objects.filter(
                variants__id__in=variant_ids
            ).prefetch_related('translations')

            values_set = set()
            for val in all_values:
                for translation in val.translations.all():
                    if translation.value:
                        values_set.add(translation.value)

            return " ".join(list(values_set))
        except Exception:
            return ""
