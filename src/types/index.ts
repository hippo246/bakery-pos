// TypeScript type definitions for BrewCRM

export type OrderStatus = "NEW" | "ACCEPTED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
export type OrderSource = "WALK_IN" | "SWIGGY" | "ZOMATO" | "DIRECT_DELIVERY";
export type PaymentStatus = "PAID" | "COD" | "PENDING";
export type Urgency = "urgent" | "soon" | "ok";
export type Tier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type Category = "Coffee" | "Special" | "Food";
export type Tab = "orders" | "kitchen" | "crm" | "analytics" | "menu";

export interface Order {
  id: string;
  source: OrderSource;
  customer: string;
  items: string;
  amount: number;
  status: OrderStatus;
  time: number;
  payStatus: PaymentStatus;
}

export interface KDSCardItem {
  name: string;
  qty: number;
  mod: string;
  checked: boolean;
}

export interface KDSCard {
  id: string;
  source: OrderSource;
  station: "Bar" | "Kitchen";
  items: KDSCardItem[];
  note: string;
  startedAt: number;
  urgency: Urgency;
  held: boolean;
  holdReason?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: Tier;
  fav: string;
  birthday?: string;
  allergy?: string;
  visits: number;
  spend: number;
  tags: string[];
  notes?: string;
  lastVisit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  cat: Category;
  desc: string;
  emoji: string;
  popular: boolean;
  active: boolean;
  eightySixed: boolean;
}

export interface VisitHistory {
  date: string;
  items: string;
  amt: number;
}

export interface NavItem {
  id: Tab;
  label: string;
  icon: string;
}

export interface AnalyticsMetric {
  val: string;
  lbl: string;
  change: string;
  up: boolean;
  sub: string;
}

export interface AnalyticsData {
  today: AnalyticsPeriod;
  week: AnalyticsPeriod;
  month: AnalyticsPeriod;
}

export interface AnalyticsPeriod {
  metrics: AnalyticsMetric[];
  barVals: number[];
  barLabels: string[];
  barCaption: string;
  barPeak: string;
}

export interface ChannelData {
  name: string;
  pct: number;
  rev: string;
  orders: number;
  color: string;
}

export interface TopItem {
  name: string;
  sold: number;
  rev: string;
  trend: string;
}
