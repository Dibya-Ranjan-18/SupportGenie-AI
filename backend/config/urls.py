from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "SupportGenie AI Backend API",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth/",
            "chat": "/api/v1/chat/",
            "tickets": "/api/v1/tickets/",
            "knowledge": "/api/v1/knowledge/",
        }
    })


urlpatterns = [
    path('', health_check, name='root_health_check'),
    path('api/v1/', health_check, name='api_v1_health_check'),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/chat/', include('chatbot.urls')),
    path('api/v1/knowledge/', include('knowledge.urls')),
    path('api/v1/tickets/', include('tickets.urls')),
    path('api/v1/feedback/', include('feedback.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
