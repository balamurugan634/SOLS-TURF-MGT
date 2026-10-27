# TurfHub – Turf Booking & Management Platform

A modern, responsive, full-stack turf booking and facility management platform built with **React 18 (TypeScript + Tailwind CSS)** and **Django REST Framework (Python)**.

---

## 🌟 Key Features

### 1. Three Role-Based Portals & RBAC
- **Admin Portal**:
  - Full platform overview & financial statistics.
  - Create and manage Turf Owners with temporary generated credentials.
  - Activate, suspend, or deactivate owner accounts.
  - View all customer accounts, verified payments, and audit logs.
  - Turf facilities management and owner assignments.
  - *Turf owners cannot register publicly — only administrators can provision them.*

- **Turf Owner Portal**:
  - Mandatory password change on first login.
  - Access only turfs assigned to their account.
  - **Dynamic Slot Pricing Engine**:
    - Configure individual hourly slot rates.
    - Set weekday vs. weekend pricing rules.
    - Configure peak hour surcharges (e.g., 6-7 PM, 8-9 PM prime slots).
    - Block/unblock unavailable slots for maintenance or private tournaments.
    - **Critical Business Rule**: Price updates reflect immediately for future bookings while existing confirmed bookings retain their locked agreed price!
  - Real-time earnings and booking analytics.

- **Customer Experience**:
  - Responsive landing page matching real-world SaaS aesthetic.
  - Search turfs by location, sport, and date.
  - Horizontal interactive date selector (next 14 days) and time-of-day filters (Morning, Afternoon, Evening, Night).
  - Slot states: Available (white), Selected (green), Booked (disabled gray), Unavailable (labeled).
  - 4-step booking flow with simulated Razorpay payment gateway (UPI, Card, Net Banking).
  - Instant match confirmation voucher with QR code and printable receipt.
  - Booking history, cancellation, and refund management.

---

## 🔐 Default Demo Accounts

Use the **1-Click Demo Switcher** in the navigation bar or log in with these credentials:

| Role | Email / ID | Password | Notes |
|---|---|---|---|
| **Administrator** | `admin@turfhub.com` | `admin123` | Full admin privileges & owner provisioning |
| **Active Turf Owner** | `owner.greenfield@turfhub.com` | `owner123` | Manages GreenField Turf & Pace Sports Arena |
| **New Turf Owner** | `newowner@turfhub.com` | `tempPass#2026` | *Requires first-login password change!* |
| **Customer** | `john.doe@example.com` | `customer123` | Customer booking and match pass access |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup (Django REST Framework)
```bash
cd backend

# Run migrations
python manage.py makemigrations turfhub_api
python manage.py migrate

# Seed database with sample turfs, dynamic pricing rules, and users
python manage.py seed_turfhub

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup (React + Vite + Tailwind CSS)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Vite, React Router DOM
- **Backend**: Python 3, Django 4.2+, Django REST Framework, Simple JWT, Django CORS Headers
- **Database**: SQLite (Relational, ACID transactions with `select_for_update` for race-condition prevention)
- **Security**: Role-Based Access Control (RBAC), password hashing (PBKDF2), audit logs
