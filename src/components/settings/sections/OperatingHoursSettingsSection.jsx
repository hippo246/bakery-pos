import React from 'react';
// Operating Hours Settings Section - Weekly Schedule with Templates
// Premium hours management

import { useState, useCallback } from "react";

const DAYS = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" }
];

const TEMPLATES = [
  { id: "standard", name: "Standard (9-5)", hours: { open: "09:00", close: "17:00" } },
  { id: "extended", name: "Extended (9-9)", hours: { open: "09:00", close: "21:00" } },
  { id: "late", name: "Late Night (11-11)", hours: { open: "11:00", close: "23:00" } },
  { id: "weekend", name: "Weekend (10-10)", hours: { open: "10:00", close: "22:00" } },
  { id: "247", name: "24/7", hours: { open: "00:00", close: "23:59" } }
];

export default function OperatingHoursSettingsSection({ settings, onUpdate, isMobile }) {
  const [formData, setFormData] = useState(() => {
    const defaultHours = {};
    DAYS.forEach(day => {
      defaultHours[day.id] = {
        enabled: true,
        open: "09:00",
        close: "21:00",
        breakStart: "",
        breakEnd: ""
      };
    });
    return {
      hours: settings?.hours || defaultHours,
      holidays: settings?.holidays || [],
      specialClosures: settings?.specialClosures || []
    };
  });

  const handleChange = useCallback((dayId, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [dayId]: {
          ...prev.hours[dayId],
          [field]: value
        }
      }
    }));
  }, []);

  const handleApplyTemplate = useCallback((template) => {
    setFormData(prev => {
      const newHours = { ...prev.hours };
      DAYS.forEach(day => {
        newHours[day.id] = {
          ...newHours[day.id],
          open: template.hours.open,
          close: template.hours.close
        };
      });
      return { ...prev, hours: newHours };
    });
  }, []);

  const handleCopyDay = useCallback((sourceDayId, targetDayId) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [targetDayId]: { ...prev.hours[sourceDayId] }
      }
    }));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const isOpenOnDay = (day) => formData.hours[day.id]?.enabled;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 20 : 24,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: "0 0 8px"
        }}>
          Operating Hours
        </h2>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: "var(--cafe-text-secondary)",
          margin: 0
        }}>
          Configure your cafe's weekly schedule and special hours
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px" : "32px" }}>
        {/* Quick Templates */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Quick Templates
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)",
            gap: 12
          }}>
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template)}
                style={{
                  padding: "16px",
                  background: "var(--cafe-bg-card)",
                  border: "1px solid var(--cafe-border)",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                  {template.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
                  {template.hours.open} - {template.hours.close}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Weekly Schedule
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {DAYS.map((day, idx) => (
              <div
                key={day.id}
                style={{
                  padding: "16px 20px",
                  borderBottom: idx < DAYS.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "140px 1fr auto",
                  gap: 16,
                  alignItems: "center"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={isOpenOnDay(day)}
                    onChange={(e) => handleChange(day.id, 'enabled', e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                      {day.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
                      {day.short}
                    </div>
                  </div>
                </div>

                {isOpenOnDay(day) && (
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4, display: "block" }}>
                        Open
                      </label>
                      <input
                        type="time"
                        value={formData.hours[day.id]?.open || "09:00"}
                        onChange={(e) => handleChange(day.id, 'open', e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: 14,
                          border: "1px solid var(--cafe-border)",
                          borderRadius: 6,
                          background: "var(--cafe-bg-surface)",
                          color: "var(--cafe-text-primary)"
                        }}
                      />
                    </div>
                    <span style={{ color: "var(--cafe-text-tertiary)" }}>→</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 4, display: "block" }}>
                        Close
                      </label>
                      <input
                        type="time"
                        value={formData.hours[day.id]?.close || "21:00"}
                        onChange={(e) => handleChange(day.id, 'close', e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: 14,
                          border: "1px solid var(--cafe-border)",
                          borderRadius: 6,
                          background: "var(--cafe-bg-surface)",
                          color: "var(--cafe-text-primary)"
                        }}
                      />
                    </div>
                  </div>
                )}

                {!isMobile && idx > 0 && (
                  <button
                    onClick={() => handleCopyDay(DAYS[idx - 1].id, day.id)}
                    style={{
                      padding: "8px 16px",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border)",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "var(--cafe-text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Copy from {DAYS[idx - 1].short}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Closures */}
        <div>
          <h3 style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--cafe-text-secondary)",
            margin: "0 0 16px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            Special Closures
          </h3>
          <div style={{
            background: "var(--cafe-bg-card)",
            border: "1px solid var(--cafe-border)",
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginBottom: 16 }}>
              Add temporary closures for holidays, maintenance, or special events.
            </div>
            <button
              style={{
                padding: "12px 20px",
                background: "var(--cafe-bg-surface)",
                border: "1px dashed var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer",
                width: "100%"
              }}
            >
              + Add Special Closure
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: isMobile ? "20px" : "32px",
        borderTop: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>
          {DAYS.filter(d => isOpenOnDay(d)).length} days open per week
        </div>
        <button
          onClick={handleSave}
          style={{
            padding: "12px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
