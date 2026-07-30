"""Dashboard views — Admin dashboard stats aggregation."""
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum

from accounts.permissions import IsAdmin
from accounts.models import CustomUser
from chatbot.models import ChatSession, Message
from tickets.models import Ticket
from feedback.models import Feedback
from knowledge.models import Document


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timezone.timedelta(days=7)

        total_chunks = Document.objects.aggregate(total=Sum('chunk_count'))['total'] or 0

        return Response({
            'users': {
                'total': CustomUser.objects.filter(role='customer').count(),
                'active': CustomUser.objects.filter(role='customer', is_active=True, is_blocked=False).count(),
                'blocked': CustomUser.objects.filter(is_blocked=True).count(),
                'new_this_week': CustomUser.objects.filter(created_at__gte=week_start).count(),
            },
            'chats': {
                'total': ChatSession.objects.count(),
                'today': ChatSession.objects.filter(created_at__gte=today_start).count(),
                'this_week': ChatSession.objects.filter(created_at__gte=week_start).count(),
                'total_messages': Message.objects.count(),
            },
            'tickets': {
                'total': Ticket.objects.count(),
                'pending': Ticket.objects.filter(status='pending').count(),
                'open': Ticket.objects.filter(status='open').count(),
                'resolved': Ticket.objects.filter(status='resolved').count(),
                'closed': Ticket.objects.filter(status='closed').count(),
                'new_today': Ticket.objects.filter(created_at__gte=today_start).count(),
            },
            'knowledge_base': {
                'total_documents': Document.objects.count(),
                'indexed': Document.objects.filter(status='indexed').count(),
                'total_chunks': total_chunks,
            },
            'feedback': {
                'total': Feedback.objects.count(),
                'positive': Feedback.objects.filter(rating='up').count(),
                'negative': Feedback.objects.filter(rating='down').count(),
            },
        })
