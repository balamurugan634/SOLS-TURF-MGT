from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_status_view(request):
    return JsonResponse({
        "status": "online",
        "service": "TurfHub Backend API",
        "version": "1.0.0",
        "endpoints": {
            "api_root": "/api/",
            "admin": "/admin/",
            "health": "/api/health/"
        }
    })

urlpatterns = [
    path("", root_status_view, name="root-status"),
    path("admin/", admin.site.urls),
    path("api/", include("turfhub_api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
