import { useState, useEffect, useCallback, useRef } from "react";
import { createUser, updateUserCollection, subscribeToUsers } from "./firebase";

const TEAMS = [
  "MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI","BRA","MAR",
  "HAI","SCO","USA","PAR","AUS","TUR","GER","CUW","CIV","ECU",
  "NED","JPN","SWE","TUN","BEL","EGY","IRN","NZL","ESP","CPV",
  "KSA","URU","FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR",
  "POR","COD","UZB","COL","ENG","CRO","GHA","PAN"
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
const TEAM_FLAGS = {
  MEX:"🇲🇽",RSA:"🇿🇦",KOR:"🇰🇷",CZE:"🇨🇿",CAN:"🇨🇦",BIH:"🇧🇦",QAT:"🇶🇦",SUI:"🇨🇭",
  BRA:"🇧🇷",MAR:"🇲🇦",HAI:"🇭🇹",SCO:"🏴",USA:"🇺🇸",PAR:"🇵🇾",AUS:"🇦🇺",TUR:"🇹🇷",
  GER:"🇩🇪",CUW:"🇨🇼",CIV:"🇨🇮",ECU:"🇪🇨",NED:"🇳🇱",JPN:"🇯🇵",SWE:"🇸🇪",TUN:"🇹🇳",
  BEL:"🇧🇪",EGY:"🇪🇬",IRN:"🇮🇷",NZL:"🇳🇿",ESP:"🇪🇸",CPV:"🇨🇻",KSA:"🇸🇦",URU:"🇺🇾",
  FRA:"🇫🇷",SEN:"🇸🇳",IRQ:"🇮🇶",NOR:"🇳🇴",ARG:"🇦🇷",ALG:"🇩🇿",AUT:"🇦🇹",JOR:"🇯🇴",
  POR:"🇵🇹",COD:"🇨🇩",UZB:"🇺🇿",COL:"🇨🇴",ENG:"🏴",CRO:"🇭🇷",GHA:"🇬🇭",PAN:"🇵🇦"
};
const SPECIAL_STICKERS = Array.from({length:20},(_,i)=>String(i).padStart(2,"0"));
const COCA_STICKERS    = Array.from({length:14},(_,i)=>i+1);
const TEAM_STICKERS    = Array.from({length:20},(_,i)=>i+1);
const AVATARS=["⚽","🏆","🥅","🦅","🦁","🐯","🦊","🐻","🦋","🌟","🔥","💎","🎯","🌈","⚡","🦄","🍀","🎸","🏅","🎪"];
const COLORS=[
  {name:"Azul",bg:"#1a56db"},{name:"Verde",bg:"#057a55"},{name:"Rojo",bg:"#c81e1e"},
  {name:"Morado",bg:"#7e3af2"},{name:"Naranja",bg:"#d97706"},{name:"Rosa",bg:"#e74694"},
  {name:"Cian",bg:"#0694a2"},{name:"Gris",bg:"#4b5563"},
];
const ROOM_CODE="MUNDIAL2026";

function hashPass(str){
  let h=0;
  for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0;
  return h.toString(36);
}

function buildEmptyCollection(){
  const col={};
  TEAMS.forEach(t=>{ col[t]={}; TEAM_STICKERS.forEach(n=>{col[t][n]={owned:false,repeated:0};}); });
  col["ESPECIALES"]={};
  SPECIAL_STICKERS.forEach(n=>{col["ESPECIALES"][n]={owned:false,repeated:0};});
  col["CC"]={};
  COCA_STICKERS.forEach(n=>{col["CC"][n]={owned:false,repeated:0};});
  return col;
}

function calcStats(col){
  if(!col) return null;
  let total=0,owned=0,reps=0; const sections={};
  TEAMS.forEach(t=>{
    let tO=0,tR=0;
    TEAM_STICKERS.forEach(n=>{total++;if(col[t]?.[n]?.owned){owned++;tO++;}tR+=col[t]?.[n]?.repeated||0;});
    sections[t]={total:20,owned:tO,reps:tR,pct:Math.round(tO/20*100)}; reps+=tR;
  });
  let sO=0,sR=0;
  SPECIAL_STICKERS.forEach(n=>{total++;if(col["ESPECIALES"]?.[n]?.owned){owned++;sO++;}sR+=col["ESPECIALES"]?.[n]?.repeated||0;});
  sections["ESPECIALES"]={total:20,owned:sO,reps:sR,pct:Math.round(sO/20*100)}; reps+=sR;
  let cO=0,cR=0;
  COCA_STICKERS.forEach(n=>{total++;if(col["CC"]?.[n]?.owned){owned++;cO++;}cR+=col["CC"]?.[n]?.repeated||0;});
  sections["CC"]={total:14,owned:cO,reps:cR,pct:Math.round(cO/14*100)}; reps+=cR;
  const missing=total-owned,pct=Math.round(owned/total*100);
  const sorted=[...TEAMS].map(t=>({code:t,...sections[t]})).sort((a,b)=>b.pct-a.pct);
  return {total,owned,missing,pct,reps,sections,complete:sorted.filter(s=>s.pct===100),best:sorted.slice(0,3),worst:sorted.slice(-3).reverse()};
}

function findMatches(users,myId){
  const me=users[myId]; if(!me) return [];
  const myCol=me.collection;
  const hasIt =(col,sk,n)=>col[sk]?.[n]?.owned||(col[sk]?.[n]?.repeated||0)>0;
  const hasRep=(col,sk,n)=>(col[sk]?.[n]?.repeated||0)>0;
  const needs =(col,sk,n)=>!hasIt(col,sk,n);
  return Object.entries(users).filter(([uid])=>uid!==myId).map(([uid,user])=>{
    const tc=user.collection; const gives=[],ns=[];
    TEAMS.forEach(t=>TEAM_STICKERS.forEach(n=>{
      if(hasRep(myCol,t,n)&&needs(tc,t,n)) gives.push({section:t,num:n,flag:TEAM_FLAGS[t]});
      if(hasRep(tc,t,n)&&needs(myCol,t,n)) ns.push({section:t,num:n,flag:TEAM_FLAGS[t]});
    }));
    SPECIAL_STICKERS.forEach(n=>{
      if(hasRep(myCol,"ESPECIALES",n)&&needs(tc,"ESPECIALES",n)) gives.push({section:"ESPECIALES",num:n,flag:"✨"});
      if(hasRep(tc,"ESPECIALES",n)&&needs(myCol,"ESPECIALES",n)) ns.push({section:"ESPECIALES",num:n,flag:"✨"});
    });
    COCA_STICKERS.forEach(n=>{
      if(hasRep(myCol,"CC",n)&&needs(tc,"CC",n)) gives.push({section:"CC",num:n,flag:"🥤"});
      if(hasRep(tc,"CC",n)&&needs(myCol,"CC",n)) ns.push({section:"CC",num:n,flag:"🥤"});
    });
    if(gives.length>0||ns.length>0) return {uid,name:user.name,avatar:user.avatar,color:user.color,gives,needs:ns};
    return null;
  }).filter(Boolean);
}

// atoms
function Avatar({avatar,color,size=36}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color?.bg||"#1a56db",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.44,flexShrink:0,border:"2px solid rgba(255,255,255,0.25)"}}>{avatar}</div>;
}
function ProgressBar({pct,color="#057a55",height=6}){
  return <div style={{background:"#e5e7eb",borderRadius:99,height,overflow:"hidden",width:"100%"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .35s"}}/></div>;
}
function StatCard({label,value,sub,color}){
  return <div style={{background:"#f3f4f6",borderRadius:10,padding:"12px 16px",flex:1,minWidth:110}}><div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||"#111"}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}</div>;
}

