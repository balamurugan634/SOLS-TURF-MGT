import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("status", "ACTIVE")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("ADMIN", "Administrator"),
        ("TURF_OWNER", "Turf Owner"),
        ("CUSTOMER", "Customer"),
    )
    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("SUSPENDED", "Suspended"),
        ("DEACTIVATED", "Deactivated"),
    )

    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default="")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="CUSTOMER")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    must_change_password = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.role}"


class Turf(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    tagline = models.CharField(max_length=255, blank=True, default="")
    location = models.CharField(max_length=255)  # e.g., HSR, Bangalore
    city = models.CharField(max_length=100, default="Bangalore")
    address = models.TextField(blank=True, default="")
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8)
    review_count = models.PositiveIntegerField(default=120)
    hourly_base_price = models.DecimalField(max_digits=8, decimal_places=2, default=1200.00)
    sports = models.JSONField(default=list)  # ["Football", "Box Cricket", "Futsal"]
    amenities = models.JSONField(default=list)  # ["Floodlights", "Changing Rooms", "Parking", ...]
    description = models.TextField(blank=True, default="")
    main_image = models.CharField(max_length=500)
    gallery_images = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.location}"


class TurfOwnerAssignment(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="turf_assignments", limit_choices_to={"role": "TURF_OWNER"})
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="owner_assignments")
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_turfs")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("owner", "turf")

    def __str__(self):
        return f"{self.owner.name} -> {self.turf.name}"


class PricingRule(models.Model):
    DAY_TYPE_CHOICES = (
        ("ALL", "All Days"),
        ("WEEKDAY", "Weekdays (Mon-Fri)"),
        ("WEEKEND", "Weekends (Sat-Sun)"),
    )

    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="pricing_rules")
    day_type = models.CharField(max_length=20, choices=DAY_TYPE_CHOICES, default="ALL")
    time_slot_start = models.TimeField()
    time_slot_end = models.TimeField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_peak = models.BooleanField(default=False)
    label = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ["time_slot_start"]

    def __str__(self):
        return f"{self.turf.name}: {self.time_slot_start.strftime('%H:%M')} - {self.time_slot_end.strftime('%H:%M')} = ₹{self.price} ({self.day_type})"


class SlotOverride(models.Model):
    """Overrides for specific dates: blocking or custom promotional slot price."""
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="slot_overrides")
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_blocked = models.BooleanField(default=False)
    custom_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("turf", "date", "start_time")

    def __str__(self):
        status = "BLOCKED" if self.is_blocked else f"₹{self.custom_price}"
        return f"{self.turf.name} on {self.date} {self.start_time}: {status}"


class Booking(models.Model):
    STATUS_CHOICES = (
        ("CONFIRMED", "Confirmed"),
        ("CANCELLED", "Cancelled"),
        ("COMPLETED", "Completed"),
    )

    booking_id = models.CharField(max_length=40, unique=True, db_index=True)
    customer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="bookings")
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="bookings")
    booking_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    sport = models.CharField(max_length=50, default="Football")
    
    # Financial snapshot (retains original price even if pricing rules change later!)
    slot_price = models.DecimalField(max_digits=8, decimal_places=2)
    taxes = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="CONFIRMED")
    cancellation_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-booking_date", "-start_time"]

    def __str__(self):
        return f"{self.booking_id} | {self.turf.name} on {self.booking_date} {self.start_time}"


class Payment(models.Model):
    STATUS_CHOICES = (
        ("SUCCESS", "Success"),
        ("PENDING", "Pending"),
        ("FAILED", "Failed"),
        ("REFUNDED", "Refunded"),
    )
    METHOD_CHOICES = (
        ("UPI", "UPI (GPay / PhonePe / Paytm)"),
        ("CARD", "Credit / Debit Card"),
        ("NETBANKING", "Net Banking"),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payment")
    payment_id = models.CharField(max_length=100, unique=True)
    order_id = models.CharField(max_length=100, blank=True, default="")
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="SUCCESS")
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="UPI")
    verified_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.payment_id} - ₹{self.amount} ({self.status})"


class Review(models.Model):
    turf = models.ForeignKey(Turf, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    user_name = models.CharField(max_length=255)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ by {self.user_name} on {self.turf.name}"


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=100)
    details = models.JSONField(default=dict)
    ip_address = models.CharField(max_length=50, blank=True, default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.action} on {self.entity_type} #{self.entity_id}"
