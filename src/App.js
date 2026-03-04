import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const POLL_MS = 4000;
const DAILY_AVG = { total_emails:600, assigned_default:100, assigned_onboarded:750, incorrect_assignment:150, assignment_accuracy:80.0, intent_detected:600, incorrect_intent:60, intent_accuracy:90.0, completed_by_user:550, total_entities:322, po_extracted:174, po_corrected:10, po_accuracy:94.25, inv_extracted:73, inv_corrected:2, inv_accuracy:97.26, vendor_extracted:73, vendor_corrected:2, vendor_accuracy:97.26 };

const LIGHT = { pageBg:"#f5f6f8",white:"#ffffff",offWhite:"#fafafa",surface:"#f0f1f4",orange:"#e07020",orangeL:"#f5a623",orangeD:"#c05a10",orangeXL:"#fff3e8",blue:"#1565c0",blueL:"#1e88e5",blueXL:"#e8f1fd",teal:"#00796b",tealXL:"#e0f2f1",red:"#c62828",redXL:"#ffebee",amber:"#f57c00",amberXL:"#fff8e1",textH:"#111827",textB:"#374151",textS:"#6b7280",textXS:"#9ca3af",border:"#e5e7eb",skelBg:"#ebebeb",display:"'DM Mono',monospace",body:"'DM Sans',sans-serif" };
const DARK  = { pageBg:"#0f1117",white:"#1a1d27",offWhite:"#1e2130",surface:"#252836",orange:"#f5a623",orangeL:"#ffbe4d",orangeD:"#e07020",orangeXL:"#221a06",blue:"#5ba4f5",blueL:"#74b9ff",blueXL:"#0d1f35",teal:"#4db6ac",tealXL:"#0d2422",red:"#ef5350",redXL:"#2a0d0d",amber:"#ffb300",amberXL:"#231900",textH:"#f1f3f9",textB:"#c9cdd8",textS:"#8b92a8",textXS:"#4a5068",border:"#2e3245",skelBg:"#2e3245",display:"'DM Mono',monospace",body:"'DM Sans',sans-serif" };
const G = { orange:"linear-gradient(135deg,#e07020,#f5a623)" };

const N   = v => v==null||v===""?"--":Math.round(Number(v)).toLocaleString();
const P   = v => v==null||v===""?"--":`${parseFloat(v).toFixed(1)}%`;
const ac  = (v,T) => { const n=parseFloat(v); if(isNaN(n))return T.textXS; return n>=90?T.teal:n>=80?T.amber:T.red; };
const acB = (v,T) => { const n=parseFloat(v); if(isNaN(n))return T.surface; return n>=90?T.tealXL:n>=80?T.amberXL:T.redXL; };
const rnd  = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const rndF = (a,b) => parseFloat((Math.random()*(b-a)+a).toFixed(2));

function generateDayData(dateStr, variance=0.08) {
  const v = f => Math.round(DAILY_AVG[f]*(1+rndF(-variance,variance)));
  const te=v("total_emails"), ad=v("assigned_default"), ao=v("assigned_onboarded"), ia=v("incorrect_assignment");
  const id_=v("intent_detected"), ii=v("incorrect_intent"), cb=v("completed_by_user");
  const poe=v("po_extracted"), poc=Math.min(poe,v("po_corrected"));
  const ine=v("inv_extracted"), inc=Math.min(ine,v("inv_corrected"));
  const ve=v("vendor_extracted"), vc=Math.min(ve,v("vendor_corrected"));
  return { date:dateStr, total_emails:te, assigned_default:ad, assigned_onboarded:ao, incorrect_assignment:ia,
    assignment_accuracy: ao>0?parseFloat(((ao-ia)/ao*100).toFixed(1)):80.0,
    intent_detected:id_, incorrect_intent:ii, intent_accuracy:id_>0?parseFloat(((id_-ii)/id_*100).toFixed(1)):90.0,
    completed_by_user:cb, total_entities:poe+ine+ve,
    po_extracted:poe, po_corrected:poc, po_accuracy:poe>0?parseFloat(((poe-poc)/poe*100).toFixed(2)):94.25,
    inv_extracted:ine, inv_corrected:inc, inv_accuracy:ine>0?parseFloat(((ine-inc)/ine*100).toFixed(2)):97.26,
    vendor_extracted:ve, vendor_corrected:vc, vendor_accuracy:ve>0?parseFloat(((ve-vc)/ve*100).toFixed(2)):97.26 };
}

function seedDays() {
  const days=[], now=new Date();
  for(let i=15;i>=1;i--) { const d=new Date(now); d.setDate(d.getDate()-i); days.push(generateDayData(`${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`)); }
  return days;
}

