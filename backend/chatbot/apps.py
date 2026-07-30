import sys
import threading
from django.apps import AppConfig


class ChatbotConfig(AppConfig):
    name = 'chatbot'

    def ready(self):
        # Don't pre-warm during manage.py commands like migrate, test, etc.
        if 'test' in sys.argv or 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return

        def _prewarm():
            try:
                from .ai_service import _get_embeddings
                _get_embeddings()
            except Exception:
                pass

        threading.Thread(target=_prewarm, daemon=True).start()
