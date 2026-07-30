"""
Chatbot views — Chat sessions, messages, streaming responses.
"""
import json
import logging
from django.db.models import Q, Count, Prefetch
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.http import StreamingHttpResponse

from .models import ChatSession, Message
from .serializers import (
    ChatSessionSerializer, ChatSessionDetailSerializer,
    MessageSerializer, SendMessageSerializer, RenameSessionSerializer
)
from .ai_service import get_ai_response_stream, stream_ai_response, get_follow_up_suggestions
from accounts.permissions import IsAdmin

logger = logging.getLogger(__name__)


class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all chat sessions for the current user, annotated to avoid N+1 queries."""
        search = request.query_params.get('search', '')
        queryset = (
            ChatSession.objects
            .filter(user=request.user)
            .annotate(message_count_ann=Count('messages', distinct=True))
            .prefetch_related(
                Prefetch('messages', queryset=Message.objects.order_by('-created_at'), to_attr='prefetched_messages')
            )
        )
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(messages__content__icontains=search)
            ).distinct()
        serializer = ChatSessionSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new chat session."""
        session = ChatSession.objects.create(
            user=request.user,
            title=request.data.get('title', 'New Conversation')
        )
        serializer = ChatSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, session_id, user):
        try:
            return ChatSession.objects.get(id=session_id, user=user)
        except ChatSession.DoesNotExist:
            return None

    def get(self, request, session_id):
        session = self.get_object(session_id, request.user)
        if not session:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSessionDetailSerializer(session)
        return Response(serializer.data)

    def patch(self, request, session_id):
        """Rename a session."""
        session = self.get_object(session_id, request.user)
        if not session:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RenameSessionSerializer(data=request.data)
        if serializer.is_valid():
            session.title = serializer.validated_data['title']
            session.save()
            return Response(ChatSessionSerializer(session).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        session = self.get_object(session_id, request.user)
        if not session:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response({'message': 'Session deleted.'}, status=status.HTTP_204_NO_CONTENT)


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        """Get all messages for a session."""
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        messages = session.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        """Send a message and stream the AI response via SSE."""
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message_content = serializer.validated_data['content']

        # Save user message
        user_msg = Message.objects.create(
            session=session,
            role='user',
            content=user_message_content,
        )

        # If chat session was taken over by a human agent, notify customer
        if session.is_human_takeover:
            def generate_takeover_stream():
                msg_content = "💬 **Human Support Agent Handover**: A support agent has taken over this chat. Please wait for an agent to reply, or submit a support ticket in the Support Portal."
                ai_msg = Message.objects.create(
                    session=session,
                    role='assistant',
                    content=msg_content,
                    sources=[],
                )
                yield f"data: {json.dumps({'type': 'chunk', 'content': msg_content})}\n\n"
                yield f"data: {json.dumps({'type': 'done', 'message_id': str(ai_msg.id), 'user_message_id': str(user_msg.id), 'sources': [], 'suggestions': []})}\n\n"
                yield "data: [DONE]\n\n"

            response = StreamingHttpResponse(generate_takeover_stream(), content_type='text/event-stream')
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response

        # Get full conversation history for context (Gemini supports 1M token context window)
        history = list(
            session.messages.exclude(id=user_msg.id)
            .order_by('created_at')
        )
        history_dicts = [{'role': m.role, 'content': m.content} for m in history]

        # Auto-generate session title from first message — strip HTML chars to prevent injection
        if session.messages.count() == 1:
            import re
            safe_title = re.sub(r'[<>]', '', user_message_content).strip()
            safe_title = re.sub(r'\s+', ' ', safe_title)  # collapse whitespace
            session.title = safe_title[:60] + ('...' if len(safe_title) > 60 else '')
            session.save()

        def generate_stream():
            """SSE generator: streams AI response chunks."""
            full_response = []

            try:
                gen, context_chunks = get_ai_response_stream(user_message_content, history_dicts)
                sources = context_chunks or []
                for chunk in gen:
                    full_response.append(chunk)
                    # SSE format: data: <chunk>\n\n
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            except Exception as e:
                logger.error(f"Stream error: {e}")
                sources = []
                error_msg = f"⚠️ **Chat Error**: {str(e)}"
                full_response.append(error_msg)
                yield f"data: {json.dumps({'type': 'chunk', 'content': error_msg})}\n\n"

            # Save assistant message to DB
            complete_response = ''.join(full_response)
            ai_msg = Message.objects.create(
                session=session,
                role='assistant',
                content=complete_response,
                sources=sources,
            )
            session.save()  # Update updated_at

            # Generate follow-up suggestions
            suggestions = get_follow_up_suggestions(user_message_content, complete_response)

            # Send final metadata event
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(ai_msg.id), 'user_message_id': str(user_msg.id), 'sources': sources, 'suggestions': suggestions})}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(
            generate_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class RegenerateResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        """Regenerate the last assistant response."""
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get last assistant message and the user message before it
        messages = list(session.messages.order_by('created_at'))
        if not messages or messages[-1].role != 'assistant':
            return Response({'error': 'No assistant message to regenerate.'}, status=status.HTTP_400_BAD_REQUEST)

        # Remove last assistant message
        last_assistant = messages[-1]
        last_assistant.delete()

        # Find last user message
        user_messages = [m for m in messages[:-1] if m.role == 'user']
        if not user_messages:
            return Response({'error': 'No user message found.'}, status=status.HTTP_400_BAD_REQUEST)

        last_user_msg = user_messages[-1]
        # History = all messages before the deleted assistant message (excluding it)
        # This gives the AI full context including the user message being regenerated
        history = [{'role': m.role, 'content': m.content} for m in messages[:-1]]

        def generate_stream():
            full_response = []
            try:
                gen, context_chunks = get_ai_response_stream(last_user_msg.content, history)
                sources = context_chunks or []
                for chunk in gen:
                    full_response.append(chunk)
                    yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
            except Exception as e:
                sources = []
                error_msg = f"⚠️ **Regeneration Error**: {str(e)}"
                full_response.append(error_msg)
                yield f"data: {json.dumps({'type': 'chunk', 'content': error_msg})}\n\n"

            complete_response = ''.join(full_response)
            ai_msg = Message.objects.create(
                session=session,
                role='assistant',
                content=complete_response,
                sources=sources,
                is_regenerated=True,
            )
            session.save()
            suggestions = get_follow_up_suggestions(last_user_msg.content, complete_response)
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(ai_msg.id), 'sources': sources, 'suggestions': suggestions})}\n\n"
            yield "data: [DONE]\n\n"

        response = StreamingHttpResponse(generate_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class MessageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):
        """Delete a single message."""
        try:
            message = Message.objects.get(id=message_id, session__user=request.user)
            message.delete()
            return Response({'message': 'Message deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, message_id):
        """Edit message content."""
        try:
            message = Message.objects.get(id=message_id, session__user=request.user)
            content = request.data.get('content')
            if not content:
                return Response({'error': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)
            message.content = content
            message.save()
            return Response(MessageSerializer(message).data)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminChatPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AdminChatStatsView(APIView):
    """Admin view for all chat sessions with proper pagination."""
    permission_classes = [IsAdmin]

    def get(self, request):
        sessions = ChatSession.objects.select_related('user').order_by('-created_at')
        paginator = AdminChatPagination()
        page = paginator.paginate_queryset(sessions, request)
        data = [
            {
                'id': str(s.id),
                'user_email': s.user.email,
                'title': s.title,
                'message_count': s.message_count,
                'created_at': s.created_at,
                'updated_at': s.updated_at,
            }
            for s in page
        ]
        return paginator.get_paginated_response(data)


class EmailTranscriptView(APIView):
    """Send chat transcript to user's email."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        messages = session.messages.order_by('created_at')
        if not messages.exists():
            return Response({'error': 'No messages in this chat.'}, status=status.HTTP_400_BAD_REQUEST)

        body = f"SupportGenie AI — Chat Transcript\n"
        body += f"Session: {session.title}\n"
        body += f"Date: {session.created_at.strftime('%Y-%m-%d %H:%M')}\n"
        body += f"=" * 50 + "\n\n"

        for msg in messages:
            sender = "Customer" if msg.role == 'user' else "SupportGenie AI"
            body += f"[{sender}] {msg.created_at.strftime('%H:%M')}\n"
            body += f"{msg.content}\n\n"

        from django.core.mail import send_mail
        from django.conf import settings

        try:
            send_mail(
                subject=f"Chat Transcript: {session.title}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=False,
            )
            return Response({'message': f'Transcript sent to {request.user.email}'})
        except Exception as e:
            return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminTakeoverView(APIView):
    """Admin API: Toggle human takeover mode on/off for a chat session."""
    permission_classes = [IsAdmin]

    def post(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id)
            session.is_human_takeover = not session.is_human_takeover
            session.save()
            status_text = "enabled (Human Support Mode)" if session.is_human_takeover else "disabled (AI Mode)"
            return Response({'message': f'Human takeover {status_text}.', 'is_human_takeover': session.is_human_takeover})
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminSendAgentMessageView(APIView):
    """Admin API: Send a human support agent message into a customer's chat session."""
    permission_classes = [IsAdmin]

    def post(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        agent_msg = Message.objects.create(
            session=session,
            role='assistant',
            content=f"👨‍💼 **Support Agent ({request.user.first_name or request.user.username})**: {content}",
            sources=[],
        )
        session.save()  # update updated_at
        return Response(MessageSerializer(agent_msg).data, status=status.HTTP_201_CREATED)
