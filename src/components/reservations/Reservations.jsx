import React from 'react';
import { useState, useCallback, useMemo, useEffect } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import ConfirmDialog from "../common/ConfirmDialog";
import DestructiveDialog from "../common/DestructiveDialog";
import WarningDialog from "../common/WarningDialog";
import PromptDialog from "../common/PromptDialog";
import SelectionDialog from "../common/SelectionDialog";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";

// ── Initial Data ─────────────────────────────────────────────────────────────
const INIT_RESERVATIONS = [
  {
    id: "res-1",
    guestName: "Priya Sharma",
    phone: "+91 98765 43210",
    email: "priya.sharma@email.com",
    date: new Date().toISOString().slice(0, 10),
    time: "19:00",
    partySize: 4,
    tableId: null,
    tableNumber: null,
    status: "upcoming",
    source: "phone",
    occasion: "birthday",
    dietaryNotes: "Vegetarian, no nuts",
    allergies: "Peanuts",
    accessibility: null,
    specialRequests: "Corner table preferred",
    depositAmount: 500,
    depositStatus: "paid",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    confirmedAt: new Date(Date.now() - 86400000).toISOString(),
    checkedInAt: null,
    seatedAt: null,
    completedAt: null,
    cancelledAt: null,
    noShowAt: null,
    lateMinutes: 0,
    notes: "VIP guest - ensure excellent service"
  },
  {
    id: "res-2",
    guestName: "Rahul Mehta",
    phone: "+91 87654 32109",
    email: null,
    date: new Date().toISOString().slice(0, 10),
    time: "19:30",
    partySize: 2,
    tableId: null,
    tableNumber: null,
    status: "upcoming",
    source: "walk-in",
    occasion: null,
    dietaryNotes: null,
    allergies: null,
    accessibility: null,
    specialRequests: null,
    depositAmount: 0,
    depositStatus: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    confirmedAt: new Date(Date.now() - 7200000).toISOString(),
    checkedInAt: null,
    seatedAt: null,
    completedAt: null,
    cancelledAt: null,
    noShowAt: null,
    lateMinutes: 0,
    notes: null
  },
  {
    id: "res-3",
    guestName: "Ananya Patel",
    phone: "+91 76543 21098",
    email: "ananya.p@email.com",
    date: new Date().toISOString().slice(0, 10),
    time: "20:00",
    partySize: 6,
    tableId: "t-5",
    tableNumber: "5",
    status: "checked_in",
    source: "online",
    occasion: "anniversary",
    dietaryNotes: "Gluten-free options needed",
    allergies: "Gluten",
    accessibility: "Wheelchair access needed",
    specialRequests: "Quiet area",
    depositAmount: 1000,
    depositStatus: "paid",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    confirmedAt: new Date(Date.now() - 172800000).toISOString(),
    checkedInAt: new Date(Date.now() - 600000).toISOString(),
    seatedAt: null,
    completedAt: null,
    cancelledAt: null,
    noShowAt: null,
    lateMinutes: 0,
    notes: "Regular customer"
  }
];

const INIT_WAITLIST = [
  {
    id: "wl-1",
    guestName: "Vikram Singh",
    phone: "+91 65432 10987",
    partySize: 4,
    tablePreference: "booth",
    notes: "Celebrating promotion",
    status: "waiting",
    estimatedWait: 15,
    priority: "normal",
    createdAt: new Date(Date.now() - 900000).toISOString(),
    contactedAt: null,
    readyAt: null,
    seatedAt: null
  },
  {
    id: "wl-2",
    guestName: "Meera Joshi",
    phone: "+91 54321 09876",
    partySize: 2,
    tablePreference: null,
    notes: null,
    status: "nearly_ready",
    estimatedWait: 5,
    priority: "high",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    contactedAt: new Date(Date.now() - 600000).toISOString(),
    readyAt: null,
    seatedAt: null
  }
];

