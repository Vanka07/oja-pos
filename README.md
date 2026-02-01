# Oja - African Retail Supermarket POS

The most complete offline-first point-of-sale and business management system built specifically for Nigerian retail supermarkets.

## Key Features

### Onboarding
- Beautiful welcome screens explaining app features
- Shop setup wizard (name, owner, phone, address)
- Personalized experience with shop branding

### Dashboard (Home)
- Personalized greeting with owner's name and shop name
- Real-time daily revenue with profit tracking
- Payment method breakdown (Cash, Transfer, POS, Credit)
- Low stock alerts with quick navigation
- Recent transactions list
- Sync status indicator for offline operations

### Point of Sale (Sell)
- Fast product search by name or barcode
- Category filtering for quick product access
- Real-time cart management with quantity adjustments
- Multiple Nigerian payment methods:
  - Cash
  - Bank Transfer (Mobile banking/USSD)
  - POS Terminal (Card payments)
  - Credit Sale (Customer pays later)
- WhatsApp receipt sharing after sale
- General share functionality for receipts

### Inventory Management (Stock)
- Complete product catalog with cost/selling prices
- Stock tracking with low stock alerts
- Quick stock adjustment (add/remove inventory)
- Stock movement history tracking
- Product categorization (Beverages, Provisions, Dairy, etc.)
- Profit margin calculation per product
- Add new products with barcode support

### Credit Book (Customers)
- Full customer database with credit limits
- Outstanding debt tracking per customer
- Payment recording with history
- WhatsApp reminder sending for debts
- Total outstanding credit overview
- Transaction history per customer

### More (Settings & Tools)
- **Cash Register Management**
  - Daily opening cash count
  - Expected cash calculation
  - Closing cash reconciliation
  - Discrepancy tracking with notes

- **Expense Tracking**
  - Nigerian-specific categories (NEPA, Generator Fuel, etc.)
  - Multiple payment method support
  - Daily expense summaries

- **Price Calculator**
  - Profit margin calculator
  - Suggested selling price based on target margin
  - Quick pricing decisions

- **Shop Profile**
- **Data Export/Backup**

## Nigerian-Specific Features

- **Naira (₦) Currency** - All amounts formatted correctly
- **Nigerian Phone Numbers** - 11-digit validation
- **Local Payment Methods** - Transfer, POS, Credit (common in Nigeria)
- **Nigerian Products** - Pre-loaded with items like Peak Milk, Indomie, Milo, etc.
- **Nigerian Expense Categories** - NEPA, Generator Fuel, Levy, etc.
- **WhatsApp Integration** - Most popular messaging app in Nigeria
- **Offline-First** - Works without internet (critical for Nigeria)

## Tech Stack

- **Framework**: Expo SDK 53 with React Native
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **Haptics**: Expo Haptics for tactile feedback

## Offline-First Architecture

All data is stored locally using AsyncStorage and Zustand persist middleware:
- Products, categories, and inventory
- All sales transactions
- Customer credit records
- Expenses and cash sessions
- Stock movements history
- Pending sync queue

The app works 100% offline and tracks pending syncs for when connectivity returns.

## Sample Data

Pre-loaded Nigerian retail products:
- Peak Milk 400g
- Indomie Chicken 70g
- Coca-Cola 50cl
- Golden Penny Semovita 1kg
- Dettol Soap 110g
- Milo 400g
- Kings Oil 1L
- Dangote Sugar 1kg

Sample customers:
- Mama Ngozi (with credit history)
- Alhaji Musa

## Project Structure

```
src/
├── app/
│   ├── onboarding/
│   │   ├── _layout.tsx    # Onboarding navigation
│   │   ├── index.tsx      # Welcome slides
│   │   └── setup.tsx      # Shop setup form
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Tab navigation (5 tabs)
│   │   ├── index.tsx      # Dashboard/Home
│   │   ├── pos.tsx        # Point of Sale
│   │   ├── inventory.tsx  # Stock Management
│   │   ├── customers.tsx  # Credit Book
│   │   ├── more.tsx       # Settings & Tools
│   │   └── reports.tsx    # Analytics (accessible from Home)
│   └── _layout.tsx        # Root layout with auth redirect
├── store/
│   ├── retailStore.ts     # Main business logic store
│   ├── onboardingStore.ts # Onboarding state
│   └── updateStore.ts     # Version management
├── components/
└── lib/
```

## Installation

### Via Google Play Store (Recommended)
1. Download from Google Play Store (when published)
2. Open the app
3. Complete the onboarding flow
4. Start selling!

### Via Direct APK
1. Download the APK file
2. Enable "Install from unknown sources" in settings
3. Install and open the app
4. Complete onboarding

## Business Value

- **Save Time**: Fast checkout process
- **Reduce Losses**: Track every transaction
- **Know Your Debtors**: Never forget who owes you
- **Track Expenses**: See where money goes
- **Daily Reconciliation**: Know if cash is missing
- **Make Better Decisions**: See what sells most

---

Built with love for Nigerian entrepreneurs.
