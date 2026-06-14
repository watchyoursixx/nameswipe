import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from './firebase'
import { ref, set, get, onValue, update, serverTimestamp } from 'firebase/database'
import { NAME_POOL, ALPHABET } from './names'

// ── Utilities ──────────────────────────────────────────────────────────────
function generateCode() {
  const words = ['MAPLE','CEDAR','BIRCH','ASPEN','STONE','RIVER','CLOUD','EMBER','PEARL','BLOOM',
    'HAVEN','GROVE','CREST','BRIAR','FERN','LARK','DOVE','SAGE','REED','WREN']
  return words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 90 + 10)
}

function getNames(type, letter) {
  return NAME_POOL[type]?.[letter] || []
}

function getMatches(swipes, slot1, slot2) {
  const s1 = swipes?.[slot1] || {}
  const s2 = swipes?.[slot2] || {}
  const matches = []
  for (const [key, val] of Object.entries(s1)) {
    if (val === 'like' && s2[key] === 'like') matches.push(key)
  }
  return matches
}

// ── Confetti ───────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 55 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 0.9,
    dur: 1.3 + Math.random() * 1.2,
    color: ['#f472b6','#818cf8','#34d399','#fbbf24','#fb7185','#60a5fa'][i % 6],
    size: 7 + Math.random() * 7, circle: Math.random() > 0.5, rot: Math.random() * 360,
  }))
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
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
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.78)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
    }}>
      <div style={{
        background:'linear-gradient(145deg,#1e1b4b,#312e81)',
        border:'2px solid #818cf8', borderRadius:28,
        padding:'44px 36px', textAlign:'center',
        maxWidth:340, width:'90%',
        animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:'0 0 80px rgba(129,140,248,0.35)',
      }}>
        <div style={{ fontSize:52, marginBottom:4 }}>💜</div>
        <div style={{ color:'#c7d2fe', fontSize:11, letterSpacing:4, marginBottom:10, textTransform:'uppercase' }}>It's a Match!</div>
        <div style={{ color:'#fff', fontSize:40, fontWeight:800, letterSpacing:-1 }}>{name}</div>
        {lastName && <div style={{ color:'#a5b4fc', fontSize:22, marginTop:4 }}>{name} {lastName}</div>}
        <div style={{ color:'#818cf8', marginTop:14, fontSize:14 }}>You both love this name 🎉</div>
        <button onClick={onClose} style={{
          marginTop:28, padding:'12px 36px',
          background:'#818cf8', color:'#fff', border:'none',
          borderRadius:50, fontSize:15, cursor:'pointer', fontWeight:700, fontFamily:'inherit',
        }}>Keep swiping</button>
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
    </div>
  )
}

