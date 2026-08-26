import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sante_app.models import Patient, Medecin, Consultation
import asyncio
import websockets

User = get_user_model()

class Command(BaseCommand):
    help = 'Test WebSocket connection for consultation messaging'

    def add_arguments(self, parser):
        parser.add_argument('--consultation-id', type=int, required=True)
        parser.add_argument('--user-id', type=int, required=True)

    def handle(self, *args, **options):
        consultation_id = options['consultation_id']
        user_id = options['user_id']
        
        # Run the async test
        result = asyncio.run(self.test_websocket(consultation_id, user_id))
        
        if result:
            self.stdout.write(
                self.style.SUCCESS('WebSocket connection test successful')
            )
        else:
            self.stdout.write(
                self.style.ERROR('WebSocket connection test failed')
            )

    async def test_websocket(self, consultation_id, user_id):
        """Test WebSocket connection for consultation messaging"""
        uri = f"ws://localhost:8000/ws/consultation/{consultation_id}/{user_id}/"
        
        try:
            async with websockets.connect(uri) as websocket:
                self.stdout.write(f"Connected to WebSocket for consultation {consultation_id}, user {user_id}")
                
                # Send a test message
                test_message = {
                    "content": "Hello from Django management command!"
                }
                
                await websocket.send(json.dumps(test_message))
                self.stdout.write("Sent test message")
                
                # Wait for a response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    self.stdout.write(f"Received response: {response}")
                    return True
                except asyncio.TimeoutError:
                    self.stdout.write("No response received within timeout")
                    return False
                    
        except Exception as e:
            self.stdout.write(f"WebSocket connection failed: {e}")
            return False