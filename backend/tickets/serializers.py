"""Tickets serializers."""
from rest_framework import serializers
from .models import Ticket, TicketComment
from accounts.serializers import UserProfileSerializer


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_role = serializers.SerializerMethodField()

    class Meta:
        model = TicketComment
        fields = ['id', 'content', 'author_name', 'author_role', 'is_internal', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_author_name(self, obj):
        return obj.author.full_name or obj.author.email

    def get_author_role(self, obj):
        return obj.author.role


class TicketSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    comments = TicketCommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'user_email', 'user_name', 'subject', 'description',
            'status', 'priority', 'comments', 'comment_count',
            'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user_email', 'user_name', 'created_at', 'updated_at']

    def get_user_email(self, obj):
        return obj.user.email

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.email

    def get_comment_count(self, obj):
        # Use prefetched comments when available (avoids N+1)
        if hasattr(obj, 'prefetched_comments'):
            return len(obj.prefetched_comments)
        return obj.comments.count()


class CreateTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['subject', 'description', 'priority']

    def validate_subject(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Subject must be at least 5 characters.')
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Description must be at least 10 characters.')
        return value.strip()


class UpdateTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['status', 'priority']


class AddCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketComment
        fields = ['content', 'is_internal']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Comment cannot be empty.')
        return value.strip()
