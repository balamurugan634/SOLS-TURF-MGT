import secrets
import string
from decimal import Decimal
from datetime import datetime, date, time, timedelta

from django.db import transaction
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, Turf, TurfOwnerAssignment, PricingRule,
    SlotOverride, Booking, Payment, Review, AuditLog
)
from .serializers import (
    UserSerializer, CustomerRegistrationSerializer,
    AdminCreateTurfOwnerSerializer, ChangePasswordSerializer,
    TurfSerializer, TurfDetailSerializer, PricingRuleSerializer,
    SlotOverrideSerializer, BookingSerializer, PaymentSerializer,
    ReviewSerializer, AuditLogSerializer
)
from .permissions import IsAdminUserRole, IsTurfOwnerRole, IsAssignedTurfOwner


def log_audit(user, action, entity_type, entity_id, details=None, request=None):
    ip = ""
    if request:
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details or {},
        ip_address=ip
    )


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Universal login endpoint for Admin, Turf Owner, and Customer."""
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "")
    role_hint = request.data.get("role")  # Optional role hint for UI login tabs

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if user.status == "SUSPENDED":
        return Response(
            {"error": "Your account has been suspended by the platform administrator."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user.status == "DEACTIVATED" or not user.is_active:
        return Response(
            {"error": "Your account has been deactivated. Please contact support."},
            status=status.HTTP_403_FORBIDDEN
        )

    # If role_hint provided, verify user has that role
    if role_hint and user.role != role_hint:
        return Response(
            {"error": f"This account does not have {role_hint.replace('_', ' ').title()} privileges."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Issue JWT tokens
    refresh = RefreshToken.for_user(user)
    serializer = UserSerializer(user)

    log_audit(user, "LOGIN", "User", user.id, {"email": user.email, "role": user.role}, request)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": serializer.data,
        "must_change_password": user.must_change_password
    })


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_customer_view(request):
    """Customer self-registration endpoint. (Turf Owners cannot register here)."""
    serializer = CustomerRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        log_audit(user, "CUSTOMER_REGISTER", "User", user.id, {"email": user.email}, request)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
            "message": "Registration successful! Welcome to TurfHub."
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    """Returns the current authenticated user's profile and assignments."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Changes user password. Required for Turf Owners on first login."""
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    old_password = serializer.validated_data["old_password"]
    new_password = serializer.validated_data["new_password"]

    if not user.check_password(old_password):
        return Response({"error": "Current temporary/old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.must_change_password = False
    user.save()

    log_audit(user, "CHANGE_PASSWORD", "User", user.id, {"must_change_cleared": True}, request)

    return Response({
        "message": "Password updated successfully. You now have full access to your account.",
        "user": UserSerializer(user).data
    })


# ==========================================
# PUBLIC & CUSTOMER TURF DISCOVERY VIEWS
# ==========================================

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def turf_list_view(request):
    """Lists available turfs with filtering by location/city, sport, search, and price."""
    queryset = Turf.objects.filter(is_active=True).prefetch_related("owner_assignments__owner")

    city = request.query_params.get("city")
    if city and city.lower() != "all":
        queryset = queryset.filter(Q(city__icontains=city) | Q(location__icontains=city))

    location = request.query_params.get("location")
    if location and location.lower() != "all":
        queryset = queryset.filter(location__icontains=location)

    sport = request.query_params.get("sport")
    if sport and sport.lower() != "all":
        queryset = queryset.filter(sports__icontains=sport)

    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(location__icontains=search) |
            Q(city__icontains=search) |
            Q(description__icontains=search)
        )

    max_price = request.query_params.get("max_price")
    if max_price:
        try:
            queryset = queryset.filter(hourly_base_price__lte=Decimal(max_price))
        except Exception:
            pass

    serializer = TurfSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def turf_detail_view(request, pk):
    """Returns single turf details including dynamic pricing rules and verified reviews."""
    turf = get_object_or_404(Turf.objects.prefetch_related("pricing_rules", "reviews"), pk=pk)
    serializer = TurfDetailSerializer(turf)
    return Response(serializer.data)


# ==========================================
# DYNAMIC SLOT COMPUTATION & AVAILABILITY
# ==========================================

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def turf_slots_view(request, pk):
    """
    Computes time slots for a specific turf and date.
    Calculates dynamic slot prices based on:
    1. Day type (Weekday vs Weekend)
    2. Time of day (PricingRules: early bird, normal, evening peak, prime night)
    3. Explicit SlotOverride (blocked maintenance or custom promotional price)
    4. Confirmed Bookings (marks slot as BOOKED)
    """
    turf = get_object_or_404(Turf, pk=pk)
    date_str = request.query_params.get("date")

    if not date_str:
        target_date = timezone.localdate()
    else:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

    # Determine weekday vs weekend
    # Python weekday: 0=Mon, 4=Fri, 5=Sat, 6=Sun
    is_weekend = target_date.weekday() >= 5
    current_day_type = "WEEKEND" if is_weekend else "WEEKDAY"

    # Pre-fetch pricing rules for this turf
    rules = list(turf.pricing_rules.all())

    # Pre-fetch slot overrides for this date
    overrides = {
        o.start_time.strftime("%H:%M"): o
        for o in SlotOverride.objects.filter(turf=turf, date=target_date)
    }

    # Pre-fetch confirmed bookings for this date and turf
    confirmed_bookings = {
        b.start_time.strftime("%H:%M"): b
        for b in Booking.objects.filter(turf=turf, booking_date=target_date, status="CONFIRMED")
    }

    # Generate standard slots from 06:00 to 24:00 (1 hour each)
    slots = []
    for hour in range(6, 24):
        start_t = time(hour, 0)
        end_t = time((hour + 1) % 24, 0) if hour < 23 else time(23, 59)
        start_str = start_t.strftime("%H:%M")
        end_str = "00:00" if hour == 23 else end_t.strftime("%H:%M")
        slot_key = f"{start_str} - {end_str}"

        # Categorize period
        if 6 <= hour < 12:
            period = "Morning"
        elif 12 <= hour < 16:
            period = "Afternoon"
        elif 16 <= hour < 20:
            period = "Evening"
        else:
            period = "Night"

        # Determine price:
        # Check pricing rules matching this slot and day type
        slot_price = turf.hourly_base_price
        is_peak = False
        rule_label = ""

        # Priority 1: Specific day type match (WEEKDAY / WEEKEND)
        matching_rule = next(
            (r for r in rules if r.time_slot_start.hour == hour and r.day_type == current_day_type),
            None
        )
        # Priority 2: Fallback to 'ALL' days rule
        if not matching_rule:
            matching_rule = next(
                (r for r in rules if r.time_slot_start.hour == hour and r.day_type == "ALL"),
                None
            )

        if matching_rule:
            slot_price = matching_rule.price
            is_peak = matching_rule.is_peak
            rule_label = matching_rule.label

        # Priority 3: Check SlotOverride for this specific date
        is_blocked = False
        block_reason = ""
        if start_str in overrides:
            override = overrides[start_str]
            if override.is_blocked:
                is_blocked = True
                block_reason = override.reason or "Unavailable / Maintenance"
            elif override.custom_price is not None:
                slot_price = override.custom_price

        # Check booking status
        is_booked = start_str in confirmed_bookings

        # Determine state for UI:
        # 'booked', 'blocked', 'available'
        if is_booked:
            slot_status = "booked"
        elif is_blocked:
            slot_status = "unavailable"
        else:
            slot_status = "available"

        slots.append({
            "id": f"{target_date.strftime('%Y%m%d')}_{hour:02d}",
            "start_time": start_str,
            "end_time": end_str,
            "display_time": slot_key,
            "period": period,
            "price": float(slot_price),
            "is_peak": is_peak,
            "label": rule_label,
            "status": slot_status,
            "block_reason": block_reason,
            "is_weekend": is_weekend
        })

    return Response({
        "turf_id": turf.id,
        "turf_name": turf.name,
        "date": target_date.strftime("%Y-%m-%d"),
        "day_name": target_date.strftime("%A"),
        "is_weekend": is_weekend,
        "base_price": float(turf.hourly_base_price),
        "slots": slots
    })


# ==========================================
# BOOKINGS & PAYMENTS
# ==========================================

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def create_booking_view(request):
    """
    Creates a confirmed booking with server-side dynamic pricing calculation and double-booking prevention.
    """
    turf_id = request.data.get("turf_id")
    booking_date_str = request.data.get("booking_date")
    start_time_str = request.data.get("start_time")  # e.g., "18:00"
    end_time_str = request.data.get("end_time")      # e.g., "19:00"
    sport = request.data.get("sport", "Football")
    payment_method = request.data.get("payment_method", "UPI")

    customer_name = request.data.get("customer_name")
    customer_email = request.data.get("customer_email")
    customer_phone = request.data.get("customer_phone")

    # If logged in as customer, auto-fill profile data if omitted
    customer_user = request.user if request.user.is_authenticated else None
    if customer_user and not customer_name:
        customer_name = customer_user.name
        customer_email = customer_user.email
        customer_phone = customer_user.phone

    if not all([turf_id, booking_date_str, start_time_str, customer_name, customer_email, customer_phone]):
        return Response(
            {"error": "Please provide turf_id, booking_date, start_time, name, email, and phone number."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
        start_hour, start_min = map(int, start_time_str.split(":")[:2])
        start_time = time(start_hour, start_min)
        
        if end_time_str:
            end_hour, end_min = map(int, end_time_str.split(":")[:2])
            end_time = time(end_hour, end_min)
        else:
            end_time = time((start_hour + 1) % 24, start_min)
    except Exception as e:
        return Response({"error": f"Invalid date or time: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    # Lock rows with transaction to prevent double bookings
    with transaction.atomic():
        turf = get_object_or_404(Turf.objects.select_for_update(), pk=turf_id)

        # Check existing booking for same turf, date, start_time
        existing_booking = Booking.objects.select_for_update().filter(
            turf=turf,
            booking_date=booking_date,
            start_time=start_time,
            status="CONFIRMED"
        ).first()

        if existing_booking:
            return Response(
                {"error": "This slot has already been booked by another customer. Please select another slot."},
                status=status.HTTP_409_CONFLICT
            )

        # Check if slot is blocked by owner
        blocked_override = SlotOverride.objects.filter(
            turf=turf,
            date=booking_date,
            start_time=start_time,
            is_blocked=True
        ).first()
        if blocked_override:
            return Response(
                {"error": f"This slot is currently unavailable: {blocked_override.reason or 'Slot blocked'}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # SERVER-SIDE PRICE CALCULATION (CRITICAL SECURITY RULE)
        # 1. Day type
        day_type = "WEEKEND" if booking_date.weekday() >= 5 else "WEEKDAY"
        slot_price = turf.hourly_base_price

        # Check PricingRules
        rule = PricingRule.objects.filter(
            turf=turf,
            time_slot_start__hour=start_hour,
            day_type=day_type
        ).first()
        if not rule:
            rule = PricingRule.objects.filter(
                turf=turf,
                time_slot_start__hour=start_hour,
                day_type="ALL"
            ).first()

        if rule:
            slot_price = rule.price

        # Check custom override price if any
        custom_override = SlotOverride.objects.filter(
            turf=turf,
            date=booking_date,
            start_time=start_time,
            custom_price__isnull=False
        ).first()
        if custom_override and custom_override.custom_price:
            slot_price = custom_override.custom_price

        # Taxes (5% GST calculation or flat platform convenience fee)
        taxes = (slot_price * Decimal("0.05")).quantize(Decimal("0.01"))
        total_amount = slot_price + taxes

        # Generate unique booking ID
        rand_code = "".join(secrets.choice(string.digits) for _ in range(5))
        booking_id = f"THB-{booking_date.strftime('%y%m%d')}-{rand_code}"

        booking = Booking.objects.create(
            booking_id=booking_id,
            customer=customer_user,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            turf=turf,
            booking_date=booking_date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=60,
            sport=sport,
            slot_price=slot_price,
            taxes=taxes,
            total_amount=total_amount,
            status="CONFIRMED"
        )

        # Create Payment record (Simulated Razorpay / Payment Gateway)
        pay_id = f"pay_rzp_{secrets.token_hex(6)}"
        order_id = f"order_{secrets.token_hex(5)}"
        payment = Payment.objects.create(
            booking=booking,
            payment_id=pay_id,
            order_id=order_id,
            amount=total_amount,
            currency="INR",
            status="SUCCESS",
            payment_method=payment_method
        )

        log_audit(
            customer_user,
            "CREATE_BOOKING",
            "Booking",
            booking.booking_id,
            {
                "turf": turf.name,
                "date": str(booking_date),
                "time": str(start_time),
                "amount": float(total_amount),
                "payment_id": pay_id
            },
            request
        )

    serializer = BookingSerializer(booking)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_bookings_view(request):
    """Returns booking history for the logged-in customer."""
    bookings = Booking.objects.filter(
        Q(customer=request.user) | Q(customer_email__iexact=request.user.email)
    ).select_related("turf", "payment").order_by("-booking_date", "-start_time")
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking_view(request, pk):
    """Allows a customer or admin to cancel an upcoming booking."""
    booking = get_object_or_404(Booking, pk=pk)

    # Permission check: customer must own booking or be admin/turf owner
    if request.user.role == "CUSTOMER" and booking.customer != request.user and booking.customer_email.lower() != request.user.email.lower():
        return Response({"error": "You are not authorized to cancel this booking."}, status=status.HTTP_403_FORBIDDEN)

    if booking.status == "CANCELLED":
        return Response({"error": "This booking is already cancelled."}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get("reason", "Cancelled by customer")
    booking.status = "CANCELLED"
    booking.cancellation_reason = reason
    booking.save()

    # Update payment status
    if hasattr(booking, "payment"):
        booking.payment.status = "REFUNDED"
        booking.payment.save()

    log_audit(request.user, "CANCEL_BOOKING", "Booking", booking.booking_id, {"reason": reason}, request)

    return Response({
        "message": "Booking successfully cancelled. Refund will be processed within 2-3 business days.",
        "booking": BookingSerializer(booking).data
    })


# ==========================================
# TURF OWNER DASHBOARD VIEWS
# ==========================================

@api_view(["GET"])
@permission_classes([IsTurfOwnerRole])
def owner_turfs_view(request):
    """Returns turfs assigned to the current turf owner."""
    if request.user.role == "ADMIN":
        turfs = Turf.objects.all()
    else:
        turfs = Turf.objects.filter(owner_assignments__owner=request.user)
    serializer = TurfSerializer(turfs, many=True)
    return Response(serializer.data)


@api_view(["GET", "POST", "PUT"])
@permission_classes([IsTurfOwnerRole])
def owner_pricing_rules_view(request, turf_id):
    """
    Manages slot pricing rules for an owner's assigned turf.
    GET: Returns all pricing rules for the turf.
    POST / PUT: Updates pricing for individual slots, weekday/weekend, and peak hours.
    CRITICAL RULE: Updated prices affect future bookings only; existing bookings remain untouched!
    """
    turf = get_object_or_404(Turf, pk=turf_id)

    # Authorization
    if request.user.role != "ADMIN" and not TurfOwnerAssignment.objects.filter(owner=request.user, turf=turf).exists():
        return Response({"error": "You do not have permission to manage pricing for this turf."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        rules = turf.pricing_rules.all().order_by("time_slot_start", "day_type")
        return Response(PricingRuleSerializer(rules, many=True).data)

    if request.method in ["POST", "PUT"]:
        rules_data = request.data.get("rules")
        if not rules_data or not isinstance(rules_data, list):
            # Single rule update
            rule_id = request.data.get("id")
            price = request.data.get("price")
            is_peak = request.data.get("is_peak", False)
            day_type = request.data.get("day_type", "ALL")
            start_time_str = request.data.get("time_slot_start")
            end_time_str = request.data.get("time_slot_end")
            label = request.data.get("label", "")

            if rule_id:
                rule = get_object_or_404(PricingRule, pk=rule_id, turf=turf)
                old_price = float(rule.price)
                rule.price = Decimal(str(price))
                rule.is_peak = is_peak
                if label:
                    rule.label = label
                rule.save()
                log_audit(
                    request.user,
                    "UPDATE_PRICE_RULE",
                    "PricingRule",
                    rule.id,
                    {"turf": turf.name, "old_price": old_price, "new_price": float(rule.price)},
                    request
                )
                return Response(PricingRuleSerializer(rule).data)
            else:
                start_h, start_m = map(int, start_time_str.split(":")[:2])
                end_h, end_m = map(int, end_time_str.split(":")[:2])
                rule = PricingRule.objects.create(
                    turf=turf,
                    day_type=day_type,
                    time_slot_start=time(start_h, start_m),
                    time_slot_end=time(end_h, end_m),
                    price=Decimal(str(price)),
                    is_peak=is_peak,
                    label=label
                )
                log_audit(request.user, "CREATE_PRICE_RULE", "PricingRule", rule.id, {"turf": turf.name, "price": float(rule.price)}, request)
                return Response(PricingRuleSerializer(rule).data, status=status.HTTP_201_CREATED)

        # Batch update rules
        updated_count = 0
        for item in rules_data:
            item_id = item.get("id")
            if item_id:
                PricingRule.objects.filter(id=item_id, turf=turf).update(
                    price=Decimal(str(item.get("price"))),
                    is_peak=item.get("is_peak", False),
                    label=item.get("label", "")
                )
                updated_count += 1
            else:
                start_h, start_m = map(int, item["time_slot_start"].split(":")[:2])
                end_h, end_m = map(int, item["time_slot_end"].split(":")[:2])
                PricingRule.objects.create(
                    turf=turf,
                    day_type=item.get("day_type", "ALL"),
                    time_slot_start=time(start_h, start_m),
                    time_slot_end=time(end_h, end_m),
                    price=Decimal(str(item["price"])),
                    is_peak=item.get("is_peak", False),
                    label=item.get("label", "")
                )
                updated_count += 1

        log_audit(request.user, "BATCH_UPDATE_PRICING", "Turf", turf.id, {"count": updated_count}, request)
        updated_rules = turf.pricing_rules.all().order_by("time_slot_start", "day_type")
        return Response({
            "message": f"Successfully updated {updated_count} pricing rules. New rates are active immediately for future bookings.",
            "rules": PricingRuleSerializer(updated_rules, many=True).data
        })


@api_view(["POST"])
@permission_classes([IsTurfOwnerRole])
def owner_toggle_block_slot_view(request, turf_id):
    """Allows an owner to block or unblock unavailable time slots."""
    turf = get_object_or_404(Turf, pk=turf_id)

    if request.user.role != "ADMIN" and not TurfOwnerAssignment.objects.filter(owner=request.user, turf=turf).exists():
        return Response({"error": "Unauthorized for this turf."}, status=status.HTTP_403_FORBIDDEN)

    date_str = request.data.get("date")
    start_time_str = request.data.get("start_time")
    is_blocked = request.data.get("is_blocked", True)
    reason = request.data.get("reason", "Maintenance / Reserved")

    if not date_str or not start_time_str:
        return Response({"error": "date and start_time are required."}, status=status.HTTP_400_BAD_REQUEST)

    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    start_h, start_m = map(int, start_time_str.split(":")[:2])
    start_t = time(start_h, start_m)
    end_t = time((start_h + 1) % 24, start_m)

    override, created = SlotOverride.objects.get_or_create(
        turf=turf,
        date=target_date,
        start_time=start_t,
        defaults={"end_time": end_t, "is_blocked": is_blocked, "reason": reason}
    )

    if not created:
        override.is_blocked = is_blocked
        override.reason = reason
        override.save()

    log_audit(
        request.user,
        "BLOCK_SLOT" if is_blocked else "UNBLOCK_SLOT",
        "SlotOverride",
        override.id,
        {"turf": turf.name, "date": date_str, "time": start_time_str, "reason": reason},
        request
    )

    return Response({
        "message": f"Slot {start_time_str} on {date_str} has been {'blocked' if is_blocked else 'unblocked'}.",
        "override": SlotOverrideSerializer(override).data
    })


@api_view(["GET"])
@permission_classes([IsTurfOwnerRole])
def owner_bookings_view(request):
    """Returns bookings for the turfs assigned to the current owner."""
    if request.user.role == "ADMIN":
        turf_ids = Turf.objects.values_list("id", flat=True)
    else:
        turf_ids = request.user.turf_assignments.values_list("turf_id", flat=True)

    bookings = Booking.objects.filter(turf_id__in=turf_ids).select_related("turf", "payment").order_by("-created_at")
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsTurfOwnerRole])
def owner_analytics_view(request):
    """Returns earnings and booking analytics for the current owner's turfs."""
    if request.user.role == "ADMIN":
        turfs = Turf.objects.all()
    else:
        turfs = Turf.objects.filter(owner_assignments__owner=request.user)

    turf_ids = list(turfs.values_list("id", flat=True))

    total_bookings = Booking.objects.filter(turf_id__in=turf_ids, status="CONFIRMED").count()
    revenue_agg = Booking.objects.filter(turf_id__in=turf_ids, status="CONFIRMED").aggregate(Sum("total_amount"))
    total_revenue = float(revenue_agg["total_amount__sum"] or 0)

    # Monthly breakdown (simulated / real grouping)
    today = timezone.localdate()
    recent_bookings = Booking.objects.filter(turf_id__in=turf_ids).select_related("turf", "payment")[:10]

    return Response({
        "total_turfs": turfs.count(),
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "average_slot_rate": round(total_revenue / max(total_bookings, 1), 2),
        "recent_bookings": BookingSerializer(recent_bookings, many=True).data
    })


# ==========================================
# ADMIN DASHBOARD VIEWS
# ==========================================

@api_view(["GET"])
@permission_classes([IsAdminUserRole])
def admin_stats_view(request):
    """Returns high-level platform statistics for the admin dashboard."""
    total_owners = User.objects.filter(role="TURF_OWNER").count()
    total_customers = User.objects.filter(role="CUSTOMER").count()
    total_turfs = Turf.objects.count()
    total_bookings = Booking.objects.count()
    active_bookings = Booking.objects.filter(status="CONFIRMED", booking_date__gte=timezone.localdate()).count()

    revenue_agg = Booking.objects.filter(status="CONFIRMED").aggregate(Sum("total_amount"))
    total_revenue = float(revenue_agg["total_amount__sum"] or 0)

    return Response({
        "total_turf_owners": total_owners,
        "total_customers": total_customers,
        "total_turfs": total_turfs,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "total_revenue": total_revenue
    })


@api_view(["GET", "POST"])
@permission_classes([IsAdminUserRole])
def admin_turf_owners_view(request):
    """
    GET: Lists all turf owner accounts with assigned turfs and status.
    POST: Creates a new Turf Owner account.
          - Generates secure temporary password
          - Hashes password
          - Sets must_change_password = True
          - Assigns designated turfs
          - Returns the temporary password in response so Admin can share it!
    """
    if request.method == "GET":
        owners = User.objects.filter(role="TURF_OWNER").prefetch_related("turf_assignments__turf").order_by("-created_at")
        serializer = UserSerializer(owners, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = AdminCreateTurfOwnerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        # Generate secure temporary password if not provided
        temp_password = data.get("custom_temp_password")
        if not temp_password:
            chars = string.ascii_letters + string.digits + "!@#$%"
            temp_password = "Owner#" + "".join(secrets.choice(chars) for _ in range(8))

        with transaction.atomic():
            owner = User.objects.create_user(
                email=data["email"],
                name=data["name"],
                phone=data.get("phone", ""),
                role="TURF_OWNER",
                status=data.get("status", "ACTIVE"),
                must_change_password=True,
                is_active=True
            )
            owner.set_password(temp_password)
            owner.save()

            # Assign designated turfs
            assigned_turfs = []
            for turf_id in data.get("assigned_turf_ids", []):
                turf = Turf.objects.filter(id=turf_id).first()
                if turf:
                    assignment, _ = TurfOwnerAssignment.objects.get_or_create(
                        owner=owner,
                        turf=turf,
                        defaults={"assigned_by": request.user}
                    )
                    assigned_turfs.append(turf.name)

            log_audit(
                request.user,
                "CREATE_TURF_OWNER",
                "User",
                owner.id,
                {
                    "name": owner.name,
                    "email": owner.email,
                    "assigned_turfs": assigned_turfs,
                    "status": owner.status
                },
                request
            )

        return Response({
            "message": f"Turf Owner account for '{owner.name}' created successfully.",
            "owner": UserSerializer(owner).data,
            "temporary_password": temp_password,
            "instructions": "Please provide these temporary credentials to the owner. They will be required to change their password upon first login."
        }, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdminUserRole])
def admin_manage_owner_detail_view(request, pk):
    """Admin can activate, suspend, deactivate, or assign turfs to an owner."""
    owner = get_object_or_404(User, pk=pk, role="TURF_OWNER")

    if request.method == "PATCH":
        new_status = request.data.get("status")
        assigned_turf_ids = request.data.get("assigned_turf_ids")
        reset_temp_pass = request.data.get("reset_password", False)

        if new_status in ["ACTIVE", "SUSPENDED", "DEACTIVATED"]:
            owner.status = new_status
            if new_status == "DEACTIVATED":
                owner.is_active = False
            else:
                owner.is_active = True

        temp_pass_generated = None
        if reset_temp_pass:
            temp_pass_generated = "Reset#" + "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
            owner.set_password(temp_pass_generated)
            owner.must_change_password = True

        owner.save()

        if assigned_turf_ids is not None:
            TurfOwnerAssignment.objects.filter(owner=owner).delete()
            for tid in assigned_turf_ids:
                turf = Turf.objects.filter(id=tid).first()
                if turf:
                    TurfOwnerAssignment.objects.create(owner=owner, turf=turf, assigned_by=request.user)

        log_audit(
            request.user,
            "UPDATE_TURF_OWNER",
            "User",
            owner.id,
            {"status": owner.status, "assigned_turfs": assigned_turf_ids},
            request
        )

        res_data = {
            "message": f"Owner {owner.name} updated successfully.",
            "owner": UserSerializer(owner).data
        }
        if temp_pass_generated:
            res_data["temporary_password"] = temp_pass_generated

        return Response(res_data)

    if request.method == "DELETE":
        owner.status = "DEACTIVATED"
        owner.is_active = False
        owner.save()
        log_audit(request.user, "DEACTIVATE_TURF_OWNER", "User", owner.id, {}, request)
        return Response({"message": f"Turf owner {owner.name} deactivated."})


@api_view(["GET", "POST"])
@permission_classes([IsAdminUserRole])
def admin_turfs_view(request):
    """Admin endpoint to view all turfs or create a new turf."""
    if request.method == "GET":
        turfs = Turf.objects.all().order_by("-created_at")
        return Response(TurfSerializer(turfs, many=True).data)

    if request.method == "POST":
        serializer = TurfSerializer(data=request.data)
        if serializer.is_valid():
            turf = serializer.save()
            log_audit(request.user, "CREATE_TURF", "Turf", turf.id, {"name": turf.name}, request)
            return Response(TurfSerializer(turf).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAdminUserRole])
def admin_customers_view(request):
    """Admin endpoint to view all registered customers with booking counts."""
    customers = User.objects.filter(role="CUSTOMER").annotate(booking_count=Count("bookings")).order_by("-created_at")
    data = []
    for c in customers:
        data.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "status": c.status,
            "booking_count": c.booking_count,
            "joined_at": c.created_at.strftime("%Y-%m-%d")
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUserRole])
def admin_all_bookings_view(request):
    """Admin endpoint to view all bookings across the platform."""
    bookings = Booking.objects.all().select_related("turf", "payment").order_by("-created_at")
    return Response(BookingSerializer(bookings, many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminUserRole])
def admin_payments_view(request):
    """Admin endpoint to view all payment records."""
    payments = Payment.objects.all().select_related("booking__turf").order_by("-verified_at")
    data = []
    for p in payments:
        data.append({
            "id": p.id,
            "payment_id": p.payment_id,
            "order_id": p.order_id,
            "amount": float(p.amount),
            "currency": p.currency,
            "status": p.status,
            "payment_method": p.payment_method,
            "booking_id": p.booking.booking_id,
            "turf_name": p.booking.turf.name,
            "customer_name": p.booking.customer_name,
            "verified_at": p.verified_at.strftime("%Y-%m-%d %H:%M")
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminUserRole])
def admin_audit_logs_view(request):
    """Admin endpoint to view audit logs for security and compliance."""
    logs = AuditLog.objects.all().select_related("user")[:100]
    return Response(AuditLogSerializer(logs, many=True).data)
