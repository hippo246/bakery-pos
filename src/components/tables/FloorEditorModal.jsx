/**
 * FloorEditorModal.jsx — Visual Layout Studio
 * Rewritten for reliability: inspector edits are local until "Apply",
 * canvas drag uses corrected scale math, save/discard is explicit.
 */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import floorEngine from '../../tables/FloorEngine.js';

const SECTION_TYPES = ['indoor', 'outdoor', 'bar', 'vip', 'kitchen', 'terrace'];
const PRESET_COLORS = ['#e8f5e9', '#fff3e0', '#e3f2fd', '#fce4ec', '#f3e5f5', '#e0f7fa', '#fff8e1', '#f1f8e9'];

const snap = (v, g = 10) => Math.round(v / g) * g;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function FloorEditorModal({ onClose, onUpdate }) {
  const [floors, setFloors]           = useState([]);
  const [sections, setSections]       = useState([]);
  const [floorId, setFloorId]         = useState(null);

  // What is selected on the left list
  const [selType, setSelType]         = useState(null); // 'floor' | 'section'
  const [selId, setSelId]             = useState(null);

  // Inspector — local copy, not saved until Apply
  const [draft, setDraft]             = useState(null);
  const [dirty, setDirty]             = useState(false);
  const [saveMsg, setSaveMsg]         = useState('');

  const canvasRef   = useRef(null);
  const interRef    = useRef(null); // {mode, startX, startY, orig}
  const manualZoomRef = useRef(false);
  const [scale, setScale] = useState(1);

  // ── Load ───────────────────────────────────────────────────────────────────
  const reload = useCallback(() => {
    const allFloors = floorEngine.getAllFloors();
    setFloors(allFloors);
    if (floorId) setSections(floorEngine.getFloorSections(floorId));
  }, [floorId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const allFloors = floorEngine.getAllFloors();
    if (allFloors.length > 0 && !floorId) {
      const id = allFloors[0].id;
      startTransition(() => {
        setFloorId(id);
        setSections(floorEngine.getFloorSections(id));
      });
    }
  }, [floors, floorId]);

  // ── Scale calculation ──────────────────────────────────────────────────────
  // Fit-to-screen is a callback so it can be re-run manually (via the FIT button)
  // and on floor switch, without re-running (and clobbering manual zoom) on every
  // reload — previously this ran on every `floors` change, silently resetting
  // zoom any time Apply was clicked.
  const fitToScreen = useCallback(() => {
    const el = canvasRef.current;
    const floor = floors.find(f => f.id === floorId);
    if (!el || !floor?.dimensions) return;
    const cw = el.clientWidth - 40;
    const ch = el.clientHeight - 40;
    const s = Math.min(cw / floor.dimensions.width, ch / floor.dimensions.height, 1.5);
    manualZoomRef.current = false;
    setScale(Math.max(0.2, s));
   
  }, [floorId, floors]);

  useEffect(() => {
    startTransition(() => fitToScreen());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  const zoomBy = (factor) => {
    manualZoomRef.current = true;
    setScale(s => clamp(Number((s * factor).toFixed(2)), 0.1, 3));
  };

  // ── Select helpers ─────────────────────────────────────────────────────────
  const selectFloor = (id) => {
    setFloorId(id);
    setSelType('floor');
    setSelId(id);
    setSections(floorEngine.getFloorSections(id));
    const f = floors.find(f => f.id === id);
    setDraft(f ? { ...f } : null);
    setDirty(false);
    setSaveMsg('');
  };

  const selectSection = (id) => {
    const sec = sections.find(s => s.id === id);
    if (!sec) return;
    setSelType('section');
    setSelId(id);
    setDraft({ ...sec });
    setDirty(false);
    setSaveMsg('');
  };

  // ── Draft field update ─────────────────────────────────────────────────────
  const setField = (path, value) => {
    setDraft(prev => {
      const next = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        next[parent] = { ...next[parent], [child]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
    setDirty(true);
    setSaveMsg('');
  };

  // ── Apply changes ──────────────────────────────────────────────────────────
  const applyChanges = () => {
    if (!draft || !dirty) return;
    if (selType === 'floor') {
      floorEngine.updateFloor(draft.id, { name: draft.name, dimensions: draft.dimensions });
    } else if (selType === 'section') {
      floorEngine.updateSection(draft.id, {
        name:       draft.name,
        type:       draft.type,
        color:      draft.color,
        position:   draft.position,
        dimensions: draft.dimensions,
      });
    }
    reload();
    setDirty(false);
    setSaveMsg('✓ Saved');
    setTimeout(() => setSaveMsg(''), 2000);
    if (onUpdate) onUpdate();
  };

  const discardChanges = () => {
    const original = selType === 'floor'
      ? floors.find(f => f.id === selId)
      : sections.find(s => s.id === selId);
    if (original) { setDraft({ ...original }); setDirty(false); setSaveMsg(''); }
  };

  // ── Create / Delete ────────────────────────────────────────────────────────
  const createFloor = () => {
    const f = floorEngine.createFloor({ name: 'New Floor', dimensions: { width: 1200, height: 900 } });
    setFloors(floorEngine.getAllFloors());
    setFloorId(f.id);
    setSelType('floor');
    setSelId(f.id);
    setSections(floorEngine.getFloorSections(f.id));
    setDraft({ ...f });
    setDirty(false);
    setSaveMsg('');
  };

  const createSection = () => {
    if (!floorId) return;
    const s = floorEngine.createSection(floorId, {
      name: 'New Section', type: 'indoor', color: '#e8f5e9',
      position: { x: 50, y: 50 }, dimensions: { width: 300, height: 200 },
    });
    setSections(floorEngine.getFloorSections(floorId));
    setSelType('section');
    setSelId(s.id);
    setDraft({ ...s });
    setDirty(false);
    setSaveMsg('');
  };

  const duplicateSection = () => {
    if (!floorId || selType !== 'section' || !draft) return;
    const s = floorEngine.createSection(floorId, {
      name: `${draft.name} copy`, type: draft.type, color: draft.color,
      position: { x: (draft.position?.x || 0) + 20, y: (draft.position?.y || 0) + 20 },
      dimensions: { ...draft.dimensions },
    });
    setSections(floorEngine.getFloorSections(floorId));
    setSelType('section');
    setSelId(s.id);
    setDraft({ ...s });
    setDirty(false);
    setSaveMsg('');
  };

  // ── Close with unsaved-changes guard ───────────────────────────────────────
  const handleClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them and close?')) return;
    onClose();
  };

  const deleteSelected = () => {
    if (!selId) return;
    if (!window.confirm(`Delete this ${selType}?`)) return;
    if (selType === 'floor') {
      floorEngine.deleteFloor(selId);
      setFloorId(null); setSelType(null); setSelId(null); setDraft(null);
      setSections([]);
      // Don't call reload() here — it still closes over the just-deleted floorId
      // (this render's state hasn't caught up to setFloorId(null) yet) and would
      // immediately repopulate sections from that now-nonexistent floor, undoing
      // the setSections([]) above. Refresh the floor list directly instead.
      setFloors(floorEngine.getAllFloors());
    } else {
      floorEngine.deleteSection(floorId, selId);
      setSelType('floor'); setSelId(floorId);
      const f = floors.find(f => f.id === floorId);
      setDraft(f ? { ...f } : null);
      reload();
    }
    if (onUpdate) onUpdate();
  };

  // ── Canvas drag (move / resize sections) ──────────────────────────────────
  const onCanvasMouseDown = useCallback((e, secId, mode) => {
    e.stopPropagation();
    if (secId !== selId) selectSection(secId);
    const sec = sections.find(s => s.id === secId);
    if (!sec) return;
    const point = e.touches ? e.touches[0] : e;
    interRef.current = {
      mode,
      startX: point.clientX, startY: point.clientY,
      orig: { ...sec.position, ...sec.dimensions },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId, sections]);

  useEffect(() => {
    const onMove = (e) => {
      const inter = interRef.current;
      if (!inter || selType !== 'section' || !draft) return;
      const point = e.touches ? e.touches[0] : e;
      if (e.touches) e.preventDefault(); // stop page scroll while dragging on touch
      const dx = (point.clientX - inter.startX) / scale;
      const dy = (point.clientY - inter.startY) / scale;
      const floor = floors.find(f => f.id === floorId);
      const maxW = floor?.dimensions?.width  || 4000;
      const maxH = floor?.dimensions?.height || 4000;
      if (inter.mode === 'move') {
        const w = draft.dimensions?.width  || 200;
        const h = draft.dimensions?.height || 150;
        setDraft(prev => ({ ...prev, position: {
          x: clamp(snap(inter.orig.x + dx), 0, Math.max(0, maxW - w)),
          y: clamp(snap(inter.orig.y + dy), 0, Math.max(0, maxH - h)),
        } }));
        setDirty(true);
      } else if (inter.mode === 'resize') {
        const x = draft.position?.x || 0;
        const y = draft.position?.y || 0;
        setDraft(prev => ({ ...prev,
          dimensions: {
            width:  clamp(snap(inter.orig.width  + dx), 80, Math.max(80, maxW - x)),
            height: clamp(snap(inter.orig.height + dy), 60, Math.max(60, maxH - y)),
          }
        }));
        setDirty(true);
      }
    };
    const onUp = () => { interRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [scale, selType, draft, floors, floorId]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  // Esc = close (guarded), Cmd/Ctrl+S = apply, Delete/Backspace = delete selected,
  // Arrow keys = nudge selected section by 1px (10px with Shift).
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'select' || tag === 'textarea';

      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        applyChanges();
        return;
      }

      if (inField) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (selType === 'section' && draft && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        setDraft(prev => ({ ...prev, position: { x: (prev.position?.x || 0) + dx, y: (prev.position?.y || 0) + dy } }));
        setDirty(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId, selType, draft, dirty]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeFloor = useMemo(() => floors.find(f => f.id === floorId), [floors, floorId]);
  const displaySections = useMemo(() => {
    if (selType === 'section' && draft) {
      return sections.map(s => s.id === draft.id ? { ...s, ...draft } : s);
    }
    return sections;
  }, [sections, selType, draft]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex', flexDirection:'column', background:'var(--cafe-bg)' }}>
      {/* ── Top bar ── */}
      <div style={{ height:52, padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--cafe-border)', background:'var(--cafe-bg-elevated)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:18 }}>🗺️</span>
          <span style={{ fontSize:15, fontWeight:800, color:'var(--cafe-text-primary)' }}>Visual Layout Studio</span>
          {dirty && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--cafe-warning-bg)', color:'var(--cafe-warning)', fontWeight:700 }}>Unsaved changes</span>}
          {saveMsg && <span style={{ fontSize:11, color:'var(--cafe-success)', fontWeight:700 }}>{saveMsg}</span>}
          {activeFloor && (
            <span style={{ fontSize:11, color:'var(--cafe-text-tertiary)' }}>
              {sections.length} section{sections.length === 1 ? '' : 's'} · {activeFloor.dimensions?.width}×{activeFloor.dimensions?.height}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {dirty && <>
            <button onClick={discardChanges} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--cafe-border)', background:'transparent', color:'var(--cafe-text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Discard</button>
            <button onClick={applyChanges} title="Ctrl/Cmd+S" style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'var(--cafe-accent)', color:'#1a0e00', fontSize:12, fontWeight:800, cursor:'pointer' }}>✓ Apply</button>
          </>}
          <button onClick={handleClose} title="Esc" style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--cafe-border)', background:'transparent', color:'var(--cafe-text-secondary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>✕ Close</button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:'flex', minHeight:0 }}>

        {/* ── Left panel ── */}
        <div style={{ width:260, borderRight:'1px solid var(--cafe-border)', background:'var(--cafe-bg-elevated)', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto', overflowX:'hidden' }}>

          {/* Floors list */}
          <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--cafe-border-light)', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--cafe-text-tertiary)' }}>Floors</span>
              <button onClick={createFloor} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--cafe-border)', background:'transparent', color:'var(--cafe-accent)', cursor:'pointer', fontWeight:700 }}>+ Add</button>
            </div>
            {floors.map(f => (
              <div key={f.id} onClick={() => selectFloor(f.id)}
                style={{ padding:'8px 10px', borderRadius:8, marginBottom:3, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  background: selType==='floor' && selId===f.id ? 'var(--cafe-accent-dim)' : 'transparent',
                  border: `1px solid ${selType==='floor' && selId===f.id ? 'var(--cafe-accent-border)' : 'transparent'}` }}>
                <span style={{ fontSize:14 }}>🏢</span>
                <span style={{ fontSize:13, fontWeight: selId===f.id ? 700 : 400, color:'var(--cafe-text-primary)', flex:1 }}>{f.name}</span>
                {floorId === f.id && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:8, background:'var(--cafe-accent)', color:'#1a0e00', fontWeight:800 }}>ACTIVE</span>}
              </div>
            ))}
            {floors.length === 0 && (
              <div style={{ textAlign:'center', padding:'16px 0', color:'var(--cafe-text-tertiary)', fontSize:12 }}>No floors yet.<br/>Click + Add to create one.</div>
            )}
          </div>

          {/* Sections list */}
          <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--cafe-border-light)', flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--cafe-text-tertiary)' }}>Sections</span>
              <button onClick={createSection} disabled={!floorId}
                style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--cafe-border)', background:'transparent', color: floorId ? 'var(--cafe-accent)' : 'var(--cafe-text-tertiary)', cursor: floorId ? 'pointer' : 'not-allowed', fontWeight:700 }}>+ Add</button>
            </div>
            {sections.map(s => (
              <div key={s.id} onClick={() => selectSection(s.id)}
                style={{ padding:'8px 10px', borderRadius:8, marginBottom:3, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                  background: selType==='section' && selId===s.id ? 'var(--cafe-accent-dim)' : 'transparent',
                  border: `1px solid ${selType==='section' && selId===s.id ? 'var(--cafe-accent-border)' : 'transparent'}` }}>
                <div style={{ width:12, height:12, borderRadius:3, background:s.color, flexShrink:0, border:'1px solid rgba(0,0,0,0.15)' }} />
                <span style={{ fontSize:13, fontWeight: selId===s.id ? 700 : 400, color:'var(--cafe-text-primary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                <span style={{ fontSize:10, color:'var(--cafe-text-tertiary)', textTransform:'capitalize', flexShrink:0 }}>{s.type}</span>
              </div>
            ))}
            {sections.length === 0 && floorId && (
              <div style={{ textAlign:'center', padding:'16px 0', color:'var(--cafe-text-tertiary)', fontSize:12 }}>No sections yet.<br/>Click + Add to create one.</div>
            )}
          </div>

          {/* Inspector — always visible, no fixed height */}
          {draft ? (
            <div style={{ padding:14, background:'var(--cafe-bg-card)', flexShrink:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontSize:12, fontWeight:800, color:'var(--cafe-text-primary)' }}>{selType==='floor' ? '🏢 Floor' : '🟦 Section'} Properties</span>
                <div style={{ display:'flex', gap:6 }}>
                  {selType === 'section' && (
                    <button onClick={duplicateSection} title="Duplicate section" style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--cafe-border)', background:'transparent', color:'var(--cafe-accent)', cursor:'pointer', fontWeight:700 }}>⧉ Duplicate</button>
                  )}
                  {selId && <button onClick={deleteSelected} title="Delete (Del)" style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid var(--cafe-danger-border)', background:'var(--cafe-danger-bg)', color:'var(--cafe-danger)', cursor:'pointer', fontWeight:700 }}>Delete</button>}
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Name</div>
                <input value={draft.name || ''} onChange={e => setField('name', e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:13, boxSizing:'border-box' }} />
              </div>

              {/* Section-only: type + color */}
              {selType === 'section' && (
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Type</div>
                    <select value={draft.type || 'indoor'} onChange={e => setField('type', e.target.value)}
                      style={{ width:'100%', padding:'8px 10px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:13 }}>
                      {SECTION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ width:52 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Color</div>
                    <input type="color" value={draft.color || '#e8f5e9'} onChange={e => setField('color', e.target.value)}
                      style={{ width:'100%', height:36, padding:2, border:'1px solid var(--cafe-border)', borderRadius:7, cursor:'pointer', background:'var(--cafe-bg-surface)' }} />
                  </div>
                </div>
              )}

              {/* Color presets */}
              {selType === 'section' && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>Quick Colors</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {PRESET_COLORS.map(c => (
                      <div key={c} onClick={() => setField('color', c)} title={c}
                        style={{ width:22, height:22, borderRadius:5, background:c, cursor:'pointer', border:`2px solid ${draft.color===c ? 'var(--cafe-accent)' : 'rgba(0,0,0,0.15)'}`, flexShrink:0 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Dimensions */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Size — Width × Height</div>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, color:'var(--cafe-text-tertiary)', marginBottom:2 }}>Width</div>
                    <input type="number" value={draft.dimensions?.width || 0} onChange={e => setField('dimensions.width', Math.max(50, Number(e.target.value)))}
                      style={{ width:'100%', padding:'7px 8px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:12, boxSizing:'border-box' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, color:'var(--cafe-text-tertiary)', marginBottom:2 }}>Height</div>
                    <input type="number" value={draft.dimensions?.height || 0} onChange={e => setField('dimensions.height', Math.max(50, Number(e.target.value)))}
                      style={{ width:'100%', padding:'7px 8px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:12, boxSizing:'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Position (sections only) */}
              {selType === 'section' && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--cafe-text-tertiary)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>Position — X, Y</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:'var(--cafe-text-tertiary)', marginBottom:2 }}>X</div>
                      <input type="number" value={draft.position?.x || 0} onChange={e => setField('position.x', Number(e.target.value))}
                        style={{ width:'100%', padding:'7px 8px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:12, boxSizing:'border-box' }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, color:'var(--cafe-text-tertiary)', marginBottom:2 }}>Y</div>
                      <input type="number" value={draft.position?.y || 0} onChange={e => setField('position.y', Number(e.target.value))}
                        style={{ width:'100%', padding:'7px 8px', background:'var(--cafe-bg-surface)', border:'1px solid var(--cafe-border)', borderRadius:7, color:'var(--cafe-text-primary)', fontSize:12, boxSizing:'border-box' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Apply / Discard inline */}
              {dirty && (
                <div style={{ display:'flex', gap:6, marginTop:12 }}>
                  <button onClick={discardChanges} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid var(--cafe-border)', background:'transparent', color:'var(--cafe-text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Discard</button>
                  <button onClick={applyChanges} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:'var(--cafe-accent)', color:'#1a0e00', fontSize:12, fontWeight:800, cursor:'pointer' }}>✓ Apply</button>
                </div>
              )}
              {saveMsg && <div style={{ marginTop:8, textAlign:'center', fontSize:12, color:'var(--cafe-success)', fontWeight:700 }}>{saveMsg}</div>}
            </div>
          ) : (
            <div style={{ padding:20, textAlign:'center', color:'var(--cafe-text-tertiary)', fontSize:12 }}>
              Select a floor or section<br/>to edit its properties
            </div>
          )}
        </div>

        {/* ── Canvas ── */}
        <div ref={canvasRef} style={{ flex:1, background:'#1e1a14', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center',
          backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'20px 20px' }}
          onMouseLeave={() => { interRef.current = null; }}
        >
          {activeFloor ? (
            <div style={{ position:'relative', width:activeFloor.dimensions?.width || 1200, height:activeFloor.dimensions?.height || 900,
              background:'#faf8f5', boxShadow:'0 20px 60px rgba(0,0,0,0.5)', transform:`scale(${scale})`, transformOrigin:'center center',
              backgroundImage:'linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)',
              backgroundSize:'10px 10px' }}
            >
              {displaySections.map(sec => {
                const isSel = selType === 'section' && selId === sec.id;
                return (
                  <div key={sec.id}
                    onMouseDown={e => onCanvasMouseDown(e, sec.id, 'move')}
                    onTouchStart={e => onCanvasMouseDown(e, sec.id, 'move')}
                    style={{ position:'absolute', left:sec.position?.x||0, top:sec.position?.y||0,
                      width:sec.dimensions?.width||200, height:sec.dimensions?.height||150,
                      background:(sec.color||'#e8f5e9')+'44',
                      border:`2px solid ${isSel ? 'var(--cafe-accent)' : sec.color||'#aaa'}`,
                      borderRadius:8, cursor:'move', zIndex:isSel?10:1,
                      boxShadow: isSel ? '0 0 0 2px rgba(212,146,42,0.4)' : 'none',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      userSelect:'none' }}>
                    <div style={{ background:'rgba(255,255,255,0.9)', padding:'4px 10px', borderRadius:6, fontSize:12, fontWeight:700, color:'#333', pointerEvents:'none', boxShadow:'0 2px 6px rgba(0,0,0,0.1)', maxWidth:'80%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {sec.name}
                    </div>
                    {/* Resize handle */}
                    {isSel && (
                      <div onMouseDown={e => { e.stopPropagation(); onCanvasMouseDown(e, sec.id, 'resize'); }}
                        onTouchStart={e => { e.stopPropagation(); onCanvasMouseDown(e, sec.id, 'resize'); }}
                        style={{ position:'absolute', right:-6, bottom:-6, width:14, height:14,
                          background:'white', border:'2px solid var(--cafe-accent)', borderRadius:'50%',
                          cursor:'nwse-resize', zIndex:20, boxShadow:'0 2px 6px rgba(0,0,0,0.2)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:14 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🗺️</div>
              Select or create a floor to begin
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ position:'absolute', bottom:16, right:16, display:'flex', alignItems:'center', gap:2, background:'rgba(0,0,0,0.4)', borderRadius:8, padding:2 }}>
            <button onClick={() => zoomBy(0.8)} title="Zoom out" style={{ width:26, height:26, border:'none', borderRadius:6, background:'transparent', color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:700, cursor:'pointer' }}>−</button>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontFamily:'monospace', minWidth:40, textAlign:'center' }}>{Math.round(scale*100)}%</span>
            <button onClick={() => zoomBy(1.25)} title="Zoom in" style={{ width:26, height:26, border:'none', borderRadius:6, background:'transparent', color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:700, cursor:'pointer' }}>+</button>
            <button onClick={fitToScreen} title="Fit to screen" style={{ padding:'0 8px', height:26, border:'none', borderRadius:6, background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:700, cursor:'pointer' }}>FIT</button>
          </div>

          {/* Instructions */}
          {activeFloor && selType === 'section' && (
            <div style={{ position:'absolute', bottom:16, left:16, fontSize:11, color:'rgba(255,255,255,0.4)', background:'rgba(0,0,0,0.4)', padding:'4px 10px', borderRadius:8 }}>
              Drag to move · Drag ◉ to resize · Arrow keys to nudge · ⌘/Ctrl+S to save · Del to delete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
