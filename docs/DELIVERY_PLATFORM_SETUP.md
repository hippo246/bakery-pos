# Delivery Platform Setup Guide

This guide helps you integrate Zomato and Swiggy delivery platforms with Cafe OS POS system.

## Table of Contents

1. [Overview](#overview)
2. [Platform Partnership Application](#platform-partnership-application)
3. [Getting API Credentials](#getting-api-credentials)
4. [Configuring in Cafe OS](#configuring-in-cafe-os)
5. [Handling Delivery Orders](#handling-delivery-orders)
6. [Menu Synchronization](#menu-synchronization)
7. [Commission Tracking](#commission-tracking)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Cafe OS supports integration with major food delivery platforms:
- **Zomato** - India's leading food delivery platform
- **Swiggy** - India's largest food delivery platform

### Key Features

- **Real-time Order Receiving** - Orders from platforms appear instantly in your POS
- **Automatic Kitchen Routing** - Delivery orders auto-route to kitchen display
- **Menu Synchronization** - Sync your POS menu to platforms
- **Status Updates** - Automatically update order status (accepted, preparing, ready, delivered)
- **Commission Tracking** - Track platform commissions and net revenue
- **Multi-Platform Support** - Use both platforms simultaneously

---

## Platform Partnership Application

### Zomato Partnership

1. **Visit Zomato for Business**
   - Go to [https://www.zomato.com/partners](https://www.zomato.com/partners)
   - Click "Partner with us"

2. **Submit Application**
   - Fill in restaurant details
   - Upload required documents:
     - FSSAI license
     - GST certificate
     - PAN card
     - Restaurant photos
     - Menu

3. **Verification Process**
   - Zomato team verifies your restaurant
   - On-site inspection may be conducted
   - Approval typically takes 3-7 business days

4. **Onboarding**
   - Once approved, complete onboarding process
   - Set up restaurant profile
   - Configure delivery radius
   - Set pricing

### Swiggy Partnership

1. **Visit Swiggy for Business**
   - Go to [https://partners.swiggy.com](https://partners.swiggy.com)
   - Click "Register as a Partner"

2. **Submit Application**
   - Fill in restaurant details
   - Upload required documents:
     - FSSAI license
     - GST certificate
     - PAN card
     - Restaurant photos
     - Menu

3. **Verification Process**
   - Swiggy team verifies your restaurant
   - On-site inspection may be conducted
   - Approval typically takes 5-10 business days

4. **Onboarding**
   - Complete onboarding process
   - Set up restaurant profile
   - Configure delivery radius
   - Set pricing

---

## Getting API Credentials

### Zomato API Credentials

Once your partnership is approved:

1. **Log in to Partner Dashboard**
   - Visit [https://www.zomato.com/partners/dashboard](https://www.zomato.com/partners/dashboard)

2. **Navigate to API Settings**
   - Go to Settings → API Integration
   - Generate API credentials

3. **Required Credentials**
   - **API Key** - Your unique API key
   - **API Secret** - Your API secret for authentication
   - **Restaurant ID** - Your restaurant's unique identifier
   - **Partner ID** - Your partner identifier
   - **Webhook Secret** - For webhook signature verification

4. **Test Mode**
   - Zomato provides sandbox environment for testing
   - Use test credentials during development
   - Switch to production credentials after testing

### Swiggy API Credentials

Once your partnership is approved:

1. **Log in to Partner Dashboard**
   - Visit [https://partners.swiggy.com/dashboard](https://partners.swiggy.com/dashboard)

2. **Navigate to API Settings**
   - Go to Settings → API Integration
   - Generate API credentials

3. **Required Credentials**
   - **API Key** - Your unique API key
   - **API Secret** - Your API secret for authentication
   - **Restaurant ID** - Your restaurant's unique identifier
   - **Partner ID** - Your partner identifier
   - **Store ID** - Your store's unique identifier
   - **Webhook Secret** - For webhook signature verification

4. **Test Mode**
   - Swiggy provides sandbox environment for testing
   - Use test credentials during development
   - Switch to production credentials after testing

---

## Configuring in Cafe OS

### Step 1: Access Delivery Platform Settings

1. Log in to Cafe OS
2. Navigate to **Settings**
3. Select **Delivery Platforms** section

### Step 2: Configure Zomato

1. **Enable Zomato Integration**
   - Toggle "Enable Zomato Integration" to ON

2. **Enter Credentials**
   - Restaurant ID: Your Zomato restaurant ID
   - Partner ID: Your Zomato partner ID
   - API Key: Your Zomato API key
   - API Secret: Your Zomato API secret
   - Webhook Secret: Your Zomato webhook secret

3. **Set Commission Rate**
   - Default: 20% (adjust based on your agreement with Zomato)
   - This is used for commission tracking

4. **Test Mode**
   - Enable test mode during development
   - Disable when going live

5. **Test Connection**
   - Click "Test Webhook Connection"
   - Verify connection is successful

6. **Get Webhook Instructions**
   - Click "Get Webhook Setup Instructions"
   - Follow steps to configure webhook in Zomato dashboard

### Step 3: Configure Swiggy

1. **Enable Swiggy Integration**
   - Toggle "Enable Swiggy Integration" to ON

2. **Enter Credentials**
   - Restaurant ID: Your Swiggy restaurant ID
   - Partner ID: Your Swiggy partner ID
   - Store ID: Your Swiggy store ID
   - API Key: Your Swiggy API key
   - API Secret: Your Swiggy API secret
   - Webhook Secret: Your Swiggy webhook secret

3. **Set Commission Rate**
   - Default: 22% (adjust based on your agreement with Swiggy)
   - This is used for commission tracking

4. **Test Mode**
   - Enable test mode during development
   - Disable when going live

5. **Test Connection**
   - Click "Test Webhook Connection"
   - Verify connection is successful

6. **Get Webhook Instructions**
   - Click "Get Webhook Setup Instructions"
   - Follow steps to configure webhook in Swiggy dashboard

### Step 4: Configure Webhooks

#### Zomato Webhook Setup

1. Copy webhook URL from Cafe OS instructions
2. Log in to Zomato Partner Dashboard
3. Navigate to Settings → Webhooks
4. Add webhook URL
5. Configure signature secret (use the same as in Cafe OS)
6. Test webhook connection

#### Swiggy Webhook Setup

1. Copy webhook URL from Cafe OS instructions
2. Log in to Swiggy Partner Dashboard
3. Navigate to Settings → Webhooks
4. Add webhook URL
5. Configure signature secret (use the same as in Cafe OS)
6. Test webhook connection

### Step 5: Save Settings

1. Click "Save Settings" button
2. Verify all configurations are saved
3. Check platform statistics to confirm connection

---

## Handling Delivery Orders

### Receiving Orders

1. **Automatic Order Reception**
   - Orders from platforms appear automatically in your POS
   - You'll see a notification when a new order arrives
   - Orders are marked with platform badge (🔴 Zomato, 🟠 Swiggy)

2. **Order Details**
   - Platform order ID
   - Customer information (name, phone, address)
   - Order items with quantities
   - Special instructions
   - Estimated delivery time
   - Total amount and commission

3. **Kitchen Routing**
   - Delivery orders automatically route to kitchen display
   - Kitchen staff sees platform badge for delivery orders
   - Special instructions are highlighted

### Order Status Updates

1. **Accept Order**
   - Click "Accept" when you can fulfill the order
   - Set estimated preparation time
   - Status updates automatically on platform

2. **Reject Order**
   - Click "Reject" if you cannot fulfill
   - Provide rejection reason
   - Customer is notified on platform

3. **Update Status**
   - **Preparing** - When kitchen starts preparing
   - **Ready** - When order is ready for pickup
   - **Picked Up** - When delivery partner picks up
   - **Delivered** - When order is delivered

4. **Cancel Order**
   - Cancel if needed (before preparation)
   - Provide cancellation reason
   - Platform handles refund process

### Platform-Specific Requirements

#### Zomato Requirements
- Maximum items per order: 50
- Maximum addons per item: 10
- Preparation time must be accurate
- Packaging is required

#### Swiggy Requirements
- Maximum items per order: 100
- Maximum addons per item: 15
- Preparation time must be accurate
- Packaging is required
- Order modification support available

---

## Menu Synchronization

### Syncing Menu to Platforms

1. **Prepare Your Menu**
   - Ensure all items have:
     - Names
     - Descriptions
     - Prices
     - Categories
     - Images (recommended)
     - Availability status

2. **Sync to Zomato**
   - Navigate to Settings → Delivery Platforms
   - Click "Sync Menu" for Zomato
   - Wait for sync completion
   - Verify menu on Zomato dashboard

3. **Sync to Swiggy**
   - Navigate to Settings → Delivery Platforms
   - Click "Sync Menu" for Swiggy
   - Wait for sync completion
   - Verify menu on Swiggy dashboard

4. **Batch Sync**
   - Use "Sync to All Platforms" to sync to both at once
   - Recommended after menu updates

### Updating Item Availability

1. **Individual Item Update**
   - Mark item as out of stock in POS
   - Automatically updates on all platforms
   - Prevents orders for unavailable items

2. **Bulk Availability Update**
   - Use availability management in POS
   - Syncs to all configured platforms

### Menu Validation

Before syncing, Cafe OS validates:
- All items have names and prices
- Categories are properly structured
- Images are present (recommended)
- Descriptions are complete (recommended)

---

## Commission Tracking

### Viewing Commission Statistics

1. **Access Commission Reports**
   - Navigate to Reports → Delivery Commissions
   - Select date range
   - View commission statistics

2. **Statistics Available**
   - Total orders by platform
   - Total revenue
   - Total commission
   - Net revenue
   - Average commission rate
   - Average order value

### Commission Breakdown

#### By Platform
- Zomato commission (typically 15-25%)
- Swiggy commission (typically 15-25%)
- Net revenue after commission

#### By Date Range
- Today's commissions
- This week's commissions
- This month's commissions
- Custom date range

### Settlement Tracking

1. **Pending Settlements**
   - View orders awaiting settlement
   - Total pending amount
   - Expected settlement date

2. **Settlement History**
   - View past settlements
   - Track settlement dates
   - Reconcile with platform payouts

### Export Reports

1. **Generate CSV Report**
   - Select date range
   - Click "Export to CSV"
   - Download commission report

2. **Report Contents**
   - Summary statistics
   - Platform breakdown
   - Order-level details
   - Settlement information

---

## Troubleshooting

### Common Issues

#### Orders Not Receiving

**Problem**: Orders from platform not appearing in POS

**Solutions**:
1. Check webhook configuration in platform dashboard
2. Verify webhook URL is correct
3. Test webhook connection in Cafe OS settings
4. Check platform status for outages
5. Verify internet connection

#### Status Updates Not Working

**Problem**: Order status not updating on platform

**Solutions**:
1. Check API credentials are correct
2. Verify platform is in production mode (not test mode)
3. Test webhook connection
4. Check platform API status
5. Retry failed status updates

#### Menu Sync Failing

**Problem**: Menu not syncing to platform

**Solutions**:
1. Validate menu structure in POS
2. Check all items have required fields
3. Verify platform credentials
4. Check platform API status
5. Retry menu sync

#### Commission Tracking Inaccurate

**Problem**: Commission amounts don't match platform

**Solutions**:
1. Verify commission rate settings
2. Check platform agreement for actual rates
3. Reconcile with platform dashboard
4. Update commission rate if needed

### Error Messages

#### "Webhook Signature Verification Failed"

**Cause**: Webhook secret mismatch

**Solution**:
1. Verify webhook secret matches in both Cafe OS and platform dashboard
2. Regenerate webhook secret if needed
3. Update both systems with new secret

#### "API Authentication Failed"

**Cause**: Invalid API credentials

**Solution**:
1. Verify API key and secret are correct
2. Check for typos in credentials
3. Regenerate credentials if needed
4. Update Cafe OS with new credentials

#### "Platform Not Configured"

**Cause**: Platform not enabled or credentials missing

**Solution**:
1. Enable platform in settings
2. Enter all required credentials
3. Save settings
4. Test connection

### Support Resources

#### Platform Support

**Zomato Support**
- Email: restaurants@zomato.com
- Phone: 1800-123-4567
- Help Center: [https://www.zomato.com/partners/help](https://www.zomato.com/partners/help)

**Swiggy Support**
- Email: restaurants@swiggy.com
- Phone: 1800-208-8888
- Help Center: [https://partners.swiggy.com/help](https://partners.swiggy.com/help)

#### Cafe OS Support

For issues with Cafe OS integration:
- Email: support@cafeos.com
- Documentation: [https://docs.cafeos.com](https://docs.cafeos.com)
- Community Forum: [https://community.cafeos.com](https://community.cafeos.com)

---

## Best Practices

### Order Management

1. **Accept Orders Promptly**
   - Accept orders within 2-3 minutes
   - Set realistic preparation times
   - Update status regularly

2. **Maintain Menu Accuracy**
   - Keep menu items available
   - Update prices regularly
   - Add new items promptly
   - Remove discontinued items

3. **Quality Control**
   - Ensure food quality for delivery
   - Use proper packaging
   - Follow special instructions
   - Handle complaints professionally

### Commission Management

1. **Track Commissions Regularly**
   - Review commission reports weekly
   - Reconcile with platform payouts
   - Monitor commission rates
   - Negotiate better rates if volume increases

2. **Optimize Pricing**
   - Consider commission when setting prices
   - Adjust pricing for delivery vs dine-in
   - Monitor competitor pricing
   - Use platform promotions strategically

### Customer Service

1. **Handle Issues Promptly**
   - Respond to customer complaints quickly
   - Offer solutions for problems
   - Maintain good ratings
   - Learn from feedback

2. **Communication**
   - Keep customers informed
   - Provide accurate ETAs
   - Handle special requests
   - Build customer loyalty

---

## Security Considerations

### Credential Management

1. **Secure Storage**
   - API credentials are encrypted in Cafe OS
   - Never share credentials
   - Rotate credentials periodically
   - Use strong webhook secrets

2. **Access Control**
   - Limit access to platform settings
   - Use role-based permissions
   - Monitor access logs
   - Review user permissions regularly

### Data Protection

1. **Customer Data**
   - Protect customer information
   - Follow privacy regulations
   - Secure payment data
   - Comply with platform policies

2. **Order Data**
   - Maintain order records
   - Backup data regularly
   - Follow data retention policies
   - Secure historical data

---

## Updates and Maintenance

### Regular Maintenance

1. **Weekly Tasks**
   - Review commission reports
   - Check webhook status
   - Verify menu sync
   - Update item availability

2. **Monthly Tasks**
   - Reconcile settlements
   - Review commission rates
   - Update menu items
   - Analyze performance

3. **Quarterly Tasks**
   - Review platform agreements
   - Negotiate commission rates
   - Update credentials
   - Audit integration

### Software Updates

1. **Cafe OS Updates**
   - Install updates promptly
   - Test in sandbox first
   - Backup before updating
   - Monitor for issues

2. **Platform API Changes**
   - Monitor platform announcements
   - Update integration when needed
   - Test API changes
   - Update documentation

---

## Frequently Asked Questions

### General Questions

**Q: Can I use both Zomato and Swiggy simultaneously?**
A: Yes, Cafe OS supports both platforms simultaneously. Orders from both platforms will appear in your POS.

**Q: Do I need separate accounts for each platform?**
A: Yes, you need to apply for partnership with each platform separately.

**Q: How long does it take to get approved?**
A: Approval typically takes 3-10 business days depending on the platform.

**Q: Can I change my commission rate?**
A: Commission rates are negotiated with platforms. Contact platform support for rate adjustments.

### Technical Questions

**Q: What happens if the internet goes down?**
A: Orders will queue and sync when connection is restored. Status updates will also queue.

**Q: Can I test the integration before going live?**
A: Yes, both platforms provide sandbox environments for testing. Use test mode in Cafe OS.

**Q: How do I know if an order is from a platform?**
A: Platform orders have a colored badge (🔴 Zomato, 🟠 Swiggy) and show platform order ID.

**Q: Can I customize the menu for each platform?**
A: Yes, you can sync different menus to each platform or use the same menu for both.

### Financial Questions

**Q: When do I receive payouts?**
A: Payout schedules vary by platform. Check your platform dashboard for payout schedule.

**Q: How are commissions calculated?**
A: Commission is calculated as a percentage of order value. The rate is set in your platform agreement.

**Q: Can I see commission reports?**
A: Yes, Cafe OS provides detailed commission reports by platform, date range, and order.

**Q: What if there's a discrepancy in commission?**
A: Reconcile with platform dashboard and contact platform support for resolution.

---

## Additional Resources

### Documentation

- [Cafe OS Documentation](https://docs.cafeos.com)
- [Zomato API Documentation](https://developers.zomato.com/api)
- [Swiggy API Documentation](https://developers.swiggy.com)

### Training

- [Cafe OS Video Tutorials](https://www.youtube.com/cafeos)
- [Platform Partner Training](https://partners.zomato.com/training)

### Community

- [Cafe OS Community Forum](https://community.cafeos.com)
- [Platform Partner Communities](https://partners.zomato.com/community)

---

## Contact Support

For additional help with Cafe OS delivery platform integration:

- **Email**: support@cafeos.com
- **Phone**: 1800-CAFE-OS (1800-223-3676)
- **Live Chat**: Available in Cafe OS dashboard
- **Support Hours**: 24/7

---

*Last Updated: August 2026*
*Version: 1.0*
