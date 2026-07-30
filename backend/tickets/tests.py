from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import CustomUser
from .models import Ticket, TicketComment


class TicketTests(APITestCase):

    def setUp(self):
        self.customer = CustomUser.objects.create_user(
            username='ticketuser',
            email='ticket@example.com',
            password='TestPassword123!',
            role='customer'
        )
        self.admin = CustomUser.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='AdminPassword123!',
            role='admin'
        )
        self.ticket = Ticket.objects.create(
            user=self.customer,
            subject='Billing Query',
            description='I need help with my invoice.',
            priority='medium',
            status='pending'
        )

    def test_create_ticket(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('ticket_list')
        data = {
            'subject': 'New Technical Issue',
            'description': 'App freezes when clicking settings.',
            'priority': 'high'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ticket.objects.count(), 2)

    def test_list_tickets_customer(self):
        self.client.force_authenticate(user=self.customer)
        url = reverse('ticket_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_add_comment(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('ticket_comments', kwargs={'ticket_id': self.ticket.id})
        data = {'content': 'We are looking into your invoice now.', 'is_internal': False}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, 'open')

