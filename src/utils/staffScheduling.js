// Staff scheduling utilities

// Shift types
export const SHIFT_TYPES = {
  MORNING: { start: '06:00', end: '14:00', label: 'Morning' },
  AFTERNOON: { start: '14:00', end: '22:00', label: 'Afternoon' },
  EVENING: { start: '18:00', end: '02:00', label: 'Evening' },
  FULL_DAY: { start: '09:00', end: '18:00', label: 'Full Day' }
};

// Create a shift schedule
export const createShift = (staffId, date, shiftType, role) => {
  const shift = SHIFT_TYPES[shiftType];
  return {
    id: `SHIFT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    staffId,
    date, // ISO date string
    shiftType,
    role,
    startTime: shift.start,
    endTime: shift.end,
    status: 'scheduled',
    checkIn: null,
    checkOut: null,
    createdAt: new Date().toISOString()
  };
};

// Get schedule for a specific date
export const getScheduleForDate = (date) => {
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  return schedules.filter(schedule => schedule.date === date);
};

// Get schedule for a staff member
export const getStaffSchedule = (staffId, startDate, endDate) => {
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return schedule.staffId === staffId && scheduleDate >= start && scheduleDate <= end;
  });
};

// Check if staff member is available for a shift
export const isStaffAvailable = (staffId, date, shiftType) => {
  const schedule = getScheduleForDate(date);
  const existingShift = schedule.find(s => s.staffId === staffId);
  
  if (existingShift) {
    return false; // Already scheduled
  }
  
  // Check if staff has availability set
  const staffAvailability = JSON.parse(localStorage.getItem('staff_availability') || '{}');
  const availability = staffAvailability[staffId];
  
  if (availability) {
    const shift = SHIFT_TYPES[shiftType];
    const dayOfWeek = new Date(date).getDay();
    const dayAvailability = availability[dayOfWeek];
    
    if (dayAvailability) {
      return dayAvailability.available;
    }
  }
  
  return true; // Default to available
};

// Assign staff to shift
export const assignShift = (staffId, date, shiftType, role) => {
  if (!isStaffAvailable(staffId, date, shiftType)) {
    throw new Error('Staff member is not available for this shift');
  }
  
  const shift = createShift(staffId, date, shiftType, role);
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  schedules.push(shift);
  localStorage.setItem('staff_schedules', JSON.stringify(schedules));
  
  return shift;
};

// Remove staff from shift
export const removeShift = (shiftId) => {
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  const updated = schedules.filter(s => s.shiftId !== shiftId);
  localStorage.setItem('staff_schedules', JSON.stringify(updated));
};

// Check in staff member
export const checkInStaff = (shiftId) => {
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  const updated = schedules.map(s => {
    if (s.id === shiftId) {
      return {
        ...s,
        checkIn: new Date().toISOString(),
        status: 'checked_in'
      };
    }
    return s;
  });
  localStorage.setItem('staff_schedules', JSON.stringify(updated));
};

// Check out staff member
export const checkOutStaff = (shiftId) => {
  const schedules = JSON.parse(localStorage.getItem('staff_schedules') || '[]');
  const updated = schedules.map(s => {
    if (s.id === shiftId) {
      return {
        ...s,
        checkOut: new Date().toISOString(),
        status: 'completed'
      };
    }
    return s;
  });
  localStorage.setItem('staff_schedules', JSON.stringify(updated));
};

// Set staff availability
export const setStaffAvailability = (staffId, dayOfWeek, available, startTime, endTime) => {
  const staffAvailability = JSON.parse(localStorage.getItem('staff_availability') || '{}');
  
  if (!staffAvailability[staffId]) {
    staffAvailability[staffId] = {};
  }
  
  staffAvailability[staffId][dayOfWeek] = {
    available,
    startTime,
    endTime
  };
  
  localStorage.setItem('staff_availability', JSON.stringify(staffAvailability));
};

// Get staff coverage for a date
export const getStaffCoverage = (date) => {
  const schedule = getScheduleForDate(date);
  const coverage = {
    totalStaff: schedule.length,
    byRole: {},
    byShift: {}
  };
  
  schedule.forEach(shift => {
    // Count by role
    coverage.byRole[shift.role] = (coverage.byRole[shift.role] || 0) + 1;
    
    // Count by shift type
    coverage.byShift[shift.shiftType] = (coverage.byShift[shift.shiftType] || 0) + 1;
  });
  
  return coverage;
};

// Get staff hours worked
export const getStaffHours = (staffId, startDate, endDate) => {
  const schedule = getStaffSchedule(staffId, startDate, endDate);
  let totalHours = 0;
  
  schedule.forEach(shift => {
    if (shift.checkIn && shift.checkOut) {
      const checkIn = new Date(shift.checkIn);
      const checkOut = new Date(shift.checkOut);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      totalHours += hours;
    }
  });
  
  return totalHours;
};

// Auto-generate schedule based on staff availability
export const autoGenerateSchedule = (date, requiredCoverage) => {
  const staffList = JSON.parse(localStorage.getItem('staff') || '[]');
  const generatedSchedule = [];
  
  Object.keys(requiredCoverage).forEach(shiftType => {
    const required = requiredCoverage[shiftType];
    let assigned = 0;
    
    for (const staff of staffList) {
      if (assigned >= required) break;
      
      if (isStaffAvailable(staff.id, date, shiftType)) {
        try {
          const shift = assignShift(staff.id, date, shiftType, staff.role);
          generatedSchedule.push(shift);
          assigned++;
        } catch (error) {
          console.error(`Failed to assign ${staff.name} to shift:`, error);
        }
      }
    }
  });
  
  return generatedSchedule;
};