function computeAccumulated(days) {
  if(!days.length)return null;
  const sum=f=>days.reduce((a,d)=>a+(d[f]||0),0);
  const te=sum("total_emails"), ao=sum("assigned_onboarded"), ia=sum("incorrect_assignment");
  const id_=sum("intent_detected"), ii=sum("incorrect_intent");
  const poe=sum("po_extracted"), poc=sum("po_corrected");
  const ine=sum("inv_extracted"), inc=sum("inv_corrected");
  const ve=sum("vendor_extracted"), vc=sum("vendor_corrected");
  return { date:`All ${days.length} days`, total_emails:te, assigned_default:sum("assigned_default"),
    assigned_onboarded:ao, incorrect_assignment:ia,
    assignment_accuracy:ao>0?parseFloat(((ao-ia)/ao*100).toFixed(1)):0,
    intent_detected:id_, incorrect_intent:ii, intent_accuracy:id_>0?parseFloat(((id_-ii)/id_*100).toFixed(1)):0,
    completed_by_user:sum("completed_by_user"), total_entities:sum("total_entities"),
    po_extracted:poe, po_corrected:poc, po_accuracy:poe>0?parseFloat(((poe-poc)/poe*100).toFixed(2)):0,
    inv_extracted:ine, inv_corrected:inc, inv_accuracy:ine>0?parseFloat(((ine-inc)/ine*100).toFixed(2)):0,
    vendor_extracted:ve, vendor_corrected:vc, vendor_accuracy:ve>0?parseFloat(((ve-vc)/ve*100).toFixed(2)):0,
    avg_emails:parseFloat((te/days.length).toFixed(1)) };
}

function incrementDay16(prev) {
  const delta=rnd(1,2), ratio=delta/DAILY_AVG.total_emails;
  const te=prev.total_emails+delta, ad=prev.assigned_default+Math.round(DAILY_AVG.assigned_default*ratio);
  const ao=prev.assigned_onboarded+Math.round(DAILY_AVG.assigned_onboarded*ratio);
  const ia=prev.incorrect_assignment+(Math.random()<ratio*10?1:0);
  const id_=prev.intent_detected+Math.round(DAILY_AVG.intent_detected*ratio);
  const ii=prev.incorrect_intent+(Math.random()<ratio*5?1:0);
  const cb=prev.completed_by_user+Math.round(DAILY_AVG.completed_by_user*ratio);
  const poe=prev.po_extracted+(Math.random()<ratio*50?1:0), poc=prev.po_corrected+(Math.random()<ratio*5?1:0);
  const ine=prev.inv_extracted+(Math.random()<ratio*20?1:0), inc=prev.inv_corrected+(Math.random()<ratio*2?1:0);
  const ve=prev.vendor_extracted+(Math.random()<ratio*20?1:0), vc=prev.vendor_corrected+(Math.random()<ratio*2?1:0);
  return { ...prev, total_emails:te, assigned_default:ad, assigned_onboarded:ao, incorrect_assignment:ia,
    assignment_accuracy:ao>0?parseFloat(((ao-ia)/ao*100).toFixed(1)):80.0,
    intent_detected:id_, incorrect_intent:ii, intent_accuracy:id_>0?parseFloat(((id_-ii)/id_*100).toFixed(1)):90.0,
    completed_by_user:cb, po_extracted:poe, po_corrected:poc,
    po_accuracy:poe>0?parseFloat(((poe-poc)/poe*100).toFixed(2)):94.25,
    inv_extracted:ine, inv_corrected:inc, inv_accuracy:ine>0?parseFloat(((ine-inc)/ine*100).toFixed(2)):97.26,
    vendor_extracted:ve, vendor_corrected:vc, vendor_accuracy:ve>0?parseFloat(((ve-vc)/ve*100).toFixed(2)):97.26,
    total_entities:poe+ine+ve };
}

