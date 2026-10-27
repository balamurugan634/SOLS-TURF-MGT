from rest_framework import permissions
from .models import TurfOwnerAssignment


class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to Admin role users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == "ADMIN" or request.user.is_superuser)
        )


class IsTurfOwnerRole(permissions.BasePermission):
    """Allows access to Turf Owner or Admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ["TURF_OWNER", "ADMIN"]
        )


class IsAssignedTurfOwner(permissions.BasePermission):
    """Ensures turf owner can only manage turfs assigned to them."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == "ADMIN" or request.user.is_superuser:
            return True
        if request.user.role != "TURF_OWNER":
            return False
        
        # obj may be a Turf, PricingRule, SlotOverride, or Booking
        turf = getattr(obj, "turf", obj)
        return TurfOwnerAssignment.objects.filter(owner=request.user, turf=turf).exists()
