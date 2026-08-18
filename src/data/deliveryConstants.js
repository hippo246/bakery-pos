// Delivery Constants with GPS and Route Data
// Seed data for Route & Tracking module

import { normalizeDeliveryOrder, normalizeDriver, createRoute } from "../domain/deliveryModel.js";
import { isDatasetAllowed, getProductionBackendError } from '../utils/runtimeMode.js';

// Cafe location (Bangalore default)
export const CAFE_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  address: "Cafe Location, Bangalore"
};

// Initial drivers with GPS coordinates
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_DRIVERS = () => {
  if (!isDatasetAllowed('INIT_DRIVERS')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: "driver-1",
    name: "Amit Kumar",
    phone: "+91 87654 32109",
    vehicle: "Bike",
    status: "available",
    partner: "DIRECT_DELIVERY",
    rating: 4.5,
    deliveries: 150,
    coordinates: { lat: 12.9716, lng: 77.5946 },
    lastLocationUpdate: new Date().toISOString(),
    currentRouteId: null,
    branch: "main"
  },
  {
    id: "driver-2",
    name: "Suresh Reddy",
    phone: "+91 76543 21098",
    vehicle: "Bike",
    status: "on_delivery",
    partner: "ZOMATO",
    rating: 4.7,
    deliveries: 200,
    coordinates: { lat: 12.9352, lng: 77.6245 },
    lastLocationUpdate: new Date(Date.now() - 3 * 60000).toISOString(),
    currentRouteId: "route-1",
    branch: "main"
  },
  {
    id: "driver-3",
    name: "Vikram Singh",
    phone: "+91 65432 10987",
    vehicle: "Bike",
    status: "available",
    partner: "SWIGGY",
    rating: 4.3,
    deliveries: 120,
    coordinates: { lat: 12.9716, lng: 77.5946 },
    lastLocationUpdate: new Date(Date.now() - 10 * 60000).toISOString(),
    currentRouteId: null,
    branch: "main"
  },
  {
    id: "driver-4",
    name: "Rahul Verma",
    phone: "+91 54321 09876",
    vehicle: "Scooter",
    status: "available",
    partner: "ZOMATO",
    rating: 4.6,
    deliveries: 180,
    coordinates: { lat: 12.9716, lng: 77.5946 },
    lastLocationUpdate: new Date(Date.now() - 25 * 60000).toISOString(),
    currentRouteId: null,
    branch: "main"
  },
  {
    id: "driver-5",
    name: "Deepak Sharma",
    phone: "+91 43210 98765",
    vehicle: "Bike",
    status: "offline",
    partner: "DIRECT_DELIVERY",
    rating: 4.4,
    deliveries: 95,
    coordinates: null,
    lastLocationUpdate: null,
    currentRouteId: null,
    branch: "main"
  }
];
};

