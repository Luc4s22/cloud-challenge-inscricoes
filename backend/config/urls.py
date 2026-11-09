from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from api.views import pagina_organizacao


urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
    path("inscricao-confirmada/", TemplateView.as_view(template_name="inscricao-confirmada.html"), name="inscricao_confirmada"),
    path("admin/", admin.site.urls),
    path("organizacao/", pagina_organizacao, name="organizacao"),
    path("", include("api.urls")),
]