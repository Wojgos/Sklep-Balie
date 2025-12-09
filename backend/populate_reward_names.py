import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from promotions.models import LoyaltyReward

print("Populating LoyaltyReward names from descriptions...")
rewards = LoyaltyReward.objects.all()

for reward in rewards:
    # Polish
    reward.set_current_language('pl')
    if not reward.name:
        reward.name = reward.description
        print(f"Reward {reward.id} [PL]: Set name to '{reward.name}'")
    
    # English
    reward.set_current_language('en')
    if not reward.name:
        reward.name = reward.description
        print(f"Reward {reward.id} [EN]: Set name to '{reward.name}'")
    
    reward.save()

print("\nDone! All rewards now have names.")
