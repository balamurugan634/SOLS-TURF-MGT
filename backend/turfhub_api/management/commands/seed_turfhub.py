from datetime import date, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from turfhub_api.models import (
    User, Turf, TurfOwnerAssignment, PricingRule,
    SlotOverride, Booking, Payment, Review, AuditLog
)


class Command(BaseCommand):
    help = "Seeds database with realistic TurfHub sample data for Admins, Turf Owners, Customers, Turfs, Pricing Rules, and Bookings."

    def handle(self, *args, **options):
        self.stdout.write("Starting database seed...")

        # 1. Admin Account
        admin_user, created = User.objects.get_or_create(
            email="admin@turfhub.com",
            defaults={
                "name": "Super Administrator",
                "phone": "+91 98765 00001",
                "role": "ADMIN",
                "status": "ACTIVE",
                "must_change_password": False,
                "is_staff": True,
                "is_superuser": True
            }
        )
        admin_user.set_password("admin123")
        admin_user.save()
        self.stdout.write(f"Admin created: admin@turfhub.com / admin123")

        # 2. Turf Owner 1: Active
        owner_rajesh, _ = User.objects.get_or_create(
            email="owner.greenfield@turfhub.com",
            defaults={
                "name": "Rajesh Sharma",
                "phone": "+91 98450 12345",
                "role": "TURF_OWNER",
                "status": "ACTIVE",
                "must_change_password": False
            }
        )
        owner_rajesh.set_password("owner123")
        owner_rajesh.save()

        # 3. Turf Owner 2: Needs First-Login Password Change (per requirements)
        owner_vikram, _ = User.objects.get_or_create(
            email="newowner@turfhub.com",
            defaults={
                "name": "Vikram Malhotra",
                "phone": "+91 98110 54321",
                "role": "TURF_OWNER",
                "status": "ACTIVE",
                "must_change_password": True
            }
        )
        owner_vikram.set_password("tempPass#2026")
        owner_vikram.save()
        self.stdout.write(f"New Turf Owner created (first login change required): newowner@turfhub.com / tempPass#2026")

        # 4. Customer
        customer_john, _ = User.objects.get_or_create(
            email="john.doe@example.com",
            defaults={
                "name": "John Doe",
                "phone": "+91 99000 88776",
                "role": "CUSTOMER",
                "status": "ACTIVE",
                "must_change_password": False
            }
        )
        customer_john.set_password("customer123")
        customer_john.save()

        # 5. Realistic Turfs (matching reference image)
        turfs_data = [
            {
                "name": "GreenField Turf",
                "slug": "greenfield-turf-hsr",
                "tagline": "Bangalore's Highest Rated 7v7 FIFA Quality Artificial Pitch",
                "location": "HSR, Bangalore",
                "city": "Bangalore",
                "address": "27th Main Road, Sector 2, HSR Layout, Bengaluru, Karnataka 560102",
                "rating": Decimal("4.8"),
                "review_count": 236,
                "hourly_base_price": Decimal("1200.00"),
                "sports": ["Football", "Box Cricket", "Futsal"],
                "amenities": ["FIFA 2-Star Turf", "High-Mast Floodlights", "Dressing Rooms & Showers", "Free Covered Parking", "Chilled Mineral Water", "Spectator Seating Dugout", "Live Match Recording"],
                "description": "GreenField Turf in HSR Layout offers premium 50mm diamond-monofilament grass with shockpad cushioning. Perfect for weekend tournaments, corporate leagues, and late-night football under broadcast-quality floodlights.",
                "main_image": "/images/turf-greenfield.jpg",
                "gallery_images": ["/images/hero-turf.jpg", "/images/turf-arena.jpg"]
            },
            {
                "name": "Pace Sports Arena",
                "slug": "pace-sports-arena-whitefield",
                "tagline": "State of the art multi-sport complex with cricket bowling machine",
                "location": "Whitefield, Bangalore",
                "city": "Bangalore",
                "address": "ITPL Main Road, Near Hope Farm Junction, Whitefield, Bengaluru 560066",
                "rating": Decimal("4.7"),
                "review_count": 189,
                "hourly_base_price": Decimal("1500.00"),
                "sports": ["Football", "Box Cricket", "Badminton"],
                "amenities": ["Automated Bowling Machine", "LED Floodlights", "Player Lounge & Cafe", "First Aid", "Bibs & Footballs Provided", "Shower Rooms"],
                "description": "Pace Sports Arena is Whitefield's premier sporting arena featuring high bounce turf, professional boundary netting, and an automated cricket bowling machine.",
                "main_image": "/images/turf-arena.jpg",
                "gallery_images": ["/images/turf-greenfield.jpg", "/images/hero-turf.jpg"]
            },
            {
                "name": "KickOff Turf",
                "slug": "kickoff-turf-koramangala",
                "tagline": "Dynamic 5v5 Futsal & Cricket turf right in the heart of Koramangala",
                "location": "Koramangala, Bangalore",
                "city": "Bangalore",
                "address": "80 Feet Road, 4th Block, Koramangala, Bengaluru 560034",
                "rating": Decimal("4.6"),
                "review_count": 142,
                "hourly_base_price": Decimal("1000.00"),
                "sports": ["Football", "Futsal"],
                "amenities": ["Floodlights", "Restrooms", "Free Parking", "Drinking Water", "Changing Room"],
                "description": "Centrally located in Koramangala, KickOff Turf is the go-to venue for fast-paced 5v5 futsal matches with friends and colleagues.",
                "main_image": "/images/hero-turf.jpg",
                "gallery_images": ["/images/turf-greenfield.jpg", "/images/turf-arena.jpg"]
            },
            {
                "name": "Apex Football Arena",
                "slug": "apex-football-arena-indiranagar",
                "tagline": "Premium FIFA-standard rooftop football turf with skyline view",
                "location": "Indiranagar, Bangalore",
                "city": "Bangalore",
                "address": "100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
                "rating": Decimal("4.9"),
                "review_count": 312,
                "hourly_base_price": Decimal("1800.00"),
                "sports": ["Football", "Box Cricket", "Frisbee"],
                "amenities": ["Rooftop Skyline View", "Professional Referee on Request", "HD Match Recording", "Cafe & Smoothies", "Locker Rooms"],
                "description": "An elevated sporting experience on Indiranagar's famous 100ft road. Stunning night atmosphere with stadium grade illumination.",
                "main_image": "/images/turf-arena.jpg",
                "gallery_images": ["/images/turf-greenfield.jpg"]
            }
        ]

        created_turfs = []
        for tdata in turfs_data:
            turf, created = Turf.objects.get_or_create(
                slug=tdata["slug"],
                defaults=tdata
            )
            created_turfs.append(turf)

        # 6. Assign Turfs to Owners
        # Owner Rajesh manages GreenField and Pace Sports Arena
        TurfOwnerAssignment.objects.get_or_create(owner=owner_rajesh, turf=created_turfs[0], defaults={"assigned_by": admin_user})
        TurfOwnerAssignment.objects.get_or_create(owner=owner_rajesh, turf=created_turfs[1], defaults={"assigned_by": admin_user})

        # Owner Vikram manages KickOff Turf
        TurfOwnerAssignment.objects.get_or_create(owner=owner_vikram, turf=created_turfs[2], defaults={"assigned_by": admin_user})

        # 7. Dynamic Pricing Rules for GreenField Turf (Matching the table in prompt!)
        # | 6:00 AM – 7:00 AM | ₹800 |
        # | 7:00 AM – 8:00 AM | ₹1,000 |
        # | 4:00 PM – 5:00 PM | ₹1,200 |
        # | 6:00 PM – 7:00 PM | ₹1,500 |
        # | 8:00 PM – 9:00 PM | ₹1,800 |
        greenfield = created_turfs[0]
        rules_specs = [
            (6, 7, Decimal("800.00"), False, "Early Bird Slot", "ALL"),
            (7, 8, Decimal("1000.00"), False, "Morning Fitness Slot", "ALL"),
            (8, 12, Decimal("1100.00"), False, "Daytime Non-Peak", "WEEKDAY"),
            (8, 12, Decimal("1300.00"), False, "Weekend Morning Active", "WEEKEND"),
            (12, 16, Decimal("900.00"), False, "Afternoon Happy Hour", "ALL"),
            (16, 17, Decimal("1200.00"), False, "Afternoon Prime", "ALL"),
            (17, 18, Decimal("1350.00"), False, "Late Afternoon", "ALL"),
            (18, 19, Decimal("1500.00"), True, "Evening Prime (Peak)", "WEEKDAY"),
            (18, 19, Decimal("1700.00"), True, "Weekend Evening Prime (Peak)", "WEEKEND"),
            (19, 20, Decimal("1650.00"), True, "Evening Rush (Peak)", "ALL"),
            (20, 21, Decimal("1800.00"), True, "Prime Night Floodlit (Peak)", "ALL"),
            (21, 22, Decimal("1600.00"), True, "Night Match (Peak)", "ALL"),
            (22, 23, Decimal("1400.00"), False, "Late Night Futsal", "ALL"),
            (23, 24, Decimal("1200.00"), False, "Midnight Game", "ALL"),
        ]

        for sh, eh, pr, peak, lbl, dtype in rules_specs:
            PricingRule.objects.get_or_create(
                turf=greenfield,
                time_slot_start=time(sh, 0),
                time_slot_end=time(eh % 24, 0) if eh < 24 else time(23, 59),
                day_type=dtype,
                defaults={
                    "price": pr,
                    "is_peak": peak,
                    "label": lbl
                }
            )

        # 8. Sample Reviews
        sample_reviews = [
            (created_turfs[0], "Arjun K.", 5, "Unbelievable grass quality and lighting! Ball rolls true and no slipping even during damp weather."),
            (created_turfs[0], "Sahil Verma", 5, "Booked the 8-9 PM peak slot through TurfHub. Seamless check-in and clean changing rooms."),
            (created_turfs[0], "Pooja Reddy", 4, "Great experience for our corporate cricket match. Good parking space."),
            (created_turfs[1], "Naveen Raj", 5, "The bowling machine and boundary netting make box cricket so much fun!"),
            (created_turfs[2], "Rohan S.", 4, "Affordable and right in Koramangala. Perfect for a quick weekend 5v5 game.")
        ]
        for trf, uname, rt, cmt in sample_reviews:
            Review.objects.get_or_create(
                turf=trf,
                user_name=uname,
                defaults={"rating": rt, "comment": cmt}
            )

        # 9. Pre-populate sample bookings for Today and Tomorrow so slot states demonstrate 'booked' vs 'available'
        today = timezone.localdate()
        tomorrow = today + timedelta(days=1)

        sample_bookings = [
            (greenfield, today, time(18, 0), time(19, 0), Decimal("1500.00"), "Amit Patel", "amit.patel@gmail.com", "+91 98450 99881", "Football"),
            (greenfield, today, time(20, 0), time(21, 0), Decimal("1800.00"), "Kiran Kumar", "kiran.k@techcorp.com", "+91 97400 11223", "Box Cricket"),
            (greenfield, tomorrow, time(7, 0), time(8, 0), Decimal("1000.00"), "John Doe", "john.doe@example.com", "+91 99000 88776", "Football"),
            (created_turfs[1], today, time(19, 0), time(20, 0), Decimal("1500.00"), "Sunil Mehta", "sunil.mehta@example.com", "+91 98190 44556", "Cricket")
        ]

        for trf, bdate, st, et, sprice, cname, cmail, cph, sprt in sample_bookings:
            tax = (sprice * Decimal("0.05")).quantize(Decimal("0.01"))
            tot = sprice + tax
            b_id = f"THB-{bdate.strftime('%y%m%d')}-{st.hour:02d}00"
            booking, created = Booking.objects.get_or_create(
                turf=trf,
                booking_date=bdate,
                start_time=st,
                defaults={
                    "booking_id": b_id,
                    "customer": customer_john if cmail == customer_john.email else None,
                    "customer_name": cname,
                    "customer_email": cmail,
                    "customer_phone": cph,
                    "end_time": et,
                    "duration_minutes": 60,
                    "sport": sprt,
                    "slot_price": sprice,
                    "taxes": tax,
                    "total_amount": tot,
                    "status": "CONFIRMED"
                }
            )
            if created:
                Payment.objects.create(
                    booking=booking,
                    payment_id=f"pay_rzp_mock_{st.hour:02d}",
                    order_id=f"order_mock_{st.hour:02d}",
                    amount=tot,
                    currency="INR",
                    status="SUCCESS",
                    payment_method="UPI"
                )

        # 10. Audit log entries
        AuditLog.objects.get_or_create(
            action="SYSTEM_INIT",
            entity_type="Platform",
            entity_id="1",
            defaults={
                "user": admin_user,
                "details": {"message": "Platform seeded with initial turfs, dynamic pricing rules, and users."}
            }
        )

        self.stdout.write(self.style.SUCCESS("TurfHub successfully seeded! All roles, turfs, and dynamic pricing rules ready."))
