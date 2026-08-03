import React, { useState, useEffect } from 'react';
import { card, btn } from '../../styles/theme';
import diagnosticsEngine from '../../diagnostics/DiagnosticsEngine.js';

export default function OperationsPlatform({ isMobile }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setData(await diagnosticsEngine.getDashboardData());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{...card,padding:24}}>Loading...</div>;

  return (
    <div style={{padding:isMobile?16:24}}>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:8}}>Operations Platform</h1>
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {['overview','incidents','predictions','recommendations'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...btn(tab===t?'primary':'ghost'),padding:'8px 16px'}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {tab==='overview' && <Overview data={data} />}
      {tab==='incidents' && <Incidents data={data} />}
      {tab==='predictions' && <Predictions data={data} />}
      {tab==='recommendations' && <Recommendations data={data} />}
    </div>
  );
}

function Overview({ data }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{...card,padding:24}}>
        <h3>Health Score</h3>
        <div style={{fontSize:48,fontWeight:700,color:data.performance.score.overall>=75?'#10b981':'#f59e0b'}}>
          {data.performance.score.overall}/100
        </div>
      </div>
      <div style={{...card,padding:24}}>
        <h3>Stats</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
          <div><div style={{fontSize:24}}>{data.incidents.active}</div><div>Active</div></div>
          <div><div style={{fontSize:24,color:'#ef4444'}}>{data.incidents.critical}</div><div>Critical</div></div>
          <div><div style={{fontSize:24}}>{data.predictions.length}</div><div>Predictions</div></div>
          <div><div style={{fontSize:24}}>{data.recommendations.length}</div><div>Recommendations</div></div>
        </div>
      </div>
    </div>
  );
}

function Incidents({ data }) {
  return (
    <div style={{...card,padding:24}}>
      <h3>Incidents ({data.incidents.active})</h3>
      <div>Incident list would display here</div>
    </div>
  );
}

function Predictions({ data }) {
  return (
    <div style={{...card,padding:24}}>
      <h3>Predictions ({data.predictions.length})</h3>
      {data.predictions.map(p => (
        <div key={p.id} style={{padding:12,background:'var(--cafe-bg)',marginBottom:8}}>
          {p.component}: {p.predictedIssue}
        </div>
      ))}
    </div>
  );
}

function Recommendations({ data }) {
  return (
    <div style={{...card,padding:24}}>
      <h3>Recommendations ({data.recommendations.length})</h3>
      {data.recommendations.map(r => (
        <div key={r.id} style={{padding:12,background:'var(--cafe-bg)',marginBottom:8}}>
          {r.title}
        </div>
      ))}
    </div>
  );
}
