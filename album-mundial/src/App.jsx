import { useState, useEffect, useCallback, useRef } from "react";

const TEAMS = [
  "MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI","BRA","MAR",
  "HAI","SCO","USA","PAR","AUS","TUR","GER","CUW","CIV","ECU",
  "NED","JPN","SWE","TUN","BEL","EGY","IRN","NZL","ESP","CPV",
  "KSA","URU","FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR",
  "POR","COD","UZB","COL","ENG","CRO","GHA","PAN"
];

const TEAM_NAMES = {
  MEX:"México",RSA:"Sudáfrica",KOR:"Corea del Sur",CZE:"Rep. Checa",
  CAN:"Canadá",BIH:"Bosnia",QAT:"Qatar",SUI:"Suiza",BRA:"Brasil",MAR:"Marruecos",
  HAI:"Haití",SCO:"Escocia",USA:"EE.UU.",PAR:"Paraguay",AUS:"Australia",
  TUR:"Turquía",GER:"Alemania",CUW:"Curazao",CIV:"Costa de Marfil",ECU:"Ecuador",
  NED:"Países Bajos",JPN:"Japón",SWE:"Suecia",TUN:"Túnez",BEL:"Bélgica",
  EGY:"Egipto",IRN:"Irán",NZL:"Nueva Zelanda",ESP:"España",CPV:"Cabo Verde",
  KSA:"Arabia Saudita",URU:"Uruguay",FRA:"Francia",SEN:"Senegal",IRQ:"Iraq",
  NOR:"Noruega",ARG:"Argentina",ALG:"Argelia",AUT:"Austria",JOR:"Jordania",
  POR:"Portugal",COD:"Congo",UZB:"Uzbekistán",COL:"Colombia",ENG:"Inglaterra",
  CRO:"Croacia",GHA:"Ghana",PAN:"Panamá"
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
const COCA_STICKERS = Array.from({length:14},(_,i)=>i+1);
const TEAM_STICKERS = Array.from({length:20},(_,i)=>i+1);
const AVATARS = ["⚽","🏆","🥅","🦅","🦁","🐯","🦊","🐻","🦋","🌟","🔥","💎","🎯","🌈","⚡","🦄","🍀","🎸","🏅","🎪"];
const COLORS = [
  {name:"Azul",   bg:"#1a56db", light:"#e8f0fe"},
  {name:"Verde",  bg:"#057a55", light:"#def7ec"},
  {name:"Rojo",   bg:"#c81e1e", light:"#fde8e8"},
  {name:"Morado", bg:"#7e3af2", light:"#edebfe"},
  {name:"Naranja",bg:"#d97706", light:"#fef3c7"},
  {name:"Rosa",   bg:"#e74694", light:"#fce7f3"},
  {name:"Cian",   bg:"#0694a2", light:"#d5f5f6"},
  {name:"Gris",   bg:"#4b5563", light:"#f3f4f6"},
];
const ROOM_CODE = "MUNDIAL2026";

// ── helpers ──────────────────────────────────────────────
function buildEmptyCollection() {
  const col = {};
  TEAMS.forEach(t => {
    col[t] = {};
    TEAM_STICKERS.forEach(n => { col[t][n] = {owned:false,repeated:0}; });
  });
  col["ESPECIALES"] = {};
  SPECIAL_STICKERS.forEach(n => { col["ESPECIALES"][n] = {owned:false,repeated:0}; });
  col["CC"] = {};
  COCA_STICKERS.forEach(n => { col["CC"][n] = {owned:false,repeated:0}; });
  return col;
}

function calcStats(col) {
  let total=0, owned=0, reps=0;
  const sections = {};
  TEAMS.forEach(t => {
    let tO=0, tR=0;
    TEAM_STICKERS.forEach(n => {
      total++;
      if(col[t]?.[n]?.owned){ owned++; tO++; }
      tR += col[t]?.[n]?.repeated||0;
    });
    sections[t] = {total:20, owned:tO, reps:tR, pct:Math.round(tO/20*100)};
    reps += tR;
  });
  let sO=0, sR=0;
  SPECIAL_STICKERS.forEach(n => {
    total++;
    if(col["ESPECIALES"]?.[n]?.owned){ owned++; sO++; }
    sR += col["ESPECIALES"]?.[n]?.repeated||0;
  });
  sections["ESPECIALES"] = {total:20, owned:sO, reps:sR, pct:Math.round(sO/20*100)};
  reps += sR;
  let cO=0, cR=0;
  COCA_STICKERS.forEach(n => {
    total++;
    if(col["CC"]?.[n]?.owned){ owned++; cO++; }
    cR += col["CC"]?.[n]?.repeated||0;
  });
  sections["CC"] = {total:14, owned:cO, reps:cR, pct:Math.round(cO/14*100)};
  reps += cR;

  const missing = total - owned;
  const pct = Math.round(owned/total*100);
  const sorted = [...TEAMS].map(t=>({code:t,...sections[t]})).sort((a,b)=>b.pct-a.pct);
  const complete = sorted.filter(s=>s.pct===100);
  const best = sorted.slice(0,3);
  const worst = sorted.slice(-3).reverse();
  return {total, owned, missing, pct, reps, sections, complete, best, worst};
}

function findMatches(users, myId) {
  const me = users[myId];
  if(!me) return [];
  const matches = [];
  const myCol = me.collection;
  Object.entries(users).forEach(([uid, user]) => {
    if(uid === myId) return;
    const theirCol = user.collection;
    const gives=[], needs=[];
    TEAMS.forEach(t => {
      TEAM_STICKERS.forEach(n => {
        const myS = myCol[t]?.[n];
        const thS = theirCol[t]?.[n];
        if(myS?.repeated>0 && thS && !thS.owned) gives.push({section:t, num:n, flag:TEAM_FLAGS[t]});
        if(thS?.repeated>0 && myS && !myS.owned) needs.push({section:t, num:n, flag:TEAM_FLAGS[t]});
      });
    });
    SPECIAL_STICKERS.forEach(n => {
      const myS=myCol["ESPECIALES"]?.[n]; const thS=theirCol["ESPECIALES"]?.[n];
      if(myS?.repeated>0 && thS && !thS.owned) gives.push({section:"ESPECIALES",num:n,flag:"✨"});
      if(thS?.repeated>0 && myS && !myS.owned) needs.push({section:"ESPECIALES",num:n,flag:"✨"});
    });
    COCA_STICKERS.forEach(n => {
      const myS=myCol["CC"]?.[n]; const thS=theirCol["CC"]?.[n];
      if(myS?.repeated>0 && thS && !thS.owned) gives.push({section:"CC",num:n,flag:"🥤"});
      if(thS?.repeated>0 && myS && !myS.owned) needs.push({section:"CC",num:n,flag:"🥤"});
    });
    if(gives.length>0||needs.length>0)
      matches.push({uid, name:user.name, avatar:user.avatar, color:user.color, gives, needs});
  });
  return matches;
}

// ── localStorage persistence ──────────────────────────────
function loadData() {
  try {
    const users = JSON.parse(localStorage.getItem("album_users")||"{}");
    const myId  = localStorage.getItem("album_myId")||null;
    return {users, myId};
  } catch { return {users:{}, myId:null}; }
}
function saveUsers(users) {
  try { localStorage.setItem("album_users", JSON.stringify(users)); } catch {}
}
function saveMyId(id) {
  try { localStorage.setItem("album_myId", id); } catch {}
}
function clearMyId() {
  try { localStorage.removeItem("album_myId"); } catch {}
}

// ── sub-components ────────────────────────────────────────
function Avatar({avatar, color, size=36}) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background: color?.bg||"#1a56db",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: size*0.44, flexShrink:0,
      border:"2px solid rgba(255,255,255,0.25)"
    }}>{avatar}</div>
  );
}