// ── Safe helpers ─────────────────────────────────────────────────────────────
const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const safeText = (v, fallback = "") => {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s === "undefined" || s === "null" ? fallback : s;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "—";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const formatPhone = (phone) => {
  if (!phone) return "—";
  return phone;
};

const getArrivalState = (reservation) => {
  if (!reservation.date || !reservation.time) return { state: "Unknown", color: "var(--cafe-text-tertiary)" };
  
  const now = new Date();
  const resDate = new Date(`${reservation.date}T${reservation.time}`);
  if (isNaN(resDate.getTime())) return { state: "Invalid", color: "var(--cafe-danger)" };
  
  const diffMs = resDate - now;
  const diffMins = Math.round(diffMs / 60000);
  
  if (reservation.status === "checked_in") {
    return { state: "Checked In", color: "var(--cafe-success)" };
  }
  if (reservation.status === "seated") {
    return { state: "Seated", color: "var(--cafe-success)" };
  }
  if (reservation.status === "late") {
    return { state: `${Math.abs(diffMins)} min Late`, color: "var(--cafe-danger)" };
  }
  if (reservation.status === "no_show") {
    return { state: "No Show", color: "var(--cafe-danger)" };
  }
  if (reservation.status === "cancelled") {
    return { state: "Cancelled", color: "var(--cafe-text-tertiary)" };
  }
  if (reservation.status === "completed") {
    return { state: "Completed", color: "var(--cafe-success)" };
  }
  
  if (diffMins <= 0) {
    return { state: "Due Now", color: "var(--cafe-warning)" };
  }
  if (diffMins <= 15) {
    return { state: `Arriving in ${diffMins} min`, color: "var(--cafe-accent)" };
  }
  if (diffMins <= 60) {
    return { state: `Arrives in ${diffMins} min`, color: "var(--cafe-info)" };
  }
  
  return { state: formatTime(reservation.time), color: "var(--cafe-text-secondary)" };
};

const getWaitState = (waitlistEntry) => {
  if (!waitlistEntry.createdAt) return { state: "Unknown", elapsed: 0, color: "var(--cafe-text-tertiary)" };
  
  const now = new Date();
  const created = new Date(waitlistEntry.createdAt);
  const elapsedMins = Math.round((now - created) / 60000);
  
  if (waitlistEntry.status === "seated") {
    return { state: "Seated", elapsed: elapsedMins, color: "var(--cafe-success)" };
  }
  if (waitlistEntry.status === "cancelled" || waitlistEntry.status === "removed") {
    return { state: "Removed", elapsed: elapsedMins, color: "var(--cafe-text-tertiary)" };
  }
  if (waitlistEntry.status === "left") {
    return { state: "Left", elapsed: elapsedMins, color: "var(--cafe-text-tertiary)" };
  }
  if (waitlistEntry.status === "ready") {
    return { state: "Ready to Seat", elapsed: elapsedMins, color: "var(--cafe-success)" };
  }
  if (waitlistEntry.status === "contacted") {
    return { state: "Contacted", elapsed: elapsedMins, color: "var(--cafe-accent)" };
  }
  if (waitlistEntry.status === "nearly_ready") {
    return { state: "Nearly Ready", elapsed: elapsedMins, color: "var(--cafe-info)" };
  }
  
  const estimated = waitlistEntry.estimatedWait || 15;
  if (elapsedMins > estimated) {
    return { state: `Waiting ${elapsedMins - estimated} min past estimate`, elapsed: elapsedMins, color: "var(--cafe-danger)" };
  }
  
  return { state: `Waiting ${elapsedMins} min`, elapsed: elapsedMins, color: "var(--cafe-warning)" };
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reservations({ tables: externalTables, setTables: externalSetTables }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [reservations, setReservations] = useState(INIT_RESERVATIONS);
  const [waitlist, setWaitlist] = useState(INIT_WAITLIST);
  const [tables, setTables] = useState(externalTables || []);
  
  useEffect(() => {
    if (externalTables) setTables(externalTables);
  }, [externalTables]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [partySizeFilter, setPartySizeFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("arrival_time");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);

  // ── Form State ─────────────────────────────────────────────────────────────
  const [reservationForm, setReservationForm] = useState({
    guestName: "",
    phone: "",
    email: "",
    date: new Date().toISOString().slice(0, 10),
    time: "",
    partySize: "",
    tableId: "",
    tablePreference: "",
    source: "phone",
    occasion: "",
    dietaryNotes: "",
    allergies: "",
    accessibility: "",
    specialRequests: "",
    depositAmount: "",
    notes: ""
  });
  const [reservationErrors, setReservationErrors] = useState({});

  const [walkInForm, setWalkInForm] = useState({
    guestName: "",
    phone: "",
    partySize: "",
    tablePreference: "",
    dietaryNotes: "",
    accessibility: "",
    notes: "",
    estimatedWait: ""
  });
  const [walkInErrors, setWalkInErrors] = useState({});

  const [waitlistForm, setWaitlistForm] = useState({
    guestName: "",
    phone: "",
    partySize: "",
    tablePreference: "",
    notes: "",
    estimatedWait: "",
    priority: "normal"
  });
  const [waitlistFormErrors, setWaitlistFormErrors] = useState({});

  // ── Dialog State ───────────────────────────────────────────────────────────
  const [cancelReservationDialog, setCancelReservationDialog] = useState({ open: false, reservation: null, onConfirm: null });
  const [markLateDialog, setMarkLateDialog] = useState({ open: false, reservation: null, onConfirm: null });
  const [markNoShowDialog, setMarkNoShowDialog] = useState({ open: false, reservation: null, onConfirm: null });
  const [checkInDialog, setCheckInDialog] = useState({ open: false, reservation: null, onConfirm: null });
  const [seatGuestDialog, setSeatGuestDialog] = useState({ open: false, reservation: null, table: null, onConfirm: null });
  const [tableConflictDialog, setTableConflictDialog] = useState({ open: false, reservation: null, conflictingRes: null, onConfirm: null });
  const [rescheduleDialog, setRescheduleDialog] = useState({ open: false, reservation: null, newDate: "", newTime: "", onConfirm: null });
  const [contactDialog, setContactDialog] = useState({ open: false, reservation: null, method: null, onConfirm: null });
  const [waitlistSeatDialog, setWaitlistSeatDialog] = useState({ open: false, entry: null, table: null, onConfirm: null });
  const [waitlistCancelDialog, setWaitlistCancelDialog] = useState({ open: false, entry: null, onConfirm: null });
  const [waitlistContactDialog, setWaitlistContactDialog] = useState({ open: false, entry: null, onConfirm: null });
  const [noTablesDialog, setNoTablesDialog] = useState({ open: false, onConfirm: null });
  const [tableSelectionDialog, setTableSelectionDialog] = useState({ open: false, reservation: null, entry: null, onConfirm: null });

  // ── Computed Data ───────────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const today = selectedDate;
    const todayReservations = reservations.filter(r => r.date === today);
    
    const now = new Date();
    const arrivingSoon = todayReservations.filter(r => {
      if (r.status !== "upcoming") return false;
      const resTime = new Date(`${r.date}T${r.time}`);
      const diffMins = (resTime - now) / 60000;
      return diffMins >= 0 && diffMins <= 30;
    }).length;
    
    const checkedIn = todayReservations.filter(r => r.status === "checked_in").length;
    const waiting = todayReservations.filter(r => r.status === "checked_in" && !r.seatedAt).length;
    const seated = todayReservations.filter(r => r.status === "seated").length;
    const late = todayReservations.filter(r => r.status === "late").length;
    const noShow = todayReservations.filter(r => r.status === "no_show").length;
    const unassigned = todayReservations.filter(r => !r.tableId && r.status !== "cancelled" && r.status !== "no_show" && r.status !== "completed").length;
    const waitingList = waitlist.filter(w => w.status === "waiting").length;
    
    return {
      total: todayReservations.length,
      arrivingSoon,
      checkedIn,
      waiting,
      seated,
      late,
      noShow,
      unassigned,
      waitingList
    };
  }, [reservations, selectedDate, waitlist]);

  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter(r => r.date === selectedDate);
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (partySizeFilter !== "all") {
      const size = parseInt(partySizeFilter);
      if (!isNaN(size)) {
        filtered = filtered.filter(r => r.partySize >= size);
      }
    }
    
    if (tableFilter !== "all") {
      filtered = filtered.filter(r => r.tableId === tableFilter);
    }
    
    if (sourceFilter !== "all") {
      filtered = filtered.filter(r => r.source === sourceFilter);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(r => 
        safeText(r.guestName).toLowerCase().includes(q) ||
        safeText(r.phone).toLowerCase().includes(q) ||
        safeText(r.notes).toLowerCase().includes(q) ||
        safeText(r.occasion).toLowerCase().includes(q) ||
        (r.tableNumber && safeText(r.tableNumber).toLowerCase().includes(q))
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "arrival_time") {
        return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
      }
      if (sortBy === "party_size") {
        return b.partySize - a.partySize;
      }
      if (sortBy === "recently_added") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "table_assignment") {
        if (!a.tableId && !b.tableId) return 0;
        if (!a.tableId) return -1;
        if (!b.tableId) return 1;
        return a.tableNumber.localeCompare(b.tableNumber);
      }
      return 0;
    });
    
    return filtered;
  }, [reservations, selectedDate, statusFilter, partySizeFilter, tableFilter, sourceFilter, searchQuery, sortBy]);

  const serviceTimeline = useMemo(() => {
    const todayReservations = reservations.filter(r => r.date === selectedDate);
    const segments = [
      { key: "morning", label: "Morning", start: 6, end: 11, count: 0, guests: 0 },
      { key: "lunch", label: "Lunch", start: 11, end: 15, count: 0, guests: 0 },
      { key: "afternoon", label: "Afternoon", start: 15, end: 18, count: 0, guests: 0 },
      { key: "evening", label: "Evening", start: 18, end: 24, count: 0, guests: 0 }
    ];
    
    todayReservations.forEach(r => {
      const hour = parseInt(r.time.split(":")[0]);
      const segment = segments.find(s => hour >= s.start && hour < s.end);
      if (segment) {
        segment.count++;
        segment.guests += r.partySize;
      }
    });
    
    return segments;
  }, [reservations, selectedDate]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleAddReservation = useCallback(() => {
    const errors = {};
    
    if (!reservationForm.guestName.trim()) errors.guestName = "Required";
    if (!reservationForm.phone.trim()) errors.phone = "Required";
    else if (!/^[0-9+\-\s()]{6,20}$/.test(reservationForm.phone)) errors.phone = "Invalid phone";
    
    const partySize = parseInt(reservationForm.partySize);
    if (!partySize || partySize < 1) errors.partySize = "Required";
    
    if (!reservationForm.time) errors.time = "Required";
    
    if (Object.keys(errors).length > 0) {
      setReservationErrors(errors);
      return;
    }
    
    const newReservation = {
      id: "res-" + Date.now(),
      guestName: reservationForm.guestName.trim(),
      phone: reservationForm.phone.trim(),
      email: reservationForm.email.trim() || null,
      date: reservationForm.date,
      time: reservationForm.time,
      partySize,
      tableId: reservationForm.tableId || null,
      tableNumber: reservationForm.tableId ? tables.find(t => t.id === reservationForm.tableId)?.number : null,
      status: "upcoming",
      source: reservationForm.source,
      occasion: reservationForm.occasion || null,
      dietaryNotes: reservationForm.dietaryNotes || null,
      allergies: reservationForm.allergies || null,
      accessibility: reservationForm.accessibility || null,
      specialRequests: reservationForm.specialRequests || null,
      depositAmount: reservationForm.depositAmount ? parseFloat(reservationForm.depositAmount) : 0,
      depositStatus: reservationForm.depositAmount ? "pending" : null,
      notes: reservationForm.notes || null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      checkedInAt: null,
      seatedAt: null,
      completedAt: null,
      cancelledAt: null,
      noShowAt: null,
      lateMinutes: 0
    };
    
    setReservations(prev => [...prev, newReservation]);
    setReservationForm({
      guestName: "",
      phone: "",
      email: "",
      date: new Date().toISOString().slice(0, 10),
      time: "",
      partySize: "",
      tableId: "",
      tablePreference: "",
      source: "phone",
      occasion: "",
      dietaryNotes: "",
      allergies: "",
      accessibility: "",
      specialRequests: "",
      depositAmount: "",
      notes: ""
    });
    setReservationErrors({});
    setShowAddModal(false);
  }, [reservationForm, tables]);

  const handleAddWalkIn = useCallback(() => {
    const errors = {};
    
    const partySize = parseInt(walkInForm.partySize);
    if (!partySize || partySize < 1) errors.partySize = "Required";
    
    if (Object.keys(errors).length > 0) {
      setWalkInErrors(errors);
      return;
    }
    
    // Convert to reservation with current time
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newReservation = {
      id: "res-" + Date.now(),
      guestName: walkInForm.guestName.trim() || "Walk-in Guest",
      phone: walkInForm.phone.trim() || null,
      email: null,
      date: selectedDate,
      time: timeStr,
      partySize,
      tableId: null,
      tableNumber: null,
      status: "checked_in",
      source: "walk-in",
      occasion: null,
      dietaryNotes: walkInForm.dietaryNotes || null,
      allergies: null,
      accessibility: walkInForm.accessibility || null,
      specialRequests: null,
      depositAmount: 0,
      depositStatus: null,
      notes: walkInForm.notes || null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      checkedInAt: new Date().toISOString(),
      seatedAt: null,
      completedAt: null,
      cancelledAt: null,
      noShowAt: null,
      lateMinutes: 0
    };
    
    setReservations(prev => [...prev, newReservation]);
    setWalkInForm({
      guestName: "",
      phone: "",
      partySize: "",
      tablePreference: "",
      dietaryNotes: "",
      accessibility: "",
      notes: "",
      estimatedWait: ""
    });
    setWalkInErrors({});
    setShowWalkInModal(false);
  }, [walkInForm, selectedDate]);

  const handleAddWaitlist = useCallback(() => {
    const errors = {};
    
    if (!waitlistForm.guestName.trim()) errors.guestName = "Required";
    
    const partySize = parseInt(waitlistForm.partySize);
    if (!partySize || partySize < 1) errors.partySize = "Required";
    
    if (Object.keys(errors).length > 0) {
      setWaitlistFormErrors(errors);
      return;
    }
    
    const newEntry = {
      id: "wl-" + Date.now(),
      guestName: waitlistForm.guestName.trim(),
      phone: waitlistForm.phone.trim() || null,
      partySize,
      tablePreference: waitlistForm.tablePreference || null,
      notes: waitlistForm.notes || null,
      status: "waiting",
      estimatedWait: parseInt(waitlistForm.estimatedWait) || 15,
      priority: waitlistForm.priority || "normal",
      createdAt: new Date().toISOString(),
      contactedAt: null,
      readyAt: null,
      seatedAt: null
    };
    
    setWaitlist(prev => [...prev, newEntry]);
    setWaitlistForm({
      guestName: "",
      phone: "",
      partySize: "",
      tablePreference: "",
      notes: "",
      estimatedWait: "",
      priority: "normal"
    });
    setWaitlistFormErrors({});
    setShowWaitlistModal(false);
  }, [waitlistForm]);

  const handleCheckIn = useCallback((reservation) => {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, status: "checked_in", checkedInAt: new Date().toISOString() }
        : r
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishReservationEvent('reservation.checked_in', {
      reservationId: reservation.id,
      guestName: reservation.guestName,
      partySize: reservation.partySize,
      tableId: reservation.tableId
    });

    setShowDetailPanel(false);
  }, []);

  const handleSeatGuest = useCallback((reservation, table) => {
    // Check for conflicts
    const conflictingReservation = reservations.find(r => 
      r.id !== reservation.id &&
      r.tableId === table.id &&
      r.date === reservation.date &&
      r.status !== "cancelled" &&
      r.status !== "no_show" &&
      r.status !== "completed"
    );
    
    if (conflictingReservation) {
      setTableConflictDialog({
        open: true,
        reservation,
        conflictingRes: conflictingReservation,
        onConfirm: () => {
          setTableConflictDialog({ open: false, reservation: null, conflictingRes: null, onConfirm: null });
          proceedWithSeating(reservation, table);
        }
      });
      return;
    }
    
    proceedWithSeating(reservation, table);
  }, [reservations]);

  const proceedWithSeating = useCallback((reservation, table) => {
    const now = new Date().toISOString();
    
    // Update reservation
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, status: "seated", seatedAt: now, tableId: table.id, tableNumber: table.number }
        : r
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishReservationEvent('reservation.seated', {
      reservationId: reservation.id,
      guestName: reservation.guestName,
      partySize: reservation.partySize,
      tableId: table.id,
      tableNumber: table.number
    });

    // Update table
    if (externalSetTables) {
      externalSetTables(prev => prev.map(t => 
        t.id === table.id 
          ? { ...t, status: "occupied", currentOrder: `RES-${reservation.id}`, occupiedAt: now, occupiedSince: now, reservedFor: reservation.guestName, reservedPartySize: reservation.partySize }
          : t
      ));
    }
    
    setShowDetailPanel(false);
  }, [externalSetTables]);

  const handleMarkLate = useCallback((reservation, minutes) => {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, status: "late", lateMinutes: minutes || 15 }
        : r
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishReservationEvent('reservation.late', {
      reservationId: reservation.id,
      guestName: reservation.guestName,
      lateMinutes: minutes || 15
    });

    setShowDetailPanel(false);
  }, []);

  const handleMarkNoShow = useCallback((reservation) => {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, status: "no_show", noShowAt: new Date().toISOString() }
        : r
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishReservationEvent('reservation.no_show', {
      reservationId: reservation.id,
      guestName: reservation.guestName,
      partySize: reservation.partySize
    });

    setShowDetailPanel(false);
  }, []);

  const handleCancelReservation = useCallback((reservation) => {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, status: "cancelled", cancelledAt: new Date().toISOString() }
        : r
    ));

    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishReservationEvent('reservation.cancelled', {
      reservationId: reservation.id,
      guestName: reservation.guestName,
      partySize: reservation.partySize
    });

    setShowDetailPanel(false);
  }, []);

  const handleContactGuest = useCallback((reservation, method) => {
    // In a real app, this would integrate with phone/WhatsApp/email
    console.log(`Contacting ${reservation.guestName} via ${method}: ${reservation.phone}`);
    setShowDetailPanel(false);
  }, []);

  const handleReschedule = useCallback((reservation, newDate, newTime) => {
    // Check for conflicts at new time
    const conflictingReservation = reservations.find(r => 
      r.id !== reservation.id &&
      r.date === newDate &&
      r.time === newTime &&
      r.tableId === reservation.tableId &&
      r.status !== "cancelled" &&
      r.status !== "no_show" &&
      r.status !== "completed"
    );
    
    if (conflictingReservation) {
      setTableConflictDialog({
        open: true,
        reservation: { ...reservation, date: newDate, time: newTime },
        conflictingRes: conflictingReservation,
        onConfirm: () => {
          setTableConflictDialog({ open: false, reservation: null, conflictingRes: null, onConfirm: null });
          proceedWithReschedule(reservation, newDate, newTime);
        }
      });
      return;
    }
    
    proceedWithReschedule(reservation, newDate, newTime);
  }, [reservations]);

  const proceedWithReschedule = useCallback((reservation, newDate, newTime) => {
    setReservations(prev => prev.map(r => 
      r.id === reservation.id 
        ? { ...r, date: newDate, time: newTime, status: "upcoming", checkedInAt: null, seatedAt: null, lateMinutes: 0 }
        : r
    ));
    setShowDetailPanel(false);
  }, []);

  const handleWaitlistSeat = useCallback((entry, table) => {
    const now = new Date().toISOString();
    
    setWaitlist(prev => prev.map(w => 
      w.id === entry.id 
        ? { ...w, status: "seated", seatedAt: now }
        : w
    ));
    
    if (externalSetTables) {
      externalSetTables(prev => prev.map(t => 
        t.id === table.id 
          ? { ...t, status: "occupied", occupiedAt: now, occupiedSince: now }
          : t
      ));
    }
  }, [externalSetTables]);

  const handleWaitlistCancel = useCallback((entry) => {
    setWaitlist(prev => prev.map(w => 
      w.id === entry.id 
        ? { ...w, status: "cancelled" }
        : w
    ));
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? 16 : 24 }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Reservations & Waitlist
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>
          Manage arrivals, table assignments, and walk-in seating
        </div>

        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexWrap: "wrap" }}>
          {[
            { label: "Reservations Today", count: analytics.total, color: "var(--cafe-text-secondary)" },
            { label: "Arriving Soon", count: analytics.arrivingSoon, color: analytics.arrivingSoon > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)" },
            { label: "Checked In", count: analytics.checkedIn, color: analytics.checkedIn > 0 ? "var(--cafe-success)" : "var(--cafe-text-tertiary)" },
            { label: "Waiting", count: analytics.waiting, color: analytics.waiting > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
            { label: "Seated", count: analytics.seated, color: analytics.seated > 0 ? "var(--cafe-success)" : "var(--cafe-text-tertiary)" },
            { label: "Late", count: analytics.late, color: analytics.late > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" },
            { label: "Unassigned", count: analytics.unassigned, color: analytics.unassigned > 0 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" },
            { label: "No Show", count: analytics.noShow, color: analytics.noShow > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" },
            { label: "Waitlist", count: analytics.waitingList, color: analytics.waitingList > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)" },
          ].map(chip => (
            <div key={chip.label} style={{
              background: "var(--cafe-bg-surface)",
              border: `1px solid var(--cafe-border-light)`,
              borderRadius: "var(--cafe-radius-md)",
              padding: isMobile ? "6px 10px" : "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 6 : 8,
            }}>
              <span style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 700, color: chip.color, fontFamily: "monospace" }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Service Timeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: isMobile ? 4 : 6, overflowX: "auto", paddingBottom: 4 }}>
          {serviceTimeline.map(segment => (
            <button
              key={segment.key}
              onClick={() => {}}
              style={{
                padding: isMobile ? "8px 12px" : "10px 16px",
                borderRadius: "var(--cafe-radius-md)",
                border: "1px solid var(--cafe-border-light)",
                background: segment.count > 0 ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                color: segment.count > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)",
                cursor: "pointer",
                fontWeight: segment.count > 0 ? 600 : 500,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <span>{segment.label}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{segment.count}</span>
              <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                ({segment.guests} guests)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reservation Pipeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: isMobile ? 4 : 6, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { key: "all", label: "All", count: analytics.total, color: "var(--cafe-text-secondary)" },
            { key: "upcoming", label: "Upcoming", count: reservations.filter(r => r.status === "upcoming" && r.date === selectedDate).length, color: "var(--cafe-info)" },
            { key: "checked_in", label: "Checked In", count: reservations.filter(r => r.status === "checked_in" && r.date === selectedDate).length, color: "var(--cafe-success)" },
            { key: "seated", label: "Seated", count: reservations.filter(r => r.status === "seated" && r.date === selectedDate).length, color: "var(--cafe-success)" },
            { key: "late", label: "Late", count: reservations.filter(r => r.status === "late" && r.date === selectedDate).length, color: "var(--cafe-danger)" },
            { key: "no_show", label: "No Show", count: reservations.filter(r => r.status === "no_show" && r.date === selectedDate).length, color: "var(--cafe-danger)" },
            { key: "cancelled", label: "Cancelled", count: reservations.filter(r => r.status === "cancelled" && r.date === selectedDate).length, color: "var(--cafe-text-tertiary)" },
          ].map(stage => {
            const isSelected = statusFilter === stage.key;
            return (
              <button
                key={stage.key}
                onClick={() => setStatusFilter(stage.key)}
                style={{
                  padding: isMobile ? "6px 12px" : "8px 16px",
                  borderRadius: "var(--cafe-radius-md)",
                  border: `1px solid ${isSelected ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                  background: isSelected ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  color: isSelected ? "var(--cafe-accent)" : stage.color,
                  fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 500,
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                }}
              >
                <span>{stage.label}</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{stage.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: isMobile ? 8 : 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          {/* Date Selector */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }}
          />
          
          {/* Search */}
          <div style={{ position: "relative", flex: isMobile ? 1 : "auto" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input
              style={{ ...input, paddingLeft: 32, width: isMobile ? "100%" : 200, fontSize: "var(--cafe-font-sm)" }}
              placeholder="Guest, phone, table, note…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="checked_in">Checked In</option>
            <option value="seated">Seated</option>
            <option value="late">Late</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="all">All Sources</option>
            <option value="phone">Phone</option>
            <option value="online">Online</option>
            <option value="walk-in">Walk-in</option>
            <option value="in-person">In-person</option>
          </select>
          
          <select style={{ ...input, fontSize: "var(--cafe-font-sm)", padding: "8px 12px" }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="arrival_time">Arrival Time</option>
            <option value="party_size">Party Size</option>
            <option value="recently_added">Recently Added</option>
            <option value="table_assignment">Table Assignment</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowAddModal(true)} style={{ ...btn("primary"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}>
            + Reservation
          </button>
          <button onClick={() => setShowWalkInModal(true)} style={{ ...btn("ghost"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}>
            Walk-In
          </button>
          <button onClick={() => setShowWaitlistModal(true)} style={{ ...btn("ghost"), fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-sm)" }}>
            Waitlist
          </button>
        </div>
      </div>

      {/* Reservations Grid */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 32 }}>
        {filteredReservations.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: "var(--cafe-text-tertiary)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, marginBottom: 8 }}>No reservations for this service</div>
            <div style={{ fontSize: "var(--cafe-font-sm)" }}>Try adjusting your filters or add a new reservation</div>
          </div>
        ) : (
          filteredReservations.map(reservation => {
            const arrivalState = getArrivalState(reservation);
            const isLate = reservation.status === "late";
            const isNoShow = reservation.status === "no_show";
            const isCancelled = reservation.status === "cancelled";
            
            return (
              <div
                key={reservation.id}
                onClick={() => { setSelectedReservation(reservation); setShowDetailPanel(true); }}
                style={{
                  ...card(),
                  padding: isMobile ? 12 : 16,
                  border: `1px solid ${isLate || isNoShow ? "var(--cafe-danger-border)" : isCancelled ? "var(--cafe-border-light)" : "var(--cafe-border-light)"}`,
                  background: isCancelled ? "var(--cafe-bg-surface)" : "var(--cafe-bg-card)",
                  borderRadius: "var(--cafe-radius-md)",
                  cursor: "pointer",
                  opacity: isCancelled ? 0.6 : 1,
                  borderLeft: `3px solid ${arrivalState.color}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--cafe-shadow-md)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 8 : 12 }}>
                  <div>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-lg)" : "var(--cafe-font-xl)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                      {formatTime(reservation.time)}
                    </div>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 2 }}>
                      {reservation.guestName}
                    </div>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>
                      Party of {reservation.partySize}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: arrivalState.color, fontWeight: 600, marginBottom: 4 }}>
                      {arrivalState.state}
                    </div>
                    {reservation.tableNumber && (
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", fontWeight: 500 }}>
                        Table {reservation.tableNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: isMobile ? 8 : 12 }}>
                  {reservation.occasion && (
                    <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                      {reservation.occasion}
                    </span>
                  )}
                  {reservation.allergies && (
                    <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                      Allergy: {reservation.allergies}
                    </span>
                  )}
                  {!reservation.tableId && reservation.status !== "cancelled" && reservation.status !== "no_show" && reservation.status !== "completed" && (
                    <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-warning-bg)", color: "var(--cafe-warning)", padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                      Unassigned
                    </span>
                  )}
                  {reservation.source === "walk-in" && (
                    <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-info-bg)", color: "var(--cafe-info)", padding: "2px 8px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                      Walk-in
                    </span>
                  )}
                </div>

                {/* Contact */}
                {reservation.phone && (
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>
                    {formatPhone(reservation.phone)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Waitlist Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Current Waitlist
          </div>
          <button onClick={() => setShowWaitlistModal(true)} style={{ ...btn("ghost"), fontSize: "var(--cafe-font-xs)" }}>
            + Add to Waitlist
          </button>
        </div>

        {waitlist.filter(w => w.status === "waiting" || w.status === "nearly_ready" || w.status === "contacted" || w.status === "ready").length === 0 ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-md)", border: "1px solid var(--cafe-border-light)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600 }}>The waitlist is clear</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {waitlist
              .filter(w => w.status === "waiting" || w.status === "nearly_ready" || w.status === "contacted" || w.status === "ready")
              .map((entry, index) => {
                const waitState = getWaitState(entry);
                const position = index + 1;
                
                return (
                  <div
                    key={entry.id}
                    style={{
                      ...card(),
                      padding: isMobile ? 12 : 16,
                      border: "1px solid var(--cafe-border-light)",
                      background: "var(--cafe-bg-card)",
                      borderRadius: "var(--cafe-radius-md)",
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 12 : 16,
                    }}
                  >
                    {/* Position */}
                    <div style={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: "50%", 
                      background: "var(--cafe-accent-bg)", 
                      color: "var(--cafe-accent)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", 
                      fontWeight: 700,
                      flexShrink: 0 
                    }}>
                      {position}
                    </div>

                    {/* Guest Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-sm)" : "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 2 }}>
                        {entry.guestName}
                      </div>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: 4 }}>
                        Party of {entry.partySize}
                        {entry.tablePreference && ` · Prefers ${entry.tablePreference}`}
                      </div>
                      <div style={{ fontSize: isMobile ? "var(--cafe-font-xs)" : "var(--cafe-font-xs)", color: waitState.color, fontWeight: 500 }}>
                        {waitState.state}
                        {entry.estimatedWait && ` · Est. ${entry.estimatedWait} min`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setWaitlistContactDialog({ open: true, entry, onConfirm: () => { setWaitlistContactDialog({ open: false, entry: null, onConfirm: null }); } })}
                        style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer" }}
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => {
                          const availableTables = tables.filter(t => t.status === "available");
                          if (availableTables.length === 0) {
                            setNoTablesDialog({ open: true, onConfirm: () => setNoTablesDialog({ open: false, onConfirm: null }) });
                            return;
                          }
                          setTableSelectionDialog({ 
                            open: true, 
                            entry, 
                            reservation: null,
                            onConfirm: (table) => { 
                              setTableSelectionDialog({ open: false, entry: null, reservation: null, onConfirm: null }); 
                              handleWaitlistSeat(entry, table); 
                            }
                          });
                        }}
                        style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "none", background: "var(--cafe-success)", color: "white", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600 }}
                      >
                        Seat
                      </button>
                      <button
                        onClick={() => setWaitlistCancelDialog({ open: true, entry, onConfirm: () => { setWaitlistCancelDialog({ open: false, entry: null, onConfirm: null }); handleWaitlistCancel(entry); } })}
                        style={{ padding: "6px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-danger-border)", background: "transparent", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowAddModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(500px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>New Reservation</div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Add a new booking to the system</div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Guest Info */}
              <div>
                <label style={{ ...label, marginBottom: 6 }}>Guest Name *</label>
                <input
                  style={{ ...input }}
                  value={reservationForm.guestName}
                  onChange={e => setReservationForm({ ...reservationForm, guestName: e.target.value })}
                  placeholder="Enter guest name"
                />
                {reservationErrors.guestName && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{reservationErrors.guestName}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Phone *</label>
                  <input
                    style={{ ...input }}
                    value={reservationForm.phone}
                    onChange={e => setReservationForm({ ...reservationForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                  {reservationErrors.phone && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{reservationErrors.phone}</div>}
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Email</label>
                  <input
                    style={{ ...input }}
                    value={reservationForm.email}
                    onChange={e => setReservationForm({ ...reservationForm, email: e.target.value })}
                    placeholder="guest@email.com"
                  />
                </div>
              </div>

              {/* Booking Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Date *</label>
                  <input
                    type="date"
                    style={{ ...input }}
                    value={reservationForm.date}
                    onChange={e => setReservationForm({ ...reservationForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Time *</label>
                  <input
                    type="time"
                    style={{ ...input }}
                    value={reservationForm.time}
                    onChange={e => setReservationForm({ ...reservationForm, time: e.target.value })}
                  />
                  {reservationErrors.time && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{reservationErrors.time}</div>}
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Party Size *</label>
                  <input
                    type="number"
                    min="1"
                    style={{ ...input }}
                    value={reservationForm.partySize}
                    onChange={e => setReservationForm({ ...reservationForm, partySize: e.target.value })}
                    placeholder="2"
                  />
                  {reservationErrors.partySize && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{reservationErrors.partySize}</div>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Source</label>
                  <select style={{ ...input }} value={reservationForm.source} onChange={e => setReservationForm({ ...reservationForm, source: e.target.value })}>
                    <option value="phone">Phone</option>
                    <option value="online">Online</option>
                    <option value="in-person">In-person</option>
                    <option value="walk-in">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Occasion</label>
                  <input
                    style={{ ...input }}
                    value={reservationForm.occasion}
                    onChange={e => setReservationForm({ ...reservationForm, occasion: e.target.value })}
                    placeholder="Birthday, anniversary, etc."
                  />
                </div>
              </div>

              {/* Guest Needs */}
              <div>
                <label style={{ ...label, marginBottom: 6 }}>Dietary Notes</label>
                <input
                  style={{ ...input }}
                  value={reservationForm.dietaryNotes}
                  onChange={e => setReservationForm({ ...reservationForm, dietaryNotes: e.target.value })}
                  placeholder="Vegetarian, vegan, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Allergies</label>
                <input
                  style={{ ...input }}
                  value={reservationForm.allergies}
                  onChange={e => setReservationForm({ ...reservationForm, allergies: e.target.value })}
                  placeholder="Nuts, gluten, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Accessibility Notes</label>
                <input
                  style={{ ...input }}
                  value={reservationForm.accessibility}
                  onChange={e => setReservationForm({ ...reservationForm, accessibility: e.target.value })}
                  placeholder="Wheelchair access, high chair, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Special Requests</label>
                <input
                  style={{ ...input }}
                  value={reservationForm.specialRequests}
                  onChange={e => setReservationForm({ ...reservationForm, specialRequests: e.target.value })}
                  placeholder="Corner table, quiet area, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Notes</label>
                <textarea
                  style={{ ...input, minHeight: 80, resize: "vertical" }}
                  value={reservationForm.notes}
                  onChange={e => setReservationForm({ ...reservationForm, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              <button onClick={() => setShowAddModal(false)} style={{ ...btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={handleAddReservation} style={{ ...btn("primary"), flex: 1 }}>Create Reservation</button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-In Modal */}
      {showWalkInModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowWalkInModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(450px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Walk-In Guest</div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Quick check-in for walk-in guests</div>
              </div>
              <button onClick={() => setShowWalkInModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, marginBottom: 6 }}>Guest Name</label>
                <input
                  style={{ ...input }}
                  value={walkInForm.guestName}
                  onChange={e => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Phone</label>
                <input
                  style={{ ...input }}
                  value={walkInForm.phone}
                  onChange={e => setWalkInForm({ ...walkInForm, phone: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Party Size *</label>
                <input
                  type="number"
                  min="1"
                  style={{ ...input }}
                  value={walkInForm.partySize}
                  onChange={e => setWalkInForm({ ...walkInForm, partySize: e.target.value })}
                  placeholder="2"
                />
                {walkInErrors.partySize && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{walkInErrors.partySize}</div>}
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Table Preference</label>
                <input
                  style={{ ...input }}
                  value={walkInForm.tablePreference}
                  onChange={e => setWalkInForm({ ...walkInForm, tablePreference: e.target.value })}
                  placeholder="Booth, window, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Dietary Notes</label>
                <input
                  style={{ ...input }}
                  value={walkInForm.dietaryNotes}
                  onChange={e => setWalkInForm({ ...walkInForm, dietaryNotes: e.target.value })}
                  placeholder="Vegetarian, allergies, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Accessibility Notes</label>
                <input
                  style={{ ...input }}
                  value={walkInForm.accessibility}
                  onChange={e => setWalkInForm({ ...walkInForm, accessibility: e.target.value })}
                  placeholder="Wheelchair, high chair, etc."
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Notes</label>
                <textarea
                  style={{ ...input, minHeight: 60, resize: "vertical" }}
                  value={walkInForm.notes}
                  onChange={e => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              <button onClick={() => setShowWalkInModal(false)} style={{ ...btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={handleAddWalkIn} style={{ ...btn("primary"), flex: 1 }}>Check In</button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowWaitlistModal(false)}>
          <div style={{ 
            background: "var(--cafe-bg-card)", 
            border: "1px solid var(--cafe-border-light)", 
            borderRadius: "var(--cafe-radius-lg)", 
            width: "min(450px,95vw)", 
            maxHeight: "90vh", 
            overflowY: "auto", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideUp 0.3s ease"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div>
                <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Add to Waitlist</div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>Add a guest to the current waitlist</div>
              </div>
              <button onClick={() => setShowWaitlistModal(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ ...label, marginBottom: 6 }}>Guest Name *</label>
                <input
                  style={{ ...input }}
                  value={waitlistForm.guestName}
                  onChange={e => setWaitlistForm({ ...waitlistForm, guestName: e.target.value })}
                  placeholder="Enter guest name"
                />
                {waitlistFormErrors.guestName && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{waitlistFormErrors.guestName}</div>}
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Phone</label>
                <input
                  style={{ ...input }}
                  value={waitlistForm.phone}
                  onChange={e => setWaitlistForm({ ...waitlistForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Party Size *</label>
                <input
                  type="number"
                  min="1"
                  style={{ ...input }}
                  value={waitlistForm.partySize}
                  onChange={e => setWaitlistForm({ ...waitlistForm, partySize: e.target.value })}
                  placeholder="2"
                />
                {waitlistFormErrors.partySize && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4 }}>{waitlistFormErrors.partySize}</div>}
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Table Preference</label>
                <input
                  style={{ ...input }}
                  value={waitlistForm.tablePreference}
                  onChange={e => setWaitlistForm({ ...waitlistForm, tablePreference: e.target.value })}
                  placeholder="Booth, window, etc."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Estimated Wait (min)</label>
                  <input
                    type="number"
                    min="5"
                    style={{ ...input }}
                    value={waitlistForm.estimatedWait}
                    onChange={e => setWaitlistForm({ ...waitlistForm, estimatedWait: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <label style={{ ...label, marginBottom: 6 }}>Priority</label>
                  <select style={{ ...input }} value={waitlistForm.priority} onChange={e => setWaitlistForm({ ...waitlistForm, priority: e.target.value })}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ ...label, marginBottom: 6 }}>Notes</label>
                <textarea
                  style={{ ...input, minHeight: 60, resize: "vertical" }}
                  value={waitlistForm.notes}
                  onChange={e => setWaitlistForm({ ...waitlistForm, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              <button onClick={() => setShowWaitlistModal(false)} style={{ ...btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={handleAddWaitlist} style={{ ...btn("primary"), flex: 1 }}>Add to Waitlist</button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Detail Panel */}
      {showDetailPanel && selectedReservation && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, animation: "fadeIn 0.2s ease" }} onClick={() => setShowDetailPanel(false)}>
          <div style={{ 
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: isMobile ? "100%" : 480,
            background: "var(--cafe-bg-card)", 
            borderLeft: "1px solid var(--cafe-border-light)", 
            boxShadow: "var(--cafe-shadow-lg)",
            animation: "slideRight 0.3s ease",
            overflowY: "auto",
            padding: isMobile ? 16 : 24
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>Reservation Details</div>
              <button onClick={() => setShowDetailPanel(false)} style={{ padding: "8px 12px", borderRadius: "var(--cafe-radius-sm)", border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            {/* Header */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--cafe-border-light)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                    {selectedReservation.guestName}
                  </div>
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
                    Party of {selectedReservation.partySize}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--cafe-font-xl)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>
                    {formatTime(selectedReservation.time)}
                  </div>
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
                    {selectedReservation.date}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ 
                  fontSize: "var(--cafe-font-xs)", 
                  padding: "4px 10px", 
                  borderRadius: "var(--cafe-radius-xs)", 
                  background: "var(--cafe-accent-bg)", 
                  color: "var(--cafe-accent)", 
                  fontWeight: 600,
                  textTransform: "capitalize" 
                }}>
                  {selectedReservation.status.replace(/_/g, " ")}
                </span>
                {selectedReservation.tableNumber && (
                  <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-success-bg)", color: "var(--cafe-success)", padding: "4px 10px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                    Table {selectedReservation.tableNumber}
                  </span>
                )}
                {selectedReservation.source && (
                  <span style={{ fontSize: "var(--cafe-font-xs)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-tertiary)", padding: "4px 10px", borderRadius: "var(--cafe-radius-xs)", fontWeight: 600 }}>
                    {selectedReservation.source}
                  </span>
                )}
              </div>
            </div>

            {/* Guest Contact */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Guest Contact
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedReservation.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Phone</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", fontFamily: "monospace", color: "var(--cafe-text-primary)" }}>{formatPhone(selectedReservation.phone)}</span>
                  </div>
                )}
                {selectedReservation.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Email</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visit Details */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Visit Details
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Date</span>
                  <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.date}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Time</span>
                  <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{formatTime(selectedReservation.time)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Party Size</span>
                  <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.partySize} guests</span>
                </div>
                {selectedReservation.occasion && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Occasion</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.occasion}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dietary & Service Notes */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Dietary & Service Notes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedReservation.dietaryNotes && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Dietary</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.dietaryNotes}</span>
                  </div>
                )}
                {selectedReservation.allergies && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Allergies</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-danger)", fontWeight: 600 }}>{selectedReservation.allergies}</span>
                  </div>
                )}
                {selectedReservation.accessibility && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Accessibility</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.accessibility}</span>
                  </div>
                )}
                {selectedReservation.specialRequests && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", width: 80 }}>Requests</span>
                    <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)" }}>{selectedReservation.specialRequests}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedReservation.notes && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Notes
                </div>
                <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-primary)", lineHeight: 1.5 }}>
                  {selectedReservation.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cafe-border-light)" }}>
              {selectedReservation.status === "upcoming" && (
                <button onClick={() => { setCheckInDialog({ open: true, reservation: selectedReservation, onConfirm: () => { setCheckInDialog({ open: false, reservation: null, onConfirm: null }); handleCheckIn(selectedReservation); }}); }} style={{ ...btn("primary"), width: "100%" }}>
                  Check In
                </button>
              )}
              {selectedReservation.status === "checked_in" && !selectedReservation.tableId && (
                <button onClick={() => { const availableTables = tables.filter(t => t.status === "available"); if (availableTables.length > 0) { setTableSelectionDialog({ open: true, reservation: selectedReservation, entry: null, onConfirm: (table) => { setTableSelectionDialog({ open: false, reservation: null, entry: null, onConfirm: null }); handleSeatGuest(selectedReservation, table); }}); } else { setNoTablesDialog({ open: true, onConfirm: () => setNoTablesDialog({ open: false, onConfirm: null }) }); } }} style={{ ...btn("primary"), width: "100%" }}>
                  Assign & Seat
                </button>
              )}
              {selectedReservation.status === "checked_in" && selectedReservation.tableId && (
                <button onClick={() => { const table = tables.find(t => t.id === selectedReservation.tableId); if (table) { setSeatGuestDialog({ open: true, reservation: selectedReservation, table, onConfirm: () => { setSeatGuestDialog({ open: false, reservation: null, table: null, onConfirm: null }); handleSeatGuest(selectedReservation, table); }}); } }} style={{ ...btn("primary"), width: "100%" }}>
                  Seat Now
                </button>
              )}
              {selectedReservation.status === "upcoming" && (
                <button onClick={() => { setRescheduleDialog({ open: true, reservation: selectedReservation, newDate: selectedReservation.date, newTime: selectedReservation.time, onConfirm: (newDate, newTime) => { setRescheduleDialog({ open: false, reservation: null, newDate: "", newTime: "", onConfirm: null }); handleReschedule(selectedReservation, newDate, newTime); }}); }} style={{ ...btn("ghost"), width: "100%" }}>
                  Reschedule
                </button>
              )}
              {selectedReservation.status === "upcoming" && (
                <button onClick={() => { setMarkLateDialog({ open: true, reservation: selectedReservation, onConfirm: () => { setMarkLateDialog({ open: false, reservation: null, onConfirm: null }); handleMarkLate(selectedReservation, 15); }}); }} style={{ ...btn("ghost"), width: "100%", color: "var(--cafe-warning)", borderColor: "var(--cafe-warning-border)" }}>
                  Mark Late
                </button>
              )}
              {(selectedReservation.status === "upcoming" || selectedReservation.status === "late" || selectedReservation.status === "checked_in") && (
                <button onClick={() => { setMarkNoShowDialog({ open: true, reservation: selectedReservation, onConfirm: () => { setMarkNoShowDialog({ open: false, reservation: null, onConfirm: null }); handleMarkNoShow(selectedReservation); }}); }} style={{ ...btn("ghost"), width: "100%", color: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)" }}>
                  Mark No Show
                </button>
              )}
              {selectedReservation.status !== "cancelled" && selectedReservation.status !== "no_show" && selectedReservation.status !== "completed" && (
                <button onClick={() => { setCancelReservationDialog({ open: true, reservation: selectedReservation, onConfirm: () => { setCancelReservationDialog({ open: false, reservation: null, onConfirm: null }); handleCancelReservation(selectedReservation); }}); }} style={{ ...btn("ghost"), width: "100%", color: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)" }}>
                  Cancel Reservation
                </button>
              )}
              {selectedReservation.phone && (
                <button onClick={() => { setContactDialog({ open: true, reservation: selectedReservation, method: "call", onConfirm: () => { setContactDialog({ open: false, reservation: null, method: null, onConfirm: null }); handleContactGuest(selectedReservation, "call"); }}); }} style={{ ...btn("ghost"), width: "100%" }}>
                  Call Guest
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={checkInDialog.open}
        onClose={() => setCheckInDialog({ open: false, reservation: null, onConfirm: null })}
        onConfirm={checkInDialog.onConfirm}
        title="Check In Guest"
        description={`Confirm arrival for ${checkInDialog.reservation?.guestName}?`}
        confirmLabel="Check In"
      />

      <WarningDialog
        open={markLateDialog.open}
        onClose={() => setMarkLateDialog({ open: false, reservation: null, onConfirm: null })}
        onConfirm={markLateDialog.onConfirm}
        title="Mark as Late"
        description="This guest has arrived later than their reservation time."
        warning="This will update their status to Late in the system."
        confirmLabel="Mark Late"
      />

      <DestructiveDialog
        open={markNoShowDialog.open}
        onClose={() => setMarkNoShowDialog({ open: false, reservation: null, onConfirm: null })}
        onConfirm={markNoShowDialog.onConfirm}
        title="Mark as No Show"
        description="This guest did not arrive for their reservation."
        recordName={markNoShowDialog.reservation?.guestName}
        consequence="The reservation will be marked as No Show and the table will be released if assigned."
        confirmLabel="Mark No Show"
      />

      <DestructiveDialog
        open={cancelReservationDialog.open}
        onClose={() => setCancelReservationDialog({ open: false, reservation: null, onConfirm: null })}
        onConfirm={cancelReservationDialog.onConfirm}
        title="Cancel Reservation"
        description="This action cannot be undone."
        recordName={cancelReservationDialog.reservation?.guestName}
        consequence="The reservation will be cancelled and the table will be released if assigned."
        confirmLabel="Cancel Reservation"
      />

      <ConfirmDialog
        open={seatGuestDialog.open}
        onClose={() => setSeatGuestDialog({ open: false, reservation: null, table: null, onConfirm: null })}
        onConfirm={seatGuestDialog.onConfirm}
        title="Seat Guest"
        description={`Seat ${seatGuestDialog.reservation?.guestName} at Table ${seatGuestDialog.table?.number}?`}
        confirmLabel="Seat Now"
      />

      <ConfirmDialog
        open={contactDialog.open}
        onClose={() => setContactDialog({ open: false, reservation: null, method: null, onConfirm: null })}
        onConfirm={contactDialog.onConfirm}
        title="Contact Guest"
        description={`Call ${contactDialog.reservation?.guestName} at ${formatPhone(contactDialog.reservation?.phone)}?`}
        confirmLabel="Call"
      />

      <ConfirmDialog
        open={waitlistSeatDialog.open}
        onClose={() => setWaitlistSeatDialog({ open: false, entry: null, table: null, onConfirm: null })}
        onConfirm={waitlistSeatDialog.onConfirm}
        title="Seat Waitlist Guest"
        description={`Seat ${waitlistSeatDialog.entry?.guestName} at Table ${waitlistSeatDialog.table?.number}?`}
        confirmLabel="Seat Now"
      />

      <DestructiveDialog
        open={waitlistCancelDialog.open}
        onClose={() => setWaitlistCancelDialog({ open: false, entry: null, onConfirm: null })}
        onConfirm={waitlistCancelDialog.onConfirm}
        title="Remove from Waitlist"
        description="Remove this guest from the waitlist?"
        recordName={waitlistCancelDialog.entry?.guestName}
        consequence="This action cannot be undone."
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={waitlistContactDialog.open}
        onClose={() => setWaitlistContactDialog({ open: false, entry: null, onConfirm: null })}
        onConfirm={waitlistContactDialog.onConfirm}
        title="Contact Waitlist Guest"
        description={`Contact ${waitlistContactDialog.entry?.guestName}?`}
        confirmLabel="Contact"
      />

      <WarningDialog
        open={noTablesDialog.open}
        onClose={() => setNoTablesDialog({ open: false, onConfirm: null })}
        onConfirm={noTablesDialog.onConfirm}
        title="No Available Tables"
        description="There are currently no available tables to seat this guest."
        warning="Please wait for a table to become available or check the floor status."
        confirmLabel="Close"
      />

      <SelectionDialog
        open={tableSelectionDialog.open}
        onClose={() => setTableSelectionDialog({ open: false, reservation: null, entry: null, onConfirm: null })}
        onConfirm={tableSelectionDialog.onConfirm}
        title="Select Table"
        description={tableSelectionDialog.reservation 
          ? `Select a table for ${tableSelectionDialog.reservation.guestName} (party of ${tableSelectionDialog.reservation.partySize})`
          : `Select a table for ${tableSelectionDialog.entry?.guestName} (party of ${tableSelectionDialog.entry?.partySize})`
        }
        options={tables.filter(t => t.status === "available").map(t => ({
          value: t.id,
          label: `Table ${t.number} (Capacity: ${t.capacity})`,
          description: t.area ? `${t.area} · ${t.type}` : t.type
        }))}
        confirmLabel="Select Table"
      />

      <WarningDialog
        open={tableConflictDialog.open}
        onClose={() => setTableConflictDialog({ open: false, reservation: null, conflictingRes: null, onConfirm: null })}
        onConfirm={tableConflictDialog.onConfirm}
        title="Table Conflict Detected"
        description={`Table ${tableConflictDialog.conflictingRes?.tableNumber} is already assigned to ${tableConflictDialog.conflictingRes?.guestName} at ${formatTime(tableConflictDialog.conflictingRes?.time)}.`}
        warning="Seating here will override the existing assignment. Are you sure you want to continue?"
        confirmLabel="Override and Seat"
      />

      <PromptDialog
        open={rescheduleDialog.open}
        onClose={() => setRescheduleDialog({ open: false, reservation: null, newDate: "", newTime: "", onConfirm: null })}
        onConfirm={(values) => {
          if (values.date && values.time) {
            rescheduleDialog.onConfirm(values.date, values.time);
          }
        }}
        title="Reschedule Reservation"
        description={`Reschedule ${rescheduleDialog.reservation?.guestName} from ${formatTime(rescheduleDialog.reservation?.time)} to a new time.`}
        fields={[
          { name: "date", label: "New Date", type: "date", value: rescheduleDialog.newDate, required: true },
          { name: "time", label: "New Time", type: "time", value: rescheduleDialog.newTime, required: true }
        ]}
        confirmLabel="Reschedule"
      />
    </div>
  );
}
