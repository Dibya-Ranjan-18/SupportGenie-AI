"""Knowledge base URL configuration."""
from django.urls import path
from . import views

urlpatterns = [
    path('documents/', views.DocumentListView.as_view(), name='document_list'),
    path('documents/<uuid:doc_id>/', views.DocumentDetailView.as_view(), name='document_detail'),
    path('documents/<uuid:doc_id>/reindex/', views.DocumentReindexView.as_view(), name='document_reindex'),
    path('documents/index-url/', views.IndexURLView.as_view(), name='index_url'),
    path('stats/', views.KnowledgeBaseStatsView.as_view(), name='kb_stats'),
]
