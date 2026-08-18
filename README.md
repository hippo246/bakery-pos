# BakeryPOS - Complete Restaurant Management System

A comprehensive, feature-rich Point of Sale (POS) and restaurant management system built with React. Designed for bakeries, cafes, and restaurants to streamline operations from order taking to kitchen management.

![BakeryPOS](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF.svg)

## 🚀 Features

### Core POS Functionality
- **Dual POS Modes**: Basic mode for simplicity, Advanced mode for power users
- **Professional Layout**: Petpooja-inspired design with optimized workflow
- **Keyboard Shortcuts**: Full keyboard support for rapid order entry
- **Smart Search**: Fuzzy search with autocomplete for menu items
- **Customer Management**: Phone lookup, customer profiles, and history
- **Table Management**: Visual table layout with real-time status
- **Payment Processing**: Multiple payment methods with status tracking
- **Receipt Customization**: Configurable templates with live preview

### Order Management
- **Token System**: Unique token generation for order tracking
- **Order Timer**: Real-time order timing with overdue alerts
- **Hold Orders**: Pause and resume orders later
- **Split Bills**: Flexible bill splitting options
- **Custom Orders**: Add custom items on the fly
- **Order Notes**: Add special instructions to orders

### Kitchen Operations
- **Kitchen Display System (KDS)**: Real-time order display for kitchen staff
- **Order Status Tracking**: Pending → In Progress → Completed
- **Token Display**: Show tokens on kitchen orders
- **Custom Order Support**: Handle special requests

### Staff Management
- **Waiter Portal**: Staff-specific order management
- **Performance Tracking**: Staff statistics and metrics
- **Order Assignment**: Assign orders to specific staff members
- **QR Self-Orders**: Separate category for customer-placed orders

### Inventory & Menu
- **Recipe Management**: Food costing and recipe creation
- **Waste Tracking**: Monitor and record inventory waste
- **Menu Categories**: Organized menu with categories and variants
- **Item Codes**: Quick item lookup via codes
- **Low Stock Alerts**: Visual indicators for low inventory

### Customer Experience
- **QR Ordering**: Customer self-ordering via QR codes
- **Online Portal**: Separate customer-facing ordering system
- **Table Assignment**: Automatic table linking for orders
- **Reservation System**: Table booking management

### Reporting & Analytics
- **Dashboard**: Real-time sales metrics and KPIs
- **Comprehensive Reports**: 80+ report types
- **PDF/Excel Export**: Export reports in multiple formats
- **Sales Analytics**: Revenue, order volume, and performance tracking

### Settings & Configuration
- **Workflow Configuration**: Customizable order flow and validation
- **Receipt Templates**: Multiple receipt formats with customization
- **Store Branding**: Logo upload, GSTIN, FSSAI, email configuration
- **Backup/Restore**: Data backup and restore functionality

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BakeryPOS System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   POS Tab    │  │  Dashboard   │  │   Reports    │      │
│  │              │  │              │  │              │      │
│  │ • Order Entry│  │ • KPIs       │  │ • Sales      │      │
│  │ • Customer   │  │ • Charts     │  │ • Inventory  │      │
│  │ • Payment    │  │ • Metrics    │  │ • Staff      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Menu       │  │  Customers   │  │   Staff      │      │
│  │              │  │              │  │              │      │
│  │ • Items      │  │ • CRM        │  │ • Management │      │
│  │ • Recipes    │  │ • History    │  │ • Scheduling │      │
│  │ • Inventory  │  │ • Loyalty    │  │ • Performance│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Tables     │  │  Waiters     │  │   Kitchen    │      │
│  │              │  │              │  │              │      │
│  │ • Layout     │  │ • Orders     │  │ • KDS        │      │
│  │ • QR Codes   │  │ • Assignment │  │ • Status     │      │
│  │ • Status     │  │ • Metrics    │  │ • Tokens     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tokens      │  │  Settings    │  │  QR Ordering │      │
│  │              │  │              │  │              │      │
│  │ • Queue      │  │ • Config     │  │ • Demo Mode  │      │
│  │ • Display    │  │ • Receipts   │  │ • Mobile UI  │      │
│  │ • Tracking   │  │ • Backup     │  │ • Integration│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Order Workflow

