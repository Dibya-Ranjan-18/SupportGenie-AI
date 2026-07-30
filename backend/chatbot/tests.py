from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import CustomUser
from .models import ChatSession, Message
from .ai_service import build_rag_prompt, get_ai_response_stream


class ChatbotTests(APITestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='chatuser',
            email='chat@example.com',
            password='TestPassword123!',
            role='customer'
        )

    def test_create_and_list_chat_sessions(self):
        self.client.force_authenticate(user=self.user)
        list_url = reverse('session_list')
        
        # Create session
        create_resp = self.client.post(list_url, {'title': 'Support Query'}, format='json')
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_resp.data['title'], 'Support Query')

        # List sessions
        list_resp = self.client.get(list_url)
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_resp.data), 1)

    def test_build_rag_prompt_structure(self):
        context = [{'source': 'Guide.pdf', 'content': 'Refunds take 3 business days.'}]
        history = [{'role': 'user', 'content': 'Hi'}]
        user_msg = 'How long do refunds take?'

        system_instruction, messages = build_rag_prompt(user_msg, context, history)
        self.assertIn('<knowledge_base_context>', system_instruction)
        self.assertIn('Refunds take 3 business days.', system_instruction)
        self.assertEqual(messages[-1]['parts'][0]['text'], user_msg)

    def test_get_ai_response_stream_tuple(self):
        history = []
        user_msg = 'What is SupportGenie?'
        stream_gen, context_chunks = get_ai_response_stream(user_msg, history)
        self.assertIsInstance(context_chunks, list)
        self.assertTrue(hasattr(stream_gen, '__iter__'))

