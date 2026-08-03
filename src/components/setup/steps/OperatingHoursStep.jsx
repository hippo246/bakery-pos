import React from 'react';
// Operating Hours Step for Setup Wizard
// Configure cafe operating hours with templates and premium UX

import { useState, useCallback } from "react";

const DAYS = [
  { id: 'monday', name: 'Monday', short: 'Mon' },
  { id: 'tuesday', name: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', name: 'Wednesday', short: 'Wed' },
  { id: 'thursday', name: 'Thursday', short: 'Thu' },
  { id: 'friday', name: 'Friday', short: 'Fri' },
  { id: 'saturday', name: 'Saturday', short: 'Sat' },
  { id: 'sunday', name: 'Sunday', short: 'Sun' }
];

const TEMPLATES = [
  { id: '7days', name: '7 Days', description: 'Open every day 9AM - 10PM', icon: '📅' },
  { id: 'weekdays', name: 'Monday–Friday', description: 'Weekdays 9AM - 10PM, Weekends closed', icon: '💼' },
  { id: 'weekend', name: 'Weekend Only', description: 'Weekends 10AM - 11PM, Weekdays closed', icon: '🎉' },
  { id: 'custom', name: 'Custom', description: 'Set hours for each day individually', icon: '⚙️' }
];

export default function OperatingHoursStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [hours, setHours] = useState(() => {
    const defaultHours = {};
    DAYS.forEach(day => {
      defaultHours[day.id] = {
        enabled: true,
        open: '09:00',
        close: '22:00'
      };
    });
    return settings?.operatingHours || defaultHours;
  });

  const [selectedTemplate, setSelectedTemplate] = useState('7days');
  const [showHelp, setShowHelp] = useState({});
  const [validation, setValidation] = useState({});

  const applyTemplate = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    const newHours = {};
    
    DAYS.forEach(day => {
      if (templateId === '7days') {
        newHours[day.id] = { enabled: true, open: '09:00', close: '22:00' };
      } else if (templateId === 'weekdays') {
        const isWeekend = day.id === 'saturday' || day.id === 'sunday';
        newHours[day.id] = isWeekend 
          ? { enabled: false, open: '09:00', close: '22:00' }
          : { enabled: true, open: '09:00', close: '22:00' };
      } else if (templateId === 'weekend') {
        const isWeekend = day.id === 'saturday' || day.id === 'sunday';
        newHours[day.id] = isWeekend 
          ? { enabled: true, open: '10:00', close: '23:00' }
          : { enabled: false, open: '10:00', close: '23:00' };
      } else {
        newHours[day.id] = hours[day.id] || { enabled: true, open: '09:00', close: '22:00' };
      }
    });
    
    setHours(newHours);
    validateHours(newHours);
  }, [hours]);

  const validateHours = useCallback((hoursData) => {
    const newValidation = {};
    
    DAYS.forEach(day => {
      if (hoursData[day.id]?.enabled) {
        const openTime = hoursData[day.id]?.open;
        const closeTime = hoursData[day.id]?.close;
        
        if (openTime >= closeTime) {
          newValidation[day.id] = { status: 'warning', message: 'Close time must be after open time' };
        } else {
          newValidation[day.id] = { status: 'valid', message: 'Valid hours' };
        }
      }
    });
    
    setValidation(newValidation);
  }, []);

  const handleDayChange = useCallback((dayId, field, value) => {
    setHours(prev => {
      const newHours = {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          [field]: value
        }
      };
      validateHours(newHours);
      return newHours;
    });
    setSelectedTemplate('custom');
  }, [validateHours]);

  const handleNext = useCallback(() => {
    // Validate at least one day is enabled
    const enabledDays = Object.values(hours).filter(h => h.enabled);
    if (enabledDays.length === 0) {
      setError({
        title: 'No Operating Hours Set',
        message: 'Please enable at least one day of operation.',
        retry: () => {}
      });
      return;
    }

    // Check for validation errors
    const hasErrors = Object.values(validation).some(v => v?.status === 'warning');
    if (hasErrors) {
      setError({
        title: 'Invalid Hours',
        message: 'Some days have invalid operating hours. Close time must be after open time.',
        retry: () => {}
      });
      return;
    }

    const updatedSettings = {
      ...settings,
      operatingHours: hours
    };
    localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    onNext(hours);
  }, [hours, settings, onNext, setError, validation]);

  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const getEnabledDaysCount = () => {
    return Object.values(hours).filter(h => h.enabled).length;
  };

  const renderFieldCard = (title, icon, children, helpText) => (
    <div style={{
      background: "var(--cafe-bg-surface)",
      border: "1px solid var(--cafe-border-light)",
      borderRadius: 16,
      padding: 24,
      marginBottom: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            {title}
          </h3>
        </div>
        {helpText && (
          <button
            onClick={() => toggleHelp(title)}
            style={{
              padding: "6px 10px",
              background: "var(--cafe-accent-bg)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-accent)",
              cursor: "pointer"
            }}
          >
            ?
          </button>
        )}
      </div>
      {showHelp[title] && helpText && (
        <div style={{
          padding: 12,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
          color: "var(--cafe-info)"
        }}>
          {helpText}
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: isMobile ? "100%" : 900, margin: "0 auto" }}>
      {/* Quick Templates Card */}
      {renderFieldCard(
        "Quick Templates",
        "⚡",
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              style={{
                padding: "20px",
                border: selectedTemplate === template.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: 12,
                background: selectedTemplate === template.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (selectedTemplate !== template.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTemplate !== template.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{template.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                {template.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
                {template.description}
              </div>
            </button>
          ))}
        </div>,
        "Templates help you quickly set common operating hour patterns. You can customize individual days after selecting a template."
      )}

      {/* Weekly Schedule Card */}
      {renderFieldCard(
        "Weekly Schedule",
        "📅",
        <div style={{
          background: "var(--cafe-bg)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 12,
          overflow: "hidden"
        }}>
          {DAYS.map((day, idx) => (
            <div
              key={day.id}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "auto 1fr" : "140px 1fr auto auto",
                gap: 16,
                padding: "16px 20px",
                borderBottom: idx < DAYS.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                alignItems: "center",
                background: hours[day.id]?.enabled ? "var(--cafe-bg)" : "rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                {day.name}
              </div>
              
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={hours[day.id]?.enabled}
                  onChange={(e) => handleDayChange(day.id, 'enabled', e.target.checked)}
                  style={{ 
                    margin: 0,
                    width: 18,
                    height: 18,
                    cursor: "pointer"
                  }}
                />
                <span style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
                  {hours[day.id]?.enabled ? 'Open' : 'Closed'}
                </span>
              </label>

              {hours[day.id]?.enabled && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="time"
                      value={hours[day.id]?.open}
                      onChange={(e) => handleDayChange(day.id, 'open', e.target.value)}
                      style={{
                        padding: "10px 12px",
                        fontSize: 14,
                        border: validation[day.id]?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)",
                        outline: "none",
                        transition: "all 0.2s ease"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--cafe-accent)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = validation[day.id]?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--cafe-text-tertiary)" }}>to</span>
                    <input
                      type="time"
                      value={hours[day.id]?.close}
                      onChange={(e) => handleDayChange(day.id, 'close', e.target.value)}
                      style={{
                        padding: "10px 12px",
                        fontSize: 14,
                        border: validation[day.id]?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                        borderRadius: 8,
                        background: "var(--cafe-bg-surface)",
                        color: "var(--cafe-text-primary)",
                        outline: "none",
                        transition: "all 0.2s ease"
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--cafe-accent)";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 69, 19, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = validation[day.id]?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  {validation[day.id]?.status === 'warning' && (
                    <span style={{ fontSize: 12, color: "var(--cafe-warning)" }}>
                      ⚠
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>,
        "Configure individual day hours. Uncheck a day to mark it as closed."
      )}

      {/* Live Preview Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span>👁️</span>
          Hours Preview
        </h3>
        <div style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          color: "#000"
        }}>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
            Open <strong style={{ color: "#000" }}>{getEnabledDaysCount()} days</strong> per week
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DAYS.filter(day => hours[day.id]?.enabled).map(day => (
              <span
                key={day.id}
                style={{
                  padding: "8px 14px",
                  background: "var(--cafe-accent-bg)",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--cafe-accent)",
                  border: "1px solid var(--cafe-accent)"
                }}
              >
                {day.short}: {hours[day.id]?.open} - {hours[day.id]?.close}
              </span>
            ))}
          </div>
          {getEnabledDaysCount() === 0 && (
            <div style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
              No operating hours set
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = "var(--cafe-accent)";
              e.currentTarget.style.background = "var(--cafe-accent-bg)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--cafe-border)";
            e.currentTarget.style.background = "var(--cafe-bg-surface)";
          }}
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(139, 69, 19, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
