// Employee Scheduling System

export const ShiftType = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
  FULL_DAY: 'full_day',
  CUSTOM: 'custom'
};

export const ScheduleStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled'
};

export const AttendanceStatus = {
  SCHEDULED: 'scheduled',
  CLOCKED_IN: 'clocked_in',
  CLOCKED_OUT: 'clocked_out',
  ABSENT: 'absent',
  LATE: 'late',
  EARLY_LEAVE: 'early_leave',
  SICK_LEAVE: 'sick_leave',
  VACATION: 'vacation'
};

class EmployeeScheduleManager {
  constructor() {
    this.schedules = [];
    this.shiftTemplates = [];
    this.loadFromStorage();
  }

  // Load schedules from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedSchedules = localStorage.getItem('employee_schedules');
        const storedTemplates = localStorage.getItem('shift_templates');
        
        if (storedSchedules) {
          this.schedules = JSON.parse(storedSchedules);
        }
        if (storedTemplates) {
          this.shiftTemplates = JSON.parse(storedTemplates);
        }
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    }
  }

  // Save schedules to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('employee_schedules', JSON.stringify(this.schedules));
        localStorage.setItem('shift_templates', JSON.stringify(this.shiftTemplates));
      }
    } catch (error) {
      console.error('Error saving schedule data:', error);
    }
  }

  // Create shift template
  createShiftTemplate(templateData) {
    const template = {
      id: this.generateId(),
      ...templateData,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.shiftTemplates.push(template);
    this.saveToStorage();
    
    return template;
  }

  // Create schedule
  createSchedule(scheduleData) {
    const schedule = {
      id: this.generateId(),
      ...scheduleData,
      status: ScheduleStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shifts: scheduleData.shifts || []
    };

    this.schedules.push(schedule);
    this.saveToStorage();
    
    return schedule;
  }

  // Update schedule
  updateSchedule(scheduleId, updates) {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) {
      throw new Error('Schedule not found');
    }

    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.schedules[index];
  }

  // Delete schedule
  deleteSchedule(scheduleId) {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) {
      throw new Error('Schedule not found');
    }

    this.schedules.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get schedule by ID
  getSchedule(scheduleId) {
    return this.schedules.find(s => s.id === scheduleId);
  }

  // Get all schedules
  getAllSchedules(filters = {}) {
    let filtered = [...this.schedules];

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.employeeId) {
      filtered = filtered.filter(s => 
        s.shifts.some(shift => shift.employeeId === filters.employeeId)
      );
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.startDate);
        return scheduleDate >= new Date(filters.startDate) && scheduleDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Add shift to schedule
  addShift(scheduleId, shiftData) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const shift = {
      id: this.generateId(),
      ...shiftData,
      status: AttendanceStatus.SCHEDULED,
      createdAt: new Date().toISOString()
    };

    schedule.shifts.push(shift);
    return this.updateSchedule(scheduleId, { shifts: schedule.shifts });
  }

  // Update shift
  updateShift(scheduleId, shiftId, updates) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const shiftIndex = schedule.shifts.findIndex(s => s.id === shiftId);
    if (shiftIndex === -1) {
      throw new Error('Shift not found');
    }

    schedule.shifts[shiftIndex] = {
      ...schedule.shifts[shiftIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.updateSchedule(scheduleId, { shifts: schedule.shifts });
  }

  // Remove shift from schedule
  removeShift(scheduleId, shiftId) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    schedule.shifts = schedule.shifts.filter(s => s.id !== shiftId);
    return this.updateSchedule(scheduleId, { shifts: schedule.shifts });
  }

  // Publish schedule
  publishSchedule(scheduleId, publishedBy) {
    return this.updateSchedule(scheduleId, {
      status: ScheduleStatus.PUBLISHED,
      publishedBy,
      publishedAt: new Date().toISOString()
    });
  }

  // Cancel schedule
  cancelSchedule(scheduleId, cancelledBy, reason = '') {
    return this.updateSchedule(scheduleId, {
      status: ScheduleStatus.CANCELLED,
      cancelledBy,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    });
  }

  // Get shift templates
  getShiftTemplates() {
    return this.shiftTemplates.filter(t => t.isActive);
  }

  // Get shift template by ID
  getShiftTemplate(templateId) {
    return this.shiftTemplates.find(t => t.id === templateId);
  }

  // Update shift template
  updateShiftTemplate(templateId, updates) {
    const index = this.shiftTemplates.findIndex(t => t.id === templateId);
    if (index === -1) {
      throw new Error('Shift template not found');
    }

    this.shiftTemplates[index] = {
      ...this.shiftTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    return this.shiftTemplates[index];
  }

  // Delete shift template
  deleteShiftTemplate(templateId) {
    const index = this.shiftTemplates.findIndex(t => t.id === templateId);
    if (index === -1) {
      throw new Error('Shift template not found');
    }

    this.shiftTemplates[index].isActive = false;
    this.saveToStorage();
    return true;
  }

  // Get schedule for a specific date range
  getScheduleForDateRange(startDate, endDate, locationId = null) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDate);
      const scheduleEnd = new Date(schedule.endDate);
      
      const dateOverlap = scheduleStart <= end && scheduleEnd >= start;
      const locationMatch = !locationId || schedule.locationId === locationId;
      
      return dateOverlap && locationMatch && schedule.status === ScheduleStatus.PUBLISHED;
    });
  }

  // Get employee schedule for a specific date
  getEmployeeScheduleForDate(employeeId, date) {
    const targetDate = new Date(date).toDateString();
    
    return this.schedules
      .filter(s => s.status === ScheduleStatus.PUBLISHED)
      .flatMap(schedule => 
        schedule.shifts.filter(shift => {
          const shiftDate = new Date(shift.date).toDateString();
          return shift.employeeId === employeeId && shiftDate === targetDate;
        })
      );
  }

  // Get schedule conflicts
  getScheduleConflicts(scheduleId) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) return [];

    const conflicts = [];

    schedule.shifts.forEach(shift => {
      // Check for overlapping shifts for same employee
      const overlappingShifts = schedule.shifts.filter(otherShift => {
        if (otherShift.id === shift.id || otherShift.employeeId !== shift.employeeId) {
          return false;
        }

        const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
        const shiftEnd = new Date(`${shift.date}T${shift.endTime}`);
        const otherStart = new Date(`${otherShift.date}T${otherShift.startTime}`);
        const otherEnd = new Date(`${otherShift.date}T${otherShift.endTime}`);

        return shiftStart < otherEnd && shiftEnd > otherStart;
      });

      if (overlappingShifts.length > 0) {
        conflicts.push({
          type: 'overlap',
          shiftId: shift.id,
          employeeId: shift.employeeId,
          conflictingShifts: overlappingShifts.map(s => s.id)
        });
      }
    });

    return conflicts;
  }

  // Auto-generate schedule from templates
  autoGenerateSchedule(startDate, endDate, locationId, templateId) {
    const template = this.getShiftTemplate(templateId);
    if (!template) {
      throw new Error('Shift template not found');
    }

    const shifts = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const dayShifts = template.days[dayOfWeek] || [];

      dayShifts.forEach(dayShift => {
        shifts.push({
          employeeId: dayShift.employeeId,
          date: date.toISOString().split('T')[0],
          startTime: dayShift.startTime,
          endTime: dayShift.endTime,
          breakDuration: dayShift.breakDuration || 0,
          role: dayShift.role,
          locationId
        });
      });
    }

    return this.createSchedule({
      startDate,
      endDate,
      locationId,
      templateId,
      shifts,
      generatedBy: 'auto'
    });
  }

  // Get schedule statistics
  getStatistics(scheduleId) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) return null;

    const totalShifts = schedule.shifts.length;
    const totalHours = schedule.shifts.reduce((sum, shift) => {
      const start = new Date(`${shift.date}T${shift.startTime}`);
      const end = new Date(`${shift.date}T${shift.endTime}`);
      const hours = (end - start) / (1000 * 60 * 60);
      return sum + (hours - (shift.breakDuration || 0) / 60);
    }, 0);

    const shiftsByRole = {};
    schedule.shifts.forEach(shift => {
      shiftsByRole[shift.role] = (shiftsByRole[shift.role] || 0) + 1;
    });

    return {
      totalShifts,
      totalHours,
      averageHoursPerShift: totalShifts > 0 ? totalHours / totalShifts : 0,
      shiftsByRole,
      employeeCount: new Set(schedule.shifts.map(s => s.employeeId)).size
    };
  }

  // Generate unique ID
  generateId() {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export schedule as CSV
  exportToCSV(scheduleId) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) return '';

    const headers = ['Shift ID', 'Employee ID', 'Date', 'Start Time', 'End Time', 'Break Duration', 'Role', 'Status'];
    const rows = schedule.shifts.map(s => [
      s.id,
      s.employeeId,
      s.date,
      s.startTime,
      s.endTime,
      s.breakDuration || 0,
      s.role,
      s.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let employeeScheduleManager = null;

export const getEmployeeScheduleManager = () => {
  if (!employeeScheduleManager) {
    employeeScheduleManager = new EmployeeScheduleManager();
  }
  return employeeScheduleManager;
};
