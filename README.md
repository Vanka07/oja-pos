# RetailOS - African Retail Supermarket POS

An offline-first financial and inventory operating system designed for African retail supermarkets, with Nigeria as the MVP market.

## Features

### Dashboard
- Real-time sales overview with daily revenue tracking
- Payment method breakdown (Cash, Transfer, POS, Credit)
- Low stock alerts with quick navigation
- Recent transactions list
- Sync status indicator for offline operations

### Point of Sale (POS)
- Fast product search by name or barcode
- Category filtering for quick product access
- Real-time cart management with quantity adjustments
- Multiple payment methods:
  - Cash
  - Bank Transfer (Mobile banking/USSD)
  - POS Terminal (Card payments)
  - Credit Sale (Customer pays later)
- Success confirmation with transaction details

### Inventory Management
- Complete product catalog with cost/selling prices
- Stock tracking with low stock alerts
- Quick stock adjustment (add/remove inventory)
- Product categorization (Beverages, Provisions, Dairy, etc.)
- Profit margin calculation per product
- Add new products with barcode support

### Reports & Analytics
- Revenue tracking by time period (Today, 7 Days, 30 Days)
- Profit calculation and period-over-period comparison
- Payment method breakdown visualization
- Top-selling products ranking
- Transaction history

## Tech Stack

- **Framework**: Expo SDK 53 with React Native
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native

## Offline-First Architecture

All data is stored locally using AsyncStorage and Zustand persist middleware. The app tracks:
- Pending sync count for offline transactions
- Last sync timestamp
- All sales, products, and customer data locally

## Currency

All monetary values are displayed in Nigerian Naira (NGN) with proper formatting.

## Sample Data

The app comes pre-loaded with sample Nigerian retail products:
- Peak Milk 400g
- Indomie Chicken 70g
- Coca-Cola 50cl
- Golden Penny Semovita 1kg
- Dettol Soap 110g
- Milo 400g
- Kings Oil 1L
- Dangote Sugar 1kg

## Project Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── pos.tsx        # Point of Sale
│   │   ├── inventory.tsx  # Inventory Management
│   │   └── reports.tsx    # Reports & Analytics
│   └── _layout.tsx        # Root layout
├── store/
│   └── retailStore.ts     # Zustand store with all business logic
├── components/
└── lib/
```
