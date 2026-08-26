from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/messages/(?P<user_id>\w+)/$', consumers.MessageConsumer.as_asgi()),
    re_path(r'ws/consultation/(?P<consultation_id>\w+)/(?P<user_id>\w+)/$', consumers.ConsultationConsumer.as_asgi()),
]