// Initial delivery orders with coordinates
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_DELIVERY_ORDERS = function() {
  if (!isDatasetAllowed('INIT_DELIVERY_ORDERS')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: "del-1",
    orderId: "ord-001",
    source: "SWIGGY",
    platformOrderId: "SWG-2024-001",
    customer: {
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      address: "123, MG Road, Bangalore - 560001",
      pincode: "560001",
      coordinates: { lat: 12.9756, lng: 77.6066 }
    },
    items: [{ name: "Cappuccino", qty: 2, price: 180 }, { name: "Croissant", qty: 1, price: 120 }],
    subtotal: 300,
    deliveryFee: 40,
    commission: 61,
    total: 340,
    status: "PACKING",
    paymentMode: "ONLINE",
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
    rider: { id: "driver-1", name: "Amit Kumar", phone: "+91 87654 32109", vehicle: "Bike" },
    specialInstructions: "Less sugar in cappuccino",
    notes: ""
  },
  {
    id: "del-2",
    orderId: "ord-002",
    source: "ZOMATO",
    platformOrderId: "ZMT-2024-002",
    customer: {
      name: "Priya Patel",
      phone: "+91 87654 32109",
      address: "456, Brigade Road, Bangalore - 560025",
      pincode: "560025",
      coordinates: { lat: 12.9815, lng: 77.6034 }
    },
    items: [{ name: "Latte", qty: 1, price: 160 }, { name: "Sandwich", qty: 2, price: 280 }],
    subtotal: 440,
    deliveryFee: 35,
    commission: 95,
    total: 475,
    status: "OUT_FOR_DELIVERY",
    paymentMode: "COD",
    paymentStatus: "COD",
    codAmount: 475,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 15 * 60000).toISOString(),
    rider: { id: "driver-2", name: "Suresh Reddy", phone: "+91 76543 21098", vehicle: "Bike" },
    specialInstructions: "",
    notes: ""
  },
  {
    id: "del-3",
    orderId: "ord-003",
    source: "DIRECT_DELIVERY",
    platformOrderId: "",
    customer: {
      name: "Ankit Mehta",
      phone: "+91 76543 21098",
      address: "789, Indiranagar, Bangalore - 560038",
      pincode: "560038",
      coordinates: { lat: 12.9784, lng: 77.6408 }
    },
    items: [{ name: "Espresso", qty: 3, price: 270 }, { name: "Muffin", qty: 3, price: 180 }],
    subtotal: 450,
    deliveryFee: 40,
    commission: 0,
    total: 490,
    status: "DELIVERED",
    paymentMode: "CASH",
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() - 30 * 60000).toISOString(),
    rider: { id: "driver-3", name: "Vikram Singh", phone: "+91 65432 10987", vehicle: "Bike" },
    specialInstructions: "Hot espresso",
    notes: ""
  },
  {
    id: "del-4",
    orderId: "ord-004",
    source: "ZOMATO",
    platformOrderId: "ZMT-2024-004",
    customer: {
      name: "Sneha Gupta",
      phone: "+91 65432 10987",
      address: "321, Koramangala, Bangalore - 560034",
      pincode: "560034",
      coordinates: { lat: 12.9352, lng: 77.6245 }
    },
    items: [{ name: "Americano", qty: 2, price: 200 }, { name: "Cake Slice", qty: 1, price: 150 }],
    subtotal: 350,
    deliveryFee: 35,
    commission: 77,
    total: 385,
    status: "READY_FOR_PICKUP",
    paymentMode: "ONLINE",
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 35 * 60000).toISOString(),
    rider: null,
    specialInstructions: "No ice in americano",
    notes: ""
  },
  {
    id: "del-5",
    orderId: "ord-005",
    source: "SWIGGY",
    platformOrderId: "SWG-2024-005",
    customer: {
      name: "Rajesh Kumar",
      phone: "+91 98765 12345",
      address: "567, Jayanagar, Bangalore - 560041",
      pincode: "560041",
      coordinates: { lat: 12.9295, lng: 77.5802 }
    },
    items: [{ name: "Mocha", qty: 1, price: 190 }, { name: "Bagel", qty: 2, price: 140 }],
    subtotal: 330,
    deliveryFee: 40,
    commission: 67,
    total: 370,
    status: "PACKING",
    paymentMode: "ONLINE",
    paymentStatus: "PAID",
    codAmount: 0,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedDelivery: new Date(Date.now() + 25 * 60000).toISOString(),
    rider: null,
    specialInstructions: "Extra chocolate",
    notes: ""
  }
];
};

// Initial routes
// PRODUCTION SAFETY: This is demo data, forbidden in production
export const INIT_ROUTES = function() {
  if (!isDatasetAllowed('INIT_ROUTES')) {
    throw new Error(getProductionBackendError());
  }
  return [
  {
    id: "route-1",
    driverId: "driver-2",
    status: "IN_PROGRESS",
    startLocation: CAFE_LOCATION,
    stops: [
      {
        sequence: 1,
        deliveryId: "del-2",
        deliveryOrderId: "ord-002",
        customerName: "Priya Patel",
        address: "456, Brigade Road, Bangalore - 560025",
        coordinates: { lat: 12.9815, lng: 77.6034 },
        phone: "+91 87654 32109",
        orderTotal: 475,
        status: "in_progress",
        eta: new Date(Date.now() + 10 * 60000).toISOString(),
        actualArrival: null,
        delay: null,
        notes: ""
      }
    ],
    totalStops: 1,
    completedStops: 0,
    remainingStops: 1,
    failedStops: 0,
    totalDistance: 1.2,
    estimatedDuration: 15,
    actualStartTime: new Date(Date.now() - 5 * 60000).toISOString(),
    actualEndTime: null,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString()
  }
];
};

