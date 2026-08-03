export const REPORT_CATEGORIES = [
  { id: "financial", label: "Financials", icon: "💰" },
  { id: "sales", label: "Sales & Revenue", icon: "📈" },
  { id: "menu", label: "Menu & Items", icon: "🍔" },
  { id: "operations", label: "Operations", icon: "⚙️" },
  { id: "kitchen", label: "Kitchen (KDS)", icon: "🍳" },
  { id: "staff", label: "Staff & Labor", icon: "👥" },
  { id: "customers", label: "Customers", icon: "🌟" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "delivery", label: "Delivery", icon: "🛵" }
];

export const REPORTS = [
  // ---------------- FINANCIAL (10) ----------------
  { id: "fin_01", category: "financial", title: "Net Sales by Day", description: "Daily net sales after refunds and discounts.", type: "bar", dataFn: "netSalesByDay" },
  { id: "fin_02", category: "financial", title: "Gross Margin Breakdown", description: "Revenue vs Cost of Goods Sold.", type: "kpi", dataFn: "grossMarginBreakdown" },
  { id: "fin_03", category: "financial", title: "Tax Liability Report", description: "Total tax collected by tax rate/type.", type: "table", dataFn: "taxLiability" },
  { id: "fin_04", category: "financial", title: "Discount & Comp Impact", description: "Lost revenue due to discounts and comps.", type: "bar", dataFn: "discountImpact" },
  { id: "fin_05", category: "financial", title: "Refund Analysis", description: "Refund amounts and reasons over time.", type: "table", dataFn: "refundAnalysis" },
  { id: "fin_06", category: "financial", title: "Payment Method Mix", description: "Revenue split across Cash, Card, UPI, etc.", type: "pie", dataFn: "paymentMix" },
  { id: "fin_07", category: "financial", title: "Cash Drawer Reconciliation", description: "Expected vs actual cash in drawer.", type: "table", dataFn: "cashReconciliation" },
  { id: "fin_08", category: "financial", title: "Average Check Size Trend", description: "Historical trend of average order value.", type: "line", dataFn: "avgCheckTrend" },
  { id: "fin_09", category: "financial", title: "Revenue by Order Source", description: "Dine-in vs Delivery vs Takeaway revenue.", type: "pie", dataFn: "revenueBySource" },
  { id: "fin_10", category: "financial", title: "Cost per Labor Hour", description: "Labor cost compared to revenue generated.", type: "kpi", dataFn: "costPerLaborHour" },

  // ---------------- SALES (10) ----------------
  { id: "sal_01", category: "sales", title: "Hourly Sales Heatmap", description: "Visualizes the busiest hours of the day.", type: "heatmap", dataFn: "hourlySalesHeatmap" },
  { id: "sal_02", category: "sales", title: "Sales by Day of Week", description: "Which days generate the most revenue.", type: "bar", dataFn: "salesByDayOfWeek" },
  { id: "sal_03", category: "sales", title: "Top 10 Best Sellers", description: "Highest revenue generating items.", type: "bar", dataFn: "top10Sellers" },
  { id: "sal_04", category: "sales", title: "Bottom 10 Worst Sellers", description: "Lowest revenue generating items.", type: "table", dataFn: "bottom10Sellers" },
  { id: "sal_05", category: "sales", title: "Sales by Category", description: "Revenue breakdown by menu category.", type: "pie", dataFn: "salesByCategory" },
  { id: "sal_06", category: "sales", title: "Combo Attach Rate", description: "Percentage of orders including a combo or meal deal.", type: "kpi", dataFn: "comboAttachRate" },
  { id: "sal_07", category: "sales", title: "Upsell Performance", description: "Success rate of suggested add-ons.", type: "kpi", dataFn: "upsellPerformance" },
  { id: "sal_08", category: "sales", title: "Order Volume by Channel", description: "Number of orders per channel.", type: "bar", dataFn: "volumeByChannel" },
  { id: "sal_09", category: "sales", title: "Sales Growth Rate", description: "Period-over-period revenue growth.", type: "line", dataFn: "salesGrowthRate" },
  { id: "sal_10", category: "sales", title: "Lost Sales Tracker", description: "Estimated lost sales from voids and cancelled orders.", type: "table", dataFn: "lostSalesTracker" },

  // ---------------- MENU (10) ----------------
  { id: "mnu_01", category: "menu", title: "Item Profitability Matrix", description: "Compares item popularity vs profit margin.", type: "table", dataFn: "itemProfitability" },
  { id: "mnu_02", category: "menu", title: "Menu Category Performance", description: "Detailed stats for each menu category.", type: "table", dataFn: "categoryPerformance" },
  { id: "mnu_03", category: "menu", title: "Modifier Popularity", description: "Most frequently chosen add-ons and modifiers.", type: "bar", dataFn: "modifierPopularity" },
  { id: "mnu_04", category: "menu", title: "Allergen Order Frequency", description: "Frequency of specific allergen flags on orders.", type: "table", dataFn: "allergenFrequency" },
  { id: "mnu_05", category: "menu", title: "Menu Item Void Rate", description: "Items most frequently voided or cancelled.", type: "bar", dataFn: "itemVoidRate" },
  { id: "mnu_06", category: "menu", title: "Seasonal Item Performance", description: "Sales data for limited-time offers.", type: "line", dataFn: "seasonalPerformance" },
  { id: "mnu_07", category: "menu", title: "Drink vs Food Ratio", description: "Comparison of beverage sales to food sales.", type: "pie", dataFn: "drinkVsFood" },
  { id: "mnu_08", category: "menu", title: "Price Elasticity Est.", description: "Estimated sales impact from recent price changes.", type: "kpi", dataFn: "priceElasticity" },
  { id: "mnu_09", category: "menu", title: "Top Returned Items", description: "Items most frequently sent back to kitchen.", type: "table", dataFn: "topReturnedItems" },
  { id: "mnu_10", category: "menu", title: "Item Pairings", description: "Items most commonly purchased together.", type: "table", dataFn: "itemPairings" },

  // ---------------- OPERATIONS (10) ----------------
  { id: "ops_01", category: "operations", title: "Order Cancellation Reasons", description: "Breakdown of why orders are cancelled.", type: "pie", dataFn: "cancellationReasons" },
  { id: "ops_02", category: "operations", title: "Table Turnover Rate", description: "Average time a table is occupied.", type: "kpi", dataFn: "tableTurnover" },
  { id: "ops_03", category: "operations", title: "Revenue per Square Foot", description: "Efficiency of dining room space usage.", type: "kpi", dataFn: "revPerSqFt" },
  { id: "ops_04", category: "operations", title: "Busiest Tables", description: "Which tables generate the most revenue/turnover.", type: "table", dataFn: "busiestTables" },
  { id: "ops_05", category: "operations", title: "Average Guest Count", description: "Average party size over time.", type: "line", dataFn: "avgGuestCount" },
  { id: "ops_06", category: "operations", title: "Wait Time Distribution", description: "Distribution of customer wait times for tables.", type: "bar", dataFn: "waitTimeDistribution" },
  { id: "ops_07", category: "operations", title: "Reservation No-Show Rate", description: "Percentage of bookings that do not arrive.", type: "kpi", dataFn: "noShowRate" },
  { id: "ops_08", category: "operations", title: "Terminal Usage Stats", description: "Order volume processed by each POS terminal.", type: "pie", dataFn: "terminalUsage" },
  { id: "ops_09", category: "operations", title: "Shift Handoff Log", description: "Summary of activities during shift changes.", type: "table", dataFn: "shiftHandoff" },
  { id: "ops_10", category: "operations", title: "System Uptime & Errors", description: "Technical stability and logged errors.", type: "kpi", dataFn: "systemUptime" },

  // ---------------- KITCHEN (10) ----------------
  { id: "kit_01", category: "kitchen", title: "Average Prep Time", description: "Overall average time from order to ready.", type: "line", dataFn: "avgPrepTime" },
  { id: "kit_02", category: "kitchen", title: "Prep Time by Station", description: "Breakdown of prep times across Bar, Grill, etc.", type: "bar", dataFn: "prepTimeByStation" },
  { id: "kit_03", category: "kitchen", title: "Ticket Hold Frequency", description: "How often tickets are placed on hold.", type: "kpi", dataFn: "ticketHoldFrequency" },
  { id: "kit_04", category: "kitchen", title: "Station Bottleneck Analysis", description: "Identifies stations causing the most delays.", type: "table", dataFn: "stationBottlenecks" },
  { id: "kit_05", category: "kitchen", title: "KDS Bump Rate", description: "Speed at which tickets are bumped off screen.", type: "kpi", dataFn: "kdsBumpRate" },
  { id: "kit_06", category: "kitchen", title: "Rush Hour Kitchen Load", description: "Ticket volume vs Prep time during peak hours.", type: "line", dataFn: "rushHourLoad" },
  { id: "kit_07", category: "kitchen", title: "Item Remake Tracker", description: "Frequency and cost of remade items.", type: "table", dataFn: "itemRemakes" },
  { id: "kit_08", category: "kitchen", title: "Urgent Ticket Ratio", description: "Percentage of tickets marked as urgent.", type: "pie", dataFn: "urgentTicketRatio" },
  { id: "kit_09", category: "kitchen", title: "Kitchen Staff Efficiency", description: "Tickets processed per kitchen staff member.", type: "bar", dataFn: "kitchenEfficiency" },
  { id: "kit_10", category: "kitchen", title: "Ticket Completion Variance", description: "Variance between target and actual prep times.", type: "table", dataFn: "completionVariance" },

  // ---------------- STAFF (10) ----------------
  { id: "stf_01", category: "staff", title: "Sales per Labor Hour", description: "Key productivity metric for front-of-house.", type: "line", dataFn: "salesPerLaborHour" },
  { id: "stf_02", category: "staff", title: "Top Performing Servers", description: "Servers ranked by sales volume.", type: "bar", dataFn: "topServers" },
  { id: "stf_03", category: "staff", title: "Tip Distribution", description: "Average tip percentages across staff.", type: "table", dataFn: "tipDistribution" },
  { id: "stf_04", category: "staff", title: "Void & Comp Frequency by Staff", description: "Identifies abnormal void/comp activity.", type: "table", dataFn: "staffVoidFrequency" },
  { id: "stf_05", category: "staff", title: "Average Check by Server", description: "Shows who is successfully upselling.", type: "bar", dataFn: "avgCheckByServer" },
  { id: "stf_06", category: "staff", title: "Table Turn Time by Server", description: "Server efficiency at clearing tables.", type: "bar", dataFn: "tableTurnByServer" },
  { id: "stf_07", category: "staff", title: "Shift Attendance Log", description: "Tardiness and absence tracking.", type: "table", dataFn: "attendanceLog" },
  { id: "stf_08", category: "staff", title: "Overtime Watch", description: "Staff approaching or exceeding overtime limits.", type: "table", dataFn: "overtimeWatch" },
  { id: "stf_09", category: "staff", title: "Staff Error Rate", description: "Mistakes (wrong item, missed mod) linked to staff.", type: "kpi", dataFn: "staffErrorRate" },
  { id: "stf_10", category: "staff", title: "Employee Retention Rate", description: "Historical tracking of staff turnover.", type: "kpi", dataFn: "retentionRate" },

  // ---------------- CUSTOMERS (10) ----------------
  { id: "cst_01", category: "customers", title: "New vs Returning Guests", description: "Ratio of first-time visitors to regulars.", type: "pie", dataFn: "newVsReturning" },
  { id: "cst_02", category: "customers", title: "Top 50 Spenders", description: "List of the highest lifetime value customers.", type: "table", dataFn: "topSpenders" },
  { id: "cst_03", category: "customers", title: "Customer Retention Rate", description: "Percentage of customers who return within 30 days.", type: "kpi", dataFn: "retentionRateCust" },
  { id: "cst_04", category: "customers", title: "Average Visit Frequency", description: "How often regulars come back.", type: "bar", dataFn: "visitFrequency" },
  { id: "cst_05", category: "customers", title: "Customer Churn Risk", description: "Regulars who haven't visited recently.", type: "table", dataFn: "churnRisk" },
  { id: "cst_06", category: "customers", title: "Loyalty Program Signup Rate", description: "Conversion rate for the loyalty program.", type: "kpi", dataFn: "loyaltySignups" },
  { id: "cst_07", category: "customers", title: "Loyalty Points Liability", description: "Outstanding unredeemed loyalty points value.", type: "kpi", dataFn: "pointsLiability" },
  { id: "cst_08", category: "customers", title: "Customer Feedback Score", description: "Aggregated ratings from digital receipts.", type: "line", dataFn: "feedbackScore" },
  { id: "cst_09", category: "customers", title: "Demographic Breakdown", description: "Age/Gender metrics (if collected).", type: "pie", dataFn: "demographics" },
  { id: "cst_10", category: "customers", title: "Busiest Zip Codes", description: "Geographic heatmap of delivery/customer addresses.", type: "table", dataFn: "busiestZipCodes" },

  // ---------------- INVENTORY (10) ----------------
  { id: "inv_01", category: "inventory", title: "Current Stock Value", description: "Total capital tied up in inventory.", type: "kpi", dataFn: "stockValue" },
  { id: "inv_02", category: "inventory", title: "High Wastage Items", description: "Ingredients that are frequently wasted.", type: "bar", dataFn: "highWastage" },
  { id: "inv_03", category: "inventory", title: "Low Stock Alerts", description: "Items currently below their reorder point.", type: "table", dataFn: "lowStock" },
  { id: "inv_04", category: "inventory", title: "Inventory Turnover Ratio", description: "How quickly stock is used and replaced.", type: "kpi", dataFn: "inventoryTurnover" },
  { id: "inv_05", category: "inventory", title: "Supplier Cost Variance", description: "Changes in ingredient prices over time.", type: "line", dataFn: "costVariance" },
  { id: "inv_06", category: "inventory", title: "Theoretical vs Actual Usage", description: "Expected ingredient usage vs actual count.", type: "table", dataFn: "usageVariance" },
  { id: "inv_07", category: "inventory", title: "Dead Stock Report", description: "Items with zero usage in the last 30 days.", type: "table", dataFn: "deadStock" },
  { id: "inv_08", category: "inventory", title: "Top Ingredients by Cost", description: "Most expensive components of your menu.", type: "bar", dataFn: "topIngredientsCost" },
  { id: "inv_09", category: "inventory", title: "Top Ingredients by Volume", description: "Highest velocity inventory items.", type: "bar", dataFn: "topIngredientsVol" },
  { id: "inv_10", category: "inventory", title: "Purchase Order History", description: "Log of past orders to suppliers.", type: "table", dataFn: "poHistory" },

  // ---------------- DELIVERY (5) ----------------
  { id: "del_01", category: "delivery", title: "Delivery Driver Turnaround", description: "Average time from dispatch to return.", type: "bar", dataFn: "driverTurnaround" },
  { id: "del_02", category: "delivery", title: "Delivery Radius Heatmap", description: "Where most delivery orders originate.", type: "table", dataFn: "deliveryHeatmap" },
  { id: "del_03", category: "delivery", title: "Platform Fee Analysis", description: "Commissions paid to Swiggy/Zomato.", type: "pie", dataFn: "platformFees" },
  { id: "del_04", category: "delivery", title: "Delivery vs Dine-in Profitability", description: "Margin comparison between channels.", type: "bar", dataFn: "deliveryVsDineInMargin" },
  { id: "del_05", category: "delivery", title: "Late Delivery Tracker", description: "Orders exceeding estimated delivery time.", type: "table", dataFn: "lateDeliveries" }
];
