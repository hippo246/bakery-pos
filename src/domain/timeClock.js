// Time Clock and Attendance Tracking System

export const ClockStatus = {
  CLOCKED_OUT: 'clocked_out',
  CLOCKED_IN: 'clocked_in',
  ON_BREAK: 'on_break'
};

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  HALF_DAY: 'half_day',
  FULL_DAY: 'full_day',
  OVERTIME: 'overtime'
};

class TimeClockManager {
  constructor() {
    this.clockEvents = [];
    this.attendanceRecords = [];
    this.loadFromStorage();
  }

  // Load time clock data from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedEvents = localStorage.getItem('clock_events');
        const storedAttendance = localStorage.getItem('attendance_records');
        
        if (storedEvents) {
          this.clockEvents = JSON.parse(storedEvents);
        }
        if (storedAttendance) {
          this.attendanceRecords = JSON.parse(storedAttendance);
        }
      }
    } catch (error) {
      console.error('Error loading time clock data:', error);
    }
  }

  // Save time clock data to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('clock_events', JSON.stringify(this.clockEvents));
        localStorage.setItem('attendance_records', JSON.stringify(this.attendanceRecords));
      }
    } catch (error) {
      console.error('Error saving time clock data:', error);
    }
  }

  // Clock in employee
  clockIn(employeeId, locationId, notes = '') {
    // Check if already clocked in
    const activeClockIn = this.getActiveClockEvent(employeeId);
    if (activeClockIn) {
      throw new Error('Employee is already clocked in');
    }

    const clockEvent = {
      id: this.generateId(),
      employeeId,
      locationId,
      type: 'clock_in',
      timestamp: new Date().toISOString(),
      status: ClockStatus.CLOCKED_IN,
      notes,
      ipAddress: this.getClientIP(),
      deviceInfo: this.getDeviceInfo()
    };

    this.clockEvents.push(clockEvent);
    this.saveToStorage();
    
    return clockEvent;
  }

  // Clock out employee
  clockOut(employeeId, notes = '') {
    const activeClockIn = this.getActiveClockEvent(employeeId);
    if (!activeClockIn) {
      throw new Error('Employee is not clocked in');
    }

    const clockOutEvent = {
      id: this.generateId(),
      employeeId,
      locationId: activeClockIn.locationId,
      type: 'clock_out',
      timestamp: new Date().toISOString(),
      status: ClockStatus.CLOCKED_OUT,
      notes,
      relatedEventId: activeClockIn.id,
      ipAddress: this.getClientIP(),
      deviceInfo: this.getDeviceInfo()
    };

    this.clockEvents.push(clockOutEvent);

    // Update the clock in event
    const clockInIndex = this.clockEvents.findIndex(e => e.id === activeClockIn.id);
    this.clockEvents[clockInIndex].relatedEventId = clockOutEvent.id;
    this.clockEvents[clockInIndex].status = ClockStatus.CLOCKED_OUT;

    // Create attendance record
    this.createAttendanceRecord(activeClockIn, clockOutEvent);

    this.saveToStorage();
    
    return clockOutEvent;
  }

  // Start break
  startBreak(employeeId, notes = '') {
    const activeClockIn = this.getActiveClockEvent(employeeId);
    if (!activeClockIn) {
      throw new Error('Employee is not clocked in');
    }

    const breakEvent = {
      id: this.generateId(),
      employeeId,
      locationId: activeClockIn.locationId,
      type: 'break_start',
      timestamp: new Date().toISOString(),
      status: ClockStatus.ON_BREAK,
      notes,
      relatedEventId: activeClockIn.id,
      ipAddress: this.getClientIP(),
      deviceInfo: this.getDeviceInfo()
    };

    this.clockEvents.push(breakEvent);
    this.saveToStorage();
    
    return breakEvent;
  }

  // End break
  endBreak(employeeId, notes = '') {
    const activeBreak = this.clockEvents
      .filter(e => e.employeeId === employeeId && e.type === 'break_start')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (!activeBreak) {
      throw new Error('No active break found');
    }

    const breakEndEvent = {
      id: this.generateId(),
      employeeId,
      locationId: activeBreak.locationId,
      type: 'break_end',
      timestamp: new Date().toISOString(),
      status: ClockStatus.CLOCKED_IN,
      notes,
      relatedEventId: activeBreak.id,
      ipAddress: this.getClientIP(),
      deviceInfo: this.getDeviceInfo()
    };

    this.clockEvents.push(breakEndEvent);

    // Update the break start event
    const breakIndex = this.clockEvents.findIndex(e => e.id === activeBreak.id);
    this.clockEvents[breakIndex].relatedEventId = breakEndEvent.id;

    this.saveToStorage();
    
    return breakEndEvent;
  }

  // Get active clock event for employee
  getActiveClockEvent(employeeId) {
    return this.clockEvents
      .filter(e => e.employeeId === employeeId && e.type === 'clock_in')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .find(e => e.status === ClockStatus.CLOCKED_IN);
  }

  // Get clock status for employee
  getClockStatus(employeeId) {
    const activeClockIn = this.getActiveClockEvent(employeeId);
    if (!activeClockIn) {
      return ClockStatus.CLOCKED_OUT;
    }

    // Check if on break
    const activeBreak = this.clockEvents
      .filter(e => e.employeeId === employeeId && e.type === 'break_start')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (activeBreak && !activeBreak.relatedEventId) {
      return ClockStatus.ON_BREAK;
    }

    return ClockStatus.CLOCKED_IN;
  }

  // Create attendance record from clock events
  createAttendanceRecord(clockInEvent, clockOutEvent) {
    const clockIn = new Date(clockInEvent.timestamp);
    const clockOut = new Date(clockOutEvent.timestamp);
    
    // Get breaks for this session
    const breaks = this.clockEvents.filter(e => 
      e.employeeId === clockInEvent.employeeId &&
      e.type === 'break_start' &&
      new Date(e.timestamp) > clockIn &&
      new Date(e.timestamp) < clockOut
    );

    // Calculate break duration
    let totalBreakMinutes = 0;
    breaks.forEach(breakStart => {
      const breakEnd = this.clockEvents.find(e => e.relatedEventId === breakStart.id);
      if (breakEnd) {
        const duration = (new Date(breakEnd.timestamp) - new Date(breakStart.timestamp)) / (1000 * 60);
        totalBreakMinutes += duration;
      }
    });

    // Calculate work duration
    const totalMinutes = (clockOut - clockIn) / (1000 * 60);
    const workMinutes = totalMinutes - totalBreakMinutes;
    const workHours = workMinutes / 60;

    // Determine attendance status
    let status = AttendanceStatus.FULL_DAY;
    if (workHours < 4) {
      status = AttendanceStatus.HALF_DAY;
    } else if (workHours > 8) {
      status = AttendanceStatus.OVERTIME;
    }

    // Check for late arrival (after 9:30 AM)
    const scheduledStart = new Date(clockIn);
    scheduledStart.setHours(9, 30, 0, 0);
    if (clockIn > scheduledStart) {
      status = AttendanceStatus.LATE;
    }

    const attendanceRecord = {
      id: this.generateId(),
      employeeId: clockInEvent.employeeId,
      locationId: clockInEvent.locationId,
      date: clockIn.toISOString().split('T')[0],
      clockInTime: clockInEvent.timestamp,
      clockOutTime: clockOutEvent.timestamp,
      totalWorkMinutes: workMinutes,
      totalWorkHours: workHours,
      totalBreakMinutes,
      status,
      clockInEventId: clockInEvent.id,
      clockOutEventId: clockOutEvent.id,
      createdAt: new Date().toISOString()
    };

    this.attendanceRecords.push(attendanceRecord);
    return attendanceRecord;
  }

  // Get attendance records for employee
  getEmployeeAttendance(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return record.employeeId === employeeId && 
             recordDate >= start && 
             recordDate <= end;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Get attendance records for all employees
  getAllAttendance(filters = {}) {
    let filtered = [...this.attendanceRecords];

    if (filters.employeeId) {
      filtered = filtered.filter(r => r.employeeId === filters.employeeId);
    }

    if (filters.locationId) {
      filtered = filtered.filter(r => r.locationId === filters.locationId);
    }

    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= new Date(filters.startDate) && recordDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Get currently clocked in employees
  getClockedInEmployees() {
    const clockedInIds = this.clockEvents
      .filter(e => e.type === 'clock_in' && e.status === ClockStatus.CLOCKED_IN)
      .map(e => e.employeeId);

    return [...new Set(clockedInIds)];
  }

  // Get clock events for employee
  getEmployeeClockEvents(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.clockEvents.filter(event => {
      const eventDate = new Date(event.timestamp);
      return event.employeeId === employeeId && 
             eventDate >= start && 
             eventDate <= end;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get attendance summary for employee
  getAttendanceSummary(employeeId, startDate, endDate) {
    const records = this.getEmployeeAttendance(employeeId, startDate, endDate);
    
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status !== AttendanceStatus.ABSENT).length;
    const absentDays = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const lateDays = records.filter(r => r.status === AttendanceStatus.LATE).length;
    const totalWorkHours = records.reduce((sum, r) => sum + r.totalWorkHours, 0);
    const avgWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;
    const totalOvertime = records
      .filter(r => r.status === AttendanceStatus.OVERTIME)
      .reduce((sum, r) => sum + (r.totalWorkHours - 8), 0);

    return {
      employeeId,
      period: { startDate, endDate },
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      totalWorkHours,
      avgWorkHours,
      totalOvertime
    };
  }

  // Get daily attendance for location
  getDailyAttendance(locationId, date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    return this.attendanceRecords.filter(r => 
      r.locationId === locationId && r.date === dateStr
    );
  }

  // Manual attendance adjustment (for missed clock in/out)
  adjustAttendance(recordId, adjustments, adjustedBy, reason = '') {
    const index = this.attendanceRecords.findIndex(r => r.id === recordId);
    if (index === -1) {
      throw new Error('Attendance record not found');
    }

    const oldRecord = { ...this.attendanceRecords[index] };
    
    this.attendanceRecords[index] = {
      ...this.attendanceRecords[index],
      ...adjustments,
      adjustedBy,
      adjustedAt: new Date().toISOString(),
      adjustmentReason: reason,
      isManual: true
    };

    this.saveToStorage();
    return this.attendanceRecords[index];
  }

  // Get attendance statistics
  getStatistics(startDate, endDate) {
    const records = this.getAllAttendance({ startDate, endDate });
    
    const byStatus = {};
    records.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });

    const byEmployee = {};
    records.forEach(r => {
      if (!byEmployee[r.employeeId]) {
        byEmployee[r.employeeId] = {
          totalDays: 0,
          totalHours: 0,
          presentDays: 0
        };
      }
      byEmployee[r.employeeId].totalDays++;
      byEmployee[r.employeeId].totalHours += r.totalWorkHours;
      if (r.status !== AttendanceStatus.ABSENT) {
        byEmployee[r.employeeId].presentDays++;
      }
    });

    return {
      totalRecords: records.length,
      byStatus,
      byEmployee,
      totalWorkHours: records.reduce((sum, r) => sum + r.totalWorkHours, 0),
      avgWorkHours: records.length > 0 ? records.reduce((sum, r) => sum + r.totalWorkHours, 0) / records.length : 0
    };
  }

  // Export attendance as CSV
  exportToCSV(startDate, endDate) {
    const records = this.getAllAttendance({ startDate, endDate });
    const headers = ['ID', 'Employee ID', 'Date', 'Clock In', 'Clock Out', 'Work Hours', 'Break Minutes', 'Status'];
    const rows = records.map(r => [
      r.id,
      r.employeeId,
      r.date,
      r.clockInTime,
      r.clockOutTime,
      r.totalWorkHours.toFixed(2),
      r.totalBreakMinutes,
      r.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Helper: Get client IP (placeholder)
  getClientIP() {
    // In production, this would come from the server
    return '127.0.0.1';
  }

  // Helper: Get device info
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    };
  }

  // Generate unique ID
  generateId() {
    return `clock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let timeClockManager = null;

export const getTimeClockManager = () => {
  if (!timeClockManager) {
    timeClockManager = new TimeClockManager();
  }
  return timeClockManager;
};
