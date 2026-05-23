import { useState, useEffect, useCallback, useRef } from "react";
import {
  createUser, deleteUser, updateUserCollection,
  updateUserReady, updateUserLastSeen,
  subscribeToUsers, createRoom, setRoomHost, subscribeToRooms,
  savePrediction, subscribeToPredictions
} from "./firebase";

// ── MATCHES data (Group Stage, all 72 matches) ─────────────
const MATCHES = [
  // GROUP A
  {id:"A1",group:"A",date:"Jun 11",home:"MEX",away:"RSA"},
  {id:"A2",group:"A",date:"Jun 11",home:"KOR",away:"CZE"},
  {id:"A3",group:"A",date:"Jun 18",home:"CZE",away:"RSA"},
  {id:"A4",group:"A",date:"Jun 18",home:"MEX",away:"KOR"},
  {id:"A5",group:"A",date:"Jun 22",home:"MEX",away:"CZE"},
  {id:"A6",group:"A",date:"Jun 22",home:"RSA",away:"KOR"},
  // GROUP B
  {id:"B1",group:"B",date:"Jun 12",home:"CAN",away:"BIH"},
  {id:"B2",group:"B",date:"Jun 13",home:"QAT",away:"SUI"},
  {id:"B3",group:"B",date:"Jun 18",home:"SUI",away:"BIH"},
  {id:"B4",group:"B",date:"Jun 18",home:"CAN",away:"QAT"},
  {id:"B5",group:"B",date:"Jun 22",home:"CAN",away:"SUI"},
  {id:"B6",group:"B",date:"Jun 22",home:"BIH",away:"QAT"},
  // GROUP C
  {id:"C1",group:"C",date:"Jun 13",home:"BRA",away:"MAR"},
  {id:"C2",group:"C",date:"Jun 13",home:"HAI",away:"SCO"},
  {id:"C3",group:"C",date:"Jun 19",home:"SCO",away:"MAR"},
  {id:"C4",group:"C",date:"Jun 19",home:"BRA",away:"HAI"},
  {id:"C5",group:"C",date:"Jun 23",home:"BRA",away:"SCO"},
  {id:"C6",group:"C",date:"Jun 23",home:"MAR",away:"HAI"},
  // GROUP D
  {id:"D1",group:"D",date:"Jun 12",home:"USA",away:"PAR"},
  {id:"D2",group:"D",date:"Jun 13",home:"AUS",away:"TUR"},
  {id:"D3",group:"D",date:"Jun 19",home:"USA",away:"AUS"},
  {id:"D4",group:"D",date:"Jun 19",home:"TUR",away:"PAR"},
  {id:"D5",group:"D",date:"Jun 23",home:"USA",away:"TUR"},
  {id:"D6",group:"D",date:"Jun 23",home:"PAR",away:"AUS"},
  // GROUP E
  {id:"E1",group:"E",date:"Jun 14",home:"GER",away:"CUW"},
  {id:"E2",group:"E",date:"Jun 14",home:"CIV",away:"ECU"},
  {id:"E3",group:"E",date:"Jun 20",home:"GER",away:"CIV"},
  {id:"E4",group:"E",date:"Jun 20",home:"ECU",away:"CUW"},
  {id:"E5",group:"E",date:"Jun 24",home:"GER",away:"ECU"},
  {id:"E6",group:"E",date:"Jun 24",home:"CUW",away:"CIV"},
  // GROUP F
  {id:"F1",group:"F",date:"Jun 14",home:"NED",away:"JPN"},
  {id:"F2",group:"F",date:"Jun 14",home:"TUN",away:"SWE"},
  {id:"F3",group:"F",date:"Jun 20",home:"NED",away:"SWE"},
  {id:"F4",group:"F",date:"Jun 20",home:"JPN",away:"TUN"},
  {id:"F5",group:"F",date:"Jun 24",home:"NED",away:"TUN"},
  {id:"F6",group:"F",date:"Jun 24",home:"SWE",away:"JPN"},
  // GROUP G
  {id:"G1",group:"G",date:"Jun 15",home:"BEL",away:"EGY"},
  {id:"G2",group:"G",date:"Jun 15",home:"IRN",away:"NZL"},
  {id:"G3",group:"G",date:"Jun 21",home:"BEL",away:"IRN"},
  {id:"G4",group:"G",date:"Jun 21",home:"NZL",away:"EGY"},
  {id:"G5",group:"G",date:"Jun 25",home:"BEL",away:"NZL"},
  {id:"G6",group:"G",date:"Jun 25",home:"EGY",away:"IRN"},
  // GROUP H
  {id:"H1",group:"H",date:"Jun 15",home:"ESP",away:"CPV"},
  {id:"H2",group:"H",date:"Jun 15",home:"KSA",away:"URU"},
  {id:"H3",group:"H",date:"Jun 21",home:"ESP",away:"KSA"},
  {id:"H4",group:"H",date:"Jun 21",home:"URU",away:"CPV"},
  {id:"H5",group:"H",date:"Jun 25",home:"ESP",away:"URU"},
  {id:"H6",group:"H",date:"Jun 25",home:"CPV",away:"KSA"},
  // GROUP I
  {id:"I1",group:"I",date:"Jun 16",home:"FRA",away:"SEN"},
  {id:"I2",group:"I",date:"Jun 16",home:"IRQ",away:"NOR"},
  {id:"I3",group:"I",date:"Jun 22",home:"FRA",away:"IRQ"},
  {id:"I4",group:"I",date:"Jun 22",home:"NOR",away:"SEN"},
  {id:"I5",group:"I",date:"Jun 26",home:"FRA",away:"NOR"},
  {id:"I6",group:"I",date:"Jun 26",home:"SEN",away:"IRQ"},
  // GROUP J
  {id:"J1",group:"J",date:"Jun 16",home:"ARG",away:"ALG"},
  {id:"J2",group:"J",date:"Jun 16",home:"AUT",away:"JOR"},
  {id:"J3",group:"J",date:"Jun 22",home:"ARG",away:"AUT"},
  {id:"J4",group:"J",date:"Jun 22",home:"JOR",away:"ALG"},
  {id:"J5",group:"J",date:"Jun 26",home:"ARG",away:"JOR"},
  {id:"J6",group:"J",date:"Jun 26",home:"ALG",away:"AUT"},
  // GROUP K
  {id:"K1",group:"K",date:"Jun 17",home:"POR",away:"COD"},
  {id:"K2",group:"K",date:"Jun 17",home:"UZB",away:"COL"},
  {id:"K3",group:"K",date:"Jun 23",home:"POR",away:"UZB"},
  {id:"K4",group:"K",date:"Jun 23",home:"COL",away:"COD"},
  {id:"K5",group:"K",date:"Jun 27",home:"POR",away:"COL"},
  {id:"K6",group:"K",date:"Jun 27",home:"COD",away:"UZB"},
  // GROUP L
  {id:"L1",group:"L",date:"Jun 17",home:"ENG",away:"CRO"},
  {id:"L2",group:"L",date:"Jun 17",home:"GHA",away:"PAN"},
  {id:"L3",group:"L",date:"Jun 23",home:"ENG",away:"GHA"},
  {id:"L4",group:"L",date:"Jun 23",home:"PAN",away:"CRO"},
  {id:"L5",group:"L",date:"Jun 27",home:"ENG",away:"PAN"},
  {id:"L6",group:"L",date:"Jun 27",home:"CRO",away:"GHA"},
];

const TEAM_NAMES = {
  MEX:"México",RSA:"Sudáfrica",KOR:"Corea del Sur",CZE:"Rep. Checa",CAN:"Canadá",
  BIH:"Bosnia",QAT:"Qatar",SUI:"Suiza",BRA:"Brasil",MAR:"Marruecos",HAI:"Haití",
  SCO:"Escocia",USA:"EE.UU.",PAR:"Paraguay",AUS:"Australia",TUR:"Turquía",
  GER:"Alemania",CUW:"Curazao",CIV:"Costa de Marfil",ECU:"Ecuador",NED:"Países Bajos",
  JPN:"Japón",SWE:"Suecia",TUN:"Túnez",BEL:"Bélgica",EGY:"Egipto",IRN:"Irán",
  NZL:"Nueva Zelanda",ESP:"España",CPV:"Cabo Verde",KSA:"Arabia Saudita",URU:"Uruguay",
  FRA:"Francia",SEN:"Senegal",IRQ:"Iraq",NOR:"Noruega",ARG:"Argentina",ALG:"Argelia",
  AUT:"Austria",JOR:"Jordania",POR:"Portugal",COD:"Congo",UZB:"Uzbekistán",COL:"Colombia",
  ENG:"Inglaterra",CRO:"Croacia",GHA:"Ghana",PAN:"Panamá"
};
const TEAMS = Object.keys(TEAM_NAMES);
const TEAM_COLORS = {
  MEX:"#006847",RSA:"#007A4D",KOR:"#C60C30",CZE:"#D7141A",CAN:"#FF0000",
  BIH:"#002395",QAT:"#8D1B3D",SUI:"#FF0000",BRA:"#009C3B",MAR:"#C1272D",
  HAI:"#00209F",SCO:"#003366",USA:"#3C3B6E",PAR:"#D52B1E",AUS:"#00008B",
  TUR:"#E30A17",GER:"#333333",CUW:"#002B7F",CIV:"#F77F00",ECU:"#FFD100",
  NED:"#FF6600",JPN:"#BC002D",SWE:"#006AA7",TUN:"#E70013",BEL:"#333333",
  EGY:"#C8102E",IRN:"#239F40",NZL:"#00247D",ESP:"#AA151B",CPV:"#003893",
  KSA:"#006C35",URU:"#5EB6E4",FRA:"#002395",SEN:"#00853F",IRQ:"#CE1126",
  NOR:"#EF2B2D",ARG:"#74ACDF",ALG:"#006233",AUT:"#ED2939",JOR:"#007A3D",
  POR:"#006600",COD:"#007FFF",UZB:"#1EB53A",COL:"#FCD116",ENG:"#CF142B",
  CRO:"#FF0000",GHA:"#006B3F",PAN:"#D21034"
};

const SPECIAL_STICKERS = Array.from({length:20},(_,i)=>String(i).padStart(2,"0"));
const COCA_STICKERS    = Array.from({length:14},(_,i)=>i+1);
const TEAM_STICKERS    = Array.from({length:20},(_,i)=>i+1);
const AVATAR_EMOJIS = ["⚽","🏆","🥅","🦅","🦁","🐯","🦊","🐻","🦋","🌟","🔥","💎","🎯","🌈","⚡","🦄","🍀","🎸","🏅","🎪"];
const COLORS = [
  {name:"Azul",bg:"#1a56db"},{name:"Verde",bg:"#057a55"},{name:"Rojo",bg:"#c81e1e"},
  {name:"Morado",bg:"#7e3af2"},{name:"Naranja",bg:"#d97706"},{name:"Rosa",bg:"#e74694"},
  {name:"Cian",bg:"#0694a2"},{name:"Gris",bg:"#4b5563"},
];

function hashPass(s){let h=0;for(let i=0;i<s.length;i++)h=Math.imul(31,h)+s.charCodeAt(i)|0;return h.toString(36);}

function buildEmptyCollection(){
  const col={};
  TEAMS.forEach(t=>{col[t]={};TEAM_STICKERS.forEach(n=>{col[t][n]={owned:false,repeated:0};});});
  col["ESPE"]={};SPECIAL_STICKERS.forEach(n=>{col["ESPE"][n]={owned:false,repeated:0};});
  col["CC"]={};COCA_STICKERS.forEach(n=>{col["CC"][n]={owned:false,repeated:0};});
  return col;
}

function calcStats(col){
  if(!col) return {total:994,owned:0,missing:994,pct:0,reps:0,sections:{},complete:[],best:[],worst:[]};
  let total=0,owned=0,reps=0;const sections={};
  TEAMS.forEach(t=>{
    let tO=0,tR=0;
    TEAM_STICKERS.forEach(n=>{total++;if(col[t]?.[n]?.owned){owned++;tO++;}tR+=col[t]?.[n]?.repeated||0;});
    sections[t]={total:20,owned:tO,reps:tR,pct:Math.round(tO/20*100)};reps+=tR;
  });
  let sO=0,sR=0;
  SPECIAL_STICKERS.forEach(n=>{total++;if(col["ESPE"]?.[n]?.owned){owned++;sO++;}sR+=col["ESPE"]?.[n]?.repeated||0;});
  sections["ESPE"]={total:20,owned:sO,reps:sR,pct:Math.round(sO/20*100)};reps+=sR;
  let cO=0,cR=0;
  COCA_STICKERS.forEach(n=>{total++;if(col["CC"]?.[n]?.owned){owned++;cO++;}cR+=col["CC"]?.[n]?.repeated||0;});
  sections["CC"]={total:14,owned:cO,reps:cR,pct:Math.round(cO/14*100)};reps+=cR;
  const missing=total-owned,pct=Math.round(owned/total*100);
  const sorted=[...TEAMS].map(t=>({code:t,...sections[t]})).sort((a,b)=>b.pct-a.pct);
  return{total,owned,missing,pct,reps,sections,complete:sorted.filter(s=>s.pct===100),best:sorted.slice(0,3),worst:sorted.slice(-3).reverse()};
}

function findMatches(users,myId){
  const me=users[myId];if(!me)return[];
  const myCol=me.collection;
  const hasIt=(col,sk,n)=>col[sk]?.[n]?.owned||(col[sk]?.[n]?.repeated||0)>0;
  const hasRep=(col,sk,n)=>(col[sk]?.[n]?.repeated||0)>0;
  const needsIt=(col,sk,n)=>!hasIt(col,sk,n);
  return Object.entries(users).filter(([uid,u])=>uid!==myId&&u.ready===true).map(([uid,user])=>{
    const tc=user.collection;const gives=[],ns=[];
    TEAMS.forEach(t=>TEAM_STICKERS.forEach(n=>{
      if(hasRep(myCol,t,n)&&needsIt(tc,t,n))gives.push({section:t,num:n,code:t});
      if(hasRep(tc,t,n)&&needsIt(myCol,t,n))ns.push({section:t,num:n,code:t});
    }));
    SPECIAL_STICKERS.forEach(n=>{
      if(hasRep(myCol,"ESPE",n)&&needsIt(tc,"ESPE",n))gives.push({section:"ESPE",num:n,code:"ESPE"});
      if(hasRep(tc,"ESPE",n)&&needsIt(myCol,"ESPE",n))ns.push({section:"ESPE",num:n,code:"ESPE"});
    });
    COCA_STICKERS.forEach(n=>{
      if(hasRep(myCol,"CC",n)&&needsIt(tc,"CC",n))gives.push({section:"CC",num:n,code:"CC"});
      if(hasRep(tc,"CC",n)&&needsIt(myCol,"CC",n))ns.push({section:"CC",num:n,code:"CC"});
    });
    if(gives.length>0||ns.length>0)return{uid,name:user.name,avatar:user.avatar,color:user.color,gives,needs:ns};
    return null;
  }).filter(Boolean);
}

// ── Share text generator ──────────────────────────────────
function generateShareText(col,name,type){
  const lines=[`Album Mundial 2026 — ${name}`,""];
  const sectionLabel=(sk)=>sk==="ESPE"?"Especiales":sk==="CC"?"Coca-Cola":(`${sk} (${TEAM_NAMES[sk]||sk})`);

  const addSection=(sk,stickers)=>{
    const missing=[],repeated=[];
    stickers.forEach(n=>{
      const v=col[sk]?.[n];
      if(!v?.owned&&!(v?.repeated>0)) missing.push(n);
      if(v?.repeated>0) repeated.push(`${n}x${v.repeated}`);
    });
    if(type==="faltantes"||type==="ambos"){
      if(missing.length>0) lines.push(`${sectionLabel(sk)} — Faltantes (${missing.length}):`);
      if(missing.length>0) lines.push(missing.join(", "));
    }
    if(type==="repetidos"||type==="ambos"){
      if(repeated.length>0) lines.push(`${sectionLabel(sk)} — Repetidos:`);
      if(repeated.length>0) lines.push(repeated.join(", "));
    }
  };

  TEAMS.forEach(t=>addSection(t,TEAM_STICKERS));
  addSection("ESPE",SPECIAL_STICKERS);
  addSection("CC",COCA_STICKERS);
  return lines.filter((l,i,a)=>!(l===""&&a[i-1]==="")).join("\n");
}

// ── Scoring ───────────────────────────────────────────────
function scorePrediction(pred, result){
  if(!result||result.homeScore===null||result.awayScore===null) return null;
  const exactHome=pred.homeScore===result.homeScore, exactAway=pred.awayScore===result.awayScore;
  if(exactHome&&exactAway) return 3; // exact score
  const predWinner=pred.homeScore>pred.awayScore?"H":pred.homeScore<pred.awayScore?"A":"D";
  const realWinner=result.homeScore>result.awayScore?"H":result.homeScore<result.awayScore?"A":"D";
  if(predWinner===realWinner) return 1; // correct winner/draw only
  return 0;
}

// ── UI atoms ──────────────────────────────────────────────
function UserAvatar({user,size=36}){
  const emoji=AVATAR_EMOJIS[user?.avatar||0]||"⚽";
  const bg=user?.color?.bg||"#1a56db";
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,flexShrink:0,border:"2px solid rgba(255,255,255,0.3)"}}>{emoji}</div>;
}
function TeamBadge({code,size=22}){
  const bg=TEAM_COLORS[code]||"#374151";
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:bg,color:"#fff",borderRadius:4,fontSize:size*0.42,fontWeight:700,width:size*2,height:size,letterSpacing:"-0.5px",flexShrink:0}}>{code}</span>;
}
function ProgressBar({pct,color="#057a55",height=6}){
  return <div style={{background:"#e5e7eb",borderRadius:99,height,overflow:"hidden",width:"100%"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .35s"}}/></div>;
}
function StatCard({label,value,sub,color}){
  return <div style={{background:"#f3f4f6",borderRadius:10,padding:"12px 16px",flex:1,minWidth:110}}><div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||"#111"}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}</div>;
}

function StickerMenu({val,label,onAddRepeat,onRemoveRepeat,onRemoveOwned,onClose}){
  const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[onClose]);
  const Btn=({onClick,bg,col,children})=><button onClick={onClick} style={{display:"block",width:"100%",padding:"7px 10px",marginBottom:4,background:bg,color:col,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,textAlign:"left",fontWeight:500}}>{children}</button>;
  return(
    <div ref={ref} style={{position:"absolute",zIndex:9999,top:42,left:0,background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",minWidth:210,whiteSpace:"nowrap"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:8,paddingLeft:4}}>{label}</div>
      {val.owned&&<Btn onClick={onAddRepeat} bg="#fef3c7" col="#92400e">+ Tengo repetido{val.repeated>0?` (${val.repeated} extra${val.repeated>1?"s":""})`:""}
      </Btn>}
      {val.repeated>0&&<Btn onClick={onRemoveRepeat} bg="#f3f4f6" col="#374151">- Quitar un repetido</Btn>}
      <Btn onClick={onRemoveOwned} bg="#fde8e8" col="#991b1b">Borrar (corregir error)</Btn>
    </div>
  );
}

function StickerCell({sectionKey,num,val,onFirstClick,onAddRepeat,onRemoveRepeat,onRemoveOwned}){
  const [open,setOpen]=useState(false);
  const owned=val?.owned||false,repeated=val?.repeated||0;
  let bg="#f3f4f6",border="1px solid #e5e7eb",tc="#9ca3af";
  if(owned&&repeated>0){bg="#fef3c7";border="1px solid #d97706";tc="#92400e";}
  else if(owned){bg="#def7ec";border="1px solid #10b981";tc="#065f46";}
  const sk=sectionKey==="ESPE"?"Esp":sectionKey==="CC"?"CC":sectionKey;
  return(
    <div style={{position:"relative",display:"inline-block"}}>
      <div style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginBottom:2,userSelect:"none"}}>{num}</div>
      <div onClick={()=>{if(!owned){onFirstClick();}else{setOpen(o=>!o);}}} style={{width:34,height:34,borderRadius:8,background:bg,border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",userSelect:"none",fontSize:10,fontWeight:700,color:tc}}>
        {repeated>0&&<span style={{position:"absolute",top:-6,right:-6,background:"#d97706",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:1}}>{repeated}</span>}
        {owned?"✓":"–"}
      </div>
      {open&&owned&&<StickerMenu val={val||{owned:false,repeated:0}} label={`${sk} #${num}`} onAddRepeat={()=>{onAddRepeat();setOpen(false);}} onRemoveRepeat={()=>{onRemoveRepeat();setOpen(false);}} onRemoveOwned={()=>{onRemoveOwned();setOpen(false);}} onClose={()=>setOpen(false)}/>}
    </div>
  );
}

function MatchCard({m}){
  const [open,setOpen]=useState(false);
  const total=m.gives.length+m.needs.length;
  const Tag=({g,bg,color})=>(
    <span style={{fontSize:11,background:bg,color,padding:"2px 8px",borderRadius:6,fontWeight:600,display:"inline-flex",alignItems:"center",gap:3}}>
      <TeamBadge code={g.code} size={14}/> #{g.num}
    </span>
  );
  return(
    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",userSelect:"none"}}>
        <UserAvatar user={m} size={40}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:15}}>{m.name}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
            {m.gives.length>0&&<span style={{color:"#065f46",marginRight:8}}>{m.gives.length} puedes dar</span>}
            {m.needs.length>0&&<span style={{color:"#1e40af"}}>{m.needs.length} puedes recibir</span>}
          </div>
        </div>
        <div style={{textAlign:"center",marginRight:8}}>
          <div style={{fontSize:20,fontWeight:700,color:m.color?.bg||"#1a56db"}}>{total}</div>
          <div style={{fontSize:10,color:"#9ca3af"}}>cromos</div>
        </div>
        <div style={{fontSize:20,color:"#9ca3af",transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform .2s"}}>›</div>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid #f3f4f6",padding:"12px 16px"}}>
          {m.gives.length>0&&<div style={{marginBottom:10,background:"#f0fdf4",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:12,fontWeight:700,color:"#065f46",marginBottom:8}}>Tu le das a {m.name} ({m.gives.length}):</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{m.gives.map((g,i)=><Tag key={i} g={g} bg="#def7ec" color="#065f46"/>)}</div></div>}
          {m.needs.length>0&&<div style={{background:"#eff6ff",borderRadius:10,padding:"10px 12px"}}><div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:8}}>{m.name} te da a ti ({m.needs.length}):</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{m.needs.map((g,i)=><Tag key={i} g={g} bg="#e8f0fe" color="#1e40af"/>)}</div></div>}
        </div>
      )}
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────
function ShareModal({col,name,onClose}){
  const [type,setType]=useState("repetidos");
  const [copied,setCopied]=useState(false);
  const text=generateShareText(col,name,type);
  const copy=()=>{navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const whatsapp=()=>{window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,padding:20,maxWidth:480,width:"100%",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:16}}>Compartir mis cromos</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280"}}>x</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["repetidos","Repetidos"],["faltantes","Faltantes"],["ambos","Ambos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setType(v)} style={{flex:1,padding:"8px 4px",fontSize:12,fontWeight:600,borderRadius:8,border:type===v?"2px solid #1a56db":"1px solid #d1d5db",background:type===v?"#e8f0fe":"#fff",color:type===v?"#1a56db":"#374151",cursor:"pointer"}}>{l}</button>
          ))}
        </div>
        <textarea readOnly value={text} style={{flex:1,minHeight:200,fontSize:11,padding:10,border:"1px solid #e5e7eb",borderRadius:10,resize:"none",fontFamily:"monospace",lineHeight:1.5}}/>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={copy} style={{flex:1,padding:11,fontWeight:700,fontSize:13,background:copied?"#057a55":"#f3f4f6",color:copied?"#fff":"#374151",border:"none",borderRadius:10,cursor:"pointer"}}>{copied?"Copiado!":"Copiar texto"}</button>
          <button onClick={whatsapp} style={{flex:1,padding:11,fontWeight:700,fontSize:13,background:"#25D366",color:"#fff",border:"none",borderRadius:10,cursor:"pointer"}}>Enviar por WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

