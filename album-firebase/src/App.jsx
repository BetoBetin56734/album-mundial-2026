import { useState, useEffect, useCallback, useRef } from "react";
import {
  createUser, deleteUser, updateUserCollection,
  updateUserReady, updateUserLastSeen,
  subscribeToUsers, createRoom, setRoomHost, subscribeToRooms
} from "./firebase";

// ── album data ─────────────────────────────────────────
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
// Colors for team badges instead of flag emojis
const TEAM_COLORS = {
  MEX:"#006847",RSA:"#007A4D",KOR:"#C60C30",CZE:"#D7141A",CAN:"#FF0000",
  BIH:"#002395",QAT:"#8D1B3D",SUI:"#FF0000",BRA:"#009C3B",MAR:"#C1272D",
  HAI:"#00209F",SCO:"#003366",USA:"#3C3B6E",PAR:"#D52B1E",AUS:"#00008B",
  TUR:"#E30A17",GER:"#000000",CUW:"#002B7F",CIV:"#F77F00",ECU:"#FFD100",
  NED:"#FF6600",JPN:"#BC002D",SWE:"#006AA7",TUN:"#E70013",BEL:"#000000",
  EGY:"#C8102E",IRN:"#239F40",NZL:"#00247D",ESP:"#AA151B",CPV:"#003893",
  KSA:"#006C35",URU:"#5EB6E4",FRA:"#002395",SEN:"#00853F",IRQ:"#CE1126",
  NOR:"#EF2B2D",ARG:"#74ACDF",ALG:"#006233",AUT:"#ED2939",JOR:"#007A3D",
  POR:"#006600",COD:"#007FFF",UZB:"#1EB53A",COL:"#FCD116",ENG:"#CF142B",
  CRO:"#FF0000",GHA:"#006B3F",PAN:"#D21034"
};

const SPECIAL_STICKERS = Array.from({length:20},(_,i)=>String(i).padStart(2,"0"));
const COCA_STICKERS    = Array.from({length:14},(_,i)=>i+1);
const TEAM_STICKERS    = Array.from({length:20},(_,i)=>i+1);
const AVATARS = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T"];
const AVATAR_COLORS = ["#1a56db","#057a55","#c81e1e","#7e3af2","#d97706","#e74694","#0694a2","#4b5563","#0f766e","#7c3aed"];
const COLORS = [
  {name:"Azul",bg:"#1a56db"},{name:"Verde",bg:"#057a55"},{name:"Rojo",bg:"#c81e1e"},
  {name:"Morado",bg:"#7e3af2"},{name:"Naranja",bg:"#d97706"},{name:"Rosa",bg:"#e74694"},
  {name:"Cian",bg:"#0694a2"},{name:"Gris",bg:"#4b5563"},
];
const AVATAR_ICONS = ["★","◆","●","▲","■","♦","◉","✦","⬟","⬡","⬢","◈","⊕","⊗","◎","▣","⬛","◐","◑","◒"];

function hashPass(str){
  let h=0;
  for(let i=0;i<str.length;i++) h=Math.imul(31,h)+str.charCodeAt(i)|0;
  return h.toString(36);
}

function buildEmptyCollection(){
  const col={};
  TEAMS.forEach(t=>{col[t]={};TEAM_STICKERS.forEach(n=>{col[t][n]={owned:false,repeated:0};});});
  col["ESP"]={};SPECIAL_STICKERS.forEach(n=>{col["ESP"][n]={owned:false,repeated:0};});
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
  SPECIAL_STICKERS.forEach(n=>{total++;if(col["ESP"]?.[n]?.owned){owned++;sO++;}sR+=col["ESP"]?.[n]?.repeated||0;});
  sections["ESP"]={total:20,owned:sO,reps:sR,pct:Math.round(sO/20*100)};reps+=sR;
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
  // Only match with users who marked ready
  return Object.entries(users)
    .filter(([uid,u])=>uid!==myId&&u.ready===true)
    .map(([uid,user])=>{
      const tc=user.collection;const gives=[],ns=[];
      TEAMS.forEach(t=>TEAM_STICKERS.forEach(n=>{
        if(hasRep(myCol,t,n)&&needsIt(tc,t,n))gives.push({section:t,num:n,code:t});
        if(hasRep(tc,t,n)&&needsIt(myCol,t,n))ns.push({section:t,num:n,code:t});
      }));
      SPECIAL_STICKERS.forEach(n=>{
        if(hasRep(myCol,"ESP",n)&&needsIt(tc,"ESP",n))gives.push({section:"ESP",num:n,code:"ESP"});
        if(hasRep(tc,"ESP",n)&&needsIt(myCol,"ESP",n))ns.push({section:"ESP",num:n,code:"ESP"});
      });
      COCA_STICKERS.forEach(n=>{
        if(hasRep(myCol,"CC",n)&&needsIt(tc,"CC",n))gives.push({section:"CC",num:n,code:"CC"});
        if(hasRep(tc,"CC",n)&&needsIt(myCol,"CC",n))ns.push({section:"CC",num:n,code:"CC"});
      });
      if(gives.length>0||ns.length>0)return{uid,name:user.name,avatar:user.avatar,color:user.color,gives,needs:ns};
      return null;
    }).filter(Boolean);
}

// ── UI atoms ──────────────────────────────────────────────
function UserAvatar({user,size=36}){
  const icon=AVATAR_ICONS[user?.avatar||0]||"★";
  const bg=user?.color?.bg||"#1a56db";
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,flexShrink:0,color:"#fff",fontWeight:700,border:"2px solid rgba(255,255,255,0.3)"}}>
      {icon}
    </div>
  );
}

function TeamBadge({code,size=22}){
  const bg=TEAM_COLORS[code]||"#374151";
  return(
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:bg,color:"#fff",borderRadius:4,fontSize:size*0.45,fontWeight:700,width:size*1.8,height:size,letterSpacing:"-0.5px",flexShrink:0}}>
      {code}
    </span>
  );
}

function ProgressBar({pct,color="#057a55",height=6}){
  return<div style={{background:"#e5e7eb",borderRadius:99,height,overflow:"hidden",width:"100%"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .35s"}}/></div>;
}
function StatCard({label,value,sub,color}){
  return<div style={{background:"#f3f4f6",borderRadius:10,padding:"12px 16px",flex:1,minWidth:110}}><div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||"#111"}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{sub}</div>}</div>;
}

// Sticker menu shown on SECOND click
function StickerMenu({val,label,onAddRepeat,onRemoveRepeat,onRemoveOwned,onClose}){
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  const Btn=({onClick,bg,col,children})=>(
    <button onClick={onClick} style={{display:"block",width:"100%",padding:"7px 10px",marginBottom:4,background:bg,color:col,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,textAlign:"left",fontWeight:500}}>
      {children}
    </button>
  );
  return(
    <div ref={ref} style={{position:"absolute",zIndex:9999,top:42,left:0,background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:10,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",minWidth:210,whiteSpace:"nowrap"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#6b7280",marginBottom:8,paddingLeft:4}}>{label}</div>
      {val.owned&&(
        <Btn onClick={onAddRepeat} bg="#fef3c7" col="#92400e">
          + Tengo repetido{val.repeated>0?` (${val.repeated} extra${val.repeated>1?"s":""})`:""}
        </Btn>
      )}
      {val.repeated>0&&(
        <Btn onClick={onRemoveRepeat} bg="#f3f4f6" col="#374151">- Quitar un repetido</Btn>
      )}
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

  const handleClick=()=>{
    if(!owned){
      // First click: immediately mark as owned
      onFirstClick();
    } else {
      // Already owned: open options menu
      setOpen(o=>!o);
    }
  };

  const sk=sectionKey==="ESP"?"Esp":sectionKey==="CC"?"CC":sectionKey;
  return(
    <div style={{position:"relative",display:"inline-block"}}>
      <div style={{fontSize:9,color:"#9ca3af",textAlign:"center",marginBottom:2,userSelect:"none"}}>{num}</div>
      <div onClick={handleClick} style={{width:34,height:34,borderRadius:8,background:bg,border,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",userSelect:"none",fontSize:10,fontWeight:700,color:tc}}>
        {repeated>0&&<span style={{position:"absolute",top:-6,right:-6,background:"#d97706",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,zIndex:1}}>{repeated}</span>}
        {owned?"✓":"–"}
      </div>
      {open&&owned&&(
        <StickerMenu
          val={val||{owned:false,repeated:0}}
          label={`${sk} #${num}`}
          onAddRepeat={()=>{onAddRepeat();setOpen(false);}}
          onRemoveRepeat={()=>{onRemoveRepeat();setOpen(false);}}
          onRemoveOwned={()=>{onRemoveOwned();setOpen(false);}}
          onClose={()=>setOpen(false)}
        />
      )}
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
          {m.gives.length>0&&(
            <div style={{marginBottom:10,background:"#f0fdf4",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#065f46",marginBottom:8}}>Tu les das a {m.name} ({m.gives.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{m.gives.map((g,i)=><Tag key={i} g={g} bg="#def7ec" color="#065f46"/>)}</div>
            </div>
          )}
          {m.needs.length>0&&(
            <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:8}}>{m.name} te da a ti ({m.needs.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{m.needs.map((g,i)=><Tag key={i} g={g} bg="#e8f0fe" color="#1e40af"/>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
export default function App(){
  const [users,setUsers]           =useState({});
  const [rooms,setRooms]           =useState({});
  const [myId,setMyId]             =useState(null);
  const [screen,setScreen]         =useState("loading");
  const [tab,setTab]               =useState("album");
  // login flow
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
  // create room
  const [newRoomName,setNewRoomName]=useState("");
  const [newRoomPass,setNewRoomPass]=useState("");
  const [newRoomErr,setNewRoomErr] =useState("");
  // album
  const [selSection,setSelSection] =useState(TEAMS[0]);
  const [secSearch,setSecSearch]   =useState("");
  const [saving,setSaving]         =useState(false);
  const [dismissed,setDismissed]   =useState([]);
  // host panel
  const [hostPass,setHostPass]     =useState("");
  const [hostErr,setHostErr]       =useState("");
  const [hostUnlocked,setHostUnlocked]=useState(false);
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

  // heartbeat so host can see who's online
  useEffect(()=>{
    if(!myId)return;
    updateUserLastSeen(myId);
    heartbeatTimer.current=setInterval(()=>updateUserLastSeen(myId),30000);
    return()=>clearInterval(heartbeatTimer.current);
  },[myId]);

  const myRoom=localStorage.getItem("album_room");
  const currentRoom=myRoom?rooms[myRoom]:null;
  const me=myId?users[myId]:null;
  const stats=me?calcStats(me.collection):null;
  // Only show matches with ready users
  const readyUsers=Object.fromEntries(Object.entries(users).filter(([,u])=>u.ready&&u.roomId===myRoom));
  const matches=me&&me.ready?findMatches({...readyUsers,[myId]:me},myId):[];
  const activeAlerts=matches.filter(m=>!dismissed.includes(m.uid));
  const isHost=currentRoom&&currentRoom.hostId===myId;

  const flushCollection=useCallback((col)=>{
    if(!myId)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current=setTimeout(async()=>{
      try{await updateUserCollection(myId,col);}catch(e){console.error(e);}
      setSaving(false);
    },600);
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

  // First click = mark owned immediately
  const onFirstClick  =(sk,n)=>updateSticker(sk,n,s=>{s.owned=true;});
  const onAddRepeat   =(sk,n)=>updateSticker(sk,n,s=>{s.owned=true;s.repeated=(s.repeated||0)+1;});
  const onRemoveRepeat=(sk,n)=>updateSticker(sk,n,s=>{if(s.repeated>0)s.repeated--;});
  const onRemoveOwned =(sk,n)=>updateSticker(sk,n,s=>{s.owned=false;s.repeated=0;});

  // ── auth ──
  const handleCheckRoom=()=>{
    const code=roomInput.trim().toUpperCase();
    if(!code){setRoomErr("Escribe el código de sala.");return;}
    const found=Object.entries(rooms).find(([,r])=>r.code===code);
    if(!found){setRoomErr("Sala no encontrada. Verifica el código.");return;}
    setRoomErr("");
    localStorage.setItem("album_room",found[0]);
    setStep("choose");
  };

  const handleCreateRoom=async()=>{
    if(!newRoomName.trim()){setNewRoomErr("Escribe un nombre para la sala.");return;}
    if(newRoomPass.length<4){setNewRoomErr("La contraseña del host debe tener al menos 4 caracteres.");return;}
    const code=Math.random().toString(36).substring(2,8).toUpperCase();
    const roomId="room_"+Date.now();
    // hostId will be set after user registers
    await createRoom(roomId,{name:newRoomName.trim(),code,hostPassHash:hashPass(newRoomPass),hostId:null,createdAt:Date.now()});
    localStorage.setItem("album_room",roomId);
    localStorage.setItem("album_pendingHost",roomId);
    setNewRoomErr("");
    setStep("register");
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
    if(Object.values(users).some(u=>u.name.toLowerCase()===newName.trim().toLowerCase())){setRegErr("Ese nombre ya existe. Elige otro.");return;}
    const roomId=localStorage.getItem("album_room");
    if(!roomId){setRegErr("No hay sala seleccionada.");return;}
    const id="u_"+Date.now();
    await createUser(id,{
      name:newName.trim(),avatar:newAvatarIdx,color:newColor,
      passHash:hashPass(newPass),collection:buildEmptyCollection(),
      ready:false,roomId,createdAt:Date.now(),lastSeen:Date.now()
    });
    // If this user is the pending host, update the room
    const pendingHost=localStorage.getItem("album_pendingHost");
    if(pendingHost===roomId){
      await setRoomHost(roomId,id);
      localStorage.removeItem("album_pendingHost");
    }
    localStorage.setItem("album_myId",id);
    setMyId(id);setScreen("app");
  };

  const handleLogout=()=>{
    localStorage.removeItem("album_myId");
    setMyId(null);setScreen("login");setStep("room");
    setRoomInput("");setTab("album");setDismissed([]);setHostUnlocked(false);
  };

  const handleReady=async()=>{
    if(!myId)return;
    await updateUserReady(myId,true);
    setUsers(prev=>({...prev,[myId]:{...prev[myId],ready:true}}));
  };

  const handleUnready=async()=>{
    if(!myId)return;
    await updateUserReady(myId,false);
    setUsers(prev=>({...prev,[myId]:{...prev[myId],ready:false}}));
  };

  const handleDeleteUser=async(uid)=>{
    if(!window.confirm(`¿Eliminar al usuario "${users[uid]?.name}"? Esta acción no se puede deshacer.`))return;
    await deleteUser(uid);
  };

  const filteredTeams=secSearch?TEAMS.filter(t=>t.toLowerCase().includes(secSearch.toLowerCase())||TEAM_NAMES[t]?.toLowerCase().includes(secSearch.toLowerCase())):TEAMS;
  const isEsp=selSection==="ESP",isCC=selSection==="CC";
  const stickerList=TEAMS.includes(selSection)?TEAM_STICKERS:isEsp?SPECIAL_STICKERS:COCA_STICKERS;
  const sInfo=stats?.sections[selSection];

  const inp={width:"100%",fontSize:15,padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box"};
  const lbl={fontSize:13,color:"#6b7280",display:"block",marginBottom:6};
  const btnBlue={width:"100%",padding:13,fontSize:15,fontWeight:700,background:"#1a56db",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",marginBottom:8};
  const wrap={minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px"};
  const inner={width:"100%",maxWidth:420};
  const back={background:"none",border:"none",cursor:"pointer",color:"#6b7280",fontSize:13,marginBottom:20,padding:0};

  // ════ LOADING ════
  if(screen==="loading")return(
    <div style={{minHeight:"100vh",background:"#f9fafb",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>W</div><div style={{fontWeight:700,fontSize:22,marginBottom:6}}>Album Mundial 2026</div><div style={{fontSize:14,color:"#6b7280"}}>Conectando...</div></div>
    </div>
  );

  // ════ LOGIN ════
  if(screen==="login"){

    // Room code entry
    if(step==="room")return(
      <div style={wrap}><div style={inner}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"#1a56db",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",fontWeight:700,margin:"0 auto 16px"}}>W</div>
          <h1 style={{fontSize:24,fontWeight:700,marginBottom:6}}>Album Mundial 2026</h1>
          <p style={{fontSize:14,color:"#6b7280"}}>Ingresa el codigo de sala para unirte</p>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #e5e7eb",marginBottom:12}}>
          <label style={lbl}>Codigo de sala</label>
          <input value={roomInput} onChange={e=>setRoomInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleCheckRoom()} placeholder="" style={{...inp,letterSpacing:3,fontWeight:700}}/>
          {roomErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{roomErr}</p>}
        </div>
        <button onClick={handleCheckRoom} style={btnBlue}>Entrar</button>
        <div style={{textAlign:"center",margin:"16px 0",color:"#9ca3af",fontSize:13}}>o</div>
        <button onClick={()=>setStep("createRoom")} style={{...btnBlue,background:"#057a55"}}>Crear sala nueva (Host)</button>
      </div></div>
    );

    // Create room (host)
    if(step==="createRoom")return(
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("room")} style={back}>← Volver</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Crear sala nueva</h2>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Tu seras el host y podras administrar la sala</p>
        <div style={{marginBottom:12}}>
          <label style={lbl}>Nombre de la sala</label>
          <input value={newRoomName} onChange={e=>setNewRoomName(e.target.value)} placeholder="ej: Familia Garcia" style={inp}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={lbl}>Contrasena del host (solo para ti)</label>
          <input type="password" value={newRoomPass} onChange={e=>setNewRoomPass(e.target.value)} placeholder="Min. 4 caracteres" style={inp}/>
          <p style={{fontSize:12,color:"#6b7280",marginTop:6}}>Esta contrasena desbloquea el panel de administracion</p>
        </div>
        {newRoomErr&&<p style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{newRoomErr}</p>}
        <button onClick={handleCreateRoom} style={btnBlue}>Continuar — Crear mi perfil</button>
      </div></div>
    );

    // Choose user
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
          {roomUsers.map(([id,u])=>{
            const st=calcStats(u.collection);
            return(
              <div key={id} onClick={()=>handlePickUser(id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,cursor:"pointer",border:"1px solid #e5e7eb"}}>
                <UserAvatar user={u} size={38}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{u.name}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{st?.pct||0}% completado{u.ready?" · Listo":""}</div>
                </div>
                <span style={{fontSize:12,color:"#9ca3af",fontWeight:600}}>Entrar</span>
              </div>
            );
          })}
          <button onClick={()=>{setRegErr("");setNewName("");setNewPass("");setNewPass2("");setStep("register");}} style={{...btnBlue,background:"#057a55",marginTop:8}}>+ Crear perfil nuevo</button>
        </div></div>
      );
    }

    // Login with password
    if(step==="login"){
      const u=users[pickId];
      return(
        <div style={wrap}><div style={inner}>
          <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,background:"#fff",padding:16,borderRadius:14,border:"1px solid #e5e7eb"}}>
            <UserAvatar user={u} size={48}/>
            <div><div style={{fontWeight:700,fontSize:17}}>{u?.name}</div><div style={{fontSize:12,color:"#6b7280"}}>Ingresa tu contrasena</div></div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Contrasena</label>
            <input type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="••••••••" style={inp}/>
            {loginErr&&<p style={{color:"#dc2626",fontSize:12,marginTop:8,marginBottom:0}}>{loginErr}</p>}
          </div>
          <button onClick={handleLogin} style={btnBlue}>Entrar</button>
        </div></div>
      );
    }

    // Register
    if(step==="register")return(
      <div style={wrap}><div style={inner}>
        <button onClick={()=>setStep("choose")} style={back}>← Volver</button>
        <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>Crear perfil</h2>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Nombre unico + contrasena para proteger tu perfil</p>
        <div style={{marginBottom:12}}><label style={lbl}>Nombre o apodo</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Tu nombre" style={inp}/></div>
        <div style={{marginBottom:12}}><label style={lbl}>Contrasena (min. 4 caracteres)</label><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:16}}><label style={lbl}>Confirmar contrasena</label><input type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} placeholder="••••••••" style={inp}/></div>
        <div style={{marginBottom:14}}>
          <label style={lbl}>Icono</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {AVATAR_ICONS.map((ic,i)=>(
              <div key={i} onClick={()=>setNewAvatarIdx(i)} style={{width:40,height:40,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer",fontWeight:700,border:newAvatarIdx===i?"2px solid #1a56db":"1px solid #e5e7eb",background:newAvatarIdx===i?"#e8f0fe":"#fff",color:newAvatarIdx===i?"#1a56db":"#374151"}}>{ic}</div>
            ))}
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
              {activeAlerts.length>0&&(
                <span onClick={()=>setTab("intercambios")} style={{background:"#fef3c7",color:"#92400e",fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:99,border:"1px solid #fcd34d",cursor:"pointer"}}>
                  {activeAlerts.length} match{activeAlerts.length>1?"es":""}
                </span>
              )}
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
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:"#92400e"}}>Cuando termines de registrar tus cromos, marca "Listo"</div>
            <div style={{fontSize:12,color:"#92400e",marginTop:2}}>Los intercambios solo aparecen entre usuarios que ya marcaron listo</div>
          </div>
          <button onClick={handleReady} style={{background:"#057a55",color:"#fff",border:"none",borderRadius:10,padding:"8px 20px",fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap"}}>
            Listo - Ya ingrese mis cromos
          </button>
        </div>
      )}
      {me?.ready&&(
        <div style={{background:"#def7ec",borderBottom:"1px solid #6ee7b7",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:"#065f46",fontWeight:700,fontSize:13}}>Listo — tus datos estan activos para intercambios</span>
          <button onClick={handleUnready} style={{marginLeft:"auto",fontSize:11,background:"none",border:"1px solid #6ee7b7",borderRadius:7,padding:"3px 10px",cursor:"pointer",color:"#065f46"}}>Editar datos</button>
        </div>
      )}

      {/* dismissible match alerts */}
      {tab!=="intercambios"&&me?.ready&&activeAlerts.slice(0,2).map(m=>(
        <div key={m.uid} style={{background:"#eff6ff",borderBottom:"1px solid #93c5fd",padding:"8px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,fontSize:13,color:"#1e40af"}}>
            <strong>Match con {m.name}!</strong>
            {m.gives.length>0&&` Puedes darle ${m.gives.length}.`}
            {m.needs.length>0&&` Te pueden dar ${m.needs.length}.`}
          </div>
          <button onClick={()=>setTab("intercambios")} style={{fontSize:11,fontWeight:600,background:"#1a56db",color:"#fff",border:"none",borderRadius:7,padding:"4px 12px",cursor:"pointer",marginRight:4}}>Ver</button>
          <button onClick={()=>setDismissed(d=>[...d,m.uid])} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",color:"#1e40af",lineHeight:1,padding:"0 4px"}}>x</button>
        </div>
      ))}

      {/* tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb"}}>
        <div style={{maxWidth:820,margin:"0 auto",display:"flex",padding:"0 16px",overflowX:"auto"}}>
          {[["album","Album"],["stats","Estadisticas"],["intercambios","Intercambios"],["usuarios","Usuarios"],[isHost?"host":"host","Host"]].filter(([k])=>k!=="host"||isHost).map(([key,lbl])=>(
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
              <span style={{fontSize:11,color:"#9ca3af",marginLeft:4}}>1er clic = obtener | 2do clic = opciones</span>
            </div>
            <input value={secSearch} onChange={e=>setSecSearch(e.target.value)} placeholder="Buscar seleccion..." style={{width:"100%",fontSize:13,padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
              {filteredTeams.map(t=>{
                const sv=stats?.sections[t],active=selSection===t;
                return(
                  <button key={t} onClick={()=>setSelSection(t)} style={{padding:"4px 8px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:active?"2px solid #1a56db":"1px solid #d1d5db",background:active?"#e8f0fe":"#fff",color:active?"#1a56db":"#374151",position:"relative",display:"flex",alignItems:"center",gap:4}}>
                    <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:TEAM_COLORS[t]||"#374151",flexShrink:0}}/>
                    {t}
                    {sv?.pct===100&&<span style={{position:"absolute",top:-5,right:-5,fontSize:8,background:"#057a55",color:"#fff",borderRadius:99,padding:"1px 4px"}}>ok</span>}
                  </button>
                );
              })}
              {[["ESP","Especiales","#7e3af2"],["CC","Coca-Cola","#e74694"]].map(([key,lb,clr])=>(
                <button key={key} onClick={()=>setSelSection(key)} style={{padding:"4px 8px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:selSection===key?`2px solid ${clr}`:"1px solid #d1d5db",background:selSection===key?clr+"22":"#fff",color:selSection===key?clr:"#374151"}}>{lb}</button>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {TEAMS.includes(selSection)&&<TeamBadge code={selSection} size={28}/>}
                  {isEsp&&<div style={{width:28,height:28,background:"#7e3af2",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11}}>ESP</div>}
                  {isCC&&<div style={{width:28,height:28,background:"#e74694",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10}}>CC</div>}
                  <div>
                    <div style={{fontWeight:700,fontSize:15}}>{isEsp?"Especiales":isCC?"Coca-Cola":(TEAM_NAMES[selSection]||selSection)}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{sInfo?.owned}/{sInfo?.total} obtenidos · {sInfo?.reps} repetidos</div>
                  </div>
                </div>
                <div style={{fontSize:20,fontWeight:700,color:sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"}}>{sInfo?.pct}%</div>
              </div>
              <ProgressBar pct={sInfo?.pct||0} color={sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"} height={6}/>
              <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:6}}>
                {stickerList.map(n=>(
                  <StickerCell key={n}
                    sectionKey={selSection} num={n}
                    val={me.collection[selSection]?.[n]}
                    onFirstClick={()=>onFirstClick(selSection,n)}
                    onAddRepeat={()=>onAddRepeat(selSection,n)}
                    onRemoveRepeat={()=>onRemoveRepeat(selSection,n)}
                    onRemoveOwned={()=>onRemoveOwned(selSection,n)}
                  />
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
              {[{lb:`Selecciones (${TEAMS.length})`,owned:TEAMS.reduce((a,t)=>a+(stats.sections[t]?.owned||0),0),total:TEAMS.length*20,color:"#1a56db"},{lb:"Especiales",owned:stats.sections["ESP"]?.owned||0,total:20,color:"#7e3af2"},{lb:"Coca-Cola",owned:stats.sections["CC"]?.owned||0,total:14,color:"#e74694"}].map(row=>(
                <div key={row.lb} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{fontWeight:500}}>{row.lb}</span><span style={{color:"#6b7280"}}>{row.owned}/{row.total}</span></div>
                  <ProgressBar pct={Math.round(row.owned/row.total*100)} color={row.color}/>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{title:"Mas avanzadas",data:stats.best,color:"#057a55"},{title:"Mas incompletas",data:stats.worst,color:"#dc2626"}].map(({title,data,color})=>(
                <div key={title} style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #e5e7eb"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10,color}}>{title}</div>
                  {data.map(sv=>(
                    <div key={sv.code} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <TeamBadge code={sv.code} size={20}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600}}>{TEAM_NAMES[sv.code]||sv.code} <span style={{fontWeight:400,color:"#6b7280"}}>{sv.pct}%</span></div>
                        <ProgressBar pct={sv.pct} color={color} height={4}/>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {stats.complete.length>0&&(
              <div style={{background:"#def7ec",border:"1px solid #6ee7b7",borderRadius:14,padding:14,marginBottom:16}}>
                <div style={{fontWeight:700,color:"#065f46",marginBottom:8}}>Secciones completas ({stats.complete.length})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {stats.complete.map(sv=><span key={sv.code} style={{background:"#057a55",color:"#fff",padding:"3px 11px",borderRadius:99,fontSize:12,fontWeight:700}}>{sv.code}</span>)}
                </div>
              </div>
            )}
            <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,marginBottom:12}}>Todas las selecciones</div>
              {TEAMS.map(t=>{const sv=stats.sections[t];return(
                <div key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <TeamBadge code={t} size={18}/>
                  <div style={{flex:1}}><ProgressBar pct={sv.pct} color={sv.pct===100?"#057a55":sv.pct>50?"#1a56db":"#d97706"} height={5}/></div>
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
                <div style={{fontSize:36,marginBottom:12,color:"#d97706"}}>!</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Marca "Listo" para ver los intercambios</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Cuando termines de registrar todos tus cromos, presiona el boton "Listo" en la barra de arriba. Solo entonces apareceran los matches con otros usuarios.</div>
                <button onClick={handleReady} style={{background:"#057a55",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Listo - Ya ingrese mis cromos</button>
              </div>
            ):matches.length===0?(
              <div style={{textAlign:"center",padding:"48px 20px",color:"#9ca3af"}}>
                <div style={{fontSize:40,marginBottom:12,fontWeight:700,color:"#d1d5db"}}>?</div>
                <div style={{fontWeight:600,fontSize:15,color:"#6b7280"}}>No hay matches aun</div>
                <div style={{fontSize:13,marginTop:6}}>Cuando otro usuario marque listo y tenga repetidos que tu necesitas, aparecera aqui.</div>
              </div>
            ):matches.map(m=><MatchCard key={m.uid} m={m}/>)}
          </div>
        )}

        {/* USUARIOS */}
        {tab==="usuarios"&&(
          <div>
            <div style={{background:"#f3f4f6",borderRadius:12,padding:"10px 16px",marginBottom:16}}>
              <div style={{fontSize:13,color:"#6b7280"}}>{Object.entries(users).filter(([,u])=>u.roomId===myRoom).length} usuario(s) en la sala · Sala: <strong>{currentRoom?.name}</strong></div>
            </div>
            {Object.entries(users)
              .filter(([,u])=>u.roomId===myRoom)
              .sort(([,a],[,b])=>(calcStats(b.collection)?.pct||0)-(calcStats(a.collection)?.pct||0))
              .map(([id,u],i)=>{
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

        {/* HOST PANEL */}
        {tab==="host"&&isHost&&(
          <div>
            {!hostUnlocked?(
              <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #e5e7eb",maxWidth:400}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Panel de Host</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Ingresa la contrasena del host para administrar la sala</div>
                <input type="password" value={hostPass} onChange={e=>setHostPass(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){if(hashPass(hostPass)===currentRoom?.hostPassHash){setHostUnlocked(true);setHostErr("");}else setHostErr("Contrasena incorrecta.");} }} placeholder="Contrasena del host" style={{width:"100%",fontSize:14,padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:10,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
                {hostErr&&<p style={{color:"#dc2626",fontSize:12,marginBottom:8}}>{hostErr}</p>}
                <button onClick={()=>{if(hashPass(hostPass)===currentRoom?.hostPassHash){setHostUnlocked(true);setHostErr("");}else setHostErr("Contrasena incorrecta.");}} style={{width:"100%",padding:11,fontSize:14,fontWeight:700,background:"#1a56db",color:"#fff",border:"none",borderRadius:10,cursor:"pointer"}}>Desbloquear</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16}}>Panel de Host — {currentRoom?.name}</div>
                    <div style={{fontSize:13,color:"#6b7280"}}>Codigo de sala: <strong style={{letterSpacing:2}}>{currentRoom?.code}</strong> — comparte este codigo</div>
                  </div>
                  <button onClick={()=>setHostUnlocked(false)} style={{fontSize:12,background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"4px 12px",cursor:"pointer",color:"#6b7280"}}>Bloquear</button>
                </div>

                <div style={{background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:12,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#92400e"}}>
                  Como host puedes eliminar usuarios (ejemplo si alguien se olvido la clave y necesita crear uno nuevo). No puedes ver ni editar los cromos de nadie.
                </div>

                <div style={{fontWeight:700,marginBottom:12}}>Usuarios en la sala ({Object.entries(users).filter(([,u])=>u.roomId===myRoom).length})</div>
                {Object.entries(users)
                  .filter(([,u])=>u.roomId===myRoom)
                  .map(([id,u])=>{
                    const online=u.lastSeen&&(Date.now()-u.lastSeen)<90000;
                    const isMe=id===myId;
                    return(
                      <div key={id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#fff",borderRadius:12,marginBottom:8,border:"1px solid #e5e7eb"}}>
                        <UserAvatar user={u} size={36}/>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontWeight:600}}>{u.name}</span>
                            {isMe&&<span style={{fontSize:10,background:"#1a56db",color:"#fff",padding:"1px 6px",borderRadius:99}}>host / tu</span>}
                            {u.ready&&<span style={{fontSize:10,background:"#def7ec",color:"#065f46",padding:"1px 6px",borderRadius:99}}>Listo</span>}
                          </div>
                          <div style={{fontSize:12,color:online?"#057a55":"#9ca3af",marginTop:2}}>{online?"En linea":"Desconectado"}{u.lastSeen?` · ultima vez ${Math.round((Date.now()-u.lastSeen)/60000)} min atras`:""}</div>
                        </div>
                        {!isMe&&(
                          <button onClick={()=>handleDeleteUser(id)} style={{fontSize:12,background:"#fde8e8",color:"#991b1b",border:"1px solid #fca5a5",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontWeight:600}}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    );
                  })}

                <div style={{marginTop:16,background:"#f3f4f6",borderRadius:12,padding:14,fontSize:13,color:"#6b7280"}}>
                  Si un usuario olvido su clave: eliminalo desde aqui y dile que cree un perfil nuevo con otro nombre (o el mismo si ya fue eliminado).
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