function StickerMenu({val,label,onToggle,onAddRepeat,onRemoveRepeat,onRemoveOwned,onClose}){
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  const Btn=({onClick,bg,col,children})=>(<button onClick={onClick} style={{display:"block",width:"100%",padding:"7px 10px",marginBottom:4,background:bg,color:col,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,textAlign:"left",fontWeight:500}}>{children}</button>);
  return (
    <div ref={ref} style={{position:"absolute",zIndex:9999,top:42,left:0,background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:10,boxShadow:"0 8px 32px rgba(0,0,0,0.15)",minWidth:220,whiteSpace:"nowrap"}}>
      <div style={{fontSize:12,fontWeight:600,color:"#6b7280",marginBottom:8,paddingLeft:4}}>{label}</div>
      <Btn onClick={onToggle} bg={val.owned?"#fde8e8":"#def7ec"} col={val.owned?"#991b1b":"#065f46"}>{val.owned?"❌ Marcar como faltante":"✅ Marcar como obtenido"}</Btn>
      {val.owned&&<Btn onClick={onAddRepeat} bg="#fef3c7" col="#92400e">🔁 Tengo repetido{val.repeated>0?` (${val.repeated} extra${val.repeated>1?"s":""})`:""}
      </Btn>}
      {val.repeated>0&&<Btn onClick={onRemoveRepeat} bg="#f3f4f6" col="#374151">➖ Quitar un repetido</Btn>}
      {val.owned&&<Btn onClick={onRemoveOwned} bg="#f3f4f6" col="#dc2626">🗑 Borrar (corregir error)</Btn>}
    </div>
  );
}

