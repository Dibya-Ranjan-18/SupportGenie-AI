"""Analytics URLs."""
from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.OverviewStatsView.as_view(), name='analytics_overview'),
    path('chats/', views.ChatAnalyticsView.as_view(), name='analytics_chats'),
    path('users/', views.UserGrowthView.as_view(), name='analytics_users'),
    path('tickets/', views.TicketAnalyticsView.as_view(), name='analytics_tickets'),
    path('feedback/', views.FeedbackAnalyticsView.as_view(), name='analytics_feedback'),
]
