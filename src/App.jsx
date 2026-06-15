import { useState, useEffect, useRef } from 'react'
import { db } from './firebase'
import { ref, set, get, onValue, update, serverTimestamp } from 'firebase/database'
import { NAME_POOL, ALPHABET } from './names'

// ── Utilities ──────────────────────────────────────────────────────────────
function generateCode() {
  const words = ['MAPLE','CEDAR','BIRCH','ASPEN','STONE','RIVER','CLOUD','EMBER','PEARL','BLOOM',
    'HAVEN','GROVE','CREST','BRIAR','FERN','LARK','DOVE','SAGE','REED','WREN']
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 90 + 10)
}

function getNames(gender, type, letter) {
  return NAME_POOL[gender]?.[type]?.[letter] || []
}

function getAllFirstNames(gender) {
  const pool = NAME_POOL[gender]?.first || {}
  return ALPHABET.flatMap(l => pool[l] || [])
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Heart Burst Animation ──────────────────────────────────────────────────
function HeartBurst({ active, onDone }) {
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (!active) return
    setPhase('burst')
    const t1 = setTimeout(() => setPhase('float'), 350)
    const t2 = setTimeout(() => { setPhase('idle'); onDone?.() }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  if (phase === 'idle') return null

  const particles = Array.from({ length: 22 }, (_, i) => {
    const angle = (i / 22) * 360
    const dist = 70 + Math.random() * 90
    const size = 16 + Math.random() * 20
    return { id: i, angle, dist, size, delay: Math.random() * 0.08,
      color: ['💜','💗','💕','💖','💓'][i % 5] }
  })

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none', zIndex:998 }}>
      <div style={{
        fontSize: 80,
        animation: phase === 'burst'
          ? 'heartPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards'
          : 'heartFade 0.5s ease forwards',
        position: 'relative', zIndex: 2, lineHeight: 1,
      }}>💜</div>
      {phase === 'float' && particles.map(p => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.dist
        const ty = Math.sin(rad) * p.dist
        return (
          <div key={p.id} style={{
            position:'absolute', fontSize:p.size,
            left:'50%', top:'50%',
            animation:`flyHeart 1s ease-out ${p.delay}s forwards`,
            '--tx':`${tx}px`, '--ty':`${ty}px`,
          }}>{p.color}</div>
        )
      })}
      <style>{`
        @keyframes heartPop {
          0% { transform:scale(0); opacity:0; }
          70% { transform:scale(1.5); opacity:1; }
          100% { transform:scale(1.1); opacity:1; }
        }
        @keyframes heartFade {
          from { transform:scale(1.1); opacity:1; }
          to { transform:scale(0.4); opacity:0; }
        }
        @keyframes flyHeart {
          0% { transform:translate(-50%,-50%) scale(1); opacity:1; }
          100% { transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty) - 30px)) scale(0.2); opacity:0; }
        }
      `}</style>
    </div>
  )
}

