import React, { useState, useRef, useEffect } from 'react'

// ── FAQ knowledge base ───────────────────────────────────────────────────────
const FAQ = [
  {
    keys: ['india', 'jio', 'sony'],
    a: 'In India, FIFA World Cup 2026 is expected on JioCinema (streaming) and Sony Sports Network (TV). Final broadcast deals are typically confirmed closer to the tournament - check JioCinema and Sony LIV apps for updates.',
  },
  {
    keys: ['uk', 'england', 'britain', 'bbc', 'itv', 'scotland', 'wales'],
    a: 'In the UK, World Cup rights are shared between BBC and ITV - both free-to-air. You can also stream on BBC iPlayer and ITVX. Full fixture allocation will be announced closer to the tournament.',
  },
  {
    keys: ['usa', 'united states', 'america', 'fox', 'telemundo'],
    a: 'In the USA, FIFA World Cup 2026 broadcasts on Fox Sports and Telemundo (Spanish). You can also stream on the Fox Sports app and Peacock. As a host nation, expect maximum coverage!',
  },
  {
    keys: ['canada', 'tsn', 'ctv', 'tva'],
    a: 'In Canada, World Cup 2026 rights are held by TSN/CTV (English) and TVA Sports (French). Canada is a host nation, so expect extensive coverage across all platforms.',
  },
  {
    keys: ['australia', 'sbs', 'optus'],
    a: "In Australia, SBS has historically broadcast the World Cup free-to-air. Optus Sport may also have streaming rights. Check SBS On Demand for free streaming options.",
  },
  {
    keys: ['brazil', 'globo', 'sportv'],
    a: 'In Brazil, TV Globo and SporTV typically hold World Cup rights with full Portuguese commentary. Streaming via Globoplay.',
  },
  {
    keys: ['germany', 'ard', 'zdf'],
    a: 'In Germany, ARD and ZDF share World Cup broadcasting rights (free-to-air). You can stream via ARD Mediathek and ZDF Mediathek.',
  },
  {
    keys: ['france', 'tf1', 'm6'],
    a: 'In France, TF1 and M6 typically share World Cup broadcast rights (free-to-air). Streaming via TF1+ and 6play.',
  },
  {
    keys: ['spain', 'rtve', 'gol'],
    a: 'In Spain, RTVE has traditionally broadcast the World Cup free-to-air. Streaming via RTVE Play.',
  },
  {
    keys: ['when', 'start', 'begin', 'kick', 'opening'],
    a: 'The FIFA World Cup 2026 kicks off on 11 June 2026 with the opening match, running until the Final on 19 July 2026 - 39 days of football across 3 host nations.',
  },
  {
    keys: ['final', 'end', 'finish', 'last match'],
    a: 'The FIFA World Cup 2026 Final is on 19 July 2026 at MetLife Stadium, East Rutherford, New Jersey (New York/New Jersey area). Capacity: 82,500.',
  },
  {
    keys: ['host', 'country', 'countries', 'where is it', 'held', 'venue'],
    a: 'FIFA World Cup 2026 is hosted by three countries: USA, Canada, and Mexico - making it the first World Cup with three co-hosts. 16 stadiums across all three nations.',
  },
  {
    keys: ['teams', 'how many', '48', 'qualify'],
    a: 'For the first time ever, FIFA World Cup 2026 features 48 teams (up from 32). They are split into 12 groups of 4. The top 2 from each group plus the 8 best third-placed teams advance to the Round of 32.',
  },
  {
    keys: ['format', 'group stage', 'knockout', 'round'],
    a: 'Format: 12 groups of 4 teams (Group Stage) → Round of 32 (32 teams) → Round of 16 → Quarter-Finals → Semi-Finals → Final. 104 matches total. Third-place playoff also played.',
  },
  {
    keys: ['ticket', 'buy', 'purchase', 'seat'],
    a: 'Tickets are sold exclusively through FIFA\'s official platform. Visit FIFA.com/tickets for availability. Demand is extremely high - sign up for alerts on the official site.',
  },
  {
    keys: ['schedule', 'fixture', 'match', 'game', 'when does'],
    a: 'Full fixture schedule is available on this app! Head to the Fixtures tab for all 104 matches with times in your local timezone. Use the Group and Round filters to find specific matches.',
  },
  {
    keys: ['winner', 'champion', 'won last', 'previous'],
    a: 'Argentina are the reigning FIFA World Cup champions, having won the 2022 World Cup in Qatar. They beat France on penalties in a memorable final.',
  },
  {
    keys: ['messi', 'ronaldo', 'mbappé', 'mbappe', 'player'],
    a: 'FIFA World Cup 2026 will likely feature stars like Kylian Mbappé (France), Vinicius Jr (Brazil), Erling Haaland (Norway), and Pedri (Spain). Lionel Messi may play his final World Cup at age 38.',
  },
  {
    keys: ['groups', 'group a', 'group b', 'standings'],
    a: 'All 12 groups and live standings are available in the Groups tab of this app. You can also see qualification status and head-to-head records for each team.',
  },
  {
    keys: ['stadiums', 'stadium', 'arenas', 'arena', 'capacity'],
    a: '16 stadiums: MetLife (NY), Lumen Field (Seattle), SoFi (LA), AT&T (Dallas), NRG (Houston), Mercedes-Benz (Atlanta), Hard Rock (Miami), Lincoln Financial (Philly), Gillette (Boston), Arrowhead (KC), BC Place (Vancouver), BMO Field (Toronto), Estadio Azteca (Mexico City), Akron (Guadalajara), BBVA (Monterrey), Levis (San Jose). See the Venues tab for details!',
  },
]

