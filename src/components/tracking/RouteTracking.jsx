import React from 'react';
import { useState, useMemo, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { C, card, btn, input } from "../../styles/theme";
import { DELIVERY_STATUSES, DRIVER_STATUSES, isValidCoordinate, getLocationFreshness, formatLocationFreshness, generateNavigationLink } from "../../domain/deliveryModel.js";
import { CAFE_LOCATION, INIT_DRIVERS, INIT_DELIVERY_ORDERS, ROUTE_SECTIONS, calculateRouteStats, formatCurrency } from "../../data/deliveryConstants.js";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createDriverIcon = (status) => {
  const colors = { available: "#27ae60", on_delivery: "#3498db", returning: "#f39c12", offline: "#95a5a6" };
  const color = colors[status] || "#95a5a6";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;">🚴</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });
};

const createDeliveryIcon = (status) => {
  const colors = { PACKING: "#f39c12", READY_FOR_PICKUP: "#27ae60", PICKED_UP: "#3498db", OUT_FOR_DELIVERY: "#9b59b6", DELIVERED: "#27ae60" };
  const color = colors[status] || "#95a5a6";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;">📦</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14]
  });
};

const createCafeIcon = () => L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#8b6914;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;">☕</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18]
});

const MapBounds = ({ markers }) => {
  const map = useMap();
  useEffect(() => { if (markers?.length > 0) { map.fitBounds(L.latLngBounds(markers), { padding: [50, 50] }); } }, [markers, map]);
  return null;
};

const safeStr = (v, fb = "") => (v == null ? fb : String(v).trim() || fb);

