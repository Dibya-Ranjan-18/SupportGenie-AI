from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import CustomUser
from .models import Document
from .embedding_service import chunk_text


class KnowledgeTests(APITestCase):

    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='AdminPassword123!',
            role='admin'
        )
        self.customer = CustomUser.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='CustomerPassword123!',
            role='customer'
        )

    def test_chunk_text_utility(self):
        sample_text = "This is paragraph one.\n\nThis is paragraph two detailing knowledge rules."
        chunks = chunk_text(sample_text, 'SampleDoc')
        self.assertTrue(len(chunks) > 0)
        self.assertEqual(chunks[0].metadata['source'], 'SampleDoc')

    def test_admin_access_to_document_list(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('document_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_customer_denied_access_to_document_list(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('document_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

