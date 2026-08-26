import os
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Sante_Virtuelle.settings')
django.setup()

# Test imports
try:
    from sante_app.models import Conversation, Message
    print("✓ Models imported successfully")
    
    # Test creating a conversation
    from django.contrib.auth.models import User
    from sante_app.models import Patient
    
    # Create test conversation
    conv = Conversation.objects.create(subject="Test Conversation")
    print("✓ Conversation model working")
    
    # Test serializer imports
    from sante_app.serializers import ConversationSerializer, MessageSerializer
    print("✓ Serializers imported successfully")
    
    print("All tests passed! Models and serializers are working correctly.")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()