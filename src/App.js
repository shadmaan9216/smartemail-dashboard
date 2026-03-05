import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const POLL_MS = 4000;
const DAILY_AVG = { total_emails:600, assigned_default:100, assigned_onboarded:750, incorrect_assignment:150, assignment_accuracy:80.0, intent_detected:600, incorrect_intent:60, intent_accuracy:90.0, completed_by_user:550, total_entities:322, po_extracted:174, po_corrected:10, po_accuracy:94.25, inv_extracted:73, inv_corrected:2, inv_accuracy:97.26, vendor_extracted:73, vendor_corrected:2, vendor_accuracy:97.26 };

const LIGHT = { pageBg:"#f5f6f8",white:"#ffffff",offWhite:"#fafafa",surface:"#f0f1f4",orange:"#e07020",orangeL:"#f5a623",orangeD:"#c05a10",orangeXL:"#fff3e8",blue:"#1565c0",blueL:"#1e88e5",blueXL:"#e8f1fd",teal:"#00796b",tealXL:"#e0f2f1",red:"#c62828",redXL:"#ffebee",amber:"#f57c00",amberXL:"#fff8e1",textH:"#111827",textB:"#374151",textS:"#6b7280",textXS:"#9ca3af",border:"#e5e7eb",skelBg:"#ebebeb",display:"'DM Mono',monospace",body:"'DM Sans',sans-serif" };
const DARK  = { pageBg:"#0f1117",white:"#1a1d27",offWhite:"#1e2130",surface:"#252836",orange:"#f5a623",orangeL:"#ffbe4d",orangeD:"#e07020",orangeXL:"#221a06",blue:"#5ba4f5",blueL:"#74b9ff",blueXL:"#0d1f35",teal:"#4db6ac",tealXL:"#0d2422",red:"#ef5350",redXL:"#2a0d0d",amber:"#ffb300",amberXL:"#231900",textH:"#f1f3f9",textB:"#c9cdd8",textS:"#8b92a8",textXS:"#4a5068",border:"#2e3245",skelBg:"#2e3245",display:"'DM Mono',monospace",body:"'DM Sans',sans-serif" };
const G = { orange:"linear-gradient(135deg,#e07020,#f5a623)" };

const KPI_TIPS = {
  total_emails: "Total count of all emails received.",
  completed_by_user: "Emails for which all required actions have been completed.",
  assigned_onboarded: "Emails correctly assigned to the appropriate user using the mapping sheet.",
  assigned_default: "Emails assigned to the default user because corresponding data was missing in the mapping sheet.",
  incorrect_assignment: "Emails initially assigned to the wrong user (mapping not followed or misclassified) and later corrected manually.",
  intent_detected: "Number of emails for which the system successfully detected an intent (e.g., po_invoice, payment_enquiry).",
  incorrect_intent: "Emails where the detected intent was wrong and manually corrected.",
  total_entities: "Count of extracted data elements (e.g., po_num, inv_num, vendor_name).",
  assignment_accuracy: "Accuracy of user assignment using the mapping sheet.",
  intent_accuracy: "Accuracy of the system's intent detection.",
  po_accuracy: "Accuracy of Purchase Order number extraction from emails.",
  inv_accuracy: "Accuracy of Invoice number extraction from emails.",
  vendor_accuracy: "Accuracy of Vendor name extraction from emails.",
};

function KpiTooltip({ text, T }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState({top:0,left:0});
  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      const vpW = window.innerWidth;
      let left = r.left + r.width/2;
      // clamp so tooltip (220px wide) stays on screen
      left = Math.min(Math.max(left, 116), vpW - 116);
      setPos({ top: r.bottom + window.scrollY + 8, left });
    }
    setShow(true);
  };
  return (
    <>
      <span ref={ref} style={{display:"inline-flex",alignItems:"center",marginLeft:4,cursor:"help",verticalAlign:"middle",flexShrink:0}}
        onMouseEnter={handleEnter} onMouseLeave={()=>setShow(false)}>
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke={T.textXS} strokeWidth="1.8"/>
          <text x="10" y="14.5" textAnchor="middle" fontSize="12" fill={T.textXS} fontFamily="sans-serif" fontWeight="700">i</text>
        </svg>
      </span>
      {show && (
        <div style={{position:"fixed",top:pos.top,left:pos.left,transform:"translateX(-50%)",width:230,background:T.white,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 14px",boxShadow:"0 8px 32px rgba(0,0,0,.18)",zIndex:9999,pointerEvents:"none"}}>
          <div style={{fontFamily:T.body,fontSize:11,color:T.textB,lineHeight:1.6,fontWeight:400}}>{text}</div>
          <div style={{position:"absolute",top:-5,left:"50%",transform:"translateX(-50%)",width:8,height:8,background:T.white,border:`1px solid ${T.border}`,borderBottom:"none",borderRight:"none",rotate:"45deg"}}/>
        </div>
      )}
    </>
  );
}


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

function StatCard({ label, value, sub, accent, loading, live=false, T, tipKey }) {
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
      <div style={{marginBottom:10,fontFamily:T.body,fontSize:10,fontWeight:600,color:T.textS,letterSpacing:".8px",textTransform:"uppercase",lineHeight:1.6,display:"flex",alignItems:"flex-start",gap:2}}><span dangerouslySetInnerHTML={{__html:label}}/>{tipKey&&KPI_TIPS[tipKey]&&<KpiTooltip text={KPI_TIPS[tipKey]} T={T}/>}</div>
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

function AccCard({ label, value, loading, T, tipKey }) {
  const col=ac(value,T), bgCol=acB(value,T), pct=Math.min(100,Math.max(0,parseFloat(value)||0));
  const badge = pct>=90?{text:"Excellent",bg:T.tealXL,c:T.teal}:pct>=80?{text:"Good",bg:T.amberXL,c:T.amber}:{text:"Review",bg:T.redXL,c:T.red};
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 16px 14px",textAlign:"center",position:"relative",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${col},${col}40)`,borderRadius:"16px 16px 0 0"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${pct*0.6}%`,background:bgCol,transition:"height 1s ease",pointerEvents:"none",opacity:.4}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{fontFamily:T.body,fontSize:9,fontWeight:700,color:T.textS,letterSpacing:"1px",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}><span dangerouslySetInnerHTML={{__html:label}}/>{tipKey&&KPI_TIPS[tipKey]&&<KpiTooltip text={KPI_TIPS[tipKey]} T={T}/>}</div>
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

const TABS=[{id:"overview",label:"Overview"},{id:"intent",label:"Intent"},{id:"entities",label:"Entities"},{id:"daily",label:"Daily View"},{id:"raw",label:"Raw Table"}];

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
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAQ2B9ADASIAAhEBAxEB/8QAHAABAQADAQEBAQAAAAAAAAAAAAgBBgcFBAMC/8QAUxABAAECAwIIBg4JAwIEBgMAAAECAwQFBhExBxchQVVhlNESFjdRcdIIFSIyUlZzgYOEkbGysxMUJDZCdJKhwSMz4WLwQ3KCoiUnNFNjwjWj8f/EABwBAQACAwEBAQAAAAAAAAAAAAAGBwMEBQIBCP/EAEQRAQABAgIDCgsIAgMAAgMBAAABAgMEBQaR0REWITFRU2FxcrEUFSI0NUFSgZKh4RITFyMyM1TwYtJCwcIHRCSisvH/2gAMAwEAAhEDEQA/ALLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k=" alt="EXL" style={{height:32,width:"auto",objectFit:"contain",filter:dark?"brightness(0) invert(1)":"none",transition:"filter .3s"}}/>
          <div style={{width:1,height:28,background:T.border}}/>
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
            <option value="">Overall</option>
            {day16&&<option value="live">Today -- {day16.date} (Live)</option>}
            {[...days15].reverse().map(d=><option key={d.date} value={d.date}>{d.date}</option>)}
          </select>
        </div>

        {/* Banner */}
        <div style={{marginBottom:14,padding:"8px 14px",background:isAcc?T.orangeXL:isLive?T.tealXL:T.blueXL,border:`1px solid ${isAcc?T.orange+"40":isLive?T.teal+"40":T.blueL+"40"}`,borderRadius:10,display:"flex",gap:16,alignItems:"center",transition:"background .3s"}}>
          <span style={{fontFamily:T.body,fontSize:10,fontWeight:700,color:isAcc?T.orange:isLive?T.teal:T.blueL,letterSpacing:"1px",textTransform:"uppercase"}}>
            {isAcc?`Overall -- All 16 Days -- ${N(accumulated?.total_emails)} total emails`:isLive?`Today (Live) -- ${N(day16?.total_emails)} emails so far`:`Day: ${selDay} -- ${N(displayData?.total_emails)} emails`}
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
            <StatCard label="Total Emails<br/>Received"  value={N(displayData.total_emails)}         accent={T.orange} T={T} loading={loading} live={isLive} tipKey="total_emails"/>
            <StatCard label="Completed<br/>by User"      value={N(displayData.completed_by_user)}    accent={T.teal}   T={T} loading={loading} live={isLive} sub={displayData.total_emails?`${Math.round(displayData.completed_by_user/displayData.total_emails*100)}% rate`:""} tipKey="completed_by_user"/>
            <StatCard label="Assigned<br/>Onboarded"     value={N(displayData.assigned_onboarded)}   accent={T.blueL}  T={T} loading={loading} live={isLive} tipKey="assigned_onboarded"/>
            <StatCard label="Assigned<br/>Default"       value={N(displayData.assigned_default)}     accent={T.amber}  T={T} loading={loading} live={isLive} tipKey="assigned_default"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Incorrect<br/>Assignment"   value={N(displayData.incorrect_assignment)} accent={T.red}    T={T} loading={loading} live={isLive} sub={displayData.assigned_onboarded?`${Math.round(displayData.incorrect_assignment/displayData.assigned_onboarded*100)}% of onboarded`:""} tipKey="incorrect_assignment"/>
            <StatCard label="Intent<br/>Detected"        value={N(displayData.intent_detected)}      accent={T.blueL}  T={T} loading={loading} live={isLive} tipKey="intent_detected"/>
            <StatCard label="Incorrect<br/>Intent"       value={N(displayData.incorrect_intent)}     accent={T.red}    T={T} loading={loading} live={isLive} tipKey="incorrect_intent"/>
            <StatCard label="Total<br/>Entities"         value={N(displayData.total_entities)}       accent={T.orange} T={T} loading={loading} live={isLive} tipKey="total_entities"/>
          </div>
          <SectionHead label="Accuracy KPIs" color={T.teal} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <AccCard label="Assignment<br/>Accuracy"  value={displayData.assignment_accuracy} T={T} loading={loading} tipKey="assignment_accuracy"/>
            <AccCard label="Intent<br/>Accuracy"      value={displayData.intent_accuracy}     T={T} loading={loading} tipKey="intent_accuracy"/>
            <AccCard label="PO<br/>Accuracy"          value={displayData.po_accuracy}         T={T} loading={loading} tipKey="po_accuracy"/>
            <AccCard label="Invoice<br/>Accuracy"     value={displayData.inv_accuracy}        T={T} loading={loading} tipKey="inv_accuracy"/>
          </div>
          <SectionHead label="Entity Extraction" color={T.blueL} T={T}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            <EntityBlock title="PO Number"   ext={displayData.po_extracted}     corr={displayData.po_corrected}     acc={displayData.po_accuracy}     col={T.orange} T={T}/>
            <EntityBlock title="Invoice"     ext={displayData.inv_extracted}    corr={displayData.inv_corrected}    acc={displayData.inv_accuracy}    col={T.blueL}  T={T}/>
            <EntityBlock title="Vendor Name" ext={displayData.vendor_extracted} corr={displayData.vendor_corrected} acc={displayData.vendor_accuracy} col={T.teal}   T={T}/>
          </div>
        </>}

        {/* INTENT TAB */}
        {activeTab==="intent" && displayData && <>
          <SectionHead label="Intent Detection" color={T.blueL} T={T} sub={isAcc?"Cumulative across all 16 days":isLive?"Today's running total":"Daily totals"}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Intent<br/>Detected"      value={N(displayData.intent_detected)}  accent={T.blueL} T={T} loading={loading} live={isLive}/>
            <StatCard label="Incorrect<br/>Intent"     value={N(displayData.incorrect_intent)} accent={T.red}   T={T} loading={loading} live={isLive}
              sub={displayData.intent_detected?`${Math.round(displayData.incorrect_intent/displayData.intent_detected*100)}% error rate`:""}/>
            <AccCard label="Intent<br/>Accuracy" value={displayData.intent_accuracy} T={T} loading={loading}/>
            <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"18px 18px 14px",position:"relative",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.blueL},${T.blueL}30)`,borderRadius:"16px 16px 0 0"}}/>
              <div style={{fontFamily:T.body,fontSize:10,fontWeight:600,color:T.textS,letterSpacing:".8px",textTransform:"uppercase",marginBottom:10}}>Correct Intent</div>
              <div style={{fontFamily:T.display,fontSize:26,fontWeight:500,color:T.teal,lineHeight:1}}>{N(displayData.intent_detected - displayData.incorrect_intent)}</div>
              <div style={{marginTop:9,display:"inline-flex",alignItems:"center",gap:5,background:`${T.teal}15`,border:`1px solid ${T.teal}25`,borderRadius:20,padding:"2px 9px"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:T.teal}}/>
                <span style={{fontFamily:T.body,fontSize:9,fontWeight:600,color:T.teal}}>
                  {displayData.intent_detected?`${(100-parseFloat(displayData.intent_accuracy||0)<0?0:(100-parseFloat(displayData.intent_accuracy||0))).toFixed(1)}% miss rate`:""}
                </span>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <ChartCard title="Intent Detection Volume" height={230} T={T}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gIB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blueL} stopOpacity={.25}/><stop offset="95%" stopColor={T.blueL} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gIT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.teal} stopOpacity={.2}/><stop offset="95%" stopColor={T.teal} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                  <XAxis dataKey="date" {...aP}/><YAxis {...aP} width={50}/>
                  <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                  <Area type="monotone" dataKey="emails"    stroke={T.blueL} fill="url(#gIB)" strokeWidth={2.5} dot={false} name="Total Emails"   isAnimationActive={false}/>
                  <Area type="monotone" dataKey="completed" stroke={T.teal}  fill="url(#gIT)" strokeWidth={2}   dot={false} name="Intent Detected" isAnimationActive={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Intent Accuracy Trend %" height={230} T={T}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                  <XAxis dataKey="date" {...aP}/><YAxis domain={[80,100]} {...aP} width={36} tickFormatter={v=>v+"%"}/>
                  <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                  <Line type="monotone" dataKey="intent_acc" stroke={T.blueL} strokeWidth={3} dot={false} name="Intent Accuracy" isAnimationActive={false}/>
                  <Line type="monotone" dataKey="assign_acc" stroke={T.orange} strokeWidth={1.5} dot={false} name="Assignment Acc" isAnimationActive={false} strokeDasharray="4 3"/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>}

        {/* ENTITIES TAB */}
        {activeTab==="entities" && displayData && <>
          <SectionHead label="Entity Extraction" color={T.teal} T={T} sub={`Total entities extracted: ${N(displayData.total_entities)}`}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            <StatCard label="Total<br/>Entities"     value={N(displayData.total_entities)}    accent={T.teal}   T={T} loading={loading} live={isLive}/>
            <StatCard label="PO<br/>Extracted"       value={N(displayData.po_extracted)}      accent={T.orange} T={T} loading={loading} live={isLive}/>
            <StatCard label="Invoice<br/>Extracted"  value={N(displayData.inv_extracted)}     accent={T.blueL}  T={T} loading={loading} live={isLive}/>
            <StatCard label="Vendor<br/>Extracted"   value={N(displayData.vendor_extracted)}  accent={T.teal}   T={T} loading={loading} live={isLive}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <EntityBlock title="PO Number"   ext={displayData.po_extracted}     corr={displayData.po_corrected}     acc={displayData.po_accuracy}     col={T.orange} T={T}/>
            <EntityBlock title="Invoice"     ext={displayData.inv_extracted}    corr={displayData.inv_corrected}    acc={displayData.inv_accuracy}    col={T.blueL}  T={T}/>
            <EntityBlock title="Vendor Name" ext={displayData.vendor_extracted} corr={displayData.vendor_corrected} acc={displayData.vendor_accuracy} col={T.teal}   T={T}/>
          </div>
          <ChartCard title="Entity Extraction Trend" height={220} badge="PO / Invoice / Vendor" T={T}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gEO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.orange} stopOpacity={.25}/><stop offset="95%" stopColor={T.orange} stopOpacity={0}/></linearGradient>
                  <linearGradient id="gEB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blueL}  stopOpacity={.2}/> <stop offset="95%" stopColor={T.blueL}  stopOpacity={0}/></linearGradient>
                  <linearGradient id="gET" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.teal}   stopOpacity={.2}/> <stop offset="95%" stopColor={T.teal}   stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={T.border}/>
                <XAxis dataKey="date" {...aP}/><YAxis {...aP} width={50}/>
                <Tooltip content={tip}/><Legend wrapperStyle={{fontSize:10,fontFamily:T.body}}/>
                <Area type="monotone" dataKey="po"     stroke={T.orange} fill="url(#gEO)" strokeWidth={2} dot={false} name="PO #"      isAnimationActive={false}/>
                <Area type="monotone" dataKey="inv"    stroke={T.blueL}  fill="url(#gEB)" strokeWidth={2} dot={false} name="Invoice #"  isAnimationActive={false}/>
                <Area type="monotone" dataKey="vendor" stroke={T.teal}   fill="url(#gET)" strokeWidth={2} dot={false} name="Vendor"     isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
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
