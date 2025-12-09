import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'EStore.settings')
django.setup()

from promotions.models import LoyaltyReward

print("Checking LoyaltyReward translations...")
rewards = LoyaltyReward.objects.all()
print(f"Total rewards: {rewards.count()}\n")

for reward in rewards:
    print(f"Reward ID: {reward.id}")
    print(f"  Points required: {reward.points_required}")
    print(f"  Reward value: {reward.reward_value}")
    
    # Get Polish translation
    reward.set_current_language('pl')
    print(f"  [PL] Name: {reward.name if hasattr(reward, 'name') else 'N/A'}")
    print(f"  [PL] Description: {reward.description}")
    
    # Get English translation
    reward.set_current_language('en')
    print(f"  [EN] Name: {reward.name if hasattr(reward, 'name') else 'N/A'}")
    print(f"  [EN] Description: {reward.description}")
    print()
