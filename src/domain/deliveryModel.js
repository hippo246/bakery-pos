// Delivery Domain Model with GPS, Routes, and Tracking
// Handles coordinates, routes, driver locations, and delivery tracking

export const DELIVERY_STATUSES = {
  PACKING: { label: "Preparing", color: "#f39c12", icon: "📦", order: 1 },
  READY_FOR_PICKUP: { label: "Ready", color: "#27ae60", icon: "✅", order: 2 },
  PICKED_UP: { label: "Assigned", color: "#3498db", icon: "🚴", order: 3 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#9b59b6", icon: "🛵", order: 4 },
  DELIVERED: { label: "Delivered", color: "#27ae60", icon: "✓", order: 5 },
  FAILED: { label: "Failed", color: "#e74c3c", icon: "❌", order: 6 },
  CANCELLED: { label: "Cancelled", color: "#95a5a6", icon: "🚫", order: 7 }
};

export const DRIVER_STATUSES = {
  AVAILABLE: { label: "Available", color: "#27ae60", icon: "🟢" },
  ON_DELIVERY: { label: "On Delivery", color: "#3498db", icon: "🔵" },
  RETURNING: { label: "Returning", color: "#f39c12", icon: "🟠" },
  OFFLINE: { label: "Offline", color: "#95a5a6", icon: "⚫" },
  GPS_DISABLED: { label: "GPS Disabled", color: "#e74c3c", icon: "🔴" }
};

export const LOCATION_FRESHNESS = {
  LIVE: { label: "Live", color: "#27ae60", threshold: 2 }, // 2 minutes
  RECENT: { label: "Updated just now", color: "#27ae60", threshold: 5 }, // 5 minutes
  STALE: { label: "Stale", color: "#f39c12", threshold: 15 }, // 15 minutes
  OFFLINE: { label: "Offline", color: "#95a5a6", threshold: 30 }, // 30 minutes
  UNAVAILABLE: { label: "Location unavailable", color: "#e74c3c", threshold: Infinity }
};

export const LOCATION_ISSUES = {
  MISSING_ADDRESS: { label: "Missing Address", severity: "high", color: "#e74c3c" },
  MISSING_COORDINATES: { label: "Missing Coordinates", severity: "high", color: "#e74c3c" },
  INVALID_COORDINATES: { label: "Invalid Coordinates", severity: "high", color: "#e74c3c" },
  DUPLICATE_COORDINATES: { label: "Duplicate Coordinates", severity: "medium", color: "#f39c12" },
  GEOCODING_FAILED: { label: "Geocoding Failed", severity: "medium", color: "#f39c12" },
  DRIVER_GPS_DISABLED: { label: "Driver GPS Disabled", severity: "medium", color: "#f39c12" },
  DRIVER_LOCATION_STALE: { label: "Driver Location Stale", severity: "low", color: "#e67e22" },
  ADDRESS_MISMATCH: { label: "Table/Customer Address Mismatch", severity: "low", color: "#e67e22" },
  UNSUPPORTED_MAP_LINK: { label: "Unsupported Map Link", severity: "low", color: "#95a5a6" }
};

export const ROUTE_STATUSES = {
  PLANNED: { label: "Planned", color: "#3498db" },
  IN_PROGRESS: { label: "In Progress", color: "#f39c12" },
  COMPLETED: { label: "Completed", color: "#27ae60" },
  CANCELLED: { label: "Cancelled", color: "#95a5a6" }
};

export const TRACEABILITY_STATES = {
  COMPLETE: { label: "Complete", color: "#27ae60" },
  PARTIAL: { label: "Partial", color: "#f39c12" },
  MISSING: { label: "Missing", color: "#95a5a6" },
  OVERALLOCATED: { label: "Overallocated", color: "#e74c3c" },
  NEEDS_REVIEW: { label: "Needs Review", color: "#e67e22" }
};

export const FAILURE_REASONS = [
  "Customer Unavailable",
  "Incorrect Address",
  "No Answer",
  "Customer Refused",
  "Payment Issue",
  "Vehicle Issue",
  "Product Issue",
  "Safety Concern",
  "Other"
];

// Coordinate validation
export const isValidCoordinate = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return (
    !isNaN(latNum) && !isNaN(lngNum) &&
    latNum >= -90 && latNum <= 90 &&
    lngNum >= -180 && lngNum <= 180 &&
    (latNum !== 0 || lngNum !== 0) // Exclude (0,0) as it's often a default/invalid value
  );
};

// Calculate distance between two coordinates (Haversine formula) - straight-line distance
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