function matchFAQ(q) {
  const lower = q.toLowerCase()
  let best = null, bestScore = 0
  for (const item of FAQ) {
    const score = item.keys.filter(k => lower.includes(k)).length
    if (score > bestScore) { bestScore = score; best = item }
  }
  return bestScore >= 1 ? best.a : null
}

async function ddgSearch(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent('FIFA World Cup 2026 ' + query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url)
    const data = await res.json()
    if (data.AbstractText && data.AbstractText.length > 30) {
      return { text: data.AbstractText, source: data.AbstractURL || data.AbstractSource }
    }
    if (data.Answer) return { text: data.Answer }
  } catch {}
  return null
}

function googleLink(q) {
  return `https://www.google.com/search?q=${encodeURIComponent('FIFA World Cup 2026 ' + q)}`
}

const WELCOME = "Hi! I'm Pibe 🎭 Ask me anything about FIFA World Cup 2026 - schedules, where to watch, teams, venues, format, and more."

export default function ChatBot() {
  const [open, setOpen]     = useState(false)
  const [msgs, setMsgs]     = useState([{ role: 'bot', text: WELCOME }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const endRef  = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open, msgs])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    await new Promise(r => setTimeout(r, 300))

    const faq = matchFAQ(q)
    if (faq) {
      setMsgs(m => [...m, { role: 'bot', text: faq, link: googleLink(q) }])
      setLoading(false)
      return
    }

    const ddg = await ddgSearch(q)
    if (ddg) {
      setMsgs(m => [...m, { role: 'bot', text: ddg.text, source: ddg.source, link: googleLink(q) }])
    } else {
      setMsgs(m => [...m, {
        role: 'bot',
        text: "I don't have a direct answer for that, but I found some results on the web:",
        link: googleLink(q),
      }])
    }
    setLoading(false)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="WC 2026 chatbot">
          <div className="chatbot-header">
            <span className="chatbot-title">🏆 WC 2026 Assistant</span>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>
          <div className="chatbot-messages">
            {msgs.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                <div className="chatbot-bubble">{msg.text}</div>
                {msg.link && (
                  <a className="chatbot-link" href={msg.link} target="_blank" rel="noopener noreferrer">
                    Search on Google →
                  </a>
                )}
                {msg.source && (
                  <a className="chatbot-link chatbot-link--source" href={msg.source} target="_blank" rel="noopener noreferrer">
                    Source ↗
                  </a>
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg--bot">
                <div className="chatbot-bubble chatbot-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              className="chatbot-input"
              placeholder="Ask about WC 2026…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
            />
            <button className="chatbot-send" onClick={send} disabled={loading || !input.trim()} aria-label="Send">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        className={`chatbot-fab${open ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close WC assistant' : 'Open WC assistant'}
        title="Ask WC 2026 questions"
      >
        {open ? '✕' : '💬'}
      </button>
    </>
  )
}
