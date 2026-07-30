"""Feedback views."""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Feedback
from .serializers import FeedbackSerializer, SubmitFeedbackSerializer
from accounts.permissions import IsAdmin


class FeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Admin: list all feedback. Customer: list their own."""
        if request.user.role == 'admin':
            queryset = Feedback.objects.select_related('user', 'message').all()
            rating = request.query_params.get('rating', '')
            if rating:
                queryset = queryset.filter(rating=rating)
        else:
            queryset = Feedback.objects.filter(user=request.user)
        serializer = FeedbackSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Submit feedback for a message."""
        serializer = SubmitFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.validated_data['message']
            # Only the session owner can give feedback
            if message.session.user != request.user and request.user.role != 'admin':
                return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

            # Upsert feedback (update if already submitted)
            feedback, created = Feedback.objects.update_or_create(
                message=message,
                defaults={
                    'user': request.user,
                    'rating': serializer.validated_data['rating'],
                    'comment': serializer.validated_data.get('comment', ''),
                }
            )
            return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeedbackStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total = Feedback.objects.count()
        positive = Feedback.objects.filter(rating='up').count()
        negative = Feedback.objects.filter(rating='down').count()
        with_comment = Feedback.objects.exclude(comment='').count()
        satisfaction_rate = round((positive / total * 100), 1) if total > 0 else 0

        return Response({
            'total': total,
            'positive': positive,
            'negative': negative,
            'with_comment': with_comment,
            'satisfaction_rate': satisfaction_rate,
        })