// ── Confetti ───────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 55 }, (_, i) => ({
    id:i, left:Math.random()*100, delay:Math.random()*0.9, dur:1.3+Math.random()*1.2,
    color:['#f472b6','#818cf8','#34d399','#fbbf24','#fb7185','#60a5fa'][i%6],
    size:7+Math.random()*7, circle:Math.random()>0.5, rot:Math.random()*360,
  }))
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:997, overflow:'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:-24,
          width:p.size, height:p.size, borderRadius:p.circle?'50%':2,
          background:p.color, transform:`rotate(${p.rot}deg)`,
          animation:`cffall ${p.dur}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
      <style>{`@keyframes cffall { to { transform:translateY(110vh) rotate(720deg); opacity:0; } }`}</style>
    </div>
  )
}

// ── Match Modal ────────────────────────────────────────────────────────────
function MatchModal({ name, lastName, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{
        background:'linear-gradient(145deg,#1e1b4b,#312e81)', border:'2px solid #818cf8', borderRadius:28,
        padding:'44px 36px', textAlign:'center', maxWidth:340, width:'90%',
        animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:'0 0 80px rgba(129,140,248,0.35)',
      }}>
        <div style={{ fontSize:52, marginBottom:4 }}>💜</div>
        <div style={{ color:'#c7d2fe', fontSize:11, letterSpacing:4, marginBottom:10, textTransform:'uppercase' }}>It's a Match!</div>
        <div style={{ color:'#fff', fontSize:40, fontWeight:800, letterSpacing:-1 }}>{name}</div>
        {lastName && <div style={{ color:'#a5b4fc', fontSize:22, marginTop:4 }}>{name} {lastName}</div>}
        <div style={{ color:'#818cf8', marginTop:14, fontSize:14 }}>You both love this name 🎉</div>
        <button onClick={onClose} style={{ marginTop:28, padding:'12px 36px', background:'#818cf8', color:'#fff', border:'none', borderRadius:50, fontSize:15, cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>Keep swiping</button>
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}

// ── Swipe Card ─────────────────────────────────────────────────────────────
function SwipeCard({ name, lastName, onSwipe }) {
  const [drag, setDrag] = useState(0)
  const [flying, setFlying] = useState(null) // null | 'left' | 'right'
  const [dragging, setDragging] = useState(false)
  const startX = useRef(null)
  const cardRef = useRef(null)

  function px(e) { return e.touches ? e.touches[0].clientX : e.clientX }

  function onDown(e) { startX.current = px(e); setDragging(true) }

  function onMove(e) {
    if (!dragging || startX.current === null) return
    e.preventDefault()
    setDrag(px(e) - startX.current)
  }

  function onUp() {
    if (Math.abs(drag) > 80) {
      const dir = drag > 0 ? 'right' : 'left'
      setFlying(dir)
      setTimeout(() => onSwipe(dir), 380)
    }
    setDrag(flying ? drag : 0)
    setDragging(false)
    startX.current = null
  }

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [dragging, drag])

  const likeOp = Math.max(0, Math.min(1, drag / 80))
  const nopeOp = Math.max(0, Math.min(1, -drag / 80))

  let transform, transition
  if (flying === 'right') {
    transform = 'translateX(150vw) rotate(30deg)'
    transition = 'transform 0.4s cubic-bezier(0.5,0,1,0.5)'
  } else if (flying === 'left') {
    transform = 'translateX(-150vw) rotate(-30deg)'
    transition = 'transform 0.4s cubic-bezier(0.5,0,1,0.5)'
  } else {
    transform = `translateX(${drag}px) rotate(${drag * 0.1}deg)`
    transition = dragging ? 'none' : 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
  }

  return (
    <div
      ref={cardRef}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchEnd={onUp}
      style={{ userSelect:'none', cursor:dragging?'grabbing':'grab', transform, transition, position:'relative', width:'100%', touchAction:'pan-y' }}
    >
      <div style={{
        background:'linear-gradient(160deg,#1e1b4b 0%,#0f172a 100%)',
        border:'1.5px solid #2d3a54', borderRadius:28, padding:'56px 36px', textAlign:'center',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)', minHeight:240,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ position:'absolute', top:28, left:28, border:'3px solid #34d399', color:'#34d399', borderRadius:8, padding:'3px 14px', fontSize:20, fontWeight:800, letterSpacing:2, opacity:likeOp, transform:'rotate(-12deg)' }}>LIKE</div>
        <div style={{ position:'absolute', top:28, right:28, border:'3px solid #fb7185', color:'#fb7185', borderRadius:8, padding:'3px 14px', fontSize:20, fontWeight:800, letterSpacing:2, opacity:nopeOp, transform:'rotate(12deg)' }}>NOPE</div>
        <div style={{ color:'#fff', fontSize:48, fontWeight:800, lineHeight:1, letterSpacing:-1 }}>{name}</div>
        {lastName && <div style={{ color:'#64748b', fontSize:24, marginTop:10, fontWeight:600 }}>{name} {lastName}</div>}
      </div>
    </div>
  )
}

// ── First Name Picker (for middle name mode) ───────────────────────────────
function FirstNamePicker({ gender, onSelect, onClose }) {
  const allFirst = getAllFirstNames(gender).sort()
  const [search, setSearch] = useState('')
  const filtered = allFirst.filter(n => n.toLowerCase().startsWith(search.toLowerCase()))

  return (
    <div style={{ position:'fixed', inset:0, background:'#0f172a', display:'flex', flexDirection:'column', zIndex:200 }}>
      <div style={{ padding:'18px 20px 12px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #1e293b' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#818cf8', fontSize:26, cursor:'pointer', lineHeight:1 }}>←</button>
        <span style={{ color:'#fff', fontSize:18, fontWeight:800 }}>Pick a first name</span>
      </div>
      <div style={{ padding:'12px 20px' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'11px 14px', color:'#fff', fontSize:15, outline:'none', fontFamily:'inherit' }}
        />
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px 20px' }}>
        {filtered.map(n => (
          <button key={n} onClick={() => onSelect(n)} style={{
            display:'block', width:'100%', textAlign:'left',
            background:'none', border:'none', borderBottom:'1px solid #1e293b',
            padding:'14px 4px', color:'#e2e8f0', fontSize:18, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit',
          }}>{n}</button>
        ))}
      </div>
    </div>
  )
}

// ── Matches Panel ──────────────────────────────────────────────────────────
function MatchesPanel({ matches, lastName, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#0f172a', display:'flex', flexDirection:'column', zIndex:100 }}>
      <div style={{ padding:'20px 20px 14px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid #1e293b' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#818cf8', fontSize:26, cursor:'pointer', lineHeight:1 }}>←</button>
        <span style={{ color:'#fff', fontSize:20, fontWeight:800 }}>💜 Matches</span>
        <span style={{ marginLeft:'auto', background:'#1e1b4b', color:'#a5b4fc', borderRadius:50, padding:'2px 12px', fontSize:13, fontWeight:700 }}>{matches.length}</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {matches.length === 0 ? (
          <div style={{ color:'#334155', textAlign:'center', marginTop:80, fontSize:15, lineHeight:1.7 }}>No matches yet.<br />Keep swiping!</div>
        ) : (
          matches.map((name, i) => (
            <div key={name+i} style={{
              background:'linear-gradient(135deg,#1e1b4b,#312e81)', border:'1px solid #4338ca',
              borderRadius:18, padding:'18px 22px', marginBottom:10,
              animation:`slideIn 0.3s ease ${i*0.04}s both`,
            }}>
              <div style={{ color:'#fff', fontSize:26, fontWeight:800 }}>{name}</div>
              {lastName && <div style={{ color:'#818cf8', fontSize:16, marginTop:2 }}>{name} {lastName}</div>}
            </div>
          ))
        )}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

// ── Room Lobby ─────────────────────────────────────────────────────────────
function RoomLobby({ onJoin }) {
  const [mode, setMode] = useState(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true); setError('')
    const roomCode = generateCode()
    await set(ref(db, `rooms/${roomCode}`), {
      created: serverTimestamp(), lastName: lastName.trim(),
      slots: { p1: name.trim(), p2: null }, swipes: {},
    })
    localStorage.setItem('ns_room', roomCode)
    localStorage.setItem('ns_slot', 'p1')
    localStorage.setItem('ns_name', name.trim())
    onJoin({ roomCode, slot: 'p1', myName: name.trim() })
  }

  async function joinRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!code.trim()) { setError('Enter the room code'); return }
    setLoading(true); setError('')
    const upper = code.trim().toUpperCase()
    const snap = await get(ref(db, `rooms/${upper}`))
    if (!snap.exists()) { setError("Room not found — check the code"); setLoading(false); return }
    const room = snap.val()
    if (room.slots.p2) { setError("Room is full"); setLoading(false); return }
    await update(ref(db, `rooms/${upper}/slots`), { p2: name.trim() })
    localStorage.setItem('ns_room', upper)
    localStorage.setItem('ns_slot', 'p2')
    localStorage.setItem('ns_name', name.trim())
    onJoin({ roomCode: upper, slot: 'p2', myName: name.trim() })
  }

  const inp = { width:'100%', background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:'13px 16px', color:'#fff', fontSize:16, outline:'none', fontFamily:'inherit', marginBottom:12 }

  return (
    <div style={{ minHeight:'100svh', background:'#0f172a', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ fontSize:52, marginBottom:8 }}>🍼</div>
      <div style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>Nameswipe</div>
      <div style={{ color:'#475569', fontSize:14, marginBottom:40 }}>Find the perfect name, together</div>
      {!mode ? (
        <div style={{ width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:12 }}>
          <button onClick={() => setMode('create')} style={{ padding:'16px', background:'#818cf8', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Create a room</button>
          <button onClick={() => setMode('join')} style={{ padding:'16px', background:'#1e293b', color:'#a5b4fc', border:'1px solid #334155', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Join with a code</button>
        </div>
      ) : (
        <div style={{ width:'100%', maxWidth:340 }}>
          <button onClick={() => { setMode(null); setError('') }} style={{ background:'none', border:'none', color:'#475569', fontSize:14, cursor:'pointer', marginBottom:20, fontFamily:'inherit' }}>← Back</button>
          <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Your name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bryant" style={inp} />
          {mode === 'create' && (
            <>
              <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Baby's last name (optional)</div>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Smith" style={inp} />
            </>
          )}
          {mode === 'join' && (
            <>
              <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Room code</div>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. MAPLE42" style={{ ...inp, textTransform:'uppercase', letterSpacing:2, fontWeight:700 }} />
            </>
          )}
          {error && <div style={{ color:'#fb7185', fontSize:13, marginBottom:12 }}>{error}</div>}
          <button onClick={mode === 'create' ? createRoom : joinRoom} disabled={loading} style={{ width:'100%', padding:'14px', background:loading?'#334155':'#818cf8', color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:700, cursor:loading?'default':'pointer', fontFamily:'inherit' }}>{loading ? 'Loading…' : mode === 'create' ? 'Create room' : 'Join room'}</button>
        </div>
      )}
    </div>
  )
}

// ── Main Swipe App ─────────────────────────────────────────────────────────
function SwipeApp({ roomCode, slot, myName, onLeave }) {
  const [room, setRoom] = useState(null)
  const [gender, setGender] = useState('boy')
  const [nameType, setNameType] = useState('first')
  const [sortMode, setSortMode] = useState('alpha') // 'alpha' | 'random'
  const [letter, setLetter] = useState('M')
  const [selectedFirst, setSelectedFirst] = useState(null) // for middle name mode
  const [showFirstPicker, setShowFirstPicker] = useState(false)
  const [randomOrder, setRandomOrder] = useState([])
  const [showMatches, setShowMatches] = useState(false)
  const [matchModal, setMatchModal] = useState(null)
  const [burst, setBurst] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [cardKey, setCardKey] = useState(0)
  const seenMatchesRef = useRef(new Set())

  const otherSlot = slot === 'p1' ? 'p2' : 'p1'

  useEffect(() => {
    return onValue(ref(db, `rooms/${roomCode}`), snap => {
      if (snap.exists()) setRoom(snap.val())
    })
  }, [roomCode])

  // When switching to random, shuffle the full name list
  useEffect(() => {
    if (sortMode === 'random') {
      const all = nameType === 'first'
        ? getAllFirstNames(gender)
        : Object.values(NAME_POOL[gender]?.middle || {}).flat()
      setRandomOrder(shuffleArray(all))
    }
  }, [sortMode, gender, nameType])

  // Detect new matches
  useEffect(() => {
    if (!room) return
    const s1 = room.swipes?.[slot] || {}
    const s2 = room.swipes?.[otherSlot] || {}
    for (const [k, v] of Object.entries(s1)) {
      if (v === 'like' && s2[k] === 'like' && !seenMatchesRef.current.has(k)) {
        seenMatchesRef.current.add(k)
        const parts = k.split(':')
        const name = parts[parts.length - 1]
        setTimeout(() => {
          setMatchModal(name)
          setBurst(true)
          setTimeout(() => setConfetti(true), 300)
          setTimeout(() => setConfetti(false), 2500)
        }, 200)
      }
    }
  }, [room])

  // Build swipe key
  const swipeKey = nameType === 'first'
    ? (sortMode === 'alpha' ? `${gender}:first:${letter}` : `${gender}:first:random`)
    : (sortMode === 'alpha' ? `${gender}:middle:${letter}` : `${gender}:middle:random`)

  const mySwipes = room?.swipes?.[slot] || {}

  // Get name list based on mode
  let allNames = []
  if (nameType === 'first') {
    allNames = sortMode === 'alpha' ? getNames(gender, 'first', letter) : randomOrder
  } else {
    allNames = sortMode === 'alpha' ? getNames(gender, 'middle', letter) : randomOrder
  }

  const seenNames = new Set(
    Object.keys(mySwipes).filter(k => k.startsWith(swipeKey + ':')).map(k => k.split(':').pop())
  )
  const remaining = allNames.filter(n => !seenNames.has(n))
  const currentName = remaining[0] || null

  // All matches
  const allMatches = []
  if (room) {
    const s1 = room.swipes?.[slot] || {}
    const s2 = room.swipes?.[otherSlot] || {}
    for (const [k, v] of Object.entries(s1)) {
      if (v === 'like' && s2[k] === 'like') allMatches.push(k.split(':').pop())
    }
  }

  const myLikes = Object.entries(mySwipes)
    .filter(([k, v]) => k.startsWith(swipeKey + ':') && v === 'like')
    .map(([k]) => k.split(':').pop())

  // Full name preview for middle name
  function fullName(middleName) {
    if (nameType === 'middle' && selectedFirst) return `${selectedFirst} ${middleName}`
    return middleName
  }

  async function swipe(dir) {
    if (!currentName) return
    const key = `${swipeKey}:${currentName}`
    await update(ref(db, `rooms/${roomCode}/swipes/${slot}`), { [key]: dir === 'right' ? 'like' : 'pass' })
    setCardKey(k => k + 1)
  }

  const partnerName = room?.slots?.[otherSlot]
  const seenCount = seenNames.size
  const progress = allNames.length ? seenCount / allNames.length : 0

  if (!room) return (
    <div style={{ minHeight:'100svh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#475569' }}>Connecting…</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100svh', background:'#0f172a', color:'#fff', fontFamily:"'Inter',system-ui,sans-serif", display:'flex', flexDirection:'column', maxWidth:430, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1e293b' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🍼</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>Nameswipe</div>
            <div style={{ fontSize:11, color:'#334155', letterSpacing:1 }}>{roomCode}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'#1e293b', borderRadius:50, padding:'5px 12px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:partnerName?'#34d399':'#334155' }} />
            <span style={{ color:partnerName?'#94a3b8':'#334155', fontSize:12 }}>{partnerName || 'Waiting…'}</span>
          </div>
          <button onClick={() => setShowMatches(true)} style={{ background:allMatches.length>0?'#1e1b4b':'#111827', border:`1px solid ${allMatches.length>0?'#4338ca':'#1e293b'}`, borderRadius:50, padding:'6px 13px', color:allMatches.length>0?'#a5b4fc':'#334155', fontSize:13, cursor:'pointer', fontWeight:700 }}>💜 {allMatches.length}</button>
        </div>
      </div>

      <div style={{ padding:'8px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'#334155', fontSize:12 }}>Swiping as <span style={{ color:'#818cf8', fontWeight:700 }}>{myName}</span></div>
        <button onClick={onLeave} style={{ background:'none', border:'none', color:'#334155', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Leave</button>
      </div>

      {/* Row 1: Gender + Type */}
      <div style={{ padding:'12px 20px 0', display:'flex', gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:4, textTransform:'uppercase', letterSpacing:1.5 }}>Gender</div>
          <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:3, gap:3 }}>
            {[['boy','👦'],['girl','👧']].map(([g, e]) => (
              <button key={g} onClick={() => setGender(g)} style={{ flex:1, padding:'7px 0', background:gender===g?'#334155':'transparent', border:'none', borderRadius:8, color:gender===g?'#e2e8f0':'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{e} {g.charAt(0).toUpperCase()+g.slice(1)}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:4, textTransform:'uppercase', letterSpacing:1.5 }}>Type</div>
          <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:3, gap:3 }}>
            {['first','middle'].map(t => (
              <button key={t} onClick={() => setNameType(t)} style={{ flex:1, padding:'7px 0', background:nameType===t?'#334155':'transparent', border:'none', borderRadius:8, color:nameType===t?'#e2e8f0':'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Sort + Letter or First Name picker */}
      <div style={{ padding:'8px 20px 0', display:'flex', gap:8, alignItems:'flex-end' }}>
        {/* Sort toggle */}
        <div style={{ flex:1 }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:4, textTransform:'uppercase', letterSpacing:1.5 }}>Order</div>
          <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:3, gap:3 }}>
            {[['alpha','A–Z'],['random','🔀']].map(([m, label]) => (
              <button key={m} onClick={() => setSortMode(m)} style={{ flex:1, padding:'7px 0', background:sortMode===m?'#334155':'transparent', border:'none', borderRadius:8, color:sortMode===m?'#e2e8f0':'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Letter picker (only in alpha mode) */}
        {sortMode === 'alpha' && (
          <div>
            <div style={{ color:'#334155', fontSize:10, marginBottom:4, textTransform:'uppercase', letterSpacing:1.5 }}>Letter</div>
            <select value={letter} onChange={e => setLetter(e.target.value)} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'9px 8px', color:'#e2e8f0', fontSize:14, fontWeight:700, cursor:'pointer', outline:'none', fontFamily:'inherit' }}>
              {ALPHABET.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        {/* First name picker button (middle name mode only) */}
        {nameType === 'middle' && (
          <button onClick={() => setShowFirstPicker(true)} style={{ flex:1, padding:'9px 10px', background:'#1e293b', border:'1px solid #334155', borderRadius:10, color: selectedFirst ? '#a5b4fc' : '#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
            {selectedFirst ? `✦ ${selectedFirst}` : '+ First name'}
          </button>
        )}
      </div>

      {/* Progress */}
      <div style={{ padding:'10px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:11, color:'#334155' }}>
          <span>{seenCount} rated</span><span>{remaining.length} left</span>
        </div>
        <div style={{ background:'#1e293b', borderRadius:4, height:3 }}>
          <div style={{ background:'linear-gradient(90deg,#818cf8,#a78bfa)', height:3, borderRadius:4, width:`${progress*100}%`, transition:'width 0.4s' }} />
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', overflow:'hidden' }}>
        {currentName ? (
          <>
            <div style={{ width:'100%', position:'relative' }}>
              {remaining[2] && <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%) scale(0.92)', width:'100%', opacity:0.22, pointerEvents:'none' }}><div style={{ background:'#1e1b4b', borderRadius:28, minHeight:240 }} /></div>}
              {remaining[1] && <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%) scale(0.963)', width:'100%', opacity:0.48, pointerEvents:'none' }}><div style={{ background:'#1e1b4b', borderRadius:28, minHeight:240 }} /></div>}
              <div style={{ position:'relative', zIndex:10 }}>
                <SwipeCard
                  key={cardKey}
                  name={nameType === 'middle' && selectedFirst ? `${selectedFirst} ${currentName}` : currentName}
                  lastName={room.lastName}
                  onSwipe={swipe}
                />
              </div>
            </div>
            <div style={{ display:'flex', gap:28, marginTop:28 }}>
              <button onClick={() => swipe('left')} style={{ width:68, height:68, borderRadius:'50%', background:'#1a0f1f', border:'2px solid #fb7185', fontSize:22, cursor:'pointer', color:'#fb7185', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              <button onClick={() => swipe('right')} style={{ width:68, height:68, borderRadius:'50%', background:'#0f1e1b', border:'2px solid #34d399', fontSize:22, cursor:'pointer', color:'#34d399', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>♥</button>
            </div>
            <div style={{ marginTop:10, color:'#1e293b', fontSize:12 }}>swipe or tap</div>
          </>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>{allNames.length === 0 ? '🔤' : '✨'}</div>
            <div style={{ color:'#94a3b8', fontSize:18, fontWeight:700 }}>{allNames.length === 0 ? `No names for "${letter}"` : `All done!`}</div>
            <div style={{ color:'#475569', fontSize:14, marginTop:6 }}>Switch letters, try random, or check matches</div>
          </div>
        )}
      </div>

      {/* My likes */}
      {myLikes.length > 0 && (
        <div style={{ padding:'0 20px 20px' }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:7, textTransform:'uppercase', letterSpacing:1.5 }}>Your likes</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {myLikes.map((n, i) => {
              const isMatch = allMatches.includes(n)
              return (
                <span key={n+i} style={{ background:isMatch?'#1e1b4b':'#111827', border:`1px solid ${isMatch?'#4338ca':'#1e293b'}`, borderRadius:50, padding:'5px 13px', color:isMatch?'#a5b4fc':'#475569', fontSize:13 }}>{n}{isMatch?' 💜':''}</span>
              )
            })}
          </div>
        </div>
      )}

      <HeartBurst active={burst} onDone={() => setBurst(false)} />
      <Confetti active={confetti} />
      {matchModal && <MatchModal name={matchModal} lastName={room.lastName} onClose={() => setMatchModal(null)} />}
      {showMatches && <MatchesPanel matches={allMatches} lastName={room.lastName} onClose={() => setShowMatches(false)} />}
      {showFirstPicker && (
        <FirstNamePicker
          gender={gender}
          onSelect={n => { setSelectedFirst(n); setShowFirstPicker(false) }}
          onClose={() => setShowFirstPicker(false)}
        />
      )}
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    const roomCode = localStorage.getItem('ns_room')
    const slot = localStorage.getItem('ns_slot')
    const myName = localStorage.getItem('ns_name')
    if (roomCode && slot && myName) return { roomCode, slot, myName }
    return null
  })

  function leave() {
    localStorage.removeItem('ns_room')
    localStorage.removeItem('ns_slot')
    localStorage.removeItem('ns_name')
    setSession(null)
  }

  if (!session) return <RoomLobby onJoin={setSession} />
  return <SwipeApp {...session} onLeave={leave} />
}
