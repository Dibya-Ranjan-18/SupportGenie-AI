"""Tickets views — Create, list, update, delete tickets and comments."""
from django.utils import timezone
from django.db.models import Q, Prefetch
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.core.mail import send_mail
from django.conf import settings
from .models import Ticket, TicketComment
from .serializers import (
    TicketSerializer, CreateTicketSerializer,
    UpdateTicketSerializer, AddCommentSerializer
)
from accounts.models import CustomUser
from accounts.permissions import IsAdmin


def _notify_ticket_created(ticket):
    """Send confirmation email to user & notification email to admin team."""
    try:
        user_name = ticket.user.first_name or ticket.user.username
        # Email to user
        send_mail(
            subject=f"Support Ticket Received: #{str(ticket.id)[:8]} - {ticket.subject}",
            message=f"Hi {user_name},\n\nWe have received your support ticket '{ticket.subject}'. Our support team is reviewing it and will get back to you shortly.\n\nDescription:\n{ticket.description}\n\nThank you,\nSupportGenie AI Team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[ticket.user.email],
            fail_silently=True,
        )
        # Alert to admins
        admin_emails = list(CustomUser.objects.filter(role='admin').values_list('email', flat=True))
        if admin_emails:
            send_mail(
                subject=f"[New Support Ticket] #{str(ticket.id)[:8]} from {ticket.user.email}",
                message=f"New ticket created by {ticket.user.email}.\n\nSubject: {ticket.subject}\nCategory: {ticket.category}\nPriority: {ticket.priority}\n\nDescription:\n{ticket.description}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True,
            )
    except Exception:
        pass


def _notify_ticket_comment(ticket, comment):
    """Notify user of admin reply, or notify admins of user reply."""
    try:
        user_name = ticket.user.first_name or ticket.user.username
        if comment.author.role == 'admin' and not comment.is_internal:
            send_mail(
                subject=f"New Update on Ticket: #{str(ticket.id)[:8]} - {ticket.subject}",
                message=f"Hi {user_name},\n\nA support agent has replied to your ticket '{ticket.subject}':\n\n\"{comment.content}\"\n\nLog in to view details and reply.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[ticket.user.email],
                fail_silently=True,
            )
        elif comment.author.role != 'admin':
            admin_emails = list(CustomUser.objects.filter(role='admin').values_list('email', flat=True))
            if admin_emails:
                send_mail(
                    subject=f"[Customer Reply] Ticket #{str(ticket.id)[:8]} - {ticket.subject}",
                    message=f"Customer {ticket.user.email} commented on ticket #{str(ticket.id)[:8]}:\n\n\"{comment.content}\"",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    fail_silently=True,
                )
    except Exception:
        pass


def _notify_ticket_status(ticket, old_status, new_status):
    """Notify user when ticket status changes."""
    try:
        user_name = ticket.user.first_name or ticket.user.username
        if old_status != new_status:
            send_mail(
                subject=f"Ticket Status Updated: #{str(ticket.id)[:8]} ({new_status.upper()})",
                message=f"Hi {user_name},\n\nYour support ticket '{ticket.subject}' status has been updated from '{old_status}' to '{new_status}'.\n\nThank you,\nSupportGenie AI Support Team",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[ticket.user.email],
                fail_silently=True,
            )
    except Exception:
        pass


class TicketListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        comments_prefetch = Prefetch(
            'comments',
            queryset=TicketComment.objects.select_related('author').order_by('created_at'),
            to_attr='prefetched_comments'
        )
        if request.user.role == 'admin':
            queryset = (
                Ticket.objects.select_related('user')
                .prefetch_related(comments_prefetch)
                .all()
            )
            status_filter = request.query_params.get('status', '')
            search = request.query_params.get('search', '')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if search:
                queryset = queryset.filter(
                    Q(subject__icontains=search) | Q(user__email__icontains=search)
                )
        else:
            queryset = (
                Ticket.objects
                .filter(user=request.user)
                .prefetch_related(comments_prefetch)
            )

        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateTicketSerializer(data=request.data)
        if serializer.is_valid():
            ticket = serializer.save(user=request.user, status='pending')
            _notify_ticket_created(ticket)
            return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, ticket_id, user):
        try:
            if user.role == 'admin':
                return Ticket.objects.get(id=ticket_id)
            return Ticket.objects.get(id=ticket_id, user=user)
        except Ticket.DoesNotExist:
            return None

    def get(self, request, ticket_id):
        ticket = self.get_object(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TicketSerializer(ticket).data)

    def patch(self, request, ticket_id):
        ticket = self.get_object(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_status = ticket.status
        serializer = UpdateTicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            # Track resolved_at timestamp
            if serializer.validated_data.get('status') == 'resolved' and not ticket.resolved_at:
                ticket.resolved_at = timezone.now()
            updated_ticket = serializer.save()
            new_status = updated_ticket.status
            _notify_ticket_status(updated_ticket, old_status, new_status)
            return Response(TicketSerializer(updated_ticket).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, ticket_id):
        ticket = self.get_object(ticket_id, request.user)
        if not ticket:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Customers can only delete their own pending tickets
        if request.user.role != 'admin' and ticket.status != 'pending':
            return Response(
                {'error': 'You can only delete tickets that are still pending.'},
                status=status.HTTP_403_FORBIDDEN
            )
        ticket.delete()
        return Response({'message': 'Ticket deleted.'}, status=status.HTTP_204_NO_CONTENT)


class TicketCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        """Add a comment to a ticket."""
        try:
            if request.user.role == 'admin':
                ticket = Ticket.objects.get(id=ticket_id)
            else:
                ticket = Ticket.objects.get(id=ticket_id, user=request.user)
        except Ticket.DoesNotExist:
            return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AddCommentSerializer(data=request.data)
        if serializer.is_valid():
            # Non-admins cannot post internal notes
            is_internal = serializer.validated_data.get('is_internal', False)
            if is_internal and request.user.role != 'admin':
                is_internal = False

            comment = TicketComment.objects.create(
                ticket=ticket,
                author=request.user,
                content=serializer.validated_data['content'],
                is_internal=is_internal,
            )
            # Update ticket status to open if it was pending
            if ticket.status == 'pending' and request.user.role == 'admin':
                ticket.status = 'open'
                ticket.save()

            _notify_ticket_comment(ticket, comment)
            return Response({'message': 'Comment added.', 'comment_id': str(comment.id)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
