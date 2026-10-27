import secrets
import string
from decimal import Decimal
from datetime import datetime, date, time
from rest_framework import serializers
from .models import (
    User, Turf, TurfOwnerAssignment, PricingRule,
    SlotOverride, Booking, Payment, Review, AuditLog
)


class UserSerializer(serializers.ModelSerializer):
    assigned_turf_ids = serializers.SerializerMethodField()
    assigned_turfs = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "name", "phone", "role", "status",
            "must_change_password", "is_active", "created_at",
            "assigned_turf_ids", "assigned_turfs"
        ]
        read_only_fields = ["id", "created_at", "assigned_turf_ids", "assigned_turfs"]

    def get_assigned_turf_ids(self, obj):
        if obj.role == "TURF_OWNER":
            return list(obj.turf_assignments.values_list("turf_id", flat=True))
        return []

    def get_assigned_turfs(self, obj):
        if obj.role == "TURF_OWNER":
            return [
                {"id": a.turf.id, "name": a.turf.name, "location": a.turf.location}
                for a in obj.turf_assignments.select_related("turf")
            ]
        return []


class CustomerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["email", "name", "phone", "password"]

    def create(self, validated_data):
        # Customers always get CUSTOMER role and must_change_password=False
        password = validated_data.pop("password")
        user = User.objects.create_user(
            role="CUSTOMER",
            must_change_password=False,
            status="ACTIVE",
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class AdminCreateTurfOwnerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    assigned_turf_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    status = serializers.ChoiceField(
        choices=["ACTIVE", "SUSPENDED", "DEACTIVATED"], default="ACTIVE"
    )
    custom_temp_password = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(min_length=6, required=True)


class PricingRuleSerializer(serializers.ModelSerializer):
    time_slot_start = serializers.TimeField(format="%H:%M")
    time_slot_end = serializers.TimeField(format="%H:%M")

    class Meta:
        model = PricingRule
        fields = [
            "id", "turf", "day_type", "time_slot_start",
            "time_slot_end", "price", "is_peak", "label"
        ]


class SlotOverrideSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format="%H:%M")
    end_time = serializers.TimeField(format="%H:%M")

    class Meta:
        model = SlotOverride
        fields = [
            "id", "turf", "date", "start_time", "end_time",
            "is_blocked", "custom_price", "reason", "created_at"
        ]


class ReviewSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "turf", "user", "user_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class TurfSerializer(serializers.ModelSerializer):
    assigned_owners = serializers.SerializerMethodField()

    class Meta:
        model = Turf
        fields = [
            "id", "name", "slug", "tagline", "location", "city",
            "address", "rating", "review_count", "hourly_base_price",
            "sports", "amenities", "description", "main_image",
            "gallery_images", "is_active", "created_at", "assigned_owners"
        ]

    def get_assigned_owners(self, obj):
        return [
            {"id": a.owner.id, "name": a.owner.name, "email": a.owner.email}
            for a in obj.owner_assignments.select_related("owner")
        ]


class TurfDetailSerializer(TurfSerializer):
    pricing_rules = PricingRuleSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta(TurfSerializer.Meta):
        fields = TurfSerializer.Meta.fields + ["pricing_rules", "reviews"]


class PaymentSerializer(serializers.ModelSerializer):
    verified_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "booking", "payment_id", "order_id", "amount",
            "currency", "status", "payment_method", "verified_at"
        ]


class BookingSerializer(serializers.ModelSerializer):
    turf_name = serializers.CharField(source="turf.name", read_only=True)
    turf_location = serializers.CharField(source="turf.location", read_only=True)
    turf_image = serializers.CharField(source="turf.main_image", read_only=True)
    payment = PaymentSerializer(read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "booking_id", "customer", "customer_name", "customer_email",
            "customer_phone", "turf", "turf_name", "turf_location", "turf_image",
            "booking_date", "start_time", "end_time", "duration_minutes", "sport",
            "slot_price", "taxes", "total_amount", "status", "cancellation_reason",
            "payment", "created_at"
        ]
        read_only_fields = ["id", "booking_id", "status", "created_at"]


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default="System")
    user_name = serializers.CharField(source="user.name", read_only=True, default="System")
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "user", "user_email", "user_name", "action",
            "entity_type", "entity_id", "details", "ip_address", "timestamp"
        ]
