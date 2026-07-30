"""Feedback URLs."""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.FeedbackView.as_view(), name='feedback'),
    path('stats/', views.FeedbackStatsView.as_view(), name='feedback_stats'),
]