function DarkToggle({ dark, setDark, T }) {
  return (
    <button onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px 5px 6px",cursor:"pointer",transition:"all .3s",outline:"none"}}>
      <div style={{width:30,height:17,borderRadius:10,background:dark?T.orange:"#ccc",position:"relative",transition:"background .3s",flexShrink:0}}>
        <div style={{position:"absolute",top:2.5,left:dark?14:2.5,width:12,height:12,borderRadius:"50%",background:"#fff",transition:"left .25s ease",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
      </div>
      <span style={{fontFamily:T.body,fontSize:10,fontWeight:700,color:dark?T.orange:T.textS,userSelect:"none"}}>
        {dark ? "Light" : "Dark"}
      </span>
    </button>
  );
}

function ChartTip({ active, payload, label, T }) {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",fontFamily:T.body,boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
      <div style={{color:T.textXS,fontSize:10,marginBottom:8,fontWeight:600,letterSpacing:"1px",textTransform:"uppercase"}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:20,marginBottom:3,fontSize:12}}>
          <span style={{color:T.textS}}>{p.name}</span>
          <strong style={{color:p.color||T.orange}}>{typeof p.value==="number"?p.value.toLocaleString():p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, accent, loading, live=false, T }) {
  const col = accent||T.orange;
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(()=>{ if(prev.current!==value){setFlash(true);setTimeout(()=>setFlash(false),800);} prev.current=value; },[value]);
  return (
    <div style={{background:T.white,border:`1px solid ${flash?col:T.border}`,borderRadius:16,padding:"18px 18px 14px",minHeight:114,position:"relative",overflow:"hidden",transition:"border-color .4s,box-shadow .4s",boxShadow:flash?`0 0 0 3px ${col}25`:"0 1px 6px rgba(0,0,0,.06)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}30)`,borderRadius:"16px 16px 0 0"}}/>
      <div style={{position:"absolute",bottom:-22,right:-18,width:84,height:84,borderRadius:"50%",background:col,opacity:.06,pointerEvents:"none"}}/>
      {live && (
        <div style={{position:"absolute",top:14,right:14,display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:T.teal,animation:"pulse-live 2s infinite"}}/>
          <span style={{fontFamily:T.body,fontSize:8,fontWeight:700,color:T.teal,letterSpacing:"0.5px"}}>LIVE</span>
        </div>
      )}
      <div style={{marginBottom:10,fontFamily:T.body,fontSize:10,fontWeight:600,color:T.textS,letterSpacing:".8px",textTransform:"uppercase",lineHeight:1.6}} dangerouslySetInnerHTML={{__html:label}}/>
      {loading
        ? <div style={{height:30,width:"55%",background:T.skelBg,borderRadius:6}}/>
        : <div style={{fontFamily:T.display,fontSize:26,fontWeight:500,color:T.textH,lineHeight:1,letterSpacing:"-0.5px"}}>{value??"--"}</div>
      }
      {sub && !loading && (
        <div style={{marginTop:9,display:"inline-flex",alignItems:"center",gap:5,background:`${col}15`,border:`1px solid ${col}25`,borderRadius:20,padding:"2px 9px"}}>
          <div style={{width:4,height:4,borderRadius:"50%",background:col,flexShrink:0}}/>
          <span style={{fontFamily:T.body,fontSize:9,fontWeight:600,color:col}}>{sub}</span>
        </div>
      )}
    </div>
  );
}

function AccCard({ label, value, loading, T }) {
  const col=ac(value,T), bgCol=acB(value,T), pct=Math.min(100,Math.max(0,parseFloat(value)||0));
  const badge = pct>=90?{text:"Excellent",bg:T.tealXL,c:T.teal}:pct>=80?{text:"Good",bg:T.amberXL,c:T.amber}:{text:"Review",bg:T.redXL,c:T.red};
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px 14px",textAlign:"center",position:"relative",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}40)`,borderRadius:"16px 16px 0 0"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${pct*0.6}%`,background:bgCol,transition:"height 1s ease",pointerEvents:"none",opacity:.4}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:T.body,fontSize:9,fontWeight:700,color:T.textS,letterSpacing:"1px",textTransform:"uppercase",marginBottom:12}} dangerouslySetInnerHTML={{__html:label}}/>
        {loading
          ? <div style={{height:28,width:"50%",margin:"0 auto",background:T.skelBg,borderRadius:6}}/>
          : <div style={{fontFamily:T.display,fontSize:28,fontWeight:500,color:col,lineHeight:1}}>{P(value)}</div>
        }
        <div style={{marginTop:12,height:5,borderRadius:5,background:T.surface,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${col}60,${col})`,borderRadius:5,transition:"width 1.2s ease"}}/>
        </div>
        <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:4,background:badge.bg,border:`1px solid ${badge.c}30`,borderRadius:20,padding:"2px 10px"}}>
          <span style={{fontFamily:T.body,fontSize:9,fontWeight:700,color:badge.c}}>{badge.text}</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, height=200, children, badge, T }) {
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 18px 12px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:3,height:16,background:G.orange,borderRadius:3,flexShrink:0}}/>
        <span style={{fontFamily:T.body,fontSize:11,fontWeight:700,color:T.textS,letterSpacing:"1px",textTransform:"uppercase"}}>{title}</span>
        {badge && <span style={{marginLeft:"auto",background:T.orangeXL,border:`1px solid ${T.orange}30`,borderRadius:20,padding:"2px 12px",fontFamily:T.body,fontSize:9,fontWeight:700,color:T.orangeD}}>{badge}</span>}
      </div>
      <div style={{height}}>{children}</div>
    </div>
  );
}

function SectionHead({ label, sub, color, T }) {
  const col = color||T.orange;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
      <div style={{width:4,height:18,background:col,borderRadius:2,flexShrink:0}}/>
      <div>
        <div style={{fontFamily:T.body,fontSize:12,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:T.textH}}>{label}</div>
        {sub && <div style={{fontFamily:T.body,fontSize:10,color:T.textS,marginTop:1}}>{sub}</div>}
      </div>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg,${col}40,transparent)`}}/>
    </div>
  );
}

function EntityBlock({ title, ext, corr, acc, col, T }) {
  const pct=Math.min(100,parseFloat(acc)||0), accCol=ac(acc,T);
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"16px 18px",position:"relative",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}30)`,borderRadius:"16px 16px 0 0"}}/>
      <div style={{position:"absolute",top:-16,right:-16,width:72,height:72,borderRadius:"50%",background:col,opacity:.06,pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${col}18`,border:`1px solid ${col}28`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:col}}/>
          </div>
          <span style={{fontFamily:T.body,fontSize:13,fontWeight:700,color:T.textH}}>{title}</span>
        </div>
        <div style={{padding:"3px 12px",borderRadius:20,background:acB(acc,T),border:`1px solid ${accCol}40`}}>
          <span style={{fontFamily:T.display,fontSize:12,fontWeight:600,color:accCol}}>{P(acc)}</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[["Extracted",N(ext),T.blueL],["Corrected",N(corr),T.amber]].map(([lbl,val,c])=>(
          <div key={lbl} style={{padding:"10px 12px",background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
            <div style={{fontFamily:T.body,fontSize:8,fontWeight:700,color:T.textXS,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:5}}>{lbl}</div>
            <div style={{fontFamily:T.display,fontSize:20,fontWeight:500,color:c}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{height:4,borderRadius:4,background:T.surface,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${col}50,${col})`,borderRadius:4,transition:"width 1.2s ease"}}/>
      </div>
    </div>
  );
}

const TABS=[{id:"overview",label:"Overview"},{id:"daily",label:"Daily View"},{id:"accumulated",label:"Accumulated"},{id:"raw",label:"Raw Table"}];

export default function App() {
  const [dark, setDark] = useState(false);
  const T = dark ? DARK : LIGHT;

  const [days15, setDays15] = useState([]);
  const [day16,  setDay16]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [selDay,  setSelDay]  = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [polls, setPolls] = useState(0);
  const [updated, setUpdated] = useState(null);
  const day16Ref = useRef(null);

  useEffect(()=>{
    const seeded = seedDays(); setDays15(seeded);
    const now = new Date();
    const ds = `${now.getMonth()+1}/${now.getDate()}/${now.getFullYear()}`;
    const init = { date:ds, total_emails:0, assigned_default:0, assigned_onboarded:0, incorrect_assignment:0, assignment_accuracy:80.0, intent_detected:0, incorrect_intent:0, intent_accuracy:90.0, completed_by_user:0, total_entities:0, po_extracted:0, po_corrected:0, po_accuracy:94.25, inv_extracted:0, inv_corrected:0, inv_accuracy:97.26, vendor_extracted:0, vendor_corrected:0, vendor_accuracy:97.26 };
    day16Ref.current=init; setDay16(init); setLoading(false); setUpdated(new Date().toLocaleTimeString());
  },[]);

  const tick = useCallback(()=>{
    if(!day16Ref.current)return;
    const u=incrementDay16(day16Ref.current);
    day16Ref.current=u; setDay16({...u}); setUpdated(new Date().toLocaleTimeString()); setPolls(p=>p+1);
  },[]);

  useEffect(()=>{ if(!loading){const t=setInterval(tick,POLL_MS);return()=>clearInterval(t);} },[tick,loading]);

  const allDays     = day16?[...days15,day16]:days15;
  const accumulated = computeAccumulated(allDays);
  const displayData = selDay===""?accumulated:selDay==="live"?day16:days15.find(d=>d.date===selDay);
  const isAcc=selDay==="", isLive=selDay==="live";
  const aP = { tick:{fill:T.textXS,fontSize:10,fontFamily:T.body}, tickLine:false, axisLine:false };

  const trendData = allDays.map(d=>({
    date:d.date.split("/").slice(0,2).join("/"),
    emails:d.total_emails, completed:d.completed_by_user, onboarded:d.assigned_onboarded,
    default_:d.assigned_default, incorrect:d.incorrect_assignment,
    assign_acc:parseFloat(d.assignment_accuracy)||0, intent_acc:parseFloat(d.intent_accuracy)||0,
    po_acc:parseFloat(d.po_accuracy)||0, inv_acc:parseFloat(d.inv_accuracy)||0,
    vdr_acc:parseFloat(d.vendor_accuracy)||0, po:d.po_extracted, inv:d.inv_extracted, vendor:d.vendor_extracted
  }));

  const tip = (props) => <ChartTip {...props} T={T}/>;
  const ps = active => ({ background:active?T.orange:"transparent", border:`1px solid ${active?T.orange:T.border}`, borderRadius:7, padding:"5px 14px", fontFamily:T.body, fontSize:11, fontWeight:600, color:active?"#fff":T.textS, cursor:"pointer" });

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:T.body,color:T.textS,background:T.pageBg}}>Loading 15 days...</div>;

  return (
    <div style={{minHeight:"100vh",background:T.pageBg,transition:"background .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes pulse-live{0%,100%{box-shadow:0 0 0 0 rgba(224,112,32,.5)}50%{box-shadow:0 0 0 6px rgba(224,112,32,0)}}
      `}</style>

      {/* HEADER */}
      <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:56,background:T.white,borderBottom:`3px solid ${T.orange}`,position:"sticky",top:0,zIndex:100,boxShadow:`0 2px 16px rgba(0,0,0,${dark?.18:.07})`,transition:"background .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:G.orange,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 3px 12px rgba(224,112,32,.4)"}}>
            <span style={{fontFamily:T.display,fontSize:12,fontWeight:500,color:"#fff"}}>EXL</span>
          </div>
          <div>
            <div style={{fontFamily:T.body,fontSize:15,fontWeight:700,color:T.textH}}>Smart<span style={{color:T.orange}}>Email</span></div>
            <div style={{fontFamily:T.body,fontSize:8,fontWeight:600,color:T.textXS,letterSpacing:"1.5px",textTransform:"uppercase"}}>Analytics Dashboard</div>
          </div>
        </div>

        <div style={{display:"flex",gap:3,background:T.surface,borderRadius:9,padding:3}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={ps(activeTab===t.id)}>{t.label}</button>)}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.orange,animation:"pulse-live 2s infinite"}}/>
            <span style={{fontFamily:T.body,fontSize:10,fontWeight:700,color:T.orange}}>Day 16 Live</span>
            <span style={{fontFamily:T.body,fontSize:9,color:T.textXS}}>· {updated} · #{polls}</span>
          </div>
          <button onClick={tick} style={{background:G.orange,border:"none",color:"#fff",borderRadius:8,padding:"5px 12px",fontFamily:T.body,fontSize:10,fontWeight:600,cursor:"pointer",boxShadow:"0 2px 8px rgba(224,112,32,.35)"}}>
            Refresh
          </button>
          <DarkToggle dark={dark} setDark={setDark} T={T}/>
        </div>
      </header>

      <main style={{padding:"16px 24px",maxWidth:1800,margin:"0 auto"}}>

        {/* Dropdown */}
        <div style={{marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontFamily:T.body,fontSize:10,fontWeight:700,color:T.textS,letterSpacing:"1px",textTransform:"uppercase",whiteSpace:"nowrap"}}>View:</span>
          <select value={selDay} onChange={e=>setSelDay(e.target.value)}
            style={{flex:1,background:T.white,border:`1.5px solid ${isLive?T.teal:isAcc?T.orange:T.blueL}`,borderRadius:10,color:T.textH,fontFamily:T.body,fontSize:12,fontWeight:600,padding:"9px 14px",cursor:"pointer",outline:"none",transition:"border-color .2s"}}>
            <option value="">Accumulated -- All 16 Days</option>
            <optgroup label="Historical Days">
              {days15.map(d=><option key={d.date} value={d.date}>{d.date}</option>)}
            </optgroup>
            <optgroup label="Live">
              {day16&&<option value="live">{day16.date} (Day 16 -- Live)</option>}
            </optgroup>
          </select>
        </div>

        {/* Banner */}
        <div style={{marginBottom:14,padding:"8px 14px",background:isAcc?T.orangeXL:isLive?T.tealXL:T.blueXL,border:`1px solid ${isAcc?T.orange+"40":isLive?T.teal+"40":T.blueL+"40"}`,borderRadius:10,display:"flex",gap:16,alignItems:"center",transition:"background .3s"}}>
          <span style={{fontFamily:T.body,fontSize:10,fontWeight:700,color:isAcc?T.orange:isLive?T.teal:T.blueL,letterSpacing:"1px",textTransform:"uppercase"}}>
            {isAcc?`Accumulated -- All 16 Days -- ${N(accumulated?.total_emails)} total emails`:isLive?`Day 16 Live -- ${N(day16?.total_emails)} emails so far`:`Day: ${selDay} -- ${N(displayData?.total_emails)} emails`}
          </span>
          {isAcc && <span style={{fontFamily:T.body,fontSize:10,color:T.textS}}>Daily avg: ~{N(DAILY_AVG.total_emails)} emails</span>}
          {isLive && (
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,background:T.white,border:`1px solid ${T.teal}30`,borderRadius:20,padding:"2px 10px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.teal,animation:"pulse-live 2s infinite"}}/>
              <span style={{fontFamily:T.body,fontSize:9,fontWeight:700,color:T.teal}}>+1-2 emails every {POLL_MS/1000}s</span>
            </div>
          )}
        </div>

        {/* OVERVIEW */}
        {activeTab==="overview" && displayData && <>
          <SectionHead label="Email Processing KPIs" color={T.orange} T={T} sub={isAcc?"Sum across all 16 days":isLive?"Today's running total":"Daily totals"}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Total Emails<br/>Received"  value={N(displayData.total_emails)}         accent={T.orange} T={T} loading={loading} live={isLive}/>
            <StatCard label="Completed<br/>by User"      value={N(displayData.completed_by_user)}    accent={T.teal}   T={T} loading={loading} live={isLive} sub={displayData.total_emails?`${Math.round(displayData.completed_by_user/displayData.total_emails*100)}% rate`:""}/>
            <StatCard label="Assigned<br/>Onboarded"     value={N(displayData.assigned_onboarded)}   accent={T.blueL}  T={T} loading={loading} live={isLive}/>
            <StatCard label="Assigned<br/>Default"       value={N(displayData.assigned_default)}     accent={T.amber}  T={T} loading={loading} live={isLive}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Incorrect<br/>Assignment"   value={N(displayData.incorrect_assignment)} accent={T.red}    T={T} loading={loading} live={isLive} sub={displayData.assigned_onboarded?`${Math.round(displayData.incorrect_assignment/displayData.assigned_onboarded*100)}% of onboarded`:""}/>
            <StatCard label="Intent<br/>Detected"        value={N(displayData.intent_detected)}      accent={T.blueL}  T={T} loading={loading} live={isLive}/>
            <StatCard label="Incorrect<br/>Intent"       value={N(displayData.incorrect_intent)}     accent={T.red}    T={T} loading={loading} live={isLive}/>
            <StatCard label="Total<br/>Entities"         value={N(displayData.total_entities)}       accent={T.orange} T={T} loading={loading} live={isLive}/>
          </div>
          <SectionHead label="Accuracy KPIs" color={T.teal} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <AccCard label="Assignment<br/>Accuracy"  value={displayData.assignment_accuracy} T={T} loading={loading}/>
            <AccCard label="Intent<br/>Accuracy"      value={displayData.intent_accuracy}     T={T} loading={loading}/>
            <AccCard label="PO<br/>Accuracy"          value={displayData.po_accuracy}         T={T} loading={loading}/>
            <AccCard label="Invoice<br/>Accuracy"     value={displayData.inv_accuracy}        T={T} loading={loading}/>
          </div>
          <SectionHead label="Entity Extraction" color={T.blueL} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            <EntityBlock title="PO Number"   ext={displayData.po_extracted}     corr={displayData.po_corrected}     acc={displayData.po_accuracy}     col={T.orange} T={T}/>
            <EntityBlock title="Invoice"     ext={displayData.inv_extracted}    corr={displayData.inv_corrected}    acc={displayData.inv_accuracy}    col={T.blueL}  T={T}/>
            <EntityBlock title="Vendor Name" ext={displayData.vendor_extracted} corr={displayData.vendor_corrected} acc={displayData.vendor_accuracy} col={T.teal}   T={T}/>
          </div>
        </>}

        {/* DAILY VIEW */}
        {activeTab==="daily" && <>
          <SectionHead label="Daily Email Volume -- 15 Days + Live Day 16" color={T.orange} T={T} sub={`Daily avg: ~${N(DAILY_AVG.total_emails)} emails`}/>
          <ChartCard title="Total Emails Per Day" height={220} badge="15 days + live" T={T}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barSize={16}>
                <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                <XAxis dataKey="date" {...aP}/><YAxis {...aP} width={50} domain={[0,"auto"]}/>
                <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                <Bar dataKey="emails"    fill={T.orange} name="Total Emails" isAnimationActive={false} radius={[4,4,0,0]}/>
                <Bar dataKey="completed" fill={T.teal}   name="Completed"    isAnimationActive={false} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <ChartCard title="Assignment Volume Per Day" height={200} T={T}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barSize={12}>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                  <XAxis dataKey="date" {...aP}/><YAxis {...aP} width={50}/>
                  <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                  <Bar dataKey="onboarded" stackId="a" fill={T.blueL} name="Onboarded" isAnimationActive={false}/>
                  <Bar dataKey="default_"  stackId="a" fill={T.amber} name="Default"   isAnimationActive={false}/>
                  <Bar dataKey="incorrect" stackId="a" fill={T.red}   name="Incorrect" isAnimationActive={false} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Accuracy Trends Per Day %" height={200} T={T}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                  <XAxis dataKey="date" {...aP}/><YAxis domain={[70,100]} {...aP} width={36} tickFormatter={v=>v+"%"}/>
                  <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                  <Line type="monotone" dataKey="assign_acc" stroke={T.orange} strokeWidth={2.5} dot={false} name="Assignment" isAnimationActive={false}/>
                  <Line type="monotone" dataKey="intent_acc" stroke={T.blueL}  strokeWidth={2.5} dot={false} name="Intent"     isAnimationActive={false} strokeDasharray="5 2"/>
                  <Line type="monotone" dataKey="po_acc"     stroke={T.teal}   strokeWidth={1.5} dot={false} name="PO"         isAnimationActive={false} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="inv_acc"    stroke={T.amber}  strokeWidth={1.5} dot={false} name="Invoice"    isAnimationActive={false} strokeDasharray="3 3"/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div style={{marginTop:12}}>
            <ChartCard title="Entity Extraction Per Day" height={200} badge="PO / Invoice / Vendor" T={T}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.orange} stopOpacity={.25}/><stop offset="95%" stopColor={T.orange} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blueL}  stopOpacity={.2}/> <stop offset="95%" stopColor={T.blueL}  stopOpacity={0}/></linearGradient>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.teal}   stopOpacity={.2}/> <stop offset="95%" stopColor={T.teal}   stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                  <XAxis dataKey="date" {...aP}/><YAxis {...aP} width={50}/>
                  <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                  <Area type="monotone" dataKey="po"     stroke={T.orange} fill="url(#gO)" strokeWidth={2} dot={false} name="PO #"      isAnimationActive={false}/>
                  <Area type="monotone" dataKey="inv"    stroke={T.blueL}  fill="url(#gB)" strokeWidth={2} dot={false} name="Invoice #"  isAnimationActive={false}/>
                  <Area type="monotone" dataKey="vendor" stroke={T.teal}   fill="url(#gT)" strokeWidth={2} dot={false} name="Vendor"     isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>}

        {/* ACCUMULATED */}
        {activeTab==="accumulated" && accumulated && <>
          <SectionHead label="Accumulated Totals -- All 16 Days" color={T.orange} T={T} sub="Sum of all daily counts -- accuracy weighted across all days"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
            {[["Total Emails (All Days)",N(accumulated.total_emails),T.orange,`Daily avg: ~${N(DAILY_AVG.total_emails)}`],
              ["Total Completed",N(accumulated.completed_by_user),T.teal,`${Math.round(accumulated.completed_by_user/accumulated.total_emails*100)}% completion rate`],
              ["Total Entities Extracted",N(accumulated.total_entities),T.blueL,"PO + Invoice + Vendor combined"]
            ].map(([lbl,val,col,sub])=>(
              <div key={lbl} style={{background:T.white,border:`1.5px solid ${col}40`,borderRadius:16,padding:"20px 22px",position:"relative",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}30)`,borderRadius:"16px 16px 0 0"}}/>
                <div style={{position:"absolute",bottom:-20,right:-16,width:80,height:80,borderRadius:"50%",background:col,opacity:.06,pointerEvents:"none"}}/>
                <div style={{fontFamily:T.body,fontSize:10,fontWeight:600,color:T.textS,letterSpacing:".5px",textTransform:"uppercase",marginBottom:10}}>{lbl}</div>
                <div style={{fontFamily:T.display,fontSize:32,fontWeight:500,color:T.textH,lineHeight:1}}>{val}</div>
                <div style={{marginTop:6,fontFamily:T.body,fontSize:10,color:T.textS}}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Total Onboarded<br/>Assignments" value={N(accumulated.assigned_onboarded)}   accent={T.blueL} T={T} loading={loading}/>
            <StatCard label="Total Default<br/>Assignments"   value={N(accumulated.assigned_default)}     accent={T.amber} T={T} loading={loading}/>
            <StatCard label="Total Incorrect<br/>Assignments" value={N(accumulated.incorrect_assignment)} accent={T.red}   T={T} loading={loading}/>
            <StatCard label="Total Intent<br/>Detected"       value={N(accumulated.intent_detected)}      accent={T.blueL} T={T} loading={loading}/>
          </div>
          <SectionHead label="Weighted Accuracy -- All 16 Days" color={T.teal} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <AccCard label="Assignment<br/>Accuracy"  value={accumulated.assignment_accuracy} T={T} loading={loading}/>
            <AccCard label="Intent<br/>Accuracy"      value={accumulated.intent_accuracy}     T={T} loading={loading}/>
            <AccCard label="PO<br/>Accuracy"          value={accumulated.po_accuracy}         T={T} loading={loading}/>
            <AccCard label="Invoice<br/>Accuracy"     value={accumulated.inv_accuracy}        T={T} loading={loading}/>
          </div>
          <SectionHead label="Cumulative Entity Extraction" color={T.blueL} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            <EntityBlock title="PO Number"   ext={accumulated.po_extracted}     corr={accumulated.po_corrected}     acc={accumulated.po_accuracy}     col={T.orange} T={T}/>
            <EntityBlock title="Invoice"     ext={accumulated.inv_extracted}    corr={accumulated.inv_corrected}    acc={accumulated.inv_accuracy}    col={T.blueL}  T={T}/>
            <EntityBlock title="Vendor Name" ext={accumulated.vendor_extracted} corr={accumulated.vendor_corrected} acc={accumulated.vendor_accuracy} col={T.teal}   T={T}/>
          </div>
        </>}

        {/* RAW TABLE */}
        {activeTab==="raw" && <>
          <SectionHead label={`Raw Data -- All ${allDays.length} Days`} color={T.blueL} T={T}/>
          <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontFamily:T.body,fontSize:10}}>
                <thead>
                  <tr style={{background:T.surface,borderBottom:`2px solid ${T.border}`}}>
                    {["Date","Total","Completed","Onboarded","Default","Incorr Assign","Assign%","Intent","Incorr Intent","Intent%","PO Ext","PO Cor","PO%","Inv Ext","Inv Cor","Inv%","Vdr Ext","Vdr Cor","Vdr%","Entities"].map(h=>(
                      <th key={h} style={{padding:"9px 10px",textAlign:"left",fontSize:8,letterSpacing:"1px",textTransform:"uppercase",color:T.textS,fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{background:T.amberXL,borderBottom:`2px solid ${T.amber}`}}>
                    {[<b style={{color:T.amber}}>Avg/Day</b>,
                      N(DAILY_AVG.total_emails),N(DAILY_AVG.completed_by_user),N(DAILY_AVG.assigned_onboarded),N(DAILY_AVG.assigned_default),N(DAILY_AVG.incorrect_assignment),
                      <span style={{color:ac(DAILY_AVG.assignment_accuracy,T),fontWeight:700}}>{P(DAILY_AVG.assignment_accuracy)}</span>,
                      N(DAILY_AVG.intent_detected),N(DAILY_AVG.incorrect_intent),
                      <span style={{color:ac(DAILY_AVG.intent_accuracy,T),fontWeight:700}}>{P(DAILY_AVG.intent_accuracy)}</span>,
                      N(DAILY_AVG.po_extracted),N(DAILY_AVG.po_corrected),
                      <span style={{color:ac(DAILY_AVG.po_accuracy,T),fontWeight:700}}>{P(DAILY_AVG.po_accuracy)}</span>,
                      N(DAILY_AVG.inv_extracted),N(DAILY_AVG.inv_corrected),
                      <span style={{color:ac(DAILY_AVG.inv_accuracy,T),fontWeight:700}}>{P(DAILY_AVG.inv_accuracy)}</span>,
                      N(DAILY_AVG.vendor_extracted),N(DAILY_AVG.vendor_corrected),
                      <span style={{color:ac(DAILY_AVG.vendor_accuracy,T),fontWeight:700}}>{P(DAILY_AVG.vendor_accuracy)}</span>,
                      N(DAILY_AVG.total_entities)
                    ].map((c,j)=><td key={j} style={{padding:"8px 10px",whiteSpace:"nowrap",color:T.textB}}>{c}</td>)}
                  </tr>
                  {[...allDays].reverse().map((row,i)=>{
                    const isD16=row.date===day16?.date;
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:isD16?T.tealXL:i%2===0?T.white:T.offWhite}}>
                        {[<span style={{fontFamily:T.display,fontSize:9,color:isD16?T.teal:T.textXS,fontWeight:isD16?700:400}}>{row.date}{isD16?" *":""}</span>,
                          N(row.total_emails),N(row.completed_by_user),N(row.assigned_onboarded),N(row.assigned_default),N(row.incorrect_assignment),
                          <span style={{color:ac(row.assignment_accuracy,T),fontWeight:700,fontFamily:T.display}}>{P(row.assignment_accuracy)}</span>,
                          N(row.intent_detected),N(row.incorrect_intent),
                          <span style={{color:ac(row.intent_accuracy,T),fontWeight:700,fontFamily:T.display}}>{P(row.intent_accuracy)}</span>,
                          N(row.po_extracted),N(row.po_corrected),
                          <span style={{color:ac(row.po_accuracy,T),fontWeight:700,fontFamily:T.display}}>{P(row.po_accuracy)}</span>,
                          N(row.inv_extracted),N(row.inv_corrected),
                          <span style={{color:ac(row.inv_accuracy,T),fontWeight:700,fontFamily:T.display}}>{P(row.inv_accuracy)}</span>,
                          N(row.vendor_extracted),N(row.vendor_corrected),
                          <span style={{color:ac(row.vendor_accuracy,T),fontWeight:700,fontFamily:T.display}}>{P(row.vendor_accuracy)}</span>,
                          N(row.total_entities)
                        ].map((cell,j)=><td key={j} style={{padding:"7px 10px",color:T.textB,whiteSpace:"nowrap"}}>{cell}</td>)}
                      </tr>
                    );
                  })}
                  <tr style={{background:T.orangeXL,borderTop:`2px solid ${T.orange}`}}>
                    {[<b style={{color:T.orange,fontFamily:T.display}}>TOTAL</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.total_emails)}</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.completed_by_user)}</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.assigned_onboarded)}</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.assigned_default)}</b>,
                      <b style={{color:T.red}}>{N(accumulated?.incorrect_assignment)}</b>,
                      <b style={{color:ac(accumulated?.assignment_accuracy,T)}}>{P(accumulated?.assignment_accuracy)}</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.intent_detected)}</b>,
                      <b style={{color:T.red}}>{N(accumulated?.incorrect_intent)}</b>,
                      <b style={{color:ac(accumulated?.intent_accuracy,T)}}>{P(accumulated?.intent_accuracy)}</b>,
                      <b style={{color:T.textB}}>{N(accumulated?.po_extracted)}</b>,<b style={{color:T.textB}}>{N(accumulated?.po_corrected)}</b>,
                      <b style={{color:ac(accumulated?.po_accuracy,T)}}>{P(accumulated?.po_accuracy)}</b>,
                      <b style={{color:T.textB}}>{N(accumulated?.inv_extracted)}</b>,<b style={{color:T.textB}}>{N(accumulated?.inv_corrected)}</b>,
                      <b style={{color:ac(accumulated?.inv_accuracy,T)}}>{P(accumulated?.inv_accuracy)}</b>,
                      <b style={{color:T.textB}}>{N(accumulated?.vendor_extracted)}</b>,<b style={{color:T.textB}}>{N(accumulated?.vendor_corrected)}</b>,
                      <b style={{color:ac(accumulated?.vendor_accuracy,T)}}>{P(accumulated?.vendor_accuracy)}</b>,
                      <b style={{color:T.orange}}>{N(accumulated?.total_entities)}</b>
                    ].map((c,j)=><td key={j} style={{padding:"9px 10px",whiteSpace:"nowrap"}}>{c}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* STATUS BAR */}
        <div style={{marginTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:T.white,border:`1px solid ${T.border}`,borderRadius:10,transition:"background .3s"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",fontFamily:T.body,fontSize:9,fontWeight:600}}>
            {[["History","15 days",T.textB],["Live","Day 16",T.teal],["Day16",N(day16?.total_emails)+" emails",T.orange],["Total",N(accumulated?.total_emails),T.orange],["Polls",polls,T.textB],["Avg/Day",`~${N(DAILY_AVG.total_emails)}`,T.textB]].map(([k,v,c])=>(
              <span key={k} style={{display:"flex",alignItems:"center",gap:3}}>
                <span style={{color:T.textXS}}>{k}:</span><b style={{color:c}}>{v}</b>
              </span>
            ))}
          </div>
          <div style={{fontFamily:T.body,fontSize:9,color:T.textXS}}>
            Tick: <b style={{color:T.textB}}>{POLL_MS/1000}s</b> -- Updated: <b style={{color:T.orange}}>{updated}</b>
          </div>
        </div>
      </main>
    </div>
  );
}