export default function RouteTracking({ deliveryOrders: externalOrders, setDeliveryOrders: externalSetOrders, drivers: externalDrivers, setDrivers: externalSetDrivers }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [deliveryOrders, setDeliveryOrders] = useState(() => Array.isArray(externalOrders) ? externalOrders : INIT_DELIVERY_ORDERS);
  const [drivers, setDrivers] = useState(() => Array.isArray(externalDrivers) ? externalDrivers : INIT_DRIVERS);
  const [activeSection, setActiveSection] = useState("map");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const stats = useMemo(() => calculateRouteStats(deliveryOrders, drivers, []), [deliveryOrders, drivers]);

  const filteredDeliveries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deliveryOrders.filter(order => {
      if (!order) return false;
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      if (!q) return matchesStatus;
      const cust = order.customer || {};
      const rider = order.rider || {};
      const matchesSearch = safeStr(order.id).toLowerCase().includes(q) || safeStr(cust.name).toLowerCase().includes(q) || safeStr(rider.name).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [deliveryOrders, search, statusFilter]);

  const mapMarkers = useMemo(() => {
    const markers = [{ type: "cafe", lat: CAFE_LOCATION.lat, lng: CAFE_LOCATION.lng }];
    filteredDeliveries.forEach(order => {
      const coords = order.customer?.coordinates;
      if (coords && isValidCoordinate(coords.lat, coords.lng)) {
        markers.push({ type: "delivery", lat: coords.lat, lng: coords.lng, data: order });
      }
    });
    drivers.forEach(driver => {
      const coords = driver.coordinates;
      if (coords && isValidCoordinate(coords.lat, coords.lng)) {
        markers.push({ type: "driver", lat: coords.lat, lng: coords.lng, data: driver });
      }
    });
    return markers;
  }, [filteredDeliveries, drivers]);

  const handleOpenNavigation = useCallback((lat, lng, address) => {
    const link = generateNavigationLink(lat, lng, address);
    if (link) window.open(link, "_blank");
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDelivery(null);
    setShowDetailPanel(false);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", paddingBottom: 40 }}>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: "#3d2c1f", marginBottom: 4 }}>Route & Tracking</div>
        <div style={{ fontSize: 14, color: "#8b7355", marginBottom: 20 }}>Monitor drivers, delivery stops, route progress, and location status</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Active Drivers", count: stats.activeDrivers, color: "#27ae60" },
            { label: "Deliveries Out", count: stats.deliveriesOut, color: "#3498db" },
            { label: "Delayed", count: stats.delayed, color: stats.delayed > 0 ? "#e74c3c" : "#95a5a6" },
            { label: "Completed Today", count: stats.completedToday, color: "#27ae60" }
          ].map(chip => (
            <div key={chip.label} style={{ ...card, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, backgroundColor: "white" }}>
              <span style={{ fontSize: 11, color: "#8b7355", fontWeight: 600 }}>{chip.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: chip.color }}>{chip.count}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <input style={{ ...input, padding: "10px 12px", borderRadius: 6, minWidth: 200, flex: 1 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select style={{ ...input, padding: "10px 12px", borderRadius: 6 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            {Object.entries(DELIVERY_STATUSES).map(([key, status]) => <option key={key} value={key}>{status.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
          {ROUTE_SECTIONS.map(section => (
            <button key={section.id} style={{ ...btn(activeSection === section.id ? "primary" : "ghost"), padding: "8px 16px", fontSize: 13, borderRadius: 20, backgroundColor: activeSection === section.id ? "#8b6914" : "transparent", color: activeSection === section.id ? "white" : "#3d2c1f", border: activeSection === section.id ? "none" : "1px solid #d4c4b0" }} onClick={() => setActiveSection(section.id)}>
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {activeSection === "map" && (
          <div style={{ ...card, backgroundColor: "white", borderRadius: 8, overflow: "hidden", height: 500 }}>
            <MapContainer center={[CAFE_LOCATION.lat, CAFE_LOCATION.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapBounds markers={mapMarkers.map(m => [m.lat, m.lng])} />
              <Marker position={[CAFE_LOCATION.lat, CAFE_LOCATION.lng]} icon={createCafeIcon()}>
                <Popup><div style={{ fontSize: 13, fontWeight: 600 }}>☕ Cafe Location</div></Popup>
              </Marker>
              {mapMarkers.filter(m => m.type === "delivery").map(marker => (
                <Marker key={marker.data.id} position={[marker.lat, marker.lng]} icon={createDeliveryIcon(marker.data.status)} eventHandlers={{ click: () => { setSelectedDelivery(marker.data); setShowDetailPanel(true); } }}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{marker.data.customer?.name}</div>
                      <div style={{ fontSize: 12, color: "#8b7355" }}>{marker.data.customer?.address}</div>
                      <button style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 11, marginTop: 8, width: "100%" }} onClick={() => handleOpenNavigation(marker.lat, marker.lng, marker.data.customer?.address)}>Open Navigation</button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {mapMarkers.filter(m => m.type === "driver").map(marker => (
                <Marker key={marker.data.id} position={[marker.lat, marker.lng]} icon={createDriverIcon(marker.data.status)}>
                  <Popup>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{marker.data.name}</div>
                      <div style={{ fontSize: 12, color: "#8b7355" }}>{marker.data.vehicle} • {formatLocationFreshness(marker.data.lastLocationUpdate)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {activeSection === "drivers" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {drivers.map(driver => {
              const freshness = getLocationFreshness(driver.lastLocationUpdate);
              const activeDeliveries = deliveryOrders.filter(o => o.rider?.id === driver.id && !["DELIVERED", "FAILED", "CANCELLED"].includes(o.status)).length;
              return (
                <div key={driver.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f" }}>{driver.name}</span>
                    <span style={{ fontSize: 11, color: freshness.color }}>{freshness.label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 8 }}>{driver.vehicle} • {driver.phone}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 12, backgroundColor: DRIVER_STATUSES[driver.status]?.color + "20", color: DRIVER_STATUSES[driver.status]?.color }}>{DRIVER_STATUSES[driver.status]?.label}</span>
                    <span style={{ fontSize: 12, color: "#8b7355" }}>{activeDeliveries} active</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSection === "routes" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Route Planning</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Pending Deliveries</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#3498db" }}>{deliveryOrders.filter(o => ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Active Drivers</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{drivers.filter(d => d.status === 'on_delivery').length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Avg Delivery Time</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#8b6914" }}>{stats.avgDeliveryTime || '—'}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Pending Deliveries</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {deliveryOrders.filter(o => ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).map(order => (
                <div key={order.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer" }} onClick={() => { setSelectedDelivery(order); setShowDetailPanel(true); }}>
                  <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{order.id}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{order.customer?.name}</div>
                  <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 4 }}>{order.customer?.address}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 12, backgroundColor: DELIVERY_STATUSES[order.status]?.color + "20", color: DELIVERY_STATUSES[order.status]?.color }}>{DELIVERY_STATUSES[order.status]?.label}</span>
                    {order.rider && <span style={{ fontSize: 11, color: "#8b7355" }}>{order.rider.name}</span>}
                  </div>
                </div>
              ))}
              {deliveryOrders.filter(o => ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No pending deliveries</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "issues" && (
          <div style={{ ...card, backgroundColor: "white", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8b7355" }}>No location issues detected</div>
          </div>
        )}
      </div>

      {showDetailPanel && selectedDelivery && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "100%" : 400, backgroundColor: "white", borderRadius: isMobile ? "20px 20px 0 0" : 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#3d2c1f" }}>{selectedDelivery.customer?.name}</div>
              <button style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }} onClick={handleCloseDetail}>×</button>
            </div>
            <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 8 }}>{selectedDelivery.customer?.address}</div>
            <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 8 }}>{selectedDelivery.customer?.phone}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, padding: "4px 8px", borderRadius: 12, backgroundColor: DELIVERY_STATUSES[selectedDelivery.status]?.color + "20", color: DELIVERY_STATUSES[selectedDelivery.status]?.color }}>{DELIVERY_STATUSES[selectedDelivery.status]?.label}</span>
              <span style={{ fontSize: 13, color: "#3d2c1f", fontWeight: 600 }}>{formatCurrency(selectedDelivery.total)}</span>
            </div>
            <button style={{ ...btn("primary"), width: "100%", padding: "12px" }} onClick={() => handleOpenNavigation(selectedDelivery.customer?.coordinates?.lat, selectedDelivery.customer?.coordinates?.lng, selectedDelivery.customer?.address)}>Open Navigation</button>
          </div>
        </div>
      )}
    </div>
  );
}
