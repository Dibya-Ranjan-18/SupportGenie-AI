"""
Analytics views — Daily/weekly/monthly stats for admin dashboard charts.
"""
from datetime import timedelta, date
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth

from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.permissions import IsAdmin
from accounts.models import CustomUser
from chatbot.models import ChatSession, Message
from tickets.models import Ticket
from feedback.models import Feedback


class OverviewStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        return Response({
            'total_users': CustomUser.objects.filter(role='customer').count(),
            'total_chats': ChatSession.objects.count(),
            'today_chats': ChatSession.objects.filter(created_at__gte=today_start).count(),
            'total_messages': Message.objects.count(),
            'total_tickets': Ticket.objects.count(),
            'open_tickets': Ticket.objects.filter(status__in=['pending', 'open']).count(),
            'resolved_tickets': Ticket.objects.filter(status='resolved').count(),
            'pending_tickets': Ticket.objects.filter(status='pending').count(),
            'total_feedback': Feedback.objects.count(),
            'positive_feedback': Feedback.objects.filter(rating='up').count(),
            'negative_feedback': Feedback.objects.filter(rating='down').count(),
        })


class ChatAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    VALID_PERIODS = {'daily', 'weekly', 'monthly'}

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        if period not in self.VALID_PERIODS:
            return Response({'error': f"Invalid period. Choose from: {', '.join(self.VALID_PERIODS)}."}, status=400)

        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (ValueError, TypeError):
            return Response({'error': "'days' must be a positive integer (max 365)."}, status=400)

        start_date = timezone.now() - timedelta(days=days)

        if period == 'daily':
            data = (
                ChatSession.objects
                .filter(created_at__gte=start_date)
                .annotate(date=TruncDate('created_at'))
                .values('date')
                .annotate(count=Count('id'))
                .order_by('date')
            )
            return Response([{'date': str(d['date']), 'chats': d['count']} for d in data])

        elif period == 'weekly':
            data = (
                ChatSession.objects
                .filter(created_at__gte=start_date)
                .annotate(week=TruncWeek('created_at'))
                .values('week')
                .annotate(count=Count('id'))
                .order_by('week')
            )
            return Response([{'week': str(d['week'].date()), 'chats': d['count']} for d in data])

        elif period == 'monthly':
            data = (
                ChatSession.objects
                .filter(created_at__gte=start_date)
                .annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(count=Count('id'))
                .order_by('month')
            )
            return Response([{'month': str(d['month'].date()), 'chats': d['count']} for d in data])



class UserGrowthView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (ValueError, TypeError):
            return Response({'error': "'days' must be a positive integer (max 365)."}, status=400)

        start_date = timezone.now() - timedelta(days=days)
        data = (
            CustomUser.objects
            .filter(created_at__gte=start_date, role='customer')
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        return Response([{'date': str(d['date']), 'users': d['count']} for d in data])


class TicketAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (ValueError, TypeError):
            return Response({'error': "'days' must be a positive integer (max 365)."}, status=400)

        start_date = timezone.now() - timedelta(days=days)

        # Tickets by status
        by_status = list(
            Ticket.objects.values('status')
            .annotate(count=Count('id'))
        )

        # Tickets by priority
        by_priority = list(
            Ticket.objects.values('priority')
            .annotate(count=Count('id'))
        )

        # Daily ticket creation
        daily = list(
            Ticket.objects
            .filter(created_at__gte=start_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return Response({
            'by_status': by_status,
            'by_priority': by_priority,
            'daily': [{'date': str(d['date']), 'tickets': d['count']} for d in daily],
        })


class FeedbackAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (ValueError, TypeError):
            return Response({'error': "'days' must be a positive integer (max 365)."}, status=400)

        start_date = timezone.now() - timedelta(days=days)

        daily = list(
            Feedback.objects
            .filter(created_at__gte=start_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(
                positive=Count('id', filter=Q(rating='up')),
                negative=Count('id', filter=Q(rating='down')),
            )
            .order_by('date')
        )
        return Response([{
            'date': str(d['date']),
            'positive': d['positive'],
            'negative': d['negative'],
        } for d in daily])
