"""Feedback serializers."""
from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    message_content = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = ['id', 'message', 'user_email', 'message_content', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user_email', 'message_content']

    def get_user_email(self, obj):
        return obj.user.email

    def get_message_content(self, obj):
        return obj.message.content[:100] if obj.message else ''


class SubmitFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['message', 'rating', 'comment']

    def validate_comment(self, value):
        return value.strip() if value else ''