function StickerCell({sectionKey,num,val,onToggle,onAddRepeat,onRemoveRepeat,onRemoveOwned}){
  const [open,setOpen]=useState(false);
  const owned=val?.owned||false,repeated=val?.repeated||0;
  let bg="#f3f4f6",border="1px solid #e5e7eb",tc="#9ca3af";
  if(owned&&repeated>0){bg="#fef3c7";border="1px solid #d97706";tc="#92400e";}
  else if(owned){bg="#def7ec";border="1px solid #10b981";tc="#065f46";}
  const label=`${sectionKey==="ESPECIALES"?"Esp.":sectionKey==="CC"?"CC":sectionKey} #${num}`;
  return (
    <div style={{position:"relative",display:"inline-block"}}>
      <div style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginBottom:2,userSelect:"none"}}>{num}</div>
      <div onClick={()=>setOpen(o=>!o)} style={{width:34,height:34,borderRadius:8,background:bg,border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",userSelect:"none",fontSize:10,fontWeight:700,color:tc}}>
        {repeated>0&&<span style={{position:"absolute",top:-6,right:-6,background:"#d97706",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:1}}>{repeated}</span>}
        {owned?"✓":"–"}
      </div>
      {open&&<StickerMenu val={val||{owned:false,repeated:0}} label={label} onToggle={()=>{onToggle();setOpen(false);}} onAddRepeat={()=>{onAddRepeat();setOpen(false);}} onRemoveRepeat={()=>{onRemoveRepeat();setOpen(false);}} onRemoveOwned={()=>{onRemoveOwned();setOpen(false);}} onClose={()=>setOpen(false)}/>}
    </div>
  );
}

