"""
Chatbot serializers.
"""
from rest_framework import serializers
from .models import ChatSession, Message


class MessageSerializer(serializers.ModelSerializer):
    feedback_rating = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'session', 'role', 'content', 'sources', 'tokens_used',
                  'is_regenerated', 'created_at', 'feedback_rating']
        read_only_fields = ['id', 'created_at']

    def get_feedback_rating(self, obj):
        try:
            return obj.feedback.rating
        except Exception:
            return None


class ChatSessionSerializer(serializers.ModelSerializer):
    last_message_preview = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'message_count', 'last_message_preview',
                  'is_archived', 'is_human_takeover', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        # Use annotation set by ChatSessionListView (avoids N+1)
        if hasattr(obj, 'message_count_ann'):
            return obj.message_count_ann
        return obj.messages.count()

    def get_last_message_preview(self, obj):
        # Use prefetched messages when available (avoids N+1)
        if hasattr(obj, 'prefetched_messages'):
            last = obj.prefetched_messages[0] if obj.prefetched_messages else None
        else:
            last = obj.messages.order_by('-created_at').first()
        if last:
            return last.content[:100] + ('...' if len(last.content) > 100 else '')
        return ''


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.ReadOnlyField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'messages', 'message_count',
                  'is_archived', 'is_human_takeover', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()  # No character limit — unlimited message length


class RenameSessionSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