function ProgressBar({pct, color="#057a55", height=6}) {
  return (
    <div style={{background:"#e5e7eb", borderRadius:99, height, overflow:"hidden", width:"100%"}}>
      <div style={{width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width .4s"}}/>
    </div>
  );
}

function StatCard({label, value, sub, color}) {
  return (
    <div style={{background:"#f3f4f6", borderRadius:10, padding:"12px 16px", flex:1, minWidth:110}}>
      <div style={{fontSize:12, color:"#6b7280", marginBottom:4}}>{label}</div>
      <div style={{fontSize:22, fontWeight:600, color: color||"#111"}}>{value}</div>
      {sub && <div style={{fontSize:11, color:"#9ca3af", marginTop:2}}>{sub}</div>}
    </div>
  );
}

function StickerMenu({val, label, onToggle, onAddRepeat, onRemoveRepeat, onRemoveOwned, onClose}) {
  const ref = useRef();
  useEffect(()=>{
    function handler(e){ if(ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[onClose]);

  return (
    <div ref={ref} style={{
      position:"absolute", zIndex:9999, top:36, left:0,
      background:"#fff", border:"1px solid #e5e7eb",
      borderRadius:12, padding:10, boxShadow:"0 8px 32px rgba(0,0,0,0.15)",
      minWidth:200, whiteSpace:"nowrap"
    }}>
      <div style={{fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:8, paddingLeft:4}}>{label}</div>
      <Btn onClick={onToggle} bg={val.owned?"#fde8e8":"#def7ec"} color={val.owned?"#991b1b":"#065f46"}>
        {val.owned ? "❌ Marcar como faltante" : "✅ Marcar como obtenido"}
      </Btn>
      <Btn onClick={onAddRepeat} bg="#fef3c7" color="#92400e">
        🔁 Agregar repetido{val.repeated>0?` (tengo ${val.repeated})`:""}
      </Btn>
      {val.repeated>0 && (
        <Btn onClick={onRemoveRepeat} bg="#f3f4f6" color="#374151">
          ➖ Quitar un repetido
        </Btn>
      )}
      {val.owned && (
        <Btn onClick={onRemoveOwned} bg="#f3f4f6" color="#dc2626">
          🗑 Borrar (corregir error)
        </Btn>
      )}
    </div>
  );
}

function Btn({onClick, bg, color, children}) {
  return (
    <button onClick={onClick} style={{
      display:"block", width:"100%", padding:"7px 10px", marginBottom:4,
      background:bg, color, border:"none", borderRadius:8,
      cursor:"pointer", fontSize:13, textAlign:"left", fontWeight:500
    }}>{children}</button>
  );
}

function StickerCell({sectionKey, num, val, onToggle, onAddRepeat, onRemoveRepeat, onRemoveOwned}) {
  const [open, setOpen] = useState(false);
  const {owned, repeated} = val||{owned:false,repeated:0};

  let bg="#f3f4f6", border="1px solid #e5e7eb", textColor="#9ca3af";
  if(owned && repeated>0){ bg="#fef3c7"; border="1px solid #d97706"; textColor="#92400e"; }
  else if(owned)          { bg="#def7ec"; border="1px solid #10b981"; textColor="#065f46"; }
  else if(repeated>0)     { bg="#fce7f3"; border="1px solid #e74694"; textColor="#9d174d"; }

  const label = `${sectionKey==="ESPECIALES"?"Esp.":sectionKey==="CC"?"CC":sectionKey} #${num}`;

  return (
    <div style={{position:"relative", display:"inline-block"}}>
      <div style={{fontSize:9, color:"#9ca3af", textAlign:"center", marginBottom:2, userSelect:"none"}}>{num}</div>
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{
          width:34, height:34, borderRadius:8, background:bg, border,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", position:"relative", userSelect:"none",
          fontSize:10, fontWeight:600, color:textColor
        }}
      >
        {repeated>0 && (
          <span style={{
            position:"absolute", top:-6, right:-6,
            background:"#d97706", color:"#fff", borderRadius:"50%",
            width:16, height:16, fontSize:9,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:700, zIndex:1
          }}>{repeated}</span>
        )}
        {owned ? "✓" : repeated>0 ? "R" : "–"}
      </div>
      {open && (
        <StickerMenu
          val={val||{owned:false,repeated:0}}
          label={label}
          onToggle={()=>{ onToggle(); setOpen(false); }}
          onAddRepeat={()=>{ onAddRepeat(); setOpen(false); }}
          onRemoveRepeat={()=>{ onRemoveRepeat(); setOpen(false); }}
          onRemoveOwned={()=>{ onRemoveOwned(); setOpen(false); }}
          onClose={()=>setOpen(false)}
        />
      )}
    </div>
  );
}

// ── main app ──────────────────────────────────────────────
export default function App() {
  const init = loadData();
  const [users, setUsers]   = useState(init.users);
  const [myId,  setMyId]    = useState(init.myId);
  const [screen, setScreen] = useState(init.myId && init.users[init.myId] ? "app" : "login");
  const [tab,  setTab]      = useState("album");

  // login
  const [roomInput, setRoomInput] = useState("");
  const [roomError, setRoomError] = useState("");

  // register
  const [newName,   setNewName]   = useState("");
  const [newAvatar, setNewAvatar] = useState("⚽");
  const [newColor,  setNewColor]  = useState(COLORS[0]);

  // album
  const [selectedSection, setSelectedSection] = useState(TEAMS[0]);
  const [sectionSearch,   setSectionSearch]   = useState("");

  const persistUsers = useCallback((u) => {
    setUsers(u);
    saveUsers(u);
  }, []);

  // ── login ──
  const handleJoinRoom = () => {
    if(roomInput.trim().toUpperCase() !== ROOM_CODE) {
      setRoomError("Código incorrecto. Pídelo a quien te invitó."); return;
    }
    setRoomError(""); setScreen("register");
  };

  // ── register ──
  const handleRegister = () => {
    if(!newName.trim()) return;
    const id = "u_"+Date.now();
    const updated = {
      ...users,
      [id]: { name:newName.trim(), avatar:newAvatar, color:newColor,
               collection:buildEmptyCollection(), createdAt:Date.now() }
    };
    persistUsers(updated);
    saveMyId(id);
    setMyId(id);
    setScreen("app");
  };

  const handleSelectUser = (id) => {
    saveMyId(id); setMyId(id); setScreen("app");
  };

  const handleLogout = () => {
    clearMyId(); setMyId(null); setScreen("login");
    setTab("album"); setRoomInput(""); setRoomError("");
  };

  // ── sticker mutations ──
  const updateSticker = useCallback((sk, num, fn) => {
    if(!myId) return;
    setUsers(prev => {
      const next = {...prev};
      const col  = JSON.parse(JSON.stringify(next[myId].collection));
      if(!col[sk]) col[sk] = {};
      if(!col[sk][num]) col[sk][num] = {owned:false, repeated:0};
      fn(col[sk][num]);
      next[myId] = {...next[myId], collection:col};
      saveUsers(next);
      return next;
    });
  }, [myId]);

  const onToggle      = (sk,n) => updateSticker(sk,n,s=>{ s.owned=!s.owned; if(!s.owned) s.repeated=0; });
  const onAddRepeat   = (sk,n) => updateSticker(sk,n,s=>{ s.repeated=(s.repeated||0)+1; });
  const onRemoveRepeat= (sk,n) => updateSticker(sk,n,s=>{ if(s.repeated>0) s.repeated--; });
  const onRemoveOwned = (sk,n) => updateSticker(sk,n,s=>{ s.owned=false; s.repeated=0; });

  // ── derived ──
  const me      = myId ? users[myId] : null;
  const stats   = me   ? calcStats(me.collection) : null;
  const matches = me   ? findMatches(users, myId) : [];
  const alerts  = matches.filter(m=>m.gives.length>0||m.needs.length>0);

  const filteredTeams = sectionSearch
    ? TEAMS.filter(t => t.toLowerCase().includes(sectionSearch.toLowerCase())
        || TEAM_NAMES[t]?.toLowerCase().includes(sectionSearch.toLowerCase()))
    : TEAMS;

  // ════════════════════════════════════════
  // SCREEN: LOGIN
  // ════════════════════════════════════════
  if(screen==="login") return (
    <div style={{minHeight:"100vh", background:"#f9fafb", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px"}}>
      <div style={{width:"100%", maxWidth:400}}>
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{fontSize:56, marginBottom:12}}>🏆</div>
          <h1 style={{fontSize:24, fontWeight:700, margin:0}}>Álbum Mundial 2026</h1>
          <p style={{fontSize:14, color:"#6b7280", marginTop:6}}>Ingresa el código de sala para unirte</p>
        </div>

        <div style={{background:"#fff", borderRadius:16, padding:20, border:"1px solid #e5e7eb", marginBottom:12}}>
          <label style={{fontSize:13, color:"#6b7280", display:"block", marginBottom:6}}>Código de sala</label>
          <input
            value={roomInput}
            onChange={e=>setRoomInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleJoinRoom()}
            placeholder="ej: MUNDIAL2026"
            style={{width:"100%", fontSize:16, letterSpacing:3, fontWeight:700, textTransform:"uppercase", padding:"10px 14px", border:"1px solid #d1d5db", borderRadius:10, outline:"none", boxSizing:"border-box"}}
          />
          {roomError && <p style={{color:"#dc2626", fontSize:12, marginTop:8, marginBottom:0}}>{roomError}</p>}
        </div>
        <button onClick={handleJoinRoom} style={{width:"100%", padding:13, fontSize:15, fontWeight:700, background:"#1a56db", color:"#fff", border:"none", borderRadius:12, cursor:"pointer"}}>
          Entrar →
        </button>

        {Object.keys(users).length>0 && (
          <div style={{marginTop:28}}>
            <p style={{fontSize:13, color:"#9ca3af", textAlign:"center", marginBottom:12}}>o elige tu perfil existente</p>
            {Object.entries(users).map(([id,u])=>{
              const s = calcStats(u.collection);
              return (
                <div key={id} onClick={()=>handleSelectUser(id)} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#fff", borderRadius:12, marginBottom:8, cursor:"pointer", border:"1px solid #e5e7eb"}}>
                  <Avatar avatar={u.avatar} color={u.color} size={38}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600, fontSize:14}}>{u.name}</div>
                    <div style={{fontSize:12, color:"#6b7280"}}>{s.pct}% completado · {s.owned}/{s.total} cromos</div>
                  </div>
                  <span style={{fontSize:13, color:"#9ca3af"}}>→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // SCREEN: REGISTER
  // ════════════════════════════════════════
  if(screen==="register") return (
    <div style={{minHeight:"100vh", background:"#f9fafb", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px"}}>
      <div style={{width:"100%", maxWidth:400}}>
        <button onClick={()=>setScreen("login")} style={{background:"none", border:"none", cursor:"pointer", color:"#6b7280", fontSize:13, marginBottom:20, padding:0}}>← Volver</button>
        <h2 style={{fontSize:20, fontWeight:700, marginBottom:4}}>Crea tu perfil</h2>
        <p style={{fontSize:13, color:"#6b7280", marginBottom:24}}>Personaliza cómo te verán tus amigos</p>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:13, color:"#6b7280", display:"block", marginBottom:6}}>Tu nombre o apodo</label>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nombre" style={{width:"100%", fontSize:15, padding:"10px 14px", border:"1px solid #d1d5db", borderRadius:10, outline:"none", boxSizing:"border-box"}}/>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:13, color:"#6b7280", display:"block", marginBottom:8}}>Elige tu avatar</label>
          <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
            {AVATARS.map(a=>(
              <div key={a} onClick={()=>setNewAvatar(a)} style={{width:42, height:42, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, cursor:"pointer", border:newAvatar===a?"2px solid #1a56db":"1px solid #e5e7eb", background:newAvatar===a?"#e8f0fe":"#fff"}}>
                {a}
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <label style={{fontSize:13, color:"#6b7280", display:"block", marginBottom:8}}>Elige tu color</label>
          <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
            {COLORS.map(c=>(
              <div key={c.name} onClick={()=>setNewColor(c)} title={c.name} style={{width:34, height:34, borderRadius:"50%", background:c.bg, cursor:"pointer", border:newColor.name===c.name?"3px solid #111":"3px solid transparent"}}/>
            ))}
          </div>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:12, background:"#f3f4f6", padding:14, borderRadius:12, marginBottom:24}}>
          <Avatar avatar={newAvatar} color={newColor} size={46}/>
          <div>
            <div style={{fontWeight:600}}>{newName||"Tu nombre"}</div>
            <div style={{fontSize:12, color:"#6b7280"}}>Vista previa de tu perfil</div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={!newName.trim()}
          style={{width:"100%", padding:13, fontSize:15, fontWeight:700, background:newName.trim()?"#1a56db":"#d1d5db", color:"#fff", border:"none", borderRadius:12, cursor:newName.trim()?"pointer":"not-allowed"}}
        >
          Crear perfil y comenzar →
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // SCREEN: MAIN APP
  // ════════════════════════════════════════

  // current section info
  const isEsp  = selectedSection==="ESPECIALES";
  const isCC   = selectedSection==="CC";
  const isTeam = TEAMS.includes(selectedSection);
  const stickerList = isTeam ? TEAM_STICKERS : isEsp ? SPECIAL_STICKERS : COCA_STICKERS;
  const sInfo = stats?.sections[selectedSection];

  return (
    <div style={{minHeight:"100vh", background:"#f9fafb"}}>

      {/* ── header ── */}
      <div style={{background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"0 16px", position:"sticky", top:0, zIndex:200}}>
        <div style={{maxWidth:800, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:52}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:20}}>🏆</span>
            <span style={{fontWeight:700, fontSize:15}}>Álbum Mundial 2026</span>
          </div>
          {me && (
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              {alerts.length>0 && (
                <span style={{background:"#fef3c7", color:"#92400e", fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:99, border:"1px solid #d97706"}}>
                  🔔 {alerts.length} match{alerts.length>1?"es":""}
                </span>
              )}
              <div style={{display:"flex", alignItems:"center", gap:8, padding:"4px 10px", border:"1px solid #e5e7eb", borderRadius:20, cursor:"pointer"}} onClick={handleLogout}>
                <Avatar avatar={me.avatar} color={me.color} size={24}/>
                <span style={{fontSize:13, fontWeight:600}}>{me.name}</span>
                <span style={{fontSize:11, color:"#9ca3af"}}>salir</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── match alerts ── */}
      {tab!=="intercambios" && alerts.slice(0,2).map(m=>(
        <div key={m.uid} style={{background:"#fef3c7", borderBottom:"1px solid #fcd34d", padding:"8px 16px", display:"flex", alignItems:"center", gap:10}}>
          <span style={{fontSize:16}}>🔔</span>
          <div style={{flex:1, fontSize:13, color:"#92400e"}}>
            <strong>¡Match con {m.name}!</strong>
            {m.gives.length>0 && ` Tú le puedes dar ${m.gives.length} cromo(s).`}
            {m.needs.length>0 && ` Ellos te pueden dar ${m.needs.length} cromo(s).`}
          </div>
          <button onClick={()=>setTab("intercambios")} style={{fontSize:11, fontWeight:600, background:"#d97706", color:"#fff", border:"none", borderRadius:7, padding:"4px 12px", cursor:"pointer"}}>Ver →</button>
        </div>
      ))}

      {/* ── tabs ── */}
      <div style={{background:"#fff", borderBottom:"1px solid #e5e7eb"}}>
        <div style={{maxWidth:800, margin:"0 auto", display:"flex", padding:"0 16px"}}>
          {[["album","📋 Álbum"],["stats","📊 Estadísticas"],["intercambios","🔄 Intercambios"],["usuarios","👥 Usuarios"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{
              padding:"12px 14px", fontSize:13, fontWeight:tab===key?700:400,
              background:"none", border:"none",
              borderBottom: tab===key?"2px solid #1a56db":"2px solid transparent",
              color: tab===key?"#1a56db":"#6b7280",
              cursor:"pointer"
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:800, margin:"0 auto", padding:"16px"}}>

        {/* ══════════ TAB: ÁLBUM ══════════ */}
        {tab==="album" && me && (
          <div>
            {/* legend */}
            <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center"}}>
              <span style={{fontSize:12, color:"#6b7280", marginRight:4}}>Leyenda:</span>
              {[["#def7ec","#065f46","✓ Obtenido"],["#fef3c7","#92400e","🔁 Repetido"],["#fce7f3","#9d174d","R Sólo repetido"],["#f3f4f6","#9ca3af","– Falta"]].map(([bg,col,lbl])=>(
                <span key={lbl} style={{background:bg,color:col,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:500}}>{lbl}</span>
              ))}
            </div>

            {/* section search */}
            <input
              value={sectionSearch}
              onChange={e=>setSectionSearch(e.target.value)}
              placeholder="Buscar selección..."
              style={{width:"100%", fontSize:13, padding:"8px 12px", border:"1px solid #d1d5db", borderRadius:10, outline:"none", boxSizing:"border-box", marginBottom:12}}
            />

            {/* section buttons */}
            <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:16}}>
              {filteredTeams.map(t=>{
                const s=stats?.sections[t];
                const active=selectedSection===t;
                return (
                  <button key={t} onClick={()=>setSelectedSection(t)} style={{
                    padding:"5px 9px", fontSize:11, fontWeight:600, borderRadius:8, cursor:"pointer",
                    border: active?"2px solid #1a56db":"1px solid #d1d5db",
                    background: active?"#e8f0fe":"#fff",
                    color: active?"#1a56db":"#374151",
                    position:"relative"
                  }}>
                    {TEAM_FLAGS[t]} {t}
                    {s?.pct===100 && <span style={{position:"absolute",top:-5,right:-5,fontSize:8,background:"#057a55",color:"#fff",borderRadius:99,padding:"1px 4px"}}>✓</span>}
                  </button>
                );
              })}
              <button onClick={()=>setSelectedSection("ESPECIALES")} style={{padding:"5px 9px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:selectedSection==="ESPECIALES"?"2px solid #7e3af2":"1px solid #d1d5db",background:selectedSection==="ESPECIALES"?"#edebfe":"#fff",color:selectedSection==="ESPECIALES"?"#7e3af2":"#374151"}}>✨ Especiales</button>
              <button onClick={()=>setSelectedSection("CC")} style={{padding:"5px 9px",fontSize:11,fontWeight:600,borderRadius:8,cursor:"pointer",border:selectedSection==="CC"?"2px solid #e74694":"1px solid #d1d5db",background:selectedSection==="CC"?"#fce7f3":"#fff",color:selectedSection==="CC"?"#e74694":"#374151"}}>🥤 Coca-Cola</button>
            </div>

            {/* active section grid */}
            <div style={{background:"#fff", borderRadius:14, padding:16, border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <span style={{fontSize:26}}>{isEsp?"✨":isCC?"🥤":TEAM_FLAGS[selectedSection]}</span>
                  <div>
                    <div style={{fontWeight:700, fontSize:15}}>
                      {isEsp?"Especiales":isCC?"Coca-Cola":(TEAM_NAMES[selectedSection]||selectedSection)}
                      {isTeam && <span style={{fontWeight:400, color:"#9ca3af", fontSize:12}}> ({selectedSection})</span>}
                    </div>
                    <div style={{fontSize:12, color:"#6b7280"}}>
                      {sInfo?.owned}/{sInfo?.total} obtenidos · {sInfo?.reps} repetidos
                    </div>
                  </div>
                </div>
                <div style={{fontSize:20, fontWeight:700, color: sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"}}>
                  {sInfo?.pct}%
                </div>
              </div>
              <ProgressBar pct={sInfo?.pct||0} color={sInfo?.pct===100?"#057a55":sInfo?.pct>50?"#1a56db":"#d97706"} height={6}/>
              <div style={{marginTop:14, display:"flex", flexWrap:"wrap", gap:6}}>
                {stickerList.map(n=>(
                  <StickerCell
                    key={n}
                    sectionKey={selectedSection}
                    num={n}
                    val={me.collection[selectedSection]?.[n]}
                    onToggle={()=>onToggle(selectedSection,n)}
                    onAddRepeat={()=>onAddRepeat(selectedSection,n)}
                    onRemoveRepeat={()=>onRemoveRepeat(selectedSection,n)}
                    onRemoveOwned={()=>onRemoveOwned(selectedSection,n)}
                  />
                ))}
              </div>
              <p style={{fontSize:11, color:"#9ca3af", marginTop:12, marginBottom:0}}>Haz clic en cualquier cromo para ver las opciones</p>
            </div>
          </div>
        )}

        {/* ══════════ TAB: ESTADÍSTICAS ══════════ */}
        {tab==="stats" && stats && (
          <div>
            <div style={{display:"flex", gap:10, marginBottom:16, flexWrap:"wrap"}}>
              <StatCard label="Completado" value={`${stats.pct}%`} sub={`${stats.owned} de ${stats.total} cromos`} color={stats.pct>75?"#057a55":stats.pct>40?"#1a56db":"#d97706"}/>
              <StatCard label="Faltantes" value={stats.missing} sub="para terminar el álbum"/>
              <StatCard label="Repetidos" value={stats.reps} sub="para intercambiar"/>
              <StatCard label="Secciones completas" value={stats.complete.length} sub={`de ${TEAMS.length+2}`}/>
            </div>

            <div style={{background:"#fff", borderRadius:14, padding:16, border:"1px solid #e5e7eb", marginBottom:16}}>
              <div style={{fontWeight:700, marginBottom:14}}>Progreso por sección</div>
              {[
                {key:"teams", label:`Selecciones (${TEAMS.length})`, owned:TEAMS.reduce((a,t)=>a+(stats.sections[t]?.owned||0),0), total:TEAMS.length*20, color:"#1a56db"},
                {key:"ESPECIALES", label:"✨ Especiales", owned:stats.sections["ESPECIALES"]?.owned||0, total:20, color:"#7e3af2"},
                {key:"CC", label:"🥤 Coca-Cola", owned:stats.sections["CC"]?.owned||0, total:14, color:"#e74694"},
              ].map(row=>(
                <div key={row.key} style={{marginBottom:12}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4}}>
                    <span style={{fontWeight:500}}>{row.label}</span>
                    <span style={{color:"#6b7280"}}>{row.owned} / {row.total}</span>
                  </div>
                  <ProgressBar pct={Math.round(row.owned/row.total*100)} color={row.color}/>
                </div>
              ))}
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16}}>
              <div style={{background:"#fff", borderRadius:14, padding:14, border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700, fontSize:13, marginBottom:10, color:"#057a55"}}>🟢 Más avanzadas</div>
                {stats.best.map(s=>(
                  <div key={s.code} style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                    <span style={{fontSize:14}}>{TEAM_FLAGS[s.code]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12, fontWeight:600}}>{s.code} <span style={{fontWeight:400, color:"#6b7280"}}>{s.pct}%</span></div>
                      <ProgressBar pct={s.pct} color="#057a55" height={4}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:"#fff", borderRadius:14, padding:14, border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700, fontSize:13, marginBottom:10, color:"#dc2626"}}>🔴 Más incompletas</div>
                {stats.worst.map(s=>(
                  <div key={s.code} style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                    <span style={{fontSize:14}}>{TEAM_FLAGS[s.code]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12, fontWeight:600}}>{s.code} <span style={{fontWeight:400, color:"#6b7280"}}>{s.pct}%</span></div>
                      <ProgressBar pct={s.pct} color="#dc2626" height={4}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {stats.complete.length>0 && (
              <div style={{background:"#def7ec", border:"1px solid #6ee7b7", borderRadius:14, padding:14, marginBottom:16}}>
                <div style={{fontWeight:700, color:"#065f46", marginBottom:8}}>🎉 Secciones completas ({stats.complete.length})</div>
                <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
                  {stats.complete.map(s=>(
                    <span key={s.code} style={{background:"#057a55", color:"#fff", padding:"3px 11px", borderRadius:99, fontSize:12, fontWeight:600}}>
                      {TEAM_FLAGS[s.code]} {s.code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{background:"#fff", borderRadius:14, padding:16, border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700, marginBottom:12}}>Todas las selecciones</div>
              {TEAMS.map(t=>{
                const s=stats.sections[t];
                return (
                  <div key={t} style={{display:"flex", alignItems:"center", gap:8, marginBottom:7}}>
                    <span style={{fontSize:13, width:18}}>{TEAM_FLAGS[t]}</span>
                    <span style={{fontSize:12, fontWeight:600, width:36}}>{t}</span>
                    <div style={{flex:1}}><ProgressBar pct={s.pct} color={s.pct===100?"#057a55":s.pct>50?"#1a56db":"#d97706"} height={5}/></div>
                    <span style={{fontSize:11, color:"#6b7280", width:70, textAlign:"right"}}>{s.owned}/20 · {s.pct}%</span>
                    {s.reps>0 && <span style={{fontSize:10, background:"#fef3c7", color:"#92400e", padding:"1px 6px", borderRadius:99, whiteSpace:"nowrap"}}>{s.reps}× rep.</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ TAB: INTERCAMBIOS ══════════ */}
        {tab==="intercambios" && (
          <div>
            <p style={{fontSize:13, color:"#6b7280", marginBottom:16}}>
              Los matches se detectan automáticamente: si tienes un repetido que a alguien le falta, o viceversa, aparece aquí.
            </p>
            {matches.length===0 ? (
              <div style={{textAlign:"center", padding:"48px 20px", color:"#9ca3af"}}>
                <div style={{fontSize:48, marginBottom:12}}>🤝</div>
                <div style={{fontWeight:600, fontSize:15, color:"#6b7280"}}>No hay matches aún</div>
                <div style={{fontSize:13, marginTop:6}}>Cuando más usuarios registren sus repetidos, aparecerán las oportunidades de intercambio.</div>
              </div>
            ) : matches.map(m=>(
              <div key={m.uid} style={{background:"#fff", borderRadius:14, padding:16, marginBottom:12, border:"1px solid #e5e7eb"}}>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
                  <Avatar avatar={m.avatar} color={m.color} size={38}/>
                  <div>
                    <div style={{fontWeight:700}}>{m.name}</div>
                    <div style={{fontSize:12, color:"#6b7280"}}>
                      {m.gives.length} cromo(s) que tú le das · {m.needs.length} cromo(s) que ellos te dan
                    </div>
                  </div>
                </div>
                {m.gives.length>0 && (
                  <div style={{marginBottom:10}}>
                    <div style={{fontSize:12, fontWeight:700, color:"#065f46", marginBottom:6}}>✅ Tú le puedes dar a {m.name}:</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
                      {m.gives.slice(0,24).map((g,i)=>(
                        <span key={i} style={{fontSize:11, background:"#def7ec", color:"#065f46", padding:"2px 8px", borderRadius:99, fontWeight:500}}>
                          {g.flag} {g.section==="ESPECIALES"?"Esp":g.section}#{g.num}
                        </span>
                      ))}
                      {m.gives.length>24 && <span style={{fontSize:11, color:"#9ca3af"}}>+{m.gives.length-24} más</span>}
                    </div>
                  </div>
                )}
                {m.needs.length>0 && (
                  <div>
                    <div style={{fontSize:12, fontWeight:700, color:"#1e40af", marginBottom:6}}>🎯 {m.name} te puede dar a ti:</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
                      {m.needs.slice(0,24).map((g,i)=>(
                        <span key={i} style={{fontSize:11, background:"#e8f0fe", color:"#1e40af", padding:"2px 8px", borderRadius:99, fontWeight:500}}>
                          {g.flag} {g.section==="ESPECIALES"?"Esp":g.section}#{g.num}
                        </span>
                      ))}
                      {m.needs.length>24 && <span style={{fontSize:11, color:"#9ca3af"}}>+{m.needs.length-24} más</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══════════ TAB: USUARIOS ══════════ */}
        {tab==="usuarios" && (
          <div>
            <div style={{background:"#e8f0fe", border:"1px solid #93c5fd", borderRadius:12, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10}}>
              <span style={{fontSize:20}}>🔑</span>
              <div>
                <div style={{fontSize:14, fontWeight:700, color:"#1e40af"}}>Código de sala: {ROOM_CODE}</div>
                <div style={{fontSize:12, color:"#3b82f6"}}>Comparte este código con amigos y familia para que se unan</div>
              </div>
            </div>
            {Object.keys(users).length===0 && (
              <p style={{color:"#9ca3af", textAlign:"center", padding:40}}>Nadie más se ha unido aún.</p>
            )}
            {Object.entries(users).map(([id,u])=>{
              const s=calcStats(u.collection);
              const isMe=id===myId;
              return (
                <div key={id} style={{display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#fff", borderRadius:12, marginBottom:8, border: isMe?"2px solid #1a56db":"1px solid #e5e7eb"}}>
                  <Avatar avatar={u.avatar} color={u.color} size={42}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:2}}>
                      <span style={{fontWeight:700}}>{u.name}</span>
                      {isMe && <span style={{fontSize:10, background:"#1a56db", color:"#fff", padding:"1px 8px", borderRadius:99, fontWeight:600}}>tú</span>}
                    </div>
                    <div style={{fontSize:12, color:"#6b7280"}}>{s.owned}/{s.total} cromos · {s.reps} repetidos · {s.complete.length} secciones completas</div>
                    <div style={{marginTop:4}}><ProgressBar pct={s.pct} color={u.color?.bg||"#1a56db"} height={4}/></div>
                  </div>
                  <div style={{fontSize:20, fontWeight:700, color:u.color?.bg||"#1a56db"}}>{s.pct}%</div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