// ── Swipe Card ─────────────────────────────────────────────────────────────
function SwipeCard({ name, lastName, onSwipe }) {
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(null)

  function px(e) { return e.touches ? e.touches[0].clientX : e.clientX }
  function onDown(e) { startX.current = px(e); setDragging(true) }
  function onMove(e) {
    if (!dragging || startX.current === null) return
    setDrag(px(e) - startX.current)
  }
  function onUp() {
    if (drag > 80) onSwipe('right')
    else if (drag < -80) onSwipe('left')
    setDrag(0); setDragging(false); startX.current = null
  }

  const likeOp = Math.max(0, Math.min(1, drag / 80))
  const nopeOp = Math.max(0, Math.min(1, -drag / 80))

  return (
    <div
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      style={{
        userSelect:'none', cursor:dragging?'grabbing':'grab',
        transform:`translateX(${drag}px) rotate(${drag * 0.1}deg)`,
        transition:dragging?'none':'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position:'relative', width:'100%',
      }}
    >
      <div style={{
        background:'linear-gradient(160deg,#1e1b4b 0%,#0f172a 100%)',
        border:'1.5px solid #2d3a54', borderRadius:28,
        padding:'56px 36px', textAlign:'center',
        boxShadow:'0 24px 64px rgba(0,0,0,0.6)',
        minHeight:240, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
      }}>
        <div style={{
          position:'absolute', top:28, left:28,
          border:'3px solid #34d399', color:'#34d399',
          borderRadius:8, padding:'3px 14px',
          fontSize:20, fontWeight:800, letterSpacing:2,
          opacity:likeOp, transform:'rotate(-12deg)',
        }}>LIKE</div>
        <div style={{
          position:'absolute', top:28, right:28,
          border:'3px solid #fb7185', color:'#fb7185',
          borderRadius:8, padding:'3px 14px',
          fontSize:20, fontWeight:800, letterSpacing:2,
          opacity:nopeOp, transform:'rotate(12deg)',
        }}>NOPE</div>
        <div style={{ color:'#fff', fontSize:48, fontWeight:800, lineHeight:1, letterSpacing:-1 }}>{name}</div>
        {lastName && <div style={{ color:'#64748b', fontSize:24, marginTop:10, fontWeight:600 }}>{name} {lastName}</div>}
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
          <div style={{ color:'#334155', textAlign:'center', marginTop:80, fontSize:15, lineHeight:1.7 }}>
            No matches yet.<br />Keep swiping — they're coming!
          </div>
        ) : (
          matches.map((name, i) => (
            <div key={name} style={{
              background:'linear-gradient(135deg,#1e1b4b,#312e81)',
              border:'1px solid #4338ca', borderRadius:18,
              padding:'18px 22px', marginBottom:10,
              animation:`slideIn 0.3s ease ${i * 0.04}s both`,
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
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true); setError('')
    const roomCode = generateCode()
    const roomRef = ref(db, `rooms/${roomCode}`)
    await set(roomRef, {
      created: serverTimestamp(),
      lastName: lastName.trim(),
      slots: { p1: name.trim(), p2: null },
      swipes: {},
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
    const roomRef = ref(db, `rooms/${upper}`)
    const snap = await get(roomRef)
    if (!snap.exists()) { setError("Room not found — check the code"); setLoading(false); return }
    const room = snap.val()
    if (room.slots.p2) { setError("Room is full"); setLoading(false); return }
    await update(ref(db, `rooms/${upper}/slots`), { p2: name.trim() })
    localStorage.setItem('ns_room', upper)
    localStorage.setItem('ns_slot', 'p2')
    localStorage.setItem('ns_name', name.trim())
    onJoin({ roomCode: upper, slot: 'p2', myName: name.trim() })
  }

  const input = {
    width:'100%', background:'#1e293b', border:'1px solid #334155',
    borderRadius:12, padding:'13px 16px', color:'#fff', fontSize:16,
    outline:'none', fontFamily:'inherit', marginBottom:12,
  }

  return (
    <div style={{
      minHeight:'100svh', background:'#0f172a', display:'flex',
      flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:24, fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      <div style={{ fontSize:52, marginBottom:8 }}>🍼</div>
      <div style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:-0.5, marginBottom:4 }}>Nameswipe</div>
      <div style={{ color:'#475569', fontSize:14, marginBottom:40 }}>Find the perfect name, together</div>

      {!mode ? (
        <div style={{ width:'100%', maxWidth:340, display:'flex', flexDirection:'column', gap:12 }}>
          <button onClick={() => setMode('create')} style={{
            padding:'16px', background:'#818cf8', color:'#fff', border:'none',
            borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Create a room</button>
          <button onClick={() => setMode('join')} style={{
            padding:'16px', background:'#1e293b', color:'#a5b4fc',
            border:'1px solid #334155', borderRadius:14, fontSize:16,
            fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Join with a code</button>
        </div>
      ) : (
        <div style={{ width:'100%', maxWidth:340 }}>
          <button onClick={() => { setMode(null); setError('') }} style={{
            background:'none', border:'none', color:'#475569', fontSize:14,
            cursor:'pointer', marginBottom:20, fontFamily:'inherit',
          }}>← Back</button>

          <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Your name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bryant" style={input} />

          {mode === 'create' && (
            <>
              <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Baby's last name (optional)</div>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Smith" style={input} />
            </>
          )}

          {mode === 'join' && (
            <>
              <div style={{ color:'#475569', fontSize:11, marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 }}>Room code</div>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MAPLE42" style={{ ...input, textTransform:'uppercase', letterSpacing:2, fontWeight:700 }} />
            </>
          )}

          {error && <div style={{ color:'#fb7185', fontSize:13, marginBottom:12 }}>{error}</div>}

          <button
            onClick={mode === 'create' ? createRoom : joinRoom}
            disabled={loading}
            style={{
              width:'100%', padding:'14px', background:loading?'#334155':'#818cf8',
              color:'#fff', border:'none', borderRadius:14, fontSize:16,
              fontWeight:700, cursor:loading?'default':'pointer', fontFamily:'inherit',
            }}
          >{loading ? 'Loading…' : mode === 'create' ? 'Create room' : 'Join room'}</button>
        </div>
      )}
    </div>
  )
}

// ── Main Swipe App ─────────────────────────────────────────────────────────
function SwipeApp({ roomCode, slot, myName, onLeave }) {
  const [room, setRoom] = useState(null)
  const [nameType, setNameType] = useState('first')
  const [letter, setLetter] = useState('M')
  const [showMatches, setShowMatches] = useState(false)
  const [matchModal, setMatchModal] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [cardKey, setCardKey] = useState(0)
  const seenMatchesRef = useRef(new Set())

  const otherSlot = slot === 'p1' ? 'p2' : 'p1'

  // Live sync
  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`)
    return onValue(roomRef, snap => {
      if (snap.exists()) setRoom(snap.val())
    })
  }, [roomCode])

  // Detect new matches
  useEffect(() => {
    if (!room) return
    const matches = getMatches(room.swipes, slot, otherSlot)
    for (const name of matches) {
      if (!seenMatchesRef.current.has(name)) {
        seenMatchesRef.current.add(name)
        // Only show modal if other person already liked it (i.e. I just caused the match)
        const mySwipes = room.swipes?.[slot] || {}
        if (mySwipes[`${nameType}:${letter}:${name}`] === 'like' ||
            Object.entries(mySwipes).some(([k,v]) => k.endsWith(`:${name}`) && v === 'like')) {
          setMatchModal(name)
          setConfetti(true)
          setTimeout(() => setConfetti(false), 3000)
        }
      }
    }
  }, [room])

  const swipeKey = `${nameType}:${letter}`
  const mySwipes = room?.swipes?.[slot] || {}
  const seenNames = new Set(Object.keys(mySwipes).filter(k => k.startsWith(swipeKey + ':')).map(k => k.split(':')[2]))
  const allNames = getNames(nameType, letter)
  const remaining = allNames.filter(n => !seenNames.has(n))
  const currentName = remaining[0] || null

  const allMatches = []
  if (room) {
    for (const type of ['first','middle']) {
      for (const l of ALPHABET) {
        const ms = getMatches(room.swipes, slot, otherSlot)
          .filter(n => {
            const k1 = `${type}:${l}:${n}`
            return room.swipes?.[slot]?.[k1] === 'like' && room.swipes?.[otherSlot]?.[k1] === 'like'
          })
        allMatches.push(...ms)
      }
    }
    // Simpler: just collect all keys where both liked
    allMatches.length = 0
    const s1 = room.swipes?.[slot] || {}
    const s2 = room.swipes?.[otherSlot] || {}
    for (const [k, v] of Object.entries(s1)) {
      if (v === 'like' && s2[k] === 'like') {
        allMatches.push(k.split(':')[2])
      }
    }
  }

  async function swipe(dir) {
    if (!currentName) return
    const key = `${swipeKey}:${currentName}`
    await update(ref(db, `rooms/${roomCode}/swipes/${slot}`), { [key]: dir === 'right' ? 'like' : 'pass' })
    setCardKey(k => k + 1)
  }

  const partnerName = room?.slots?.[otherSlot]
  const partnerOnline = !!partnerName
  const myLikes = Object.entries(mySwipes)
    .filter(([k,v]) => k.startsWith(swipeKey+':') && v === 'like')
    .map(([k]) => k.split(':')[2])

  const seenCount = seenNames.size
  const progress = allNames.length ? seenCount / allNames.length : 0

  if (!room) {
    return (
      <div style={{ minHeight:'100svh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'#475569', fontSize:16 }}>Connecting…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100svh', background:'#0f172a', color:'#fff',
      fontFamily:"'Inter',system-ui,sans-serif",
      display:'flex', flexDirection:'column', maxWidth:430, margin:'0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding:'16px 20px 12px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid #1e293b',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>🍼</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16, letterSpacing:-0.5 }}>Nameswipe</div>
            <div style={{ fontSize:11, color:'#334155', letterSpacing:1 }}>{roomCode}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            background:'#1e293b', borderRadius:50, padding:'5px 12px',
          }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: partnerOnline ? '#34d399' : '#334155',
            }} />
            <span style={{ color: partnerOnline ? '#94a3b8' : '#334155', fontSize:12 }}>
              {partnerOnline ? partnerName : 'Waiting for partner…'}
            </span>
          </div>
          <button onClick={() => setShowMatches(true)} style={{
            background: allMatches.length > 0 ? '#1e1b4b' : '#111827',
            border:`1px solid ${allMatches.length > 0 ? '#4338ca' : '#1e293b'}`,
            borderRadius:50, padding:'6px 13px',
            color: allMatches.length > 0 ? '#a5b4fc' : '#334155',
            fontSize:13, cursor:'pointer', fontWeight:700,
          }}>💜 {allMatches.length}</button>
        </div>
      </div>

      {/* Who am I */}
      <div style={{ padding:'10px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ color:'#334155', fontSize:12 }}>
          Swiping as <span style={{ color:'#818cf8', fontWeight:700 }}>{myName}</span>
        </div>
        <button onClick={onLeave} style={{
          background:'none', border:'none', color:'#334155', fontSize:12, cursor:'pointer', fontFamily:'inherit',
        }}>Leave room</button>
      </div>

      {/* Controls */}
      <div style={{ padding:'12px 20px 0', display:'flex', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:5, textTransform:'uppercase', letterSpacing:1.5 }}>Name type</div>
          <div style={{ display:'flex', background:'#1e293b', borderRadius:10, padding:3, gap:3 }}>
            {['first','middle'].map(t => (
              <button key={t} onClick={() => setNameType(t)} style={{
                flex:1, padding:'7px 0',
                background:nameType===t?'#334155':'transparent',
                border:'none', borderRadius:8,
                color:nameType===t?'#e2e8f0':'#475569',
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:5, textTransform:'uppercase', letterSpacing:1.5 }}>Letter</div>
          <select value={letter} onChange={e => setLetter(e.target.value)} style={{
            width:'100%', background:'#1e293b', border:'1px solid #334155',
            borderRadius:10, padding:'9px 10px', color:'#e2e8f0',
            fontSize:15, fontWeight:700, cursor:'pointer', outline:'none', fontFamily:'inherit',
          }}>
            {ALPHABET.map(l => <option key={l} value={l}>{l} ({(NAME_POOL[nameType][l]||[]).length})</option>)}
          </select>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding:'12px 20px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11, color:'#334155' }}>
          <span>{seenCount} rated</span>
          <span>{remaining.length} left</span>
        </div>
        <div style={{ background:'#1e293b', borderRadius:4, height:3 }}>
          <div style={{
            background:'linear-gradient(90deg,#818cf8,#a78bfa)',
            height:3, borderRadius:4, width:`${progress*100}%`, transition:'width 0.4s',
          }} />
        </div>
      </div>

      {/* Card area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 20px' }}>
        {currentName ? (
          <>
            <div style={{ width:'100%', position:'relative' }}>
              {remaining[2] && (
                <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%) scale(0.92)', width:'100%', opacity:0.22, pointerEvents:'none' }}>
                  <div style={{ background:'#1e1b4b', borderRadius:28, minHeight:240 }} />
                </div>
              )}
              {remaining[1] && (
                <div style={{ position:'absolute', top:4, left:'50%', transform:'translateX(-50%) scale(0.963)', width:'100%', opacity:0.48, pointerEvents:'none' }}>
                  <div style={{ background:'#1e1b4b', borderRadius:28, minHeight:240 }} />
                </div>
              )}
              <div style={{ position:'relative', zIndex:10 }}>
                <SwipeCard key={cardKey} name={currentName} lastName={room.lastName} onSwipe={swipe} />
              </div>
            </div>
            <div style={{ display:'flex', gap:28, marginTop:28 }}>
              <button onClick={() => swipe('left')} style={{
                width:68, height:68, borderRadius:'50%',
                background:'#1a0f1f', border:'2px solid #fb7185',
                fontSize:22, cursor:'pointer', color:'#fb7185', fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>✕</button>
              <button onClick={() => swipe('right')} style={{
                width:68, height:68, borderRadius:'50%',
                background:'#0f1e1b', border:'2px solid #34d399',
                fontSize:22, cursor:'pointer', color:'#34d399', fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>♥</button>
            </div>
            <div style={{ marginTop:10, color:'#1e293b', fontSize:12 }}>swipe or tap</div>
          </>
        ) : allNames.length === 0 ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🔤</div>
            <div style={{ color:'#64748b', fontSize:16 }}>No {nameType} names for "{letter}"</div>
          </div>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>✨</div>
            <div style={{ color:'#94a3b8', fontSize:18, fontWeight:700 }}>All done for "{letter}"!</div>
            <div style={{ color:'#475569', fontSize:14, marginTop:6 }}>Pick a new letter or check matches</div>
          </div>
        )}
      </div>

      {/* My likes */}
      {myLikes.length > 0 && (
        <div style={{ padding:'0 20px 20px' }}>
          <div style={{ color:'#334155', fontSize:10, marginBottom:7, textTransform:'uppercase', letterSpacing:1.5 }}>Your likes ({letter})</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {myLikes.map(n => {
              const isMatch = allMatches.includes(n)
              return (
                <span key={n} style={{
                  background:isMatch?'#1e1b4b':'#111827',
                  border:`1px solid ${isMatch?'#4338ca':'#1e293b'}`,
                  borderRadius:50, padding:'5px 13px',
                  color:isMatch?'#a5b4fc':'#475569', fontSize:13,
                }}>{n}{isMatch?' 💜':''}</span>
              )
            })}
          </div>
        </div>
      )}

      <Confetti active={confetti} />
      {matchModal && <MatchModal name={matchModal} lastName={room.lastName} onClose={() => setMatchModal(null)} />}
      {showMatches && <MatchesPanel matches={allMatches} lastName={room.lastName} onClose={() => setShowMatches(false)} />}
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
