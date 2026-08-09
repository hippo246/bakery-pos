import React from 'react';
// Tables Step for Setup Wizard
// Service areas and tables configuration with presets and floor preview with premium UX

import { useState, useCallback, useEffect, useMemo, useRef } from "react";

// Matches the default floor created by InteractiveFloorPlan ('main-floor',
// 1200x900) and the dimensions/cascade spacing handleAddTable() uses there.
// Reusing the exact same numbers means a layout arranged here drops the
// tables in the same spots once the real floor plan takes over — nothing
// resets to a stacked (0,0) pile on first load.
const FLOOR_WIDTH = 1200;
const FLOOR_HEIGHT = 900;
const DEFAULT_TABLE_DIM = { width: 80, height: 80 };
const CASCADE_SPACING = 100;
const CASCADE_COLUMNS = 6;

const cascadePosition = (index) => ({
  x: 60 + (index % CASCADE_COLUMNS) * CASCADE_SPACING,
  y: 60 + Math.floor(index / CASCADE_COLUMNS) * CASCADE_SPACING
});

const AREA_TYPES = [
  { id: 'indoor', name: 'Indoor', icon: '🏠' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
  { id: 'terrace', name: 'Terrace', icon: '☀️' },
  { id: 'private', name: 'Private Room', icon: '🚪' },
  { id: 'bar', name: 'Bar', icon: '🍸' }
];

const TABLE_PRESETS = [
  { id: 'small', name: 'Small Cafe', description: '6 tables, 24 seats', tables: 6, capacity: 4, icon: '☕' },
  { id: 'medium', name: 'Medium Cafe', description: '12 tables, 48 seats', tables: 12, capacity: 4, icon: '🏪' },
  { id: 'large', name: 'Large Cafe', description: '20 tables, 80 seats', tables: 20, capacity: 4, icon: '🏢' },
  { id: 'custom', name: 'Custom', description: 'Add tables manually', tables: 0, capacity: 4, icon: '⚙️' }
];

const makeId = () => (crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export default function TablesStep({ settings, onNext, onBack, isMobile, isTablet, isLoading, error, setError }) {
  const [tables, setTables] = useState(() => {
    return settings?.tables || [];
  });

  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [showHelp, setShowHelp] = useState({});
  const [validation, setValidation] = useState({});

  // Free-form floor preview drag state. Positions live in floor units
  // (the same 1200x900 space InteractiveFloorPlan uses), independent of
  // however large the preview canvas happens to be rendered on screen.
  const [draggingId, setDraggingId] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const previewRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Tables saved before this feature existed (or added via a preset that
  // predates position tracking) won't have `position`/`dimensions` yet.
  // Backfill them once so they don't all pile up on top of each other.
  useEffect(() => {
    setTables(prev => {
      if (prev.every(t => t.position && t.dimensions)) return prev;
      let cascadeIdx = 0;
      return prev.map(t => (t.position && t.dimensions) ? t : ({
        ...t,
        position: t.position || cascadePosition(cascadeIdx++),
        dimensions: t.dimensions || DEFAULT_TABLE_DIM,
        shape: t.shape || 'rect'
      }));
    });
     
  }, []);

  // Keep the preview's floor-unit-to-pixel scale in sync with however wide
  // the card actually renders (sidebar layouts, mobile, window resize, etc).
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) setPreviewScale(width / FLOOR_WIDTH);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const validateTables = useCallback((tablesData) => {
    const newValidation = {};
    tablesData.forEach(table => {
      if (table.capacity < 1 || table.capacity > 20) {
        newValidation[table.id] = { status: 'warning', message: 'Capacity must be 1-20' };
      } else {
        newValidation[table.id] = { status: 'valid', message: 'Valid' };
      }
    });
    setValidation(newValidation);
  }, []);

  // Tables loaded from settings may already be invalid (edited elsewhere, or
  // imported); validate them immediately instead of waiting for the user to
  // touch a field before any warning appears.
  useEffect(() => {
    if (tables.length > 0) {
      validateTables(tables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = useCallback((presetId) => {
    setSelectedPreset(presetId);
    const preset = TABLE_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      const newTables = [];
      for (let i = 1; i <= preset.tables; i++) {
        newTables.push({
          id: makeId(),
          number: i,
          capacity: preset.capacity,
          area: 'indoor',
          status: 'available',
          position: cascadePosition(i - 1),
          dimensions: DEFAULT_TABLE_DIM,
          shape: 'rect'
        });
      }
      setTables(newTables);
      validateTables(newTables);
    }
  }, [validateTables]);

  const addTable = useCallback(() => {
    setTables(prev => {
      const newTable = {
        id: makeId(),
        number: prev.length + 1,
        capacity: 4,
        area: 'indoor',
        status: 'available',
        position: cascadePosition(prev.length),
        dimensions: DEFAULT_TABLE_DIM,
        shape: 'rect'
      };
      const newTables = [...prev, newTable];
      validateTables(newTables);
      return newTables;
    });
    setSelectedPreset('custom');
  }, [validateTables]);

  const removeTable = useCallback((tableId) => {
    setTables(prev => {
      // ids are stable and never regenerated, so removing a table can't
      // reassign another table's identity — only the display `number` of
      // tables after it shifts down.
      const renumbered = prev
        .filter(t => t.id !== tableId)
        .map((t, i) => ({ ...t, number: i + 1 }));
      validateTables(renumbered);
      return renumbered;
    });
    setSelectedPreset('custom');
  }, [validateTables]);

  const updateTable = useCallback((tableId, field, value) => {
    setTables(prev => {
      const newTables = prev.map(t =>
        t.id === tableId ? { ...t, [field]: value } : t
      );
      validateTables(newTables);
      return newTables;
    });
    setSelectedPreset('custom');
  }, [validateTables]);

  const moveTable = useCallback((tableId, direction) => {
    setTables(prev => {
      const index = prev.findIndex(t => t.id === tableId);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newTables = [...prev];
      [newTables[index], newTables[targetIndex]] = [newTables[targetIndex], newTables[index]];
      return newTables.map((t, i) => ({ ...t, number: i + 1 }));
    });
    setSelectedPreset('custom');
  }, []);

  // Free-form drag: convert a pointer event into floor-unit coordinates
  // relative to the preview canvas, independent of its on-screen scale.
  const pointerToFloorPos = useCallback((e) => {
    const el = previewRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scale = previewScale || 1;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  }, [previewScale]);

  const handleTablePointerDown = useCallback((e, table) => {
    e.preventDefault();
    e.stopPropagation();
    const pointerPos = pointerToFloorPos(e);
    dragOffsetRef.current = {
      x: pointerPos.x - (table.position?.x ?? 0),
      y: pointerPos.y - (table.position?.y ?? 0)
    };
    setDraggingId(table.id);
  }, [pointerToFloorPos]);

  // No snapping, no clamping to the canvas edges — same freedom the real
  // InteractiveFloorPlan gives (its own handleDragMove never bounds x/y),
  // so a layout arranged here behaves identically once it's live.
  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (e) => {
      const pointerPos = pointerToFloorPos(e);
      const x = pointerPos.x - dragOffsetRef.current.x;
      const y = pointerPos.y - dragOffsetRef.current.y;
      setTables(prev => prev.map(t => t.id === draggingId ? { ...t, position: { x, y } } : t));
    };
    const handleUp = () => {
      setDraggingId(null);
      setSelectedPreset('custom');
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingId, pointerToFloorPos]);

  // Keyboard fallback for the free-form canvas: nudge position instead of
  // swapping list order, since tiles are no longer laid out in a grid.
  const nudgeTablePosition = useCallback((tableId, dx, dy) => {
    setTables(prev => prev.map(t => t.id === tableId
      ? { ...t, position: { x: (t.position?.x ?? 0) + dx, y: (t.position?.y ?? 0) + dy } }
      : t));
    setSelectedPreset('custom');
  }, []);

  const resetFloorLayout = useCallback(() => {
    setTables(prev => prev.map((t, i) => ({ ...t, position: cascadePosition(i) })));
    setSelectedPreset('custom');
  }, []);

  const handleNext = useCallback(() => {
    const hasInvalidTable = Object.values(validation).some(v => v.status === 'warning');
    if (hasInvalidTable) {
      setError({ title: 'Fix table capacities', message: 'One or more tables have a capacity outside the 1-20 range.' });
      return;
    }

    const updatedSettings = {
      ...settings,
      tables
    };
    try {
      localStorage.setItem('brewcrm_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
    }
    onNext(tables);
  }, [tables, validation, settings, onNext, setError]);

  const toggleHelp = useCallback((field) => {
    setShowHelp(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const totalCapacity = useMemo(() => tables.reduce((sum, t) => sum + t.capacity, 0), [tables]);

  const tablesByArea = useMemo(() => tables.reduce((acc, t) => {
    acc[t.area] = (acc[t.area] || 0) + 1;
    return acc;
  }, {}), [tables]);

  const renderFieldCard = (title, icon, children, helpText) => (
    <div style={{
      background: "var(--cafe-bg-surface)",
      border: "1px solid var(--cafe-border-light)",
      borderRadius: isMobile ? 12 : 16,
      padding: isMobile ? 16 : 24,
      marginBottom: isMobile ? 16 : 20
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 20, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 12 }}>
          <span style={{ fontSize: isMobile ? 20 : 24 }}>{icon}</span>
          <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0 }}>
            {title}
          </h3>
        </div>
        {helpText && (
          <button
            type="button"
            onClick={() => toggleHelp(title)}
            style={{
              padding: isMobile ? "4px 8px" : "6px 10px",
              background: "var(--cafe-accent-bg)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: isMobile ? 4 : 6,
              fontSize: isMobile ? 11 : 12,
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
          padding: isMobile ? 10 : 12,
          background: "var(--cafe-info-bg)",
          border: "1px solid var(--cafe-info-border)",
          borderRadius: isMobile ? 6 : 8,
          marginBottom: isMobile ? 12 : 16,
          fontSize: isMobile ? 12 : 13,
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
      {/* Quick Presets Card */}
      {renderFieldCard(
        "Quick Presets",
        "⚡",
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 12 }}>
          {TABLE_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              style={{
                padding: isMobile ? "16px" : "20px",
                border: selectedPreset === preset.id ? "2px solid var(--cafe-accent)" : "1px solid var(--cafe-border)",
                borderRadius: isMobile ? 10 : 12,
                background: selectedPreset === preset.id ? "var(--cafe-accent-bg)" : "var(--cafe-bg)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (selectedPreset !== preset.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPreset !== preset.id) {
                  e.currentTarget.style.borderColor = "var(--cafe-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <div style={{ fontSize: isMobile ? 24 : 28, marginBottom: isMobile ? 6 : 8 }}>{preset.icon}</div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
                {preset.name}
              </div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-text-secondary)", lineHeight: 1.4 }}>
                {preset.description}
              </div>
            </button>
          ))}
        </div>,
        "Presets help you quickly configure common table layouts. You can customize individual tables after selecting a preset."
      )}

      {/* Tables Card */}
      {renderFieldCard(
        "Table Configuration",
        "🪑",
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16, flexWrap: "wrap", gap: 8 }}>
            <h4 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "var(--cafe-text-secondary)", margin: 0 }}>
              Tables ({tables.length})
            </h4>
            <button
              type="button"
              onClick={addTable}
              style={{
                padding: isMobile ? "8px 14px" : "10px 16px",
                background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
                border: "none",
                borderRadius: isMobile ? 6 : 8,
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(139, 69, 19, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              + Add Table
            </button>
          </div>

          {tables.length === 0 ? (
            <div style={{
              padding: isMobile ? 32 : 40,
              textAlign: "center",
              background: "var(--cafe-bg)",
              border: "1px dashed var(--cafe-border)",
              borderRadius: isMobile ? 10 : 12
            }}>
              <div style={{ fontSize: isMobile ? 40 : 48, marginBottom: isMobile ? 10 : 12 }}>🪑</div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--cafe-text-secondary)" }}>
                No tables yet. Add a table or select a preset.
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--cafe-bg)",
              border: "1px solid var(--cafe-border)",
              borderRadius: isMobile ? 10 : 12,
              overflow: "hidden"
            }}>
              {tables.map((table, idx) => (
                <div
                  key={table.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "auto 1fr auto auto auto" : "80px 1fr auto auto auto",
                    gap: isMobile ? 12 : 16,
                    padding: isMobile ? "12px 16px" : "16px 20px",
                    borderBottom: idx < tables.length - 1 ? "1px solid var(--cafe-border-light)" : "none",
                    alignItems: "center"
                  }}
                >
                  <div style={{
                    width: isMobile ? 44 : 52,
                    height: isMobile ? 44 : 52,
                    borderRadius: isMobile ? 8 : 10,
                    background: "var(--cafe-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 700,
                    color: "#fff"
                  }}>
                    {table.number}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
                      <input
                        type="number"
                        value={table.capacity}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = parseInt(raw, 10);
                          // Committing a fallback of 2 here used to make an
                          // emptied/invalid field look "valid" again as soon
                          // as the user started retyping. 0 falls through to
                          // the existing capacity validation instead of
                          // hiding the problem.
                          updateTable(table.id, 'capacity', raw === '' || Number.isNaN(parsed) ? 0 : parsed);
                        }}
                        min="1"
                        max="20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.preventDefault();
                        }}
                        style={{
                          width: isMobile ? 70 : 80,
                          padding: isMobile ? "8px 10px" : "10px 12px",
                          fontSize: isMobile ? 13 : 14,
                          border: validation[table.id]?.status === 'warning' ? "1px solid var(--cafe-warning)" : "1px solid var(--cafe-border)",
                          borderRadius: isMobile ? 6 : 8,
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
                          e.currentTarget.style.borderColor = validation[table.id]?.status === 'warning' ? "var(--cafe-warning)" : "var(--cafe-border)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                      <span style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)" }}>
                        seats
                      </span>
                      {validation[table.id]?.status === 'warning' && (
                        <span style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-warning)" }}>⚠</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 4 }}>
                    <button
                      type="button"
                      onClick={() => moveTable(table.id, -1)}
                      disabled={idx === 0}
                      aria-label={`Move table ${table.number} up`}
                      style={{
                        padding: isMobile ? "3px 8px" : "4px 10px",
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: isMobile ? 4 : 6,
                        fontSize: isMobile ? 11 : 12,
                        color: idx === 0 ? "var(--cafe-text-tertiary)" : "var(--cafe-text-primary)",
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        opacity: idx === 0 ? 0.5 : 1
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTable(table.id, 1)}
                      disabled={idx === tables.length - 1}
                      aria-label={`Move table ${table.number} down`}
                      style={{
                        padding: isMobile ? "3px 8px" : "4px 10px",
                        background: "var(--cafe-bg-surface)",
                        border: "1px solid var(--cafe-border)",
                        borderRadius: isMobile ? 4 : 6,
                        fontSize: isMobile ? 11 : 12,
                        color: idx === tables.length - 1 ? "var(--cafe-text-tertiary)" : "var(--cafe-text-primary)",
                        cursor: idx === tables.length - 1 ? "not-allowed" : "pointer",
                        opacity: idx === tables.length - 1 ? 0.5 : 1
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  <select
                    value={table.area}
                    onChange={(e) => updateTable(table.id, 'area', e.target.value)}
                    style={{
                      padding: isMobile ? "8px 10px" : "10px 12px",
                      fontSize: isMobile ? 13 : 14,
                      border: "1px solid var(--cafe-border)",
                      borderRadius: isMobile ? 6 : 8,
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
                      e.currentTarget.style.borderColor = "var(--cafe-border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {AREA_TYPES.map(area => (
                      <option key={area.id} value={area.id}>{area.icon} {area.name}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove Table ${table.number}? This can't be undone.`)) {
                        removeTable(table.id);
                      }
                    }}
                    style={{
                      padding: isMobile ? "8px 12px" : "10px 14px",
                      background: "var(--cafe-danger-bg)",
                      border: "1px solid var(--cafe-danger-border)",
                      borderRadius: isMobile ? 6 : 8,
                      fontSize: isMobile ? 11 : 12,
                      fontWeight: 600,
                      color: "var(--cafe-danger)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--cafe-danger)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--cafe-danger-bg)";
                      e.currentTarget.style.color = "var(--cafe-danger)";
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>,
        "Configure individual table capacity and area assignments. Tables can be organized by dining area."
      )}

      {/* Floor Preview Card */}
      <div style={{
        background: "linear-gradient(135deg, var(--cafe-accent-bg) 0%, var(--cafe-bg-surface) 100%)",
        border: "1px solid var(--cafe-border-light)",
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? 16 : 24,
        marginBottom: isMobile ? 20 : 24
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16, flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: "var(--cafe-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span>👁️</span>
            Floor Preview
          </h3>
          {tables.length > 0 && (
            <button
              type="button"
              onClick={resetFloorLayout}
              title="Snap all tables back into a tidy grid"
              style={{
                padding: isMobile ? "4px 10px" : "6px 12px",
                background: "var(--cafe-bg-card)",
                border: "1px solid var(--cafe-border-light)",
                borderRadius: isMobile ? 6 : 8,
                fontSize: isMobile ? 11 : 12,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              ↺ Reset Layout
            </button>
          )}
        </div>
        <div style={{
          background: "#fff",
          borderRadius: isMobile ? 10 : 12,
          padding: isMobile ? 16 : 20,
          color: "#000"
        }}>
          <div style={{ display: "flex", gap: isMobile ? 12 : 16, marginBottom: isMobile ? 12 : 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: isMobile ? 13 : 14, color: "#666" }}>
              <strong style={{ color: "#000" }}>{tables.length}</strong> tables
            </div>
            <div style={{ fontSize: isMobile ? 13 : 14, color: "#666" }}>
              <strong style={{ color: "#000" }}>{totalCapacity}</strong> total seats
            </div>
          </div>
          
          {Object.keys(tablesByArea).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 6 : 8, marginBottom: isMobile ? 12 : 16 }}>
              {Object.entries(tablesByArea).map(([area, count]) => {
                const areaType = AREA_TYPES.find(a => a.id === area);
                return (
                  <span
                    key={area}
                    style={{
                      padding: isMobile ? "6px 12px" : "8px 14px",
                      background: "var(--cafe-accent-bg)",
                      borderRadius: 20,
                      fontSize: isMobile ? 11 : 12,
                      fontWeight: 600,
                      color: "var(--cafe-accent)",
                      border: "1px solid var(--cafe-accent)"
                    }}
                  >
                    {areaType?.icon} {areaType?.name}: {count}
                  </span>
                );
              })}
            </div>
          )}

          {/* Visual Floor Layout - freely draggable, same coordinate space
              (1200x900) as the real InteractiveFloorPlan. This is a live
              editor, not a mock preview: wherever a table lands here is
              exactly where it opens on the actual floor plan. */}
          <div style={{
            position: "relative",
            fontSize: 12,
            color: "var(--cafe-text-tertiary)",
            fontStyle: "italic",
            marginBottom: 8
          }}>
            Drag tables anywhere — no grid, no snapping. Focus a table and use arrow keys to nudge it.
          </div>
          <div
            ref={previewRef}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: `${FLOOR_WIDTH} / ${FLOOR_HEIGHT}`,
              background: "var(--cafe-bg-surface)",
              backgroundImage: "linear-gradient(var(--cafe-border-light) 1px, transparent 1px), linear-gradient(90deg, var(--cafe-border-light) 1px, transparent 1px)",
              backgroundSize: `${CASCADE_SPACING * previewScale}px ${CASCADE_SPACING * previewScale}px`,
              borderRadius: 8,
              border: "2px dashed var(--cafe-border)",
              overflow: "visible"
            }}
          >
            {tables.map((table) => {
              const isDragged = draggingId === table.id;
              const pos = table.position || { x: 0, y: 0 };
              const dim = table.dimensions || DEFAULT_TABLE_DIM;
              return (
                <div
                  key={table.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Table ${table.number}. Drag to reposition, or use arrow keys to nudge.`}
                  onMouseDown={(e) => handleTablePointerDown(e, table)}
                  onKeyDown={(e) => {
                    const step = e.shiftKey ? 40 : 10;
                    if (e.key === 'ArrowLeft') { e.preventDefault(); nudgeTablePosition(table.id, -step, 0); }
                    else if (e.key === 'ArrowRight') { e.preventDefault(); nudgeTablePosition(table.id, step, 0); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); nudgeTablePosition(table.id, 0, -step); }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); nudgeTablePosition(table.id, 0, step); }
                  }}
                  style={{
                    position: "absolute",
                    left: pos.x * previewScale,
                    top: pos.y * previewScale,
                    width: dim.width * previewScale,
                    height: dim.height * previewScale,
                    borderRadius: 10,
                    background: isDragged ? "var(--cafe-accent)" : "var(--cafe-accent-bg)",
                    border: "2px solid var(--cafe-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: isDragged ? "#fff" : "var(--cafe-accent)",
                    boxShadow: isDragged ? "0 8px 24px rgba(139, 69, 19, 0.4)" : "0 2px 8px rgba(139, 69, 19, 0.2)",
                    cursor: isDragged ? "grabbing" : "grab",
                    transition: isDragged ? "none" : "background 0.2s ease, box-shadow 0.2s ease",
                    userSelect: "none",
                    touchAction: "none",
                    zIndex: isDragged ? 10 : 1
                  }}
                >
                  {table.number}
                </div>
              );
            })}
            {tables.length === 0 && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: 13,
                color: "#999",
                padding: "40px 20px"
              }}>
                Floor layout will appear here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            padding: isMobile ? "12px 20px" : "14px 28px",
            background: "var(--cafe-bg-surface)",
            border: "1px solid var(--cafe-border)",
            borderRadius: isMobile ? 8 : 10,
            fontSize: isMobile ? 14 : 15,
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
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          style={{
            padding: isMobile ? "12px 24px" : "14px 32px",
            background: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
            border: "none",
            borderRadius: isMobile ? 8 : 10,
            fontSize: isMobile ? 14 : 15,
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
