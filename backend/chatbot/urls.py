"""Chatbot URL configuration."""
from django.urls import path
from . import views

urlpatterns = [
    path('sessions/', views.ChatSessionListView.as_view(), name='session_list'),
    path('sessions/<uuid:session_id>/', views.ChatSessionDetailView.as_view(), name='session_detail'),
    path('sessions/<uuid:session_id>/messages/', views.MessageListView.as_view(), name='message_list'),
    path('sessions/<uuid:session_id>/send/', views.SendMessageView.as_view(), name='send_message'),
    path('sessions/<uuid:session_id>/regenerate/', views.RegenerateResponseView.as_view(), name='regenerate'),
    path('messages/<uuid:message_id>/', views.MessageDetailView.as_view(), name='message_detail'),
    path('sessions/<uuid:session_id>/email/', views.EmailTranscriptView.as_view(), name='email_transcript'),
    path('admin/all/', views.AdminChatStatsView.as_view(), name='admin_chat_stats'),
    path('admin/sessions/<uuid:session_id>/takeover/', views.AdminTakeoverView.as_view(), name='admin_takeover'),
    path('admin/sessions/<uuid:session_id>/agent-message/', views.AdminSendAgentMessageView.as_view(), name='admin_agent_message'),
]
