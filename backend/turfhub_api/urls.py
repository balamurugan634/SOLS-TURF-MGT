from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path("auth/login/", views.login_view, name="auth-login"),
    path("auth/register/", views.register_customer_view, name="auth-register"),
    path("auth/me/", views.me_view, name="auth-me"),
    path("auth/change-password/", views.change_password_view, name="auth-change-password"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # Turfs & Discovery (Public / Customer)
    path("turfs/", views.turf_list_view, name="turf-list"),
    path("turfs/<int:pk>/", views.turf_detail_view, name="turf-detail"),
    path("turfs/<int:pk>/slots/", views.turf_slots_view, name="turf-slots"),

    # Bookings (Customer)
    path("bookings/", views.create_booking_view, name="booking-create"),
    path("bookings/my-bookings/", views.my_bookings_view, name="my-bookings"),
    path("bookings/<int:pk>/cancel/", views.cancel_booking_view, name="booking-cancel"),

    # Turf Owner Dashboard
    path("owner/turfs/", views.owner_turfs_view, name="owner-turfs"),
    path("owner/turfs/<int:turf_id>/pricing-rules/", views.owner_pricing_rules_view, name="owner-pricing-rules"),
    path("owner/turfs/<int:turf_id>/toggle-block/", views.owner_toggle_block_slot_view, name="owner-toggle-block"),
    path("owner/bookings/", views.owner_bookings_view, name="owner-bookings"),
    path("owner/analytics/", views.owner_analytics_view, name="owner-analytics"),

    # Admin Dashboard
    path("admin/stats/", views.admin_stats_view, name="admin-stats"),
    path("admin/owners/", views.admin_turf_owners_view, name="admin-owners"),
    path("admin/owners/<int:pk>/", views.admin_manage_owner_detail_view, name="admin-owner-detail"),
    path("admin/turfs/", views.admin_turfs_view, name="admin-turfs"),
    path("admin/customers/", views.admin_customers_view, name="admin-customers"),
    path("admin/bookings/", views.admin_all_bookings_view, name="admin-all-bookings"),
    path("admin/payments/", views.admin_payments_view, name="admin-payments"),
    path("admin/audit-logs/", views.admin_audit_logs_view, name="admin-audit-logs"),

    # Health & Serverless Database Initialization
    path("health/", views.health_check_view, name="health-check"),
    path("setup-db/", views.setup_database_view, name="setup-database"),
]

