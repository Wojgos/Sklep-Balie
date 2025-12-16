from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl.documents import Document
from django_elasticsearch_dsl.fields import TextField, KeywordField
from elasticsearch_dsl import analyzer, token_filter
from .models import Product, AttributeValue

# --- 1. DEFINICJA FILTRÓW I ANALIZATORÓW ---

# Filtr synonimów (wspólny dla obu języków)
# Używamy synonym_graph, aby poprawnie obsługiwać frazy wielowyrazowe (np. "hot tub")
synonym_graph_filter = token_filter(
    'synonym_graph_filter',
    type='synonym_graph',
    synonyms_path='analysis/synonyms.txt'
)

english_stemmer_filter = token_filter(
    'english_stemmer_filter',
    type='stemmer',
    name='english'
)

# Analizator POLSKI
polish_analyzer = analyzer(
    'polish_analyzer',
    tokenizer='standard',
    filter=[
        'lowercase',
        synonym_graph_filter,
        # Tu usunęliśmy stemmer, który powodował błąd 400
    ]
)

# Analizator ANGIELSKI (Pełna wersja)
english_analyzer = analyzer(
    'english_analyzer',
    tokenizer='standard',
    filter=[
        'lowercase',
        synonym_graph_filter,
        english_stemmer_filter  # Tu stemming działa
    ]
)


@registry.register_document
class ProductDocument(Document):
    # --- 2. POLA DOKUMENTU ---

    name_pl = TextField(analyzer=polish_analyzer)
    name_en = TextField(analyzer=english_analyzer)

    description_pl = TextField(analyzer=polish_analyzer)
    description_en = TextField(analyzer=english_analyzer)

    category = TextField()
    attributes_flat = TextField(analyzer='standard')

    class Index:
        name = 'products'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
        }

    class Django:
        model = Product
        fields = []

    # --- 3. METODY PRZYGOTOWANIA DANYCH ---

    def prepare_name_pl(self, instance):
        return instance.safe_translation_getter('name', language_code='pl')

    def prepare_name_en(self, instance):
        return instance.safe_translation_getter('name', language_code='en')

    def prepare_description_pl(self, instance):
        return instance.safe_translation_getter('description', language_code='pl')

    def prepare_description_en(self, instance):
        return instance.safe_translation_getter('description', language_code='en')

    def prepare_category(self, instance):
        return instance.category.safe_translation_getter('name', any_language=True)

    def prepare_attributes_flat(self, instance):
        try:
            variant_ids = instance.variants.values_list('id', flat=True)
            all_values = AttributeValue.objects.filter(
                variants__id__in=variant_ids
            ).prefetch_related('translations')

            values_set = set()
            for val in all_values:
                for t in val.translations.all():
                    if t.value:
                        values_set.add(t.value)
            return " ".join(list(values_set))
        except Exception:
            return ""