// Calculate location freshness
export const getLocationFreshness = (lastUpdate) => {
  if (!lastUpdate) return LOCATION_FRESHNESS.UNAVAILABLE;
  
  const now = Date.now();
  const lastTime = new Date(lastUpdate).getTime();
  if (isNaN(lastTime)) return LOCATION_FRESHNESS.UNAVAILABLE;
  
  const minutesAgo = (now - lastTime) / 60000;
  
  if (minutesAgo <= LOCATION_FRESHNESS.LIVE.threshold) return LOCATION_FRESHNESS.LIVE;
  if (minutesAgo <= LOCATION_FRESHNESS.RECENT.threshold) return LOCATION_FRESHNESS.RECENT;
  if (minutesAgo <= LOCATION_FRESHNESS.STALE.threshold) return LOCATION_FRESHNESS.STALE;
  if (minutesAgo <= LOCATION_FRESHNESS.OFFLINE.threshold) return LOCATION_FRESHNESS.OFFLINE;
  return LOCATION_FRESHNESS.UNAVAILABLE;
};

// Format location freshness for display
export const formatLocationFreshness = (lastUpdate) => {
  const freshness = getLocationFreshness(lastUpdate);
  if (freshness === LOCATION_FRESHNESS.UNAVAILABLE) return "Location unavailable";
  
  const now = Date.now();
  const lastTime = new Date(lastUpdate).getTime();
  const minutesAgo = Math.round((now - lastTime) / 60000);
  
  if (minutesAgo < 1) return "Updated just now";
  if (minutesAgo === 1) return "Updated 1 min ago";
  if (minutesAgo < 60) return `Updated ${minutesAgo} min ago`;
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo === 1) return "Updated 1 hour ago";
  return `Updated ${hoursAgo} hours ago`;
};

// Normalize delivery order with GPS data
export const normalizeDeliveryOrder = (order) => {
  if (!order || typeof order !== "object") return null;
  
  const now = new Date().toISOString();
  const customer = order.customer || {};
  
  // Default coordinates for Bangalore if not provided
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;
  
  return {
    id: order.id || `del-${Date.now()}`,
    orderId: order.orderId || null,
    source: order.source || "DIRECT_DELIVERY",
    platformOrderId: order.platformOrderId || "",
    customer: {
      name: customer.name || "Unknown",
      phone: customer.phone || "",
      address: customer.address || "",
      pincode: customer.pincode || "",
      coordinates: {
        lat: customer.coordinates?.lat || defaultLat,
        lng: customer.coordinates?.lng || defaultLng
      }
    },
    items: Array.isArray(order.items) ? order.items : [],
    subtotal: Number(order.subtotal) || 0,
    deliveryFee: Number(order.deliveryFee) || 0,
    commission: Number(order.commission) || 0,
    total: Number(order.total) || 0,
    status: order.status || "PACKING",
    paymentMode: order.paymentMode || "CASH",
    paymentStatus: order.paymentStatus || "UNPAID",
    codAmount: Number(order.codAmount) || 0,
    createdAt: order.createdAt || now,
    estimatedDelivery: order.estimatedDelivery || null,
    assignedAt: order.assignedAt || null,
    deliveredAt: order.deliveredAt || null,
    failedAt: order.failedAt || null,
    updatedAt: order.updatedAt || now,
    rider: order.rider ? {
      id: order.rider.id,
      name: order.rider.name,
      phone: order.rider.phone,
      vehicle: order.rider.vehicle || "Bike",
      status: order.rider.status || "available",
      coordinates: order.rider.coordinates || null,
      lastLocationUpdate: order.rider.lastLocationUpdate || null
    } : null,
    specialInstructions: order.specialInstructions || "",
    notes: order.notes || "",
    failureReason: order.failureReason || null,
    routeId: order.routeId || null,
    routeSequence: order.routeSequence || null
  };
};

// Normalize driver with GPS data
export const normalizeDriver = (driver) => {
  if (!driver || typeof driver !== "object") return null;
  
  return {
    id: driver.id,
    name: driver.name || "Unknown",
    phone: driver.phone || "",
    vehicle: driver.vehicle || "Bike",
    status: driver.status || "AVAILABLE",
    partner: driver.partner || "DIRECT_DELIVERY",
    rating: Number(driver.rating) || 0,
    deliveries: Number(driver.deliveries) || 0,
    coordinates: driver.coordinates || null,
    lastLocationUpdate: driver.lastLocationUpdate || null,
    currentRouteId: driver.currentRouteId || null,
    branch: driver.branch || null
  };
};

