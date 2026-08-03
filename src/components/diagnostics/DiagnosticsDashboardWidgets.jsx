import React, { useState, useEffect } from 'react';
import { card } from '../../styles/theme';
import diagnosticsEngine from '../../diagnostics/DiagnosticsEngine.js';

export default function DiagnosticsDashboardWidgets({ isMobile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setData(await diagnosticsEngine.getDashboardData());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{...card, padding:24}}>Loading...</div>;
  if (!data) return <div style={{...card, padding:24}}>No data</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <SystemScoreWidget score={data.performance.score} />
      <IncidentWidget incidents={data.incidents} />
      <PredictionsWidget predictions={data.predictions} />
      <RecommendationsWidget recommendations={data.recommendations} />
    </div>
  );
}

function SystemScoreWidget({ score }) {
  const color = score.overall >= 75 ? '#10b981' : score.overall >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{...card,padding:24}}>
      <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Platform Health Score</h3>
      <div style={{fontSize:48,fontWeight:700,color}}>{score.overall}/100</div>
    </div>
  );
}

function IncidentWidget({ incidents }) {
  return (
    <div style={{...card,padding:24}}>
      <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Incidents</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        <div><div style={{fontSize:24,fontWeight:700}}>{incidents.total}</div><div style={{fontSize:12,color:'var(--cafe-text-secondary)'}}>Total</div></div>
        <div><div style={{fontSize:24,fontWeight:700,color:'#ef4444'}}>{incidents.critical}</div><div style={{fontSize:12,color:'var(--cafe-text-secondary)'}}>Critical</div></div>
        <div><div style={{fontSize:24,fontWeight:700,color:'#f59e0b'}}>{incidents.active}</div><div style={{fontSize:12,color:'var(--cafe-text-secondary)'}}>Active</div></div>
      </div>
    </div>
  );
}

function PredictionsWidget({ predictions }) {
  if (!predictions?.length) return <div style={{...card,padding:24}}><h3>Predictions</h3><div>No predictions</div></div>;
  return (
    <div style={{...card,padding:24}}>
      <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Predictions ({predictions.length})</h3>
      {predictions.slice(0,3).map(p => (
        <div key={p.id} style={{padding:12,background:'var(--cafe-bg)',borderRadius:8,marginBottom:8}}>
          <div style={{fontWeight:500}}>{p.component}</div>
          <div style={{fontSize:12,color:'var(--cafe-text-secondary)'}}>{p.predictedIssue}</div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsWidget({ recommendations }) {
  if (!recommendations?.length) return <div style={{...card,padding:24}}><h3>Recommendations</h3><div>No recommendations</div></div>;
  return (
    <div style={{...card,padding:24}}>
      <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Recommendations ({recommendations.length})</h3>
      {recommendations.slice(0,3).map(r => (
        <div key={r.id} style={{padding:12,background:'var(--cafe-bg)',borderRadius:8,marginBottom:8}}>
          <div style={{fontWeight:500}}>{r.title}</div>
          <div style={{fontSize:12,color:'var(--cafe-text-secondary)'}}>{r.component}</div>
        </div>
      ))}
    </div>
  );
}
