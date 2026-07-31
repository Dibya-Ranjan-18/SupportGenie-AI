import sys
import threading
from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    name = 'chatbot'

    def ready(self):
        # Lazy initialization — do not load heavy embedding models on startup
        pass