// ── Predictions Tab ───────────────────────────────────────
function PredictionsTab({myId,myName,roomId,predictions,users}){
  const [selGroup,setSelGroup]=useState("A");
  const [myPreds,setMyPreds]=useState({});
  const [saved,setSaved]=useState({});
  const groups=["A","B","C","D","E","F","G","H","I","J","K","L"];

  // Load my predictions from firebase data
  useEffect(()=>{
    const mine={};
    Object.entries(predictions).forEach(([matchId,preds])=>{
      if(preds[myId]) mine[matchId]=preds[myId];
    });
    setMyPreds(mine);
  },[predictions,myId]);

  const groupMatches=MATCHES.filter(m=>m.group===selGroup);

  const handleInput=(matchId,field,val)=>{
    const n=parseInt(val);
    if(val===""||(!isNaN(n)&&n>=0&&n<=20)){
      setMyPreds(p=>({...p,[matchId]:{...p[matchId],[field]:val===""?null:n}}));
    }
  };

  const handleSave=async(matchId)=>{
    const pred=myPreds[matchId];
    if(pred?.homeScore==null||pred?.awayScore==null) return;
    await savePrediction(roomId,matchId,myId,{homeScore:pred.homeScore,awayScore:pred.awayScore,name:myName});
    setSaved(s=>({...s,[matchId]:true}));
    setTimeout(()=>setSaved(s=>({...s,[matchId]:false})),2000);
  };

  // Compute scoreboard
  const scoreboard={};
  MATCHES.forEach(m=>{
    const matchPreds=predictions[m.id]||{};
    // host sets result via result field
    const result=matchPreds["_result"];
    Object.entries(matchPreds).forEach(([uid,pred])=>{
      if(uid==="_result") return;
      const pts=scorePrediction(pred,result);
      if(pts!==null){
        if(!scoreboard[uid]) scoreboard[uid]={pts:0,exact:0,winner:0};
        scoreboard[uid].pts+=pts;
        if(pts===3) scoreboard[uid].exact++;
        if(pts===1) scoreboard[uid].winner++;
      }
    });
  });

  const roomUsers=Object.entries(users).filter(([,u])=>u.roomId===roomId);

  return(
    <div>
      <div style={{background:"#e8f0fe",border:"1px solid #93c5fd",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#1e40af"}}>
        Predice el resultado de cada partido. 3 pts por resultado exacto · 1 pt por acertar ganador o empate.
      </div>

      {/* Scoreboard */}
      {Object.keys(scoreboard).length>0&&(
        <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e5e7eb",marginBottom:16}}>
          <div style={{fontWeight:700,marginBottom:10}}>Tabla de predicciones</div>
          {roomUsers
            .map(([id,u])=>({id,u,s:scoreboard[id]||{pts:0,exact:0,winner:0}}))
            .sort((a,b)=>b.s.pts-a.s.pts)
            .map(({id,u,s},i)=>(
              <div key={id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
                <div style={{fontWeight:700,color:"#9ca3af",width:20}}>#{i+1}</div>
                <UserAvatar user={u} size={30}/>
                <div style={{flex:1,fontWeight:600,fontSize:13}}>{u.name}{id===myId&&<span style={{fontSize:10,background:"#1a56db",color:"#fff",padding:"1px 6px",borderRadius:99,marginLeft:6}}>tu</span>}</div>
                <div style={{fontWeight:700,color:"#1a56db",fontSize:16}}>{s.pts} pts</div>
                <div style={{fontSize:11,color:"#6b7280"}}>{s.exact} exactos · {s.winner} ganador</div>
              </div>
            ))}
        </div>
      )}

      {/* Group tabs */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        {groups.map(g=>(
          <button key={g} onClick={()=>setSelGroup(g)} style={{padding:"5px 10px",fontSize:12,fontWeight:600,borderRadius:8,border:selGroup===g?"2px solid #1a56db":"1px solid #d1d5db",background:selGroup===g?"#e8f0fe":"#fff",color:selGroup===g?"#1a56db":"#374151",cursor:"pointer"}}>Grupo {g}</button>
        ))}
      </div>

      {/* Match cards */}
      {groupMatches.map(m=>{
        const pred=myPreds[m.id]||{};
        const allPreds=predictions[m.id]||{};
        const result=allPreds["_result"];
        const myScore=result?scorePrediction(pred,result):null;
        return(
          <div key={m.id} style={{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:14,marginBottom:10}}>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{m.date} · Grupo {m.group}</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:6}}>
                <TeamBadge code={m.home} size={24}/>
                <span style={{fontWeight:700,fontSize:14}}>{TEAM_NAMES[m.home]}</span>
              </div>
              <span style={{fontWeight:700,color:"#9ca3af",fontSize:13}}>vs</span>
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}>
                <span style={{fontWeight:700,fontSize:14}}>{TEAM_NAMES[m.away]}</span>
                <TeamBadge code={m.away} size={24}/>
              </div>
            </div>

            {/* My prediction input */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:12,color:"#6b7280",flexShrink:0}}>Mi prediccion:</span>
              <input type="number" min="0" max="20" value={pred.homeScore??""} onChange={e=>handleInput(m.id,"homeScore",e.target.value)} placeholder="0" style={{width:44,textAlign:"center",fontSize:16,fontWeight:700,padding:"6px 4px",border:"1px solid #d1d5db",borderRadius:8,outline:"none"}}/>
              <span style={{fontWeight:700}}>-</span>
              <input type="number" min="0" max="20" value={pred.awayScore??""} onChange={e=>handleInput(m.id,"awayScore",e.target.value)} placeholder="0" style={{width:44,textAlign:"center",fontSize:16,fontWeight:700,padding:"6px 4px",border:"1px solid #d1d5db",borderRadius:8,outline:"none"}}/>
              <button onClick={()=>handleSave(m.id)} disabled={pred.homeScore==null||pred.awayScore==null} style={{padding:"6px 14px",fontSize:12,fontWeight:700,background:saved[m.id]?"#057a55":pred.homeScore!=null&&pred.awayScore!=null?"#1a56db":"#d1d5db",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",flexShrink:0}}>
                {saved[m.id]?"Guardado":"Guardar"}
              </button>
              {myScore!==null&&<span style={{fontSize:12,fontWeight:700,color:myScore===3?"#057a55":myScore===1?"#d97706":"#9ca3af",marginLeft:4}}>{myScore===3?"3pts - Exacto!":myScore===1?"1pt - Ganador":"0pts"}</span>}
            </div>

            {/* Other users predictions (visible after result or always) */}
            {Object.entries(allPreds).filter(([uid])=>uid!==myId&&uid!=="_result").length>0&&(
              <div style={{background:"#f9fafb",borderRadius:8,padding:8}}>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:6}}>Predicciones de otros:</div>
                {Object.entries(allPreds).filter(([uid])=>uid!==myId&&uid!=="_result").map(([uid,p])=>{
                  const u=users[uid];
                  const pts=result?scorePrediction(p,result):null;
                  return(
                    <div key={uid} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <UserAvatar user={u} size={20}/>
                      <span style={{fontSize:12,fontWeight:600}}>{u?.name||uid}</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#374151"}}>{p.homeScore} - {p.awayScore}</span>
                      {pts!==null&&<span style={{fontSize:11,color:pts===3?"#057a55":pts===1?"#d97706":"#9ca3af"}}>{pts===3?"Exacto":pts===1?"Ganador":"Fallo"}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
export default function App(){
  const [users,setUsers]           =useState({});
  const [rooms,setRooms]           =useState({});
  const [predictions,setPredictions]=useState({});
  const [myId,setMyId]             =useState(null);
  const [screen,setScreen]         =useState("loading");
  const [tab,setTab]               =useState("album");
  const [step,setStep]             =useState("room");
  const [roomInput,setRoomInput]   =useState("");
  const [roomErr,setRoomErr]       =useState("");
  const [pickId,setPickId]         =useState(null);
  const [loginPass,setLoginPass]   =useState("");
  const [loginErr,setLoginErr]     =useState("");
  const [newName,setNewName]       =useState("");
  const [newPass,setNewPass]       =useState("");
  const [newPass2,setNewPass2]     =useState("");
  const [newAvatarIdx,setNewAvatarIdx]=useState(0);
  const [newColor,setNewColor]     =useState(COLORS[0]);
  const [regErr,setRegErr]         =useState("");
  const [newRoomName,setNewRoomName]=useState("");
  const [newRoomPass,setNewRoomPass]=useState("");
  const [newRoomErr,setNewRoomErr] =useState("");
  const [selSection,setSelSection] =useState(TEAMS[0]);
  const [secSearch,setSecSearch]   =useState("");
  const [saving,setSaving]         =useState(false);
  const [dismissed,setDismissed]   =useState([]);
  const [hostPass,setHostPass]     =useState("");
  const [hostErr,setHostErr]       =useState("");
  const [hostUnlocked,setHostUnlocked]=useState(false);
  const [showShare,setShowShare]   =useState(false);
  const saveTimer=useRef(null);
  const heartbeatTimer=useRef(null);

  useEffect(()=>{
    const unsub1=subscribeToUsers(data=>{
      setUsers(data);
      setScreen(prev=>{
        if(prev==="loading"){
          const id=localStorage.getItem("album_myId");
          const room=localStorage.getItem("album_room");
          if(id&&data[id]&&room){setMyId(id);return "app";}
          return "login";
        }
        return prev;
      });
    });
    const unsub2=subscribeToRooms(data=>setRooms(data));
    return()=>{unsub1();unsub2();};
  },[]);

  const myRoom=localStorage.getItem("album_room");

  useEffect(()=>{
    if(!myRoom) return;
    const unsub=subscribeToPredictions(myRoom,data=>setPredictions(data));
    return()=>unsub();
  },[myRoom]);

  useEffect(()=>{
    if(!myId)return;
    updateUserLastSeen(myId);
    heartbeatTimer.current=setInterval(()=>updateUserLastSeen(myId),30000);
    return()=>clearInterval(heartbeatTimer.current);
  },[myId]);

  const currentRoom=myRoom?rooms[myRoom]:null;
  const me=myId?users[myId]:null;
  const stats=me?calcStats(me.collection):null;
  const readyUsers=Object.fromEntries(Object.entries(users).filter(([,u])=>u.ready&&u.roomId===myRoom));
  const matches=me&&me.ready?findMatches({...readyUsers,[myId]:me},myId):[];
  const activeAlerts=matches.filter(m=>!dismissed.includes(m.uid));
  const isHost=currentRoom&&currentRoom.hostId===myId;

  const flushCollection=useCallback((col)=>{
    if(!myId)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current=setTimeout(async()=>{try{await updateUserCollection(myId,col);}catch(e){console.error(e);}setSaving(false);},600);
  },[myId]);

  const updateSticker=useCallback((sk,num,fn)=>{
    if(!myId)return;
    setUsers(prev=>{
      const next={...prev};
      const col=JSON.parse(JSON.stringify(next[myId].collection));
      if(!col[sk])col[sk]={};
      if(!col[sk][num])col[sk][num]={owned:false,repeated:0};
      fn(col[sk][num]);
      next[myId]={...next[myId],collection:col};
      flushCollection(col);
      return next;
    });
  },[myId,flushCollection]);

  const onFirstClick  =(sk,n)=>updateSticker(sk,n,s=>{s.owned=true;});
  const onAddRepeat   =(sk,n)=>updateSticker(sk,n,s=>{s.owned=true;s.repeated=(s.repeated||0)+1;});
  const onRemoveRepeat=(sk,n)=>updateSticker(sk,n,s=>{if(s.repeated>0)s.repeated--;});
  const onRemoveOwned =(sk,n)=>updateSticker(sk,n,s=>{s.owned=false;s.repeated=0;});

  // Fill all stickers in current section
  const fillAll=()=>{
    if(!myId)return;
    setUsers(prev=>{
      const next={...prev};
      const col=JSON.parse(JSON.stringify(next[myId].collection));
      if(!col[selSection])col[selSection]={};
      const list=TEAMS.includes(selSection)?TEAM_STICKERS:selSection==="ESPE"?SPECIAL_STICKERS:COCA_STICKERS;
      list.forEach(n=>{
        if(!col[selSection][n])col[selSection][n]={owned:false,repeated:0};
        col[selSection][n].owned=true;
      });
      next[myId]={...next[myId],collection:col};
      flushCollection(col);
      return next;
    });
  };

  // Auth
  const handleCheckRoom=()=>{
    const code=roomInput.trim().toUpperCase();
    if(!code){setRoomErr("Escribe el codigo de sala.");return;}
    const found=Object.entries(rooms).find(([,r])=>r.code===code);
    if(!found){setRoomErr("Sala no encontrada. Verifica el codigo.");return;}
    setRoomErr("");localStorage.setItem("album_room",found[0]);setStep("choose");
  };
  const handleCreateRoom=async()=>{
    if(!newRoomName.trim()){setNewRoomErr("Escribe un nombre.");return;}
    if(newRoomPass.length<4){setNewRoomErr("Contrasena min. 4 caracteres.");return;}
    const code=Math.random().toString(36).substring(2,8).toUpperCase();
    const roomId="room_"+Date.now();
    await createRoom(roomId,{name:newRoomName.trim(),code,hostPassHash:hashPass(newRoomPass),hostId:null,createdAt:Date.now()});
    localStorage.setItem("album_room",roomId);
    localStorage.setItem("album_pendingHost",roomId);
    setNewRoomErr("");setStep("register");
  };
  const handlePickUser=(id)=>{setPickId(id);setLoginPass("");setLoginErr("");setStep("login");};
  const handleLogin=()=>{
    const u=users[pickId];
    if(!u){setLoginErr("Usuario no encontrado.");return;}
    if(u.passHash!==hashPass(loginPass)){setLoginErr("Contrasena incorrecta.");return;}
    localStorage.setItem("album_myId",pickId);setMyId(pickId);setScreen("app");
  };
  const handleRegister=async()=>{
    if(!newName.trim()){setRegErr("Escribe tu nombre.");return;}
    if(newPass.length<4){setRegErr("Contrasena min. 4 caracteres.");return;}
    if(newPass!==newPass2){setRegErr("Las contrasenas no coinciden.");return;}
    if(Object.values(users).some(u=>u.name.toLowerCase()===newName.trim().toLowerCase())){setRegErr("Ese nombre ya existe.");return;}
    const roomId=localStorage.getItem("album_room");
    if(!roomId){setRegErr("No hay sala seleccionada.");return;}
    const id="u_"+Date.now();
    await createUser(id,{name:newName.trim(),avatar:newAvatarIdx,color:newColor,passHash:hashPass(newPass),collection:buildEmptyCollection(),ready:false,roomId,createdAt:Date.now(),lastSeen:Date.now()});
    const pendingHost=localStorage.getItem("album_pendingHost");
    if(pendingHost===roomId){await setRoomHost(roomId,id);localStorage.removeItem("album_pendingHost");}
    localStorage.setItem("album_myId",id);setMyId(id);setScreen("app");
  };
  const handleLogout=()=>{localStorage.removeItem("album_myId");setMyId(null);setScreen("login");setStep("room");setRoomInput("");setTab("album");setDismissed([]);setHostUnlocked(false);};
  const handleReady=async()=>{if(!myId)return;await updateUserReady(myId,true);setUsers(prev=>({...prev,[myId]:{...prev[myId],ready:true}}));};
  const handleUnready=async()=>{if(!myId)return;await updateUserReady(myId,false);setUsers(prev=>({...prev,[myId]:{...prev[myId],ready:false}}));};
  const handleDeleteUser=async(uid)=>{if(!window.confirm(`Eliminar a "${users[uid]?.name}"?`))return;await deleteUser(uid);};

  const filteredTeams=secSearch?TEAMS.filter(t=>t.toLowerCase().includes(secSearch.toLowerCase())||TEAM_NAMES[t]?.toLowerCase().includes(secSearch.toLowerCase())):TEAMS;
  const isEsp=selSection==="ESPE",isCC=selSection==="CC";
  const stickerList=TEAMS.includes(selSection)?TEAM_STICKERS:isEsp?SPECIAL_STICKERS:COCA_STICKERS;
  const sInfo=stats?.sections[selSection];

  const inp={width:"100%",fontSize:15,padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:13,color:"#6b7280",display:"block",marginBottom:6};
  const btnBlue={width:"100%",padding:13,fontSize:15,fontWeight:700,background:"#1a56db",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",marginBottom:8};
  const wrap={minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px"};
  const inner={width:"100%",maxWidth:420};
  const back={background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:13,marginBottom:20,padding:0};

  if(screen==="loading") return <div style={{minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{width:64,height:64,background:"#1a56db",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",fontWeight:700,margin:"0 auto 16px"}}>W</div><div style={{fontWeight:700,fontSize:20}}>Album Mundial 2026</div><div style={{fontSize:14,color:"#6b7280",marginTop:6}}>Conectando...</div></div></div>;

  if(screen==="login"){
    if(step==="room") return(
      <div style={wrap}><div style={inner}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"#1a56db",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",fontWeight:700,margin:"0 auto 16px"}}>W</div>
          <h1 style={{fontSize:24,fontWeight:700,marginBottom:6}}>Album Mundial 2026</h1>
          <p style={{fontSize:14,color:"#6b7280"}}>Ingresa el codigo de sala para unirte</p>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #e5e7eb",marginBottom:12}}>
          <label style={lbl}>Codigo de sala</label>
          <input value={roomInput} onChange={e=>setRoomInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleCheckRoom()} style={{...inp,letterSpacing:3,fontWeight:700}}/>
          {roomErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{roomErr}</p>}
        </div>
        <button onClick={handleCheckRoom} style={btnBlue}>Entrar</button>
        <div style={{textAlign:"center",margin:"12px 0",color:"#9ca3af",fontSize:13}}>o</div>
        <button onClick={()=>setStep("createRoom")} style={{...btnBlue,background:"#057a55"}}>Crear sala nueva (Host)</button>
      </div></div>
    );

    if(step==="createRoom") return(
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("room")} style={back}>← Volver</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Crear sala nueva</h2>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Tu seras el host y podras administrar la sala</p>
        <div style={{marginBottom:12}}><label style={lbl}>Nombre de la sala</label><input value={newRoomName} onChange={e=>setNewRoomName(e.target.value)} placeholder="ej: Familia Garcia" style={inp}/></div>
        <div style={{marginBottom:20}}><label style={lbl}>Contrasena del host (solo para ti)</label><input type="password" value={newRoomPass} onChange={e=>setNewRoomPass(e.target.value)} placeholder="Min. 4 caracteres" style={inp}/></div>
        {newRoomErr&&<p style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{newRoomErr}</p>}
        <button onClick={handleCreateRoom} style={btnBlue}>Continuar — Crear mi perfil</button>
      </div></div>
    );

    if(step==="choose"){
      const roomId=localStorage.getItem("album_room");
      const room=rooms[roomId];
      const roomUsers=Object.entries(users).filter(([,u])=>u.roomId===roomId);
      return(
        <div style={wrap}><div style={inner}>
          <button onClick={()=>{setStep("room");localStorage.removeItem("album_room");}} style={back}>← Cambiar sala</button>
          <div style={{background:"#e8f0fe",borderRadius:12,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontWeight:700,color:"#1e40af",fontSize:14}}>{room?.name||"Sala"}</div>
            <div style={{fontSize:12,color:"#3b82f6",marginLeft:"auto"}}>{roomUsers.length} usuario(s)</div>
          </div>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>¿Quien eres?</h2>
          <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Elige tu perfil o crea uno nuevo</p>
          {roomUsers.map(([id,u])=>{const st=calcStats(u.collection);return(
            <div key={id} onClick={()=>handlePickUser(id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,cursor:"pointer",border:"1px solid #e5e7eb"}}>
              <UserAvatar user={u} size={38}/>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{u.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{st?.pct||0}% completado{u.ready?" · Listo":""}</div></div>
              <span style={{fontSize:12,color:"#9ca3af",fontWeight:600}}>Entrar</span>
            </div>
          );})}
          <button onClick={()=>{setRegErr("");setNewName("");setNewPass("");setNewPass2("");setStep("register");}} style={{...btnBlue,background:"#057a55",marginTop:8}}>+ Crear perfil nuevo</button>
        </div></div>
      );
    }

    if(step==="login"){const u=users[pickId];return(
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,background:"#fff",padding:16,borderRadius:14,border:"1px solid #e5e7eb"}}>
          <UserAvatar user={u} size={48}/>
          <div><div style={{fontWeight:700,fontSize:17}}>{u?.name}</div><div style={{fontSize:12,color:"#6b7280"}}>Ingresa tu contrasena</div></div>
        </div>
        <div style={{marginBottom:16}}><label style={lbl}>Contrasena</label><input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={inp}/>{loginErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{loginErr}</p>}</div>
        <button onClick={handleLogin} style={btnBlue}>Entrar</button>
      </div></div>
    );}

    if(step==="register") return(
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Crear perfil</h2>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Nombre unico + contrasena para proteger tu perfil</p>
        <div style={{marginBottom:12}}><label style={lbl}>Nombre o apodo</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Tu nombre" style={inp}/></div>
        <div style={{marginBottom:12}}><label style={lbl}>Contrasena (min. 4)</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:16}}><label style={lbl}>Confirmar contrasena</label><input type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Emoji</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {AVATAR_EMOJIS.map((em,i)=><div key={i} onClick={()=>setNewAvatarIdx(i)} style={{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,cursor:"pointer",border:newAvatarIdx===i?"2px solid #1a56db":"1px solid #e5e7eb",background:newAvatarIdx===i?"#e8f0fe":"#fff"}}>{em}</div>)}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={lbl}>Color</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {COLORS.map(c=><div key={c.name} onClick={()=>setNewColor(c)} title={c.name} style={{width:32,height:32,borderRadius:"50%",background:c.bg,cursor:"pointer",border:newColor.name===c.name?"3px solid #111":"3px solid transparent"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#f3f4f6",padding:14,borderRadius:12,marginBottom:16}}>
          <UserAvatar user={{avatar:newAvatarIdx,color:newColor}} size={44}/>
          <div><div style={{fontWeight:700}}>{newName||"Tu nombre"}</div><div style={{fontSize:12,color:"#6b7280"}}>Vista previa</div></div>
        </div>
        {regErr&&<p style={{color:"#dc2626",fontSize:13,marginBottom:12,fontWeight:500}}>{regErr}</p>}
        <button onClick={handleRegister} disabled={!newName.trim()||newPass.length<4} style={{...btnBlue,background:newName.trim()&&newPass.length>=4?"#1a56db":"#d1d5db",cursor:newName.trim()&&newPass.length>=4?"pointer":"not-allowed"}}>Crear perfil</button>
      </div></div>
    );
  }

  // ════ MAIN APP ════
  return(
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      {showShare&&me&&<ShareModal col={me.collection} name={me.name} onClose={()=>setShowShare(false)}/>}

      {/* header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",position:"sticky",top:0,zIndex:200}}>
        <div style={{maxWidth:820,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:"#1a56db",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>W</div>
            <span style={{fontWeight:700,fontSize:15}}>Album Mundial 2026</span>
            {saving&&<span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>guardando...</span>}
          </div>
          {me&&(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {activeAlerts.length>0&&<span onClick={()=>setTab("intercambios")} style={{background:"#fef3c7",color:"#92400e",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,border:"1px solid #fcd34d",cursor:"pointer"}}>{activeAlerts.length} match{activeAlerts.length>1?"es":""}</span>}
              <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",border:"1px solid #e5e7eb",borderRadius:20,cursor:"pointer"}}>
                <UserAvatar user={me} size={24}/>
                <span style={{fontSize:13,fontWeight:600}}>{me.name}</span>
                <span style={{fontSize:11,color:"#9ca3af"}}>salir</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ready banner */}
      {me&&!me.ready&&(
        <div style={{background:"#fef3c7",borderBottom:"1px solid #fcd34d",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#92400e"}}>Cuando termines, marca "Listo"</div><div style={{fontSize:12,color:"#92400e",marginTop:2}}>Los intercambios y predicciones solo se comparten entre usuarios listos</div></div>
          <button onClick={handleReady} style={{background:"#057a55",color:"#fff",border:"none",borderRadius:10,padding:"8px 20px",fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>Listo - Ya ingrese mis cromos</button>
        </div>
      )}
      {me?.ready&&(
        <div style={{background:"#def7ec",borderBottom:"1px solid #6ee7b7",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:"#065f46",fontWeight:700,fontSize:13}}>Listo — datos activos para intercambios</span>
          <button onClick={()=>setShowShare(true)} style={{marginLeft:"auto",fontSize:12,fontWeight:600,background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"4px 14px",cursor:"pointer"}}>Compartir mis cromos</button>
          <button onClick={handleUnready} style={{fontSize:11,background:"none",border:"1px solid #6ee7b7",borderRadius:7,padding:"3px 10px",cursor:"pointer",color:"#065f46"}}>Editar datos</button>
        </div>
      )}

      {/* alerts */}
      {tab!=="intercambios"&&me?.ready&&activeAlerts.slice(0,2).map(m=>(
        <div key={m.uid} style={{background:"#eff6ff",borderBottom:"1px solid #93c5fd",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,fontSize:13,color:"#1e40af"}}><strong>Match con {m.name}!</strong>{m.gives.length>0&&` Puedes darle ${m.gives.length}.`}{m.needs.length>0&&` Te pueden dar ${m.needs.length}.`}</div>
          <button onClick={()=>setTab("intercambios")} style={{fontSize:11,fontWeight:600,background:"#1a56db",color:"#fff",border:"none",borderRadius:7,padding:"4px 12px",cursor:"pointer",marginRight:4}}>Ver</button>
          <button onClick={()=>setDismissed(d=>[...d,m.uid])} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",color:"#1e40af",lineHeight:1,padding:"0 4px"}}>x</button>
        </div>
      ))}

      {/* tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb"}}>
        <div style={{maxWidth:820,margin:"0 auto",display:"flex",padding:"0 16px",overflowX:"auto"}}>
          {[["album","Album"],["stats","Estadisticas"],["intercambios","Intercambios"],["predicciones","Predicciones"],["usuarios","Usuarios"],["host","Host"]].filter(([k])=>k!=="host"||isHost).map(([key,lbl])=>(
            <button key={key} onClick={()=>setTab(key)} style={{padding:"12px 14px",fontSize:13,fontWeight:tab===key?700:400,background:"none",border:"none",whiteSpace:"nowrap",borderBottom:tab===key?"2px solid #1a56db":"2px solid transparent",color:tab===key?"#1a56db":"#6b7280",cursor:"pointer"}}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:16}}>

        {/* ALBUM */}
        {tab==="album"&&me&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Leyenda:</span>
              {[["#def7ec","#065f46","Obtenido"],["#fef3c7","#92400e","Con repetidos"],["#f3f4f6","#9ca3af","Falta"]].map(([bg,col,lb])=>(
                <span key={lb} style={{background:bg,color:col,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:500}}>{lb}</span>
              ))}
              <span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>1er clic = obtener · 2do = opciones</span>
            </div>
            <input value={secSearch} onChange={e=>setSecSearch(e.target.value)} placeholder="Buscar seleccion..." style={{width:"100%",fontSize:13,padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
              {filteredTeams.map(t=>{const sv=stats?.sections[t],active=selSection===t;return(
                <button key={t} onClick={()=>setSelSection(t)} style={{padding:"4px 8px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:active?"2px solid #1a56db":"1px solid #d1d5db",background:active?"#e8f0fe":"#fff",color:active?"#1a56db":"#374151",position:"relative",display:"flex",alignItems:"center",gap:4}}>
                  <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:TEAM_COLORS[t]||"#374151",flexShrink:0}}/>{t}
                  {sv?.pct===100&&<span style={{position:"absolute",top:-5,right:-5,fontSize:8,background:"#057a55",color:"#fff",borderRadius:99,padding:"1px 4px"}}>ok</span>}
                </button>
              );})}
              {[["ESPE","Especiales","#7e3af2"],["CC","Coca-Cola","#e74694"]].map(([key,lb,clr])=>(
                <button key={key} onClick={()=>setSelSection(key)} style={{padding:"4px 8px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:selSection===key?`2px solid ${clr}`:"1px solid #d1d5db",background:selSection===key?clr+"22":"#fff",color:selSection===key?clr:"#374151"}}>{lb}</button>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {TEAMS.includes(selSection)&&<TeamBadge code={selSection} size={28}/>}
                  {isEsp&&<div style={{width:36,height:28,background:"#7e3af2",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11}}>ESP</div>}
                  {isCC&&<div style={{width:36,height:28,background:"#e74694",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10}}>CC</div>}
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{isEsp?"Especiales":isCC?"Coca-Cola":(TEAM_NAMES[selSection]||selSection)}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{sInfo?.owned}/{sInfo?.total} obtenidos · {sInfo?.reps} repetidos</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={fillAll} style={{fontSize:11,fontWeight:600,background:"#e8f0fe",color:"#1a56db",border:"1px solid #93c5fd",borderRadius:8,padding:"5px 12px",cursor:"pointer",whiteSpace:"nowrap"}}>Llenar todo</button>
                  <div style={{fontSize:20,fontWeight:700,color:sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"}}>{sInfo?.pct}%</div>
                </div>
              </div>
              <ProgressBar pct={sInfo?.pct||0} color={sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"} height={6}/>
              <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:6}}>
                {stickerList.map(n=>(
                  <StickerCell key={n} sectionKey={selSection} num={n} val={me.collection[selSection]?.[n]}
                    onFirstClick={()=>onFirstClick(selSection,n)} onAddRepeat={()=>onAddRepeat(selSection,n)}
                    onRemoveRepeat={()=>onRemoveRepeat(selSection,n)} onRemoveOwned={()=>onRemoveOwned(selSection,n)}/>
                ))}
              </div>
              <p style={{fontSize:11,color:"#9ca3af",marginTop:12,marginBottom:0}}>1er clic = marcar obtenido · 2do clic = mas opciones</p>
            </div>
          </div>
        )}

        {/* ESTADISTICAS */}
        {tab==="stats"&&stats&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <StatCard label="Completado" value={`${stats.pct}%`} sub={`${stats.owned} de ${stats.total}`} color={stats.pct>75?"#057a55":stats.pct>40?"#1a56db":"#d97706"}/>
              <StatCard label="Faltantes" value={stats.missing} sub="para terminar"/>
              <StatCard label="Repetidos" value={stats.reps} sub="para intercambiar"/>
              <StatCard label="Secciones 100%" value={stats.complete.length} sub={`de ${TEAMS.length+2}`}/>
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb",marginBottom:16}}>
              <div style={{fontWeight:700,marginBottom:14}}>Progreso por seccion</div>
              {[{lb:`Selecciones (${TEAMS.length})`,owned:TEAMS.reduce((a,t)=>a+(stats.sections[t]?.owned||0),0),total:TEAMS.length*20,color:"#1a56db"},{lb:"Especiales",owned:stats.sections["ESPE"]?.owned||0,total:20,color:"#7e3af2"},{lb:"Coca-Cola",owned:stats.sections["CC"]?.owned||0,total:14,color:"#e74694"}].map(row=>(
                <div key={row.lb} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:500}}>{row.lb}</span><span style={{color:"#6b7280"}}>{row.owned}/{row.total}</span></div><ProgressBar pct={Math.round(row.owned/row.total*100)} color={row.color}/></div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{title:"Mas avanzadas",data:stats.best,color:"#057a55"},{title:"Mas incompletas",data:stats.worst,color:"#dc2626"}].map(({title,data,color})=>(
                <div key={title} style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e5e7eb"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10,color}}>{title}</div>
                  {data.map(sv=><div key={sv.code} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><TeamBadge code={sv.code} size={20}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{TEAM_NAMES[sv.code]||sv.code} <span style={{fontWeight:400,color:"#6b7280"}}>{sv.pct}%</span></div><ProgressBar pct={sv.pct} color={color} height={4}/></div></div>)}
                </div>
              ))}
            </div>
            {stats.complete.length>0&&<div style={{background:"#def7ec",border:"1px solid #6ee7b7",borderRadius:14,padding:14,marginBottom:16}}><div style={{fontWeight:700,color:"#065f46",marginBottom:8}}>Secciones completas ({stats.complete.length})</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{stats.complete.map(sv=><span key={sv.code} style={{background:"#057a55",color:"#fff",padding:"3px 11px",borderRadius:99,fontSize:12,fontWeight:700}}>{sv.code}</span>)}</div></div>}
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,marginBottom:12}}>Todas las selecciones</div>
              {TEAMS.map(t=>{const sv=stats.sections[t];return(
                <div key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <TeamBadge code={t} size={18}/><div style={{flex:1}}><ProgressBar pct={sv.pct} color={sv.pct===100?"#057a55":sv.pct>50?"#1a56db":"#d97706"} height={5}/></div>
                  <span style={{fontSize:11,color:"#6b7280",width:70,textAlign:"right"}}>{sv.owned}/20 · {sv.pct}%</span>
                  {sv.reps>0&&<span style={{fontSize:10,background:"#fef3c7",color:"#92400e",padding:"1px 6px",borderRadius:99,whiteSpace:"nowrap"}}>{sv.reps}x</span>}
                </div>
              );})}
            </div>
          </div>
        )}

        {/* INTERCAMBIOS */}
        {tab==="intercambios"&&(
          <div>
            {!me?.ready?(
              <div style={{textAlign:"center",padding:"40px 20px",background:"#fff",borderRadius:14,border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Marca "Listo" para ver los intercambios</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Cuando termines de registrar tus cromos, presiona el boton "Listo".</div>
                <button onClick={handleReady} style={{background:"#057a55",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Listo - Ya ingrese mis cromos</button>
              </div>
            ):matches.length===0?(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#9ca3af"}}>
                <div style={{fontWeight:600,fontSize:15,color:"#6b7280"}}>No hay matches aun</div>
                <div style={{fontSize:13,marginTop:6}}>Cuando alguien tenga repetidos que tu necesitas, aparecera aqui.</div>
              </div>
            ):matches.map(m=><MatchCard key={m.uid} m={m}/>)}
          </div>
        )}

        {/* PREDICCIONES */}
        {tab==="predicciones"&&(
          <PredictionsTab myId={myId} myName={me?.name||""} roomId={myRoom} predictions={predictions} users={users}/>
        )}

        {/* USUARIOS */}
        {tab==="usuarios"&&(
          <div>
            <div style={{background:"#f3f4f6",borderRadius:12,padding:"10px 16px",marginBottom:16}}>
              <div style={{fontSize:13,color:"#6b7280"}}>{Object.entries(users).filter(([,u])=>u.roomId===myRoom).length} usuario(s) en la sala · <strong>{currentRoom?.name}</strong></div>
            </div>
            {Object.entries(users).filter(([,u])=>u.roomId===myRoom).sort(([,a],[,b])=>(calcStats(b.collection)?.pct||0)-(calcStats(a.collection)?.pct||0)).map(([id,u],i)=>{
              const sv=calcStats(u.collection),isMe=id===myId;
              const online=u.lastSeen&&(Date.now()-u.lastSeen)<90000;
              return(
                <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,border:isMe?"2px solid #1a56db":"1px solid #e5e7eb"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#9ca3af",width:20,textAlign:"center"}}>#{i+1}</div>
                  <UserAvatar user={u} size={42}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700}}>{u.name}</span>
                      {isMe&&<span style={{fontSize:10,background:"#1a56db",color:"#fff",padding:"1px 8px",borderRadius:99,fontWeight:600}}>tu</span>}
                      {u.ready&&<span style={{fontSize:10,background:"#def7ec",color:"#065f46",padding:"1px 8px",borderRadius:99,fontWeight:600}}>Listo</span>}
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:online?"#def7ec":"#f3f4f6",color:online?"#065f46":"#9ca3af"}}>{online?"En linea":"Desconectado"}</span>
                    </div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{sv?.owned}/{sv?.total} · {sv?.reps} rep. · {sv?.complete.length} completas</div>
                    <div style={{marginTop:4}}><ProgressBar pct={sv?.pct||0} color={u.color?.bg||"#1a56db"} height={4}/></div>
                  </div>
                  <div style={{fontSize:20,fontWeight:700,color:u.color?.bg||"#1a56db"}}>{sv?.pct||0}%</div>
                </div>
              );
            })}
          </div>
        )}

        {/* HOST */}
        {tab==="host"&&isHost&&(
          <div>
            {!hostUnlocked?(
              <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #e5e7eb",maxWidth:400}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Panel de Host</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Ingresa la contrasena del host</div>
                <input type="password" value={hostPass} onChange={e=>setHostPass(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(hashPass(hostPass)===currentRoom?.hostPassHash){setHostUnlocked(true);setHostErr("");}else setHostErr("Contrasena incorrecta.");}}} placeholder="Contrasena del host" style={{...inp,marginBottom:8}}/>
                {hostErr&&<p style={{color:"#dc2626",fontSize:12,marginBottom:8}}>{hostErr}</p>}
                <button onClick={()=>{if(hashPass(hostPass)===currentRoom?.hostPassHash){setHostUnlocked(true);setHostErr("");}else setHostErr("Contrasena incorrecta.");}} style={{width:"100%",padding:11,fontSize:14,fontWeight:700,background:"#1a56db",color:"#fff",border:"none",borderRadius:10,cursor:"pointer"}}>Desbloquear</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>Panel de Host — {currentRoom?.name}</div>
                    <div style={{fontSize:13,color:"#6b7280"}}>Codigo de sala: <strong style={{letterSpacing:2}}>{currentRoom?.code}</strong></div>
                  </div>
                  <button onClick={()=>setHostUnlocked(false)} style={{fontSize:12,background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"4px 12px",cursor:"pointer",color:"#6b7280"}}>Bloquear</button>
                </div>
                <div style={{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#92400e"}}>
                  Puedes eliminar usuarios si olvidaron su clave. No puedes ver ni editar sus cromos.
                </div>
                <div style={{fontWeight:700,marginBottom:12}}>Usuarios ({Object.entries(users).filter(([,u])=>u.roomId===myRoom).length})</div>
                {Object.entries(users).filter(([,u])=>u.roomId===myRoom).map(([id,u])=>{
                  const online=u.lastSeen&&(Date.now()-u.lastSeen)<90000,isMe=id===myId;
                  return(
                    <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,border:"1px solid #e5e7eb"}}>
                      <UserAvatar user={u} size={36}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontWeight:600}}>{u.name}</span>
                          {isMe&&<span style={{fontSize:10,background:"#1a56db",color:"#fff",padding:"1px 6px",borderRadius:99}}>host/tu</span>}
                          {u.ready&&<span style={{fontSize:10,background:"#def7ec",color:"#065f46",padding:"1px 6px",borderRadius:99}}>Listo</span>}
                        </div>
                        <div style={{fontSize:12,color:online?"#057a55":"#9ca3af",marginTop:2}}>{online?"En linea":"Desconectado"}{u.lastSeen?` · ${Math.round((Date.now()-u.lastSeen)/60000)} min`:""}</div>
                      </div>
                      {!isMe&&<button onClick={()=>handleDeleteUser(id)} style={{fontSize:12,background:"#fde8e8",color:"#991b1b",border:"1px solid #fca5a5",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:600}}>Eliminar</button>}
                    </div>
                  );
                })}
                <div style={{marginTop:16,background:"#f3f4f6",borderRadius:12,padding:14,fontSize:13,color:"#6b7280"}}>Si un usuario olvido su clave: eliminalo y dile que cree un perfil nuevo.</div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