// Route & Tracking sections
export const ROUTE_SECTIONS = [
  { id: "map", label: "Live Map", icon: "🗺️" },
  { id: "routes", label: "Routes", icon: "📍" },
  { id: "drivers", label: "Drivers", icon: "🚴" },
  { id: "issues", label: "Location Issues", icon: "⚠️" }
];

// Calculate route statistics
export const calculateRouteStats = (deliveryOrders, drivers, routes) => {
  const safeOrders = Array.isArray(deliveryOrders) ? deliveryOrders : [];
  const safeDrivers = Array.isArray(drivers) ? drivers : [];
  const safeRoutes = Array.isArray(routes) ? routes : [];

  const activeDrivers = safeDrivers.filter(d => 
    d.status === "available" || d.status === "on_delivery" || d.status === "returning"
  ).length;

  const deliveriesOut = safeOrders.filter(o => 
    ["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)
  ).length;

  const awaitingDispatch = safeOrders.filter(o => 
    o.status === "PACKING" || (o.status === "READY_FOR_PICKUP" && !o.rider)
  ).length;

  const delayed = safeOrders.filter(o => {
    if (!o.estimatedDelivery || !["PACKING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.status)) return false;
    const etaMin = Math.round((new Date(o.estimatedDelivery) - Date.now()) / 60000);
    return etaMin < 0;
  }).length;

  const gpsOffline = safeDrivers.filter(d => {
    if (!d.lastLocationUpdate) return true;
    const minutesAgo = (Date.now() - new Date(d.lastLocationUpdate).getTime()) / 60000;
    return minutesAgo > 30;
  }).length;

  const staleLocation = safeDrivers.filter(d => {
    if (!d.lastLocationUpdate) return false;
    const minutesAgo = (Date.now() - new Date(d.lastLocationUpdate).getTime()) / 60000;
    return minutesAgo > 5 && minutesAgo <= 30;
  }).length;

  const unassigned = safeOrders.filter(o => !o.rider && !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length;

  const completedToday = safeOrders.filter(o => {
    const today = new Date().toDateString();
    const created = o.createdAt ? new Date(o.createdAt) : null;
    return o.status === "DELIVERED" && created && !isNaN(created) && created.toDateString() === today;
  }).length;

  return {
    activeDrivers,
    deliveriesOut,
    awaitingDispatch,
    delayed,
    gpsOffline,
    staleLocation,
    unassigned,
    completedToday
  };
};

// Format quantity
export const formatQuantity = (value, unit = "") => {
  const num = Number(value);
  if (isNaN(num)) return `0 ${unit}`;
  return `${num.toLocaleString('en-IN', { maximumFractionDigits: 1 })} ${unit}`.trim();
};

// Format currency
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// Format percentage
export const formatPercentage = (value) => {
  const num = Number(value);
  if (isNaN(num)) return "0%";
  return `${Math.round(num)}%`;
};

// Format time
export const formatTime = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// Format relative time
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  
  const now = Date.now();
  const diff = now - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Get seed drivers
export const getSeedDrivers = () => {
  try {
    return INIT_DRIVERS().map(normalizeDriver);
  } catch (error) {
    console.warn('[deliveryConstants] Demo data not available:', error.message);
    return [];
  }
};

// Get seed delivery orders with coordinates
export const getSeedDeliveryOrders = () => {
  try {
    return INIT_DELIVERY_ORDERS().map(normalizeDeliveryOrder);
  } catch (error) {
    console.warn('[deliveryConstants] Demo data not available:', error.message);
    return [];
  }
};

// Get seed routes
export const getSeedRoutes = () => {
  try {
    return INIT_ROUTES();
  } catch (error) {
    console.warn('[deliveryConstants] Demo data not available:', error.message);
    return [];
  }
};
