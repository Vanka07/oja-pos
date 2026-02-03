# OJA POS
## Setup, Configuration & Troubleshooting Guide

**Last Updated:** February 02, 2026  
**Version:** 1.1

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository & Codebase](#3-repository--codebase)
4. [Domain & DNS Setup](#4-domain--dns-setup)
5. [Vercel Deployment](#5-vercel-deployment)
6. [Supabase Backend](#6-supabase-backend)
7. [Paystack Payment Integration](#7-paystack-payment-integration)
8. [Email Setup (Zoho Mail)](#8-email-setup-zoho-mail)
9. [Google Search Console & SEO](#9-google-search-console--seo)
10. [App Features Reference](#10-app-features-reference)
11. [Premium Tier & Monetization](#11-premium-tier--monetization)
12. [Activation Codes](#12-activation-codes)
13. [Environment Variables & Secrets](#13-environment-variables--secrets)
14. [Deployment Commands](#14-deployment-commands)
15. [Troubleshooting Guide](#15-troubleshooting-guide)
16. [Social Media](#16-social-media)
17. [Future Roadmap](#17-future-roadmap)

---

## 1. Project Overview

Oja POS is a point-of-sale system built for Nigerian businesses. "Oja" means "market" in Yoruba. The app is designed to work offline-first with optional cloud sync, supporting Nigerian business workflows including Naira currency, WhatsApp receipts, and local payment methods.

| Property | Value |
|----------|-------|
| App Name | Oja POS |
| Tagline | The POS Built for Every Nigerian Business |
| Landing Page | https://ojapos.app |
| Web App | https://app.ojapos.app |
| GitHub (App) | github.com/Vanka07/oja-pos |
| GitHub (Landing) | github.com/Vanka07/oja-landing |
| Brand Color | #E05E1B (Burnt Orange) |
| Font | Poppins |
| Target Market | Nigerian businesses — supermarkets, salons, pharmacies, fashion, restaurants, electronics |
| App Icon | Shopping cart (38px in-app), bigger and bolder |
| Favicon | Clean "O" lettermark in orange circle |

---

## 2. Technology Stack

### Frontend (Mobile + Web)
- Expo SDK 53 (React Native)
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- Zustand (state management — 8 stores)
- React Native Reanimated (animations)
- MMKV (native storage) / localStorage (web)
- Expo Router (file-based routing)

### Backend
- Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- Supabase project ID: `bjpqdfcpclmcxyydtcmm`
- Region: London (eu-west-2)

### Hosting & Deployment
- Vercel (landing page + web app)
- Vercel project: `jamius-projects-ae6688b3/dist`
- Custom domains via Vercel DNS

### Payments
- Paystack (Nigerian payment gateway)
- Supabase Edge Functions for verification + webhooks

---

## 3. Repository & Codebase

### Key Directories

| Directory | Description |
|-----------|-------------|
| `src/app/` | All screens (Expo Router file-based routing) |
| `src/app/onboarding/` | Onboarding flow (business type, setup, PIN, recovery code) |
| `src/store/` | 8 Zustand stores (retail, auth, staff, subscription, theme, onboarding, update, language) |
| `src/lib/` | Utilities (storage, sync, paystack, activation, printer, alerts, i18n, placeholderConfig) |
| `src/components/` | Shared components (PremiumUpsell, OjaLogo, TabBar, etc.) |
| `supabase/functions/` | Edge functions (paystack-verify, paystack-webhook) |
| `supabase/migrations/` | SQL migrations |
| `scripts/` | CLI tools (generate-codes.js) |
| `dist/` | Expo web export output (deployed to Vercel) |
| `assets/` | App icon, splash screen, adaptive icon |
| `patches/` | Patch-package fixes |

### Key Files
- `src/lib/storage.ts` — Platform-specific storage adapter (MMKV native, localStorage web)
- `src/lib/syncService.ts` — Cloud sync logic (Supabase ↔ local, 5-min interval)
- `src/lib/paystack.ts` — Paystack client (initializePayment, verifyPayment)
- `src/lib/activationCode.ts` — HMAC-SHA256 code generation + validation
- `src/lib/premiumFeatures.ts` — Feature access map + canAccess() helper
- `src/lib/lowStockAlerts.ts` — WhatsApp inventory alert system
- `src/lib/printerService.ts` — Bluetooth thermal printer + web print fallback
- `src/lib/i18n.ts` — Translation strings (5 languages)
- `src/lib/placeholderConfig.ts` — Business-type-aware placeholder text
- `src/lib/receiptPdf.ts` — PDF generation for receipts
- `src/store/subscriptionStore.ts` — Tier management (starter/business)
- `src/store/languageStore.ts` — i18n language selection

---

## 4. Domain & DNS Setup

### Domains

| Domain | Registrar | Points To | Status |
|--------|-----------|-----------|--------|
| ojapos.app | Namecheap (~$13/yr) | Landing page (Vercel) | ✅ Live |
| app.ojapos.app | Subdomain | POS web app (Vercel) | ✅ Live |
| ojapos.ng | DomainKing (premium .ng) | Landing page (Vercel) | ✅ Live |

### DNS Configuration
Both ojapos.app and ojapos.ng use Vercel nameservers:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

### DNS Records (ojapos.app)

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| CNAME | app | cname.vercel-dns.com | POS web app |
| CNAME | www | cname.vercel-dns.com | WWW redirect |
| MX | @ | mx.zoho.com (10) | Email |
| MX | @ | mx2.zoho.com (20) | Email fallback |
| MX | @ | mx3.zoho.com (50) | Email fallback |
| TXT | @ | v=spf1 include:zoho.com ~all | SPF |
| TXT | @ | zoho-verification=... | Domain verification |
| CNAME | zb...._domainkey | ...zoho.com | DKIM |

---

## 5. Vercel Deployment

### Projects

| Project | Domain | Source |
|---------|--------|--------|
| dist (jamius-projects-ae6688b3) | app.ojapos.app | Expo web export |
| oja-landing | ojapos.app, ojapos.ng, www.ojapos.app | Static HTML |

### Deploy POS App
```bash
# 1. Export web build
npx expo export --platform web

# 2. Copy Vercel config (Expo wipes dist/ each time)
cp vercel.json dist/

# 3. Deploy to production
cd dist
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

### Deploy Landing Page
```bash
cd oja-landing
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

**Important:** The Vercel token is stored in `oja-pos/.env` as `VERCEL_TOKEN`. Source it before running deploy commands.

---

## 6. Supabase Backend

| Property | Value |
|----------|-------|
| Project ID | bjpqdfcpclmcxyydtcmm |
| Region | London (eu-west-2) |
| Dashboard | https://supabase.com/dashboard/project/bjpqdfcpclmcxyydtcmm |
| API URL | https://bjpqdfcpclmcxyydtcmm.supabase.co |
| Auth | Email/password (no social login yet) |

### Database Tables (8 total)

| Table | Description |
|-------|-------------|
| shops | Shop profiles |
| shop_members | Staff linked to shops |
| products | Product catalog |
| sales | Transaction records |
| customers | Customer directory |
| expenses | Expense tracking |
| subscriptions | Premium tier subscriptions (Paystack + activation codes) |
| sync_log | Cloud sync tracking |

All tables have Row Level Security (RLS) enabled. Users can only access data belonging to their shop.

### Edge Functions

| Function | URL | JWT |
|----------|-----|-----|
| paystack-verify | https://bjpqdfcpclmcxyydtcmm.supabase.co/functions/v1/paystack-verify | OFF |
| paystack-webhook | https://bjpqdfcpclmcxyydtcmm.supabase.co/functions/v1/paystack-webhook | OFF |

### Supabase Secrets
- `PAYSTACK_SECRET_KEY` — Paystack secret key (currently test key)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for admin operations

---

## 7. Paystack Payment Integration

### Overview
Paystack handles subscription payments for the ₦5,000/month Business tier. The flow is:
1. User taps "Pay with Paystack" in the app
2. App opens Paystack checkout (WebView on mobile, popup on web)
3. User pays via card, bank transfer, or USSD
4. Paystack redirects to callback URL (ojapos.app/payment-callback.html)
5. App calls paystack-verify edge function to confirm payment
6. Edge function verifies with Paystack API + creates subscription record in Supabase
7. Paystack also sends webhook for server-side confirmation (backup)

### Keys (Currently TEST)

| Key | Value |
|-----|-------|
| Public Key | pk_test_25d612955358dd9ac5ee6f429181c83d2af86816 |
| Secret Key | Stored in Supabase secrets (PAYSTACK_SECRET_KEY) |
| Webhook URL | https://bjpqdfcpclmcxyydtcmm.supabase.co/functions/v1/paystack-webhook |

### Going Live Checklist
- [x] Log into Paystack dashboard (dashboard.paystack.com)
- [x] Set webhook URL
- [x] End-to-end test completed (Feb 1 2026)
- [ ] Switch to Live mode and get live keys
- [ ] Update public key in src/lib/paystack.ts
- [ ] Update secret key in Supabase edge function secrets
- [ ] Test a real ₦100 payment end-to-end

---

## 8. Email Setup (Zoho Mail)

| Property | Value |
|----------|-------|
| Email | hello@ojapos.app |
| Provider | Zoho Mail (free tier) |
| Login | https://mail.zoho.com |
| DNS | MX + SPF + DKIM configured on Vercel DNS |

Used for customer support and business communications.

---

## 9. Google Search Console & SEO

### Search Console
- ojapos.app — Verified ✅, sitemap submitted
- ojapos.ng — Verified ✅, sitemap submitted
- Dashboard: https://search.google.com/search-console

### SEO Pages

| URL | Description |
|-----|-------------|
| / | Main landing page — hero, features, pricing |
| /features | 15 features detailed with descriptions |
| /pricing | Starter vs Business tier comparison |
| /faq | 16 questions with FAQPage JSON-LD schema |
| /about | Company story, all-Nigeria market context |
| /privacy | Privacy policy |

### SEO Features
- JSON-LD structured data (SoftwareApplication + WebApplication schemas)
- FAQPage schema for rich results in Google
- Canonical URLs on all pages
- sitemap.xml + robots.txt
- OG meta tags + social preview image
- Target keywords: "POS app Nigeria", "point of sale Nigeria", "retail POS Nigerian shops"

---

## 10. App Features Reference

### Onboarding Flow
1. Welcome slides (4 screens)
2. Business type selection (6 types)
3. Shop setup (name, owner, phone, address)
4. PIN setup (4-digit)
5. Recovery code (6-digit, save to WhatsApp)
6. Dashboard

### Business Types Supported
- Supermarket
- Salon
- Pharmacy
- Fashion/Boutique
- Restaurant
- Electronics

### Security Features
- **PIN Lock Screen** — 4-digit PIN protection for app access
- **Recovery Code System** — 6-digit code for PIN reset, save to WhatsApp
- **Forgot PIN Flow** — Enter recovery code on lock screen to reset
- **Staff Activity Log** — Track actions when multiple staff use the app (hidden for solo owners)

### Core Features (Free Tier)
- Quick Sell — Scan barcode or tap to add products, cash/transfer/POS payment
- Product Management — Add/edit products, categories, track stock levels (50 product limit)
- Sales History — Today's transactions with basic totals
- Credit Book — Track customer debts and payments, payment receipts
- Customers — Directory with purchase history
- WhatsApp Receipts — Share receipt via WhatsApp after sale
- Expenses — Track business expenses by category
- PIN Lock — Secure app access with recovery code

### Credit Book Improvements (Feb 2026)
- Payment method selection (Cash/Transfer/POS) when recording payments
- Payment receipt generation (text, PDF, WhatsApp-shareable)
- Credit sale receipts show "CREDIT SALE" label with balance breakdown
- `customerPreviousBalance` tracked in Sale interface

### Business Tier Features (₦5,000/month)
- Unlimited Products — No 50 product cap
- Multi-Staff — 4 roles: Owner, Manager, Cashier, Employee
- Staff PIN Auth — Each staff has unique PIN, activity logged
- Cloud Sync — Supabase auto-sync every 5 minutes
- Advanced Reports — Revenue trends, profit margin %, best day, date filtering, charts
- Payroll — Staff salary tracking, payment recording (Cash/Transfer), status badges
- WhatsApp Inventory Alerts — Auto-detect low stock after sales, send WhatsApp alert
- Receipt Printing — Bluetooth thermal printer (58/80mm) + web browser print
- Export Data — JSON backup via share sheet
- Dark/Light Mode — System, dark, or light theme toggle
- Shop Profile — Editable shop name, address, phone, logo

### Multi-Language Support
5 languages supported:
- English
- Yorùbá
- Pidgin
- Igbo
- Hausa

Language selector available in More tab.

### Business-Type-Aware Placeholders
All placeholder text across 8+ screens adapts to business type. Names are ethnically diverse — Igbo, Yoruba, Hausa mix.

### Staff Roles & Permissions

| Role | Sell | Manage Products | View Reports | Manage Staff | Manage Shop | Payroll |
|------|------|-----------------|--------------|--------------|-------------|---------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Cashier | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Employee | — | — | — | — | — | — (payroll only) |

---

## 11. Premium Tier & Monetization

| Property | Value |
|----------|-------|
| Free Tier | Starter — 50 products, 1 staff, basic reports, offline-only |
| Paid Tier | Business — ₦5,000/month, unlimited everything + cloud sync |
| Activation | Paystack payment OR manual activation code (OJA-XXXX-XXXX) |
| Gate Status | canAccess() currently returns true always (testing bypass) |

**Note:** Premium gates are bypassed for testing. To re-enable, update `canAccess()` in `src/lib/premiumFeatures.ts`.

---

## 12. Activation Codes

### Format
`OJA-XXXX-XXXX` (e.g., OJA-A3F7-K9M2)

Codes are HMAC-SHA256 signed for offline validation — no server call needed.

### Generating Codes
```bash
cd oja-pos
node scripts/generate-codes.js --count 10 --duration 30

# Options:
#   --count N     Number of codes to generate (default: 10)
#   --duration N  Subscription duration in days (default: 30)
#   --output FILE Output file path
```

Generated codes are saved to `scripts/codes-YYYY-MM-DD.txt`

### How It Works
1. Code contains encoded duration + HMAC signature
2. App validates signature locally using shared secret
3. Used codes are tracked in local storage to prevent reuse
4. No internet required for validation

---

## 13. Environment Variables & Secrets

### Local (.env in oja-pos/)

| Variable | Description |
|----------|-------------|
| VERCEL_TOKEN | Vercel deploy token (full scope) |

### Supabase Edge Function Secrets

| Secret | Description |
|--------|-------------|
| PAYSTACK_SECRET_KEY | Paystack secret key (currently test key sk_test_...) |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key for admin DB operations |

### In-App Config (hardcoded)
- Supabase URL + anon key: `src/lib/supabase.ts`
- Paystack public key: `src/lib/paystack.ts`
- Activation code secret: `src/lib/activationCode.ts`

---

## 14. Deployment Commands

### Deploy POS Web App
```bash
cd /path/to/oja-pos
source .env
npx expo export --platform web
cp vercel.json dist/
cd dist
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

### Deploy Landing Page
```bash
cd /path/to/oja-landing
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

### Push to GitHub
```bash
# App
cd /path/to/oja-pos
git add -A
git commit -m "your message"
git push

# Landing
cd /path/to/oja-landing
git add -A
git commit -m "your message"
git push
```

---

## 15. Troubleshooting Guide

### Expo web export shows blank page
Check `vercel.json` is in `dist/` folder. The SPA rewrite rule is required:
```json
{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}
```
Expo wipes `dist/` on every export — always re-copy vercel.json.

### TextInput only accepts first character (React Native Web)
NEVER define components inside render functions. This causes React to unmount/remount on every state change. Extract to a separate component file.

### WhatsApp link opens blank page on web
Use `window.open("https://wa.me/...")` on web, NOT `Linking.openURL("whatsapp://...")`.

### Dark mode styles not applying
Check for duplicate `dark:` prefixes. NativeWind only processes one `dark:` prefix per property. Also ensure `setColorScheme()` is called in root `_layout.tsx`.

### Cloud sync not working
Check: 1) User is logged in, 2) Supabase URL/key correct, 3) RLS policies allow the user's shop, 4) Network connectivity.

### Paystack payment not verifying
Check: 1) paystack-verify edge function deployed with JWT OFF, 2) PAYSTACK_SECRET_KEY set in Supabase secrets, 3) Payment reference matches, 4) Test vs Live key mismatch.

### Activation code rejected
Code may have been used already (tracked in local storage). To reset for testing, clear the subscription store.

### Vercel deploy fails
Ensure VERCEL_TOKEN is valid. If expired, generate new one at vercel.com/account/tokens.

### Staff PIN not working after lock
The lock screen delegates to `staffStore.switchStaff()`. Ensure staff PINs are set in staff management.

### Receipt printer not connecting
Bluetooth printers require native builds (not Expo Go). On web, falls back to browser print dialog.

### Subscription not created after payment
Check SUPABASE_SERVICE_ROLE_KEY is set in Supabase edge function secrets.

### Duplicate categories appearing
Fixed Feb 2 2026 — `addCategory` in onboarding setup.tsx was appending without checking for existing names. Fixed with Set dedup check.

---

## 16. Social Media

| Platform | Handle | URL |
|----------|--------|-----|
| X (Twitter) | @ojaposapp | https://x.com/ojaposapp |
| Instagram | @ojaposapp | https://instagram.com/ojaposapp |
| TikTok | @ojaposapp | https://tiktok.com/@ojaposapp |
| Email | hello@ojapos.app | mailto:hello@ojapos.app |
| WhatsApp | +234 802 247 1137 | https://wa.me/2348022471137 |

**Note:** @ojapos was taken/suspended on X, so we use @ojaposapp everywhere for consistency.

---

## 17. Future Roadmap

### Near Term
- [ ] Re-enable premium feature gates (canAccess())
- [ ] Update app icon + splash screen with cart logo + burnt orange
- [ ] Beta test with 5-10 real shop owners
- [ ] Switch Paystack to live keys

### Medium Term
- [ ] WhatsApp Business API for automated receipts
- [ ] Multi-branch support
- [ ] Supplier Credit Book (BNPL for shops)
- [ ] WhatsApp Storefront integration
- [ ] Agent/Reseller dashboard for distributors

### Long Term
- [ ] USSD/SMS fallback for feature phones
- [ ] Price Intelligence (PriceNija integration)
- [ ] Loyalty/Rewards program
- [ ] Supplier ordering system
- [ ] iOS App Store + Google Play Store releases

### Completed (Feb 2026)
- [x] Multi-language support (5 languages)
- [x] PIN security in onboarding
- [x] Recovery code system
- [x] Business type selection (6 types)
- [x] Business-type-aware placeholders
- [x] Credit payment receipts
- [x] About page rebrand (all-Nigeria focus)
- [x] Landing page GitHub repo

---

*Built with ❤️ for Nigerian businesses*