function MatchCard({m}){
  const [open,setOpen]=useState(false);
  const total=m.gives.length+m.needs.length;
  const tag=(items,bg,color)=>items.map((g,i)=>(
    <span key={i} style={{fontSize:11,background:bg,color,padding:"3px 9px",borderRadius:99,fontWeight:500}}>
      {g.flag} {g.section==="ESPECIALES"?"Esp":g.section}#{g.num}
    </span>
  ));
  return (
    <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",marginBottom:10,overflow:"hidden"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer",userSelect:"none"}}>
        <Avatar avatar={m.avatar} color={m.color} size={40}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:15}}>{m.name}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
            {m.gives.length>0&&<span style={{color:"#065f46",marginRight:8}}>✅ {m.gives.length} puedes dar</span>}
            {m.needs.length>0&&<span style={{color:"#1e40af"}}>🎯 {m.needs.length} puedes recibir</span>}
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
          {m.gives.length>0&&(
            <div style={{marginBottom:10,background:"#f0fdf4",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#065f46",marginBottom:8}}>✅ Tú le das a {m.name} ({m.gives.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tag(m.gives,"#def7ec","#065f46")}</div>
            </div>
          )}
          {m.needs.length>0&&(
            <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:8}}>🎯 {m.name} te da a ti ({m.needs.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{tag(m.needs,"#e8f0fe","#1e40af")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function App(){
  const [users,setUsers]           =useState({});
  const [myId,setMyId]             =useState(null);
  const [screen,setScreen]         =useState("loading");
  const [tab,setTab]               =useState("album");
  // login flow
  const [step,setStep]             =useState("room"); // room | choose | login | register
  const [roomInput,setRoomInput]   =useState("");
  const [roomErr,setRoomErr]       =useState("");
  const [pickId,setPickId]         =useState(null);
  const [loginPass,setLoginPass]   =useState("");
  const [loginErr,setLoginErr]     =useState("");
  const [newName,setNewName]       =useState("");
  const [newPass,setNewPass]       =useState("");
  const [newPass2,setNewPass2]     =useState("");
  const [newAvatar,setNewAvatar]   =useState("⚽");
  const [newColor,setNewColor]     =useState(COLORS[0]);
  const [regErr,setRegErr]         =useState("");
  // app
  const [selSection,setSelSection] =useState(TEAMS[0]);
  const [secSearch,setSecSearch]   =useState("");
  const [saving,setSaving]         =useState(false);
  const [dismissed,setDismissed]   =useState([]);
  const saveTimer=useRef(null);

  useEffect(()=>{
    const unsub=subscribeToUsers(data=>{
      setUsers(data);
      setScreen(prev=>{
        if(prev==="loading"){
          const id=localStorage.getItem("album_myId");
          if(id&&data[id]){setMyId(id);return "app";}
          return "login";
        }
        return prev;
      });
    });
    return()=>unsub();
  },[]);

  const me=myId?users[myId]:null;
  const stats=me?calcStats(me.collection):null;
  const matches=me?findMatches(users,myId):[];
  const activeAlerts=matches.filter(m=>(m.gives.length>0||m.needs.length>0)&&!dismissed.includes(m.uid));

  const flushCollection=useCallback((col)=>{
    if(!myId)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current=setTimeout(async()=>{
      try{await updateUserCollection(myId,col);}catch(e){console.error(e);}
      setSaving(false);
    },800);
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

  const onToggle      =(sk,n)=>updateSticker(sk,n,s=>{s.owned=!s.owned;if(!s.owned)s.repeated=0;});
  const onAddRepeat   =(sk,n)=>updateSticker(sk,n,s=>{s.owned=true;s.repeated=(s.repeated||0)+1;});
  const onRemoveRepeat=(sk,n)=>updateSticker(sk,n,s=>{if(s.repeated>0)s.repeated--;});
  const onRemoveOwned =(sk,n)=>updateSticker(sk,n,s=>{s.owned=false;s.repeated=0;});

  // auth
  const handleRoom=()=>{
    if(roomInput.trim().toUpperCase()!==ROOM_CODE){setRoomErr("Código incorrecto.");return;}
    setRoomErr("");setStep("choose");
  };
  const handlePickUser=(id)=>{setPickId(id);setLoginPass("");setLoginErr("");setStep("login");};
  const handleLogin=()=>{
    const u=users[pickId];
    if(!u){setLoginErr("Usuario no encontrado.");return;}
    if(u.passHash!==hashPass(loginPass)){setLoginErr("Contraseña incorrecta.");return;}
    localStorage.setItem("album_myId",pickId);
    setMyId(pickId);setScreen("app");
  };
  const handleRegister=async()=>{
    if(!newName.trim()){setRegErr("Escribe tu nombre.");return;}
    if(newPass.length<4){setRegErr("Contraseña mínimo 4 caracteres.");return;}
    if(newPass!==newPass2){setRegErr("Las contraseñas no coinciden.");return;}
    if(Object.values(users).some(u=>u.name.toLowerCase()===newName.trim().toLowerCase())){setRegErr("Ese nombre ya existe.");return;}
    const id="u_"+Date.now();
    await createUser(id,{name:newName.trim(),avatar:newAvatar,color:newColor,passHash:hashPass(newPass),collection:buildEmptyCollection(),createdAt:Date.now()});
    localStorage.setItem("album_myId",id);
    setMyId(id);setScreen("app");
  };
  const handleLogout=()=>{localStorage.removeItem("album_myId");setMyId(null);setScreen("login");setStep("room");setRoomInput("");setTab("album");setDismissed([]);};

  const filteredTeams=secSearch?TEAMS.filter(t=>t.toLowerCase().includes(secSearch.toLowerCase())||TEAM_NAMES[t]?.toLowerCase().includes(secSearch.toLowerCase())):TEAMS;
  const isEsp=selSection==="ESPECIALES",isCC=selSection==="CC";
  const stickerList=TEAMS.includes(selSection)?TEAM_STICKERS:isEsp?SPECIAL_STICKERS:COCA_STICKERS;
  const sInfo=stats?.sections[selSection];

  const inp={width:"100%",fontSize:15,padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:13,color:"#6b7280",display:"block",marginBottom:6};
  const btnBlue={width:"100%",padding:13,fontSize:15,fontWeight:700,background:"#1a56db",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",marginBottom:8};
  const wrap={minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px"};
  const inner={width:"100%",maxWidth:400};
  const back={background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:13,marginBottom:20,padding:0};

  // ════ LOADING ════
  if(screen==="loading") return <div style={{minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🏆</div><div style={{fontSize:14,color:"#6b7280"}}>Conectando...</div></div></div>;

  // ════ LOGIN FLOW ════
  if(screen==="login"){

    if(step==="room") return (
      <div style={wrap}><div style={inner}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:56,marginBottom:12}}>🏆</div>
          <h1 style={{fontSize:24,fontWeight:700}}>Álbum Mundial 2026</h1>
          <p style={{fontSize:14,color:"#6b7280",marginTop:6}}>Ingresa el código de sala</p>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #e5e7eb",marginBottom:12}}>
          <label style={lbl}>Código de sala</label>
          <input value={roomInput} onChange={e=>setRoomInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRoom()} placeholder="MUNDIAL2026" style={{...inp,letterSpacing:3,fontWeight:700,textTransform:"uppercase"}}/>
          {roomErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{roomErr}</p>}
        </div>
        <button onClick={handleRoom} style={btnBlue}>Entrar →</button>
      </div></div>
    );

    if(step==="choose") return (
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("room")} style={back}>← Cambiar código</button>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:8}}>🏆</div>
          <h2 style={{fontSize:20,fontWeight:700}}>¿Quién eres?</h2>
          <p style={{fontSize:13,color:"#6b7280",marginTop:4}}>Elige tu perfil o crea uno nuevo</p>
        </div>
        {Object.entries(users).map(([id,u])=>{
          const st=calcStats(u.collection);
          return (
            <div key={id} onClick={()=>handlePickUser(id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,cursor:"pointer",border:"1px solid #e5e7eb"}}>
              <Avatar avatar={u.avatar} color={u.color} size={38}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{u.name}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{st?.pct||0}% completado</div>
              </div>
              <span style={{fontSize:13,color:"#9ca3af",fontWeight:600}}>🔒 Entrar</span>
            </div>
          );
        })}
        <button onClick={()=>{setRegErr("");setNewName("");setNewPass("");setNewPass2("");setStep("register");}} style={{...btnBlue,background:"#057a55",marginTop:8}}>+ Crear perfil nuevo</button>
      </div></div>
    );

    if(step==="login"){
      const u=users[pickId];
      return (
        <div style={wrap}><div style={inner}>
          <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,background:"#fff",padding:16,borderRadius:14,border:"1px solid #e5e7eb"}}>
            <Avatar avatar={u?.avatar} color={u?.color} size={48}/>
            <div>
              <div style={{fontWeight:700,fontSize:17}}>{u?.name}</div>
              <div style={{fontSize:12,color:"#6b7280"}}>Ingresa tu contraseña</div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Contraseña</label>
            <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={inp}/>
            {loginErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{loginErr}</p>}
          </div>
          <button onClick={handleLogin} style={btnBlue}>Entrar →</button>
        </div></div>
      );
    }

    if(step==="register") return (
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Crear perfil nuevo</h2>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Tu nombre es único y tu contraseña protege tu perfil</p>
        <div style={{marginBottom:12}}><label style={lbl}>Nombre o apodo</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre" style={inp}/></div>
        <div style={{marginBottom:12}}><label style={lbl}>Contraseña (mín. 4 caracteres)</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:16}}><label style={lbl}>Confirmar contraseña</label><input type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Avatar</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {AVATARS.map(a=><div key={a} onClick={()=>setNewAvatar(a)} style={{width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,cursor:"pointer",border:newAvatar===a?"2px solid #1a56db":"1px solid #e5e7eb",background:newAvatar===a?"#e8f0fe":"#fff"}}>{a}</div>)}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <label style={lbl}>Color</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {COLORS.map(c=><div key={c.name} onClick={()=>setNewColor(c)} title={c.name} style={{width:32,height:32,borderRadius:"50%",background:c.bg,cursor:"pointer",border:newColor.name===c.name?"3px solid #111":"3px solid transparent"}}/>)}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:"#f3f4f6",padding:14,borderRadius:12,marginBottom:16}}>
          <Avatar avatar={newAvatar} color={newColor} size={44}/>
          <div><div style={{fontWeight:700}}>{newName||"Tu nombre"}</div><div style={{fontSize:12,color:"#6b7280"}}>Vista previa</div></div>
        </div>
        {regErr&&<p style={{color:"#dc2626",fontSize:13,marginBottom:12,fontWeight:500}}>{regErr}</p>}
        <button onClick={handleRegister} disabled={!newName.trim()||newPass.length<4} style={{...btnBlue,background:newName.trim()&&newPass.length>=4?"#1a56db":"#d1d5db",cursor:newName.trim()&&newPass.length>=4?"pointer":"not-allowed"}}>Crear perfil →</button>
      </div></div>
    );
  }

  // ════ MAIN APP ════
  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>

      {/* header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",position:"sticky",top:0,zIndex:200}}>
        <div style={{maxWidth:820,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>🏆</span>
            <span style={{fontWeight:700,fontSize:15}}>Álbum Mundial 2026</span>
            {saving&&<span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>guardando…</span>}
          </div>
          {me&&(
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {activeAlerts.length>0&&(
                <span onClick={()=>setTab("intercambios")} style={{background:"#fef3c7",color:"#92400e",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,border:"1px solid #fcd34d",cursor:"pointer"}}>
                  🔔 {activeAlerts.length} match{activeAlerts.length>1?"es":""}
                </span>
              )}
              <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",border:"1px solid #e5e7eb",borderRadius:20,cursor:"pointer"}}>
                <Avatar avatar={me.avatar} color={me.color} size={24}/>
                <span style={{fontSize:13,fontWeight:600}}>{me.name}</span>
                <span style={{fontSize:11,color:"#9ca3af"}}>salir</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* dismissible alerts */}
      {tab!=="intercambios"&&activeAlerts.slice(0,2).map(m=>(
        <div key={m.uid} style={{background:"#fef3c7",borderBottom:"1px solid #fcd34d",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>🔔</span>
          <div style={{flex:1,fontSize:13,color:"#92400e"}}>
            <strong>¡Match con {m.name}!</strong>
            {m.gives.length>0&&` Puedes darle ${m.gives.length} cromo(s).`}
            {m.needs.length>0&&` Te pueden dar ${m.needs.length} cromo(s).`}
          </div>
          <button onClick={()=>setTab("intercambios")} style={{fontSize:11,fontWeight:600,background:"#d97706",color:"#fff",border:"none",borderRadius:7,padding:"4px 12px",cursor:"pointer",marginRight:4}}>Ver →</button>
          <button onClick={()=>setDismissed(d=>[...d,m.uid])} style={{fontSize:18,background:"none",border:"none",cursor:"pointer",color:"#92400e",lineHeight:1,padding:"0 4px"}}>✕</button>
        </div>
      ))}

      {/* tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb"}}>
        <div style={{maxWidth:820,margin:"0 auto",display:"flex",padding:"0 16px",overflowX:"auto"}}>
          {[["album","📋 Álbum"],["stats","📊 Estadísticas"],["intercambios","🔄 Intercambios"],["usuarios","👥 Usuarios"]].map(([key,lbl])=>(
            <button key={key} onClick={()=>setTab(key)} style={{padding:"12px 14px",fontSize:13,fontWeight:tab===key?700:400,background:"none",border:"none",whiteSpace:"nowrap",borderBottom:tab===key?"2px solid #1a56db":"2px solid transparent",color:tab===key?"#1a56db":"#6b7280",cursor:"pointer"}}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:820,margin:"0 auto",padding:16}}>

        {/* ÁLBUM */}
        {tab==="album"&&me&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#6b7280"}}>Leyenda:</span>
              {[["#def7ec","#065f46","✓ Obtenido"],["#fef3c7","#92400e","✓🔁 Con repetidos"],["#f3f4f6","#9ca3af","– Falta"]].map(([bg,col,lb])=>(
                <span key={lb} style={{background:bg,color:col,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:500}}>{lb}</span>
              ))}
            </div>
            <input value={secSearch} onChange={e=>setSecSearch(e.target.value)} placeholder="Buscar selección..." style={{width:"100%",fontSize:13,padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
              {filteredTeams.map(t=>{
                const sv=stats?.sections[t],active=selSection===t;
                return <button key={t} onClick={()=>setSelSection(t)} style={{padding:"5px 9px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:active?"2px solid #1a56db":"1px solid #d1d5db",background:active?"#e8f0fe":"#fff",color:active?"#1a56db":"#374151",position:"relative"}}>{TEAM_FLAGS[t]} {t}{sv?.pct===100&&<span style={{position:"absolute",top:-5,right:-5,fontSize:8,background:"#057a55",color:"#fff",borderRadius:99,padding:"1px 4px"}}>✓</span>}</button>;
              })}
              {[["ESPECIALES","✨ Especiales","#7e3af2"],["CC","🥤 Coca-Cola","#e74694"]].map(([key,lb,clr])=>(
                <button key={key} onClick={()=>setSelSection(key)} style={{padding:"5px 9px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:selSection===key?`2px solid ${clr}`:"1px solid #d1d5db",background:selSection===key?clr+"22":"#fff",color:selSection===key?clr:"#374151"}}>{lb}</button>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:26}}>{isEsp?"✨":isCC?"🥤":TEAM_FLAGS[selSection]}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{isEsp?"Especiales":isCC?"Coca-Cola":(TEAM_NAMES[selSection]||selSection)}{TEAMS.includes(selSection)&&<span style={{fontWeight:400,color:"#9ca3af",fontSize:12}}> ({selSection})</span>}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{sInfo?.owned}/{sInfo?.total} obtenidos · {sInfo?.reps} repetidos</div>
                  </div>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"}}>{sInfo?.pct}%</div>
              </div>
              <ProgressBar pct={sInfo?.pct||0} color={sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"} height={6}/>
              <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:6}}>
                {stickerList.map(n=><StickerCell key={n} sectionKey={selSection} num={n} val={me.collection[selSection]?.[n]} onToggle={()=>onToggle(selSection,n)} onAddRepeat={()=>onAddRepeat(selSection,n)} onRemoveRepeat={()=>onRemoveRepeat(selSection,n)} onRemoveOwned={()=>onRemoveOwned(selSection,n)}/>)}
              </div>
              <p style={{fontSize:11,color:"#9ca3af",marginTop:12,marginBottom:0}}>Haz clic en un cromo para ver las opciones</p>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {tab==="stats"&&stats&&(
          <div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <StatCard label="Completado" value={`${stats.pct}%`} sub={`${stats.owned} de ${stats.total}`} color={stats.pct>75?"#057a55":stats.pct>40?"#1a56db":"#d97706"}/>
              <StatCard label="Faltantes" value={stats.missing} sub="para terminar"/>
              <StatCard label="Repetidos" value={stats.reps} sub="para intercambiar"/>
              <StatCard label="Secciones 100%" value={stats.complete.length} sub={`de ${TEAMS.length+2}`}/>
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb",marginBottom:16}}>
              <div style={{fontWeight:700,marginBottom:14}}>Progreso por sección</div>
              {[{lb:`Selecciones (${TEAMS.length})`,owned:TEAMS.reduce((a,t)=>a+(stats.sections[t]?.owned||0),0),total:TEAMS.length*20,color:"#1a56db"},{lb:"✨ Especiales",owned:stats.sections["ESPECIALES"]?.owned||0,total:20,color:"#7e3af2"},{lb:"🥤 Coca-Cola",owned:stats.sections["CC"]?.owned||0,total:14,color:"#e74694"}].map(row=>(
                <div key={row.lb} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:500}}>{row.lb}</span><span style={{color:"#6b7280"}}>{row.owned}/{row.total}</span></div>
                  <ProgressBar pct={Math.round(row.owned/row.total*100)} color={row.color}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{title:"🟢 Más avanzadas",data:stats.best,color:"#057a55"},{title:"🔴 Más incompletas",data:stats.worst,color:"#dc2626"}].map(({title,data,color})=>(
                <div key={title} style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e5e7eb"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10,color}}>{title}</div>
                  {data.map(sv=><div key={sv.code} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:14}}>{TEAM_FLAGS[sv.code]}</span><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{sv.code} <span style={{fontWeight:400,color:"#6b7280"}}>{sv.pct}%</span></div><ProgressBar pct={sv.pct} color={color} height={4}/></div></div>)}
                </div>
              ))}
            </div>
            {stats.complete.length>0&&<div style={{background:"#def7ec",border:"1px solid #6ee7b7",borderRadius:14,padding:14,marginBottom:16}}><div style={{fontWeight:700,color:"#065f46",marginBottom:8}}>🎉 Secciones completas ({stats.complete.length})</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{stats.complete.map(sv=><span key={sv.code} style={{background:"#057a55",color:"#fff",padding:"3px 11px",borderRadius:99,fontSize:12,fontWeight:600}}>{TEAM_FLAGS[sv.code]} {sv.code}</span>)}</div></div>}
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,marginBottom:12}}>Todas las selecciones</div>
              {TEAMS.map(t=>{const sv=stats.sections[t];return <div key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}><span style={{fontSize:13,width:18}}>{TEAM_FLAGS[t]}</span><span style={{fontSize:12,fontWeight:600,width:36}}>{t}</span><div style={{flex:1}}><ProgressBar pct={sv.pct} color={sv.pct===100?"#057a55":sv.pct>50?"#1a56db":"#d97706"} height={5}/></div><span style={{fontSize:11,color:"#6b7280",width:70,textAlign:"right"}}>{sv.owned}/20 · {sv.pct}%</span>{sv.reps>0&&<span style={{fontSize:10,background:"#fef3c7",color:"#92400e",padding:"1px 6px",borderRadius:99,whiteSpace:"nowrap"}}>{sv.reps}× rep.</span>}</div>;})}
            </div>
          </div>
        )}

        {/* INTERCAMBIOS */}
        {tab==="intercambios"&&(
          <div>
            <div style={{background:"#e8f0fe",border:"1px solid #93c5fd",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#1e40af"}}>
              🔄 Haz clic en cada persona para ver qué pueden intercambiar. Actualización en tiempo real.
            </div>
            {matches.length===0?(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#9ca3af"}}>
                <div style={{fontSize:48,marginBottom:12}}>🤝</div>
                <div style={{fontWeight:600,fontSize:15,color:"#6b7280"}}>No hay matches aún</div>
                <div style={{fontSize:13,marginTop:6}}>Cuando alguien tenga repetidos que tú necesitas, aparecerá aquí.</div>
              </div>
            ):matches.map(m=><MatchCard key={m.uid} m={m}/>)}
          </div>
        )}

        {/* USUARIOS */}
        {tab==="usuarios"&&(
          <div>
            <div style={{background:"#e8f0fe",border:"1px solid #93c5fd",borderRadius:12,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>🔑</span>
              <div><div style={{fontSize:14,fontWeight:700,color:"#1e40af"}}>Código de sala: {ROOM_CODE}</div><div style={{fontSize:12,color:"#3b82f6"}}>Comparte este código con amigos para que se unan</div></div>
            </div>
            <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>{Object.keys(users).length} usuario(s) · tiempo real 🟢</div>
            {Object.entries(users).sort(([,a],[,b])=>(calcStats(b.collection)?.pct||0)-(calcStats(a.collection)?.pct||0)).map(([id,u],i)=>{
              const sv=calcStats(u.collection),isMe=id===myId;
              return (
                <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,border:isMe?"2px solid #1a56db":"1px solid #e5e7eb"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#9ca3af",width:20,textAlign:"center"}}>#{i+1}</div>
                  <Avatar avatar={u.avatar} color={u.color} size={42}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span style={{fontWeight:700}}>{u.name}</span>
                      {isMe&&<span style={{fontSize:10,background:"#1a56db",color:"#fff",padding:"1px 8px",borderRadius:99,fontWeight:600}}>tú</span>}
                    </div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{sv?.owned}/{sv?.total} · {sv?.reps} rep. · {sv?.complete.length} completas</div>
                    <div style={{marginTop:4}}><ProgressBar pct={sv?.pct||0} color={u.color?.bg||"#1a56db"} height={4}/></div>
                  </div>
                  <div style={{fontSize:22,fontWeight:700,color:u.color?.bg||"#1a56db"}}>{sv?.pct||0}%</div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
