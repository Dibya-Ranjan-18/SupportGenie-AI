"""Knowledge base serializers."""
from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.SerializerMethodField()
    file_size_display = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_url', 'file_type', 'file_size',
            'file_size_display', 'status', 'chunk_count', 'error_message',
            'uploaded_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'chunk_count', 'error_message', 'created_at', 'updated_at']

    def get_uploaded_by_email(self, obj):
        return obj.uploaded_by.email if obj.uploaded_by else None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['title', 'file']

    def validate_file(self, value):
        allowed_extensions = ('.pdf', '.docx', '.txt')
        allowed_types = {
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/octet-stream',
        }
        max_size = 25 * 1024 * 1024  # 25MB

        if value.size > max_size:
            raise serializers.ValidationError('File size must be under 25MB.')

        name = value.name.lower()
        if not name.endswith(allowed_extensions):
            raise serializers.ValidationError('Only PDF (.pdf), Word (.docx), and Text (.txt) files are allowed.')

        content_type = getattr(value, 'content_type', '').lower()
        if content_type and content_type not in allowed_types:
            raise serializers.ValidationError('Unsupported file content type.')

        return value

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters.')
        return value.strip()


class IndexURLSerializer(serializers.Serializer):
    url = serializers.URLField()
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