```
Customer Arrives
       ↓
┌──────────────┐
│ Table Seating │
└──────────────┘
       ↓
┌──────────────┐
│ QR Scan /    │
│ Manual Order │
└──────────────┘
       ↓
┌──────────────┐
│ Order Entry  │
│ • Menu Items │
│ • Custom     │
│ • Modifiers  │
└──────────────┘
       ↓
┌──────────────┐
│ Order Review │
│ • Total      │
│ • GST        │
│ • Discounts  │
└──────────────┘
       ↓
┌──────────────┐
│ Payment      │
│ • Cash       │
│ • Card       │
│ • UPI        │
└──────────────┘
       ↓
┌──────────────┐
│ Token Gen    │
│ • Unique ID  │
│ • Display    │
└──────────────┘
       ↓
┌──────────────┐
│ Kitchen      │
│ • KDS Display│
│ • Status     │
│ • Preparation│
└──────────────┘
       ↓
┌──────────────┐
│ Completion   │
│ • Receipt    │
│ • Table Clear│
└──────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: CSS-in-JS (Inline Styles)
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Data Persistence**: localStorage
- **QR Generation**: QR Server API
- **Export**: jsPDF, SheetJS (Excel)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/hippo246/bakery-pos.git
cd bakery-pos

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

### First Time Setup

1. **Launch the Application**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

2. **Configure Store Settings**
   - Navigate to Settings tab
   - Add store name, logo, GSTIN, FSSAI
   - Configure receipt template
   - Set up payment methods

3. **Add Menu Items**
   - Go to Menu tab
   - Add categories and items
   - Set prices, descriptions, and item codes
   - Configure variants if needed

4. **Setup Tables**
   - Navigate to Tables tab
   - Add tables with capacity
   - Generate QR codes for each table

5. **Add Staff**
   - Go to Staff tab
   - Add employees with roles
   - Configure permissions

### Daily Operations

**Taking Orders**
1. Select POS tab
2. Choose Basic or Advanced mode
3. Select customer type (Walk-in/Registered)
4. Add items via search or quick codes
5. Apply modifiers if needed
6. Review order and process payment
7. Generate token and receipt

**Kitchen Operations**
1. Monitor Kitchen Display System
2. Update order status as items are prepared
3. Mark orders complete when ready

**Table Management**
1. Monitor table status in real-time
2. Assign orders to tables
3. Clear tables when customers leave

## 📊 Key Features Deep Dive

### POS Modes

**Basic Mode**
- Simplified interface for quick order entry
- Essential features only
- Ideal for high-volume, simple orders

**Advanced Mode**
- Full feature set
- Collapsible panels (Customer, Table, Notes, Payment, Promotions)
- Quick Actions Bar
- Enhanced search and filtering

### QR Ordering System

**Customer Flow**
1. Customer scans table QR code
2. Opens mobile-optimized menu
3. Browses and adds items to cart
4. Places order with table assignment
5. Order appears in POS and Kitchen systems

**Demo Mode**
- Preview QR menu experience
- Test customer flow
- Mobile/tablet optimized UI

### Token System

- Unique token generated per order
- Displayed on:
  - Receipt
  - Kitchen Display
  - Table Assignment
  - Waiter Portal
  - Customer notifications

### Reporting

**Available Reports**
- Sales reports (daily, weekly, monthly)
- Inventory reports
- Staff performance
- Customer analytics
- Order analysis
- Payment method breakdown
- And 70+ more...

**Export Options**
- PDF with formatting
- Excel with multiple sheets
- CSV for data analysis

## 🔧 Configuration

### Workflow Settings

Configure order flow requirements:
- Require customer selection
- Require table assignment
- Payment method restrictions
- Order validation rules

### Receipt Customization

- Multiple template options
- Custom header/footer
- Logo upload
- GSTIN/FSSAI display
- Cashier name
- Payment details
- Bill ID generation

### Backup & Restore

- Manual backup triggers
- Data export/import
- Configuration preservation

## 📱 Mobile Responsiveness

- Responsive design for tablets and phones
- Touch-optimized interfaces
- Mobile-specific QR ordering
- Adaptive layouts

## 🔒 Data Management

- Local storage persistence
- Session recovery
- Data backup capabilities
- Export functionality

## 🚀 Performance Optimizations

- Lazy loading of components
- Memoization for expensive calculations
- Efficient state management
- Optimized rendering

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Petpooja POS system
- Built with React and Vite
- QR code generation by QR Server API

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for restaurants, bakeries, and cafes**
