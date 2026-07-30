"""Tickets URL configuration."""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.TicketListView.as_view(), name='ticket_list'),
    path('<uuid:ticket_id>/', views.TicketDetailView.as_view(), name='ticket_detail'),
    path('<uuid:ticket_id>/comments/', views.TicketCommentView.as_view(), name='ticket_comments'),
]