// Create route from deliveries
export const createRoute = (deliveries, driverId, startLocation = null) => {
  if (!Array.isArray(deliveries) || deliveries.length === 0) return null;
  
  const now = new Date().toISOString();
  const routeId = `route-${Date.now()}`;
  
  // Default start location (cafe location - Bangalore)
  const cafeLocation = {
    lat: 12.9716,
    lng: 77.5946,
    address: "Cafe Location"
  };
  
  const stops = deliveries.map((delivery, index) => {
    const normalized = normalizeDeliveryOrder(delivery);
    return {
      sequence: index + 1,
      deliveryId: normalized.id,
      deliveryOrderId: normalized.orderId,
      customerName: normalized.customer.name,
      address: normalized.customer.address,
      coordinates: normalized.customer.coordinates,
      phone: normalized.customer.phone,
      orderTotal: normalized.total,
      status: "pending",
      eta: null,
      actualArrival: null,
      delay: null,
      notes: ""
    };
  });
  
  return {
    id: routeId,
    driverId,
    status: "PLANNED",
    startLocation: startLocation || cafeLocation,
    stops,
    totalStops: stops.length,
    completedStops: 0,
    remainingStops: stops.length,
    failedStops: 0,
    totalDistance: null, // Will be calculated if routing service exists
    estimatedDuration: null,
    actualStartTime: null,
    actualEndTime: null,
    createdAt: now,
    updatedAt: now
  };
};

// Calculate route progress
export const calculateRouteProgress = (route) => {
  if (!route || typeof route !== "object") return null;
  
  const stops = Array.isArray(route.stops) ? route.stops : [];
  const completed = stops.filter(s => s.status === "completed").length;
  const failed = stops.filter(s => s.status === "failed").length;
  const remaining = stops.filter(s => s.status === "pending").length;
  
  return {
    totalStops: stops.length,
    completedStops: completed,
    remainingStops: remaining,
    failedStops: failed,
    progress: stops.length > 0 ? Math.round((completed / stops.length) * 100) : 0
  };
};

// Reconcile delivery with route
export const reconcileDeliveryRoute = (delivery, route) => {
  if (!delivery || !route) return null;
  
  const stop = route.stops?.find(s => s.deliveryId === delivery.id);
  if (!stop) return null;
  
  return {
    routeId: route.id,
    sequence: stop.sequence,
    totalStops: route.totalStops,
    completedStops: route.completedStops,
    remainingStops: route.remainingStops,
    delay: stop.delay,
    eta: stop.eta,
    actualArrival: stop.actualArrival
  };
};

// Check for location issues
export const checkLocationIssues = (delivery) => {
  if (!delivery || typeof delivery !== "object") return [];
  
  const issues = [];
  const customer = delivery.customer || {};
  const coordinates = customer.coordinates || {};
  
  if (!customer.address || customer.address.trim() === "") {
    issues.push(LOCATION_ISSUES.MISSING_ADDRESS);
  }
  
  if (!coordinates.lat || !coordinates.lng) {
    issues.push(LOCATION_ISSUES.MISSING_COORDINATES);
  } else if (!isValidCoordinate(coordinates.lat, coordinates.lng)) {
    issues.push(LOCATION_ISSUES.INVALID_COORDINATES);
  }
  
  return issues;
};

// Check for driver location issues
export const checkDriverLocationIssues = (driver) => {
  if (!driver || typeof driver !== "object") return [];
  
  const issues = [];
  const freshness = getLocationFreshness(driver.lastLocationUpdate);
  
  if (freshness === LOCATION_FRESHNESS.UNAVAILABLE) {
    issues.push(LOCATION_ISSUES.DRIVER_GPS_DISABLED);
  } else if (freshness === LOCATION_FRESHNESS.STALE || freshness === LOCATION_FRESHNESS.OFFLINE) {
    issues.push(LOCATION_ISSUES.DRIVER_LOCATION_STALE);
  }
  
  return issues;
};

// Generate navigation link
export const generateNavigationLink = (lat, lng, address) => {
  if (isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  
  if (address && address.trim() !== "") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  
  return null;
};

// Calculate route distance (sum of straight-line distances between stops)
export const calculateRouteDistance = (route) => {
  if (!route || typeof route !== "object") return null;
  
  const stops = Array.isArray(route.stops) ? route.stops : [];
  if (stops.length === 0) return null;
  
  let totalDistance = 0;
  let prevCoords = route.startLocation?.coordinates;
  
  if (!prevCoords) return null;
  
  for (const stop of stops) {
    const stopCoords = stop.coordinates;
    if (!stopCoords || !isValidCoordinate(stopCoords.lat, stopCoords.lng)) {
      return null; // Cannot calculate if any stop has invalid coordinates
    }
    
    const segmentDistance = calculateDistance(
      prevCoords.lat,
      prevCoords.lng,
      stopCoords.lat,
      stopCoords.lng
    );
    
    if (segmentDistance === null) return null;
    
    totalDistance += segmentDistance;
    prevCoords = stopCoords;
  }
  
  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
};
