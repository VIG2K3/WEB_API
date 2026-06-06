import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const GROQ_API_KEY = "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";
const GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions";

const BOT_SYSTEM = `You are PenangBot, a friendly and knowledgeable Penang travel assistant embedded inside a travel planning app.

Your job:
- Recommend specific Penang attractions, food spots, hotels and hidden gems
- Help users plan itineraries and day trips around Penang
- Answer questions about Penang travel, food, culture, transport and routes
- When a user selects a category or quick-action card, give enthusiastic specific suggestions for that topic
- Keep responses concise (max 200 words), friendly, with emojis
- Format multi-item responses as short numbered lists
- Always end with a helpful follow-up tip or question

Key Penang knowledge:
- Areas: George Town (UNESCO), Batu Ferringhi, Teluk Bahang, Air Itam, Gurney Drive, Tanjung Bungah
- Attractions: Penang Hill, Kek Lok Si, Fort Cornwallis, War Museum, Khoo Kongsi, Blue Mansion, Clan Jetties, ESCAPE Theme Park
- Food: Char Kway Teow, Assam Laksa, Nasi Kandar, Cendol, Hokkien Mee, Rojak, Apom, Curry Mee
- Food spots: Gurney Drive Hawker, New Lane Hawker, Lorong Selamat, Line Clear Nasi Kandar
- Hotels: E&O Hotel, Hard Rock Penang, Shangri-La Rasa Sayang, Lone Pine Hotel
- Best time to visit: November to February

Only answer Penang-related questions.`;

// Quick-action cards shown before conversation starts
const QUICK_CARDS = [
  { icon: "🍜", title: "Best Street Food",    subtitle: "Top hawker stalls & local favourites",    prompt: "What are the best street food spots in Penang?" },
  { icon: "🗓️", title: "Plan My Itinerary",  subtitle: "Day-by-day trip planning made easy",        prompt: "Help me plan a 3-day Penang itinerary" },
  { icon: "🎨", title: "Hidden Gems",         subtitle: "Off-the-beaten-path spots in George Town", prompt: "What are hidden gems and underrated spots in Penang?" },
  { icon: "🏖️", title: "Beach Guide",         subtitle: "Best beaches & water activities",           prompt: "What are the best beaches in Penang and what can I do there?" },
  { icon: "🏛️", title: "Culture & Heritage",  subtitle: "Temples, heritage trails & museums",        prompt: "Tell me about Penang's cultural attractions and heritage sites" },
  { icon: "💰", title: "Budget Travel",        subtitle: "Travel Penang without breaking the bank",  prompt: "Give me budget travel tips for Penang" },
];

// Category filter tabs
const CATEGORIES = ["All", "Food 🍜", "Culture 🏛️", "Nature 🌿", "Beaches 🏖️", "Nightlife 🌙", "Shopping 🛍️"];

// Suggestions shown in the chat footer
const SUGGESTIONS = [
  "Best time to visit? 📅",
  "How to get around? 🚌",
  "Family-friendly spots? 👨‍👩‍👧",
  "Top hotels? 🏨",
  "Day trip ideas? 🗺️",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartRecommendations() {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [isTyping,  setIsTyping]  = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [chatMode,  setChatMode]  = useState(false); // false = show landing, true = show chat
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    if (!chatMode) setChatMode(true);

    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    setIsTyping(true);

    try {
      const groqMessages = [{ role: "system", content: BOT_SYSTEM }];
      newMessages.slice(-8).forEach((m) => groqMessages.push({ role: m.role, content: m.content }));

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: groqMessages, temperature: 0.7, max_tokens: 350 }),
      });

      const data  = await res.json();
      const reply = data?.choices?.[0]?.message?.content;
      setIsTyping(false);
      if (!reply) throw new Error("No reply");
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setIsTyping(false);
      setMessages([...newMessages, { role: "assistant", content: "❌ Something went wrong. Please try again!" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCategoryTab = (cat: string) => {
    setActiveTab(cat);
    if (cat !== "All") {
      const topic = cat.replace(/\s*[^\w\s].*/g, "").trim();
      sendMessage(`Recommend the best ${topic} spots and experiences in Penang`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const resetChat = () => { setMessages([]); setInput(""); setChatMode(false); setActiveTab("All"); };

  // ── Render markdown bold + newlines ─────────────────────────────────────────
  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span>
    );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={st.root}>
      <style>{CSS}</style>

      <div style={st.card}>

        {/* ── Top bar ── */}
        <div style={st.topBar}>
          <div style={st.botInfo}>
            <div style={st.botAvatar}>✦</div>
            <div>
              <div style={st.botName}>PenangBot</div>
              <div style={st.botSub}>
                <span style={st.onlineDot} />
                Penang travel expert
              </div>
            </div>
          </div>
          {chatMode && (
            <button className="pb-reset" onClick={resetChat}>↺ New chat</button>
          )}
        </div>

        {/* ── Landing view (no messages yet) ── */}
        {!chatMode && (
          <div style={st.landing}>
            <div style={st.landingIcon}>✦</div>
            <h2 style={st.landingTitle}>How can I help you today?</h2>
            <p style={st.landingSubtitle}>
              Ask me anything about Penang — food, places, itineraries, tips and more
            </p>

            {/* Quick-action cards */}
            <div style={st.cardsGrid}>
              {QUICK_CARDS.map((c) => (
                <button
                  key={c.title}
                  className="pb-card"
                  style={st.quickCard}
                  onClick={() => sendMessage(c.prompt)}
                >
                  <span style={st.quickCardIcon}>{c.icon}</span>
                  <span style={st.quickCardTitle}>{c.title}</span>
                  <span style={st.quickCardSub}>{c.subtitle}</span>
                </button>
              ))}
            </div>

            {/* Category tabs */}
            <div style={st.tabs}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`pb-tab ${activeTab === cat ? "pb-tab-active" : ""}`}
                  onClick={() => handleCategoryTab(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat messages ── */}
        {chatMode && (
          <div style={st.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...st.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && <div style={st.msgAvatar}>✦</div>}
                <div style={{ ...st.bubble, ...(m.role === "assistant" ? st.bubbleBot : st.bubbleUser) }}>
                  {renderText(m.content)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ ...st.msgRow, justifyContent: "flex-start" }}>
                <div style={st.msgAvatar}>✦</div>
                <div style={{ ...st.bubble, ...st.bubbleBot }}>
                  <div style={st.typingDots}>
                    {[0, 1, 2].map((d) => (
                      <div key={d} className="pb-dot" style={{ ...st.dot, animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* ── Suggestion pills (shown after chat starts) ── */}
        {chatMode && (
          <div style={st.suggBar}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="pb-sugg" onClick={() => sendMessage(s)} disabled={loading}>{s}</button>
            ))}
          </div>
        )}

        {/* ── Input bar (always visible at bottom) ── */}
        <div style={st.inputWrap}>
          <div style={st.inputBox}>
            <span style={st.inputIcon}>✦</span>
            <input
              ref={inputRef}
              style={st.input}
              placeholder="Ask me anything about Penang…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="pb-send"
              style={{ ...st.sendBtn, ...(loading || !input.trim() ? st.sendDisabled : {}) }}
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              {loading ? <span className="pb-spinner" /> : "➤"}
            </button>
          </div>
          <p style={st.powered}>Powered by Groq · Llama 3.1</p>
        </div>

      </div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  button { cursor: pointer; border: none; background: none; font-family: inherit; }
  input  { font-family: inherit; border: none; outline: none; background: none; }

  /* Quick cards */
  .pb-card {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 14px 14px 12px; text-align: left;
    transition: all 0.18s ease; cursor: pointer;
  }
  .pb-card:hover { background: rgba(255,255,255,0.1); border-color: rgba(108,99,255,0.4); transform: translateY(-2px); }

  /* Category tabs */
  .pb-tab {
    padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45); border: 1px solid transparent;
    transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
  }
  .pb-tab:hover { color: rgba(255,255,255,0.75); }
  .pb-tab-active { background: rgba(108,99,255,0.2) !important; color: #a8a4ff !important; border-color: rgba(108,99,255,0.35) !important; }

  /* Suggestion pills */
  .pb-sugg {
    background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.2);
    color: #a8a4ff; padding: 5px 13px; border-radius: 20px;
    font-size: 12px; white-space: nowrap; flex-shrink: 0;
    transition: all 0.15s;
  }
  .pb-sugg:hover:not(:disabled) { background: rgba(108,99,255,0.22); color: #fff; }
  .pb-sugg:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Reset btn */
  .pb-reset {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.35);
    padding: 5px 12px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    transition: all 0.15s;
  }
  .pb-reset:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.65); }

  /* Send button */
  .pb-send { transition: transform 0.15s; }
  .pb-send:not(:disabled):hover { transform: scale(1.08); }

  /* Spinner */
  .pb-spinner {
    display: inline-block; width: 15px; height: 15px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    animation: pb-spin 0.8s linear infinite;
  }
  @keyframes pb-spin { to { transform: rotate(360deg); } }

  /* Typing dots */
  .pb-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.4);
    animation: pb-bounce 1.2s ease-in-out infinite;
    display: inline-block;
  }
  @keyframes pb-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-6px); }
  }

  @keyframes pb-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const st: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Outfit', sans-serif",
    background: "#f0ede8",
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "32px 20px 48px",
  },

  // Outer card (dark)
  card: {
    width: "100%",
    maxWidth: 700,
    background: "#111827",
    borderRadius: 24,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
    animation: "pb-fadeUp 0.4s ease both",
    minHeight: 560,
  },

  // Top bar
  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(0,0,0,0.2)",
    flexShrink: 0,
  },
  botInfo: { display: "flex", alignItems: "center", gap: 10 },
  botAvatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #e76f51)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, color: "#fff", fontWeight: 700,
  },
  botName: { fontSize: 14, fontWeight: 600, color: "#fff" },
  botSub: {
    fontSize: 11, color: "rgba(255,255,255,0.38)",
    display: "flex", alignItems: "center", gap: 5, marginTop: 2,
  },
  onlineDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#22c55e", boxShadow: "0 0 5px #22c55e", display: "inline-block",
  },

  // Landing
  landing: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", padding: "32px 24px 20px",
  },
  landingIcon: {
    width: 52, height: 52, borderRadius: "50%",
    background: "linear-gradient(135deg, #6c63ff, #e76f51)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, color: "#fff", marginBottom: 18,
    boxShadow: "0 8px 24px rgba(108,99,255,0.35)",
  },
  landingTitle: {
    fontSize: 28, fontWeight: 700, color: "#fff",
    textAlign: "center", marginBottom: 10, lineHeight: 1.25,
  },
  landingSubtitle: {
    fontSize: 13.5, color: "rgba(255,255,255,0.45)",
    textAlign: "center", maxWidth: 400, lineHeight: 1.6, marginBottom: 28,
  },

  // Quick cards grid
  cardsGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10, width: "100%", marginBottom: 24,
  },
  quickCard: { fontFamily: "'Outfit', sans-serif" },
  quickCardIcon: { fontSize: 20, marginBottom: 4 },
  quickCardTitle: { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 },
  quickCardSub: { fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4, marginTop: 2 },

  // Category tabs
  tabs: {
    display: "flex", gap: 6, overflowX: "auto",
    width: "100%", paddingBottom: 2,
  },

  // Messages
  messages: {
    flex: 1, overflowY: "auto",
    padding: "20px 18px",
    display: "flex", flexDirection: "column", gap: 14,
    minHeight: 300,
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  msgAvatar: {
    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg, #6c63ff, #e76f51)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, color: "#fff", fontWeight: 700,
  },
  bubble: {
    maxWidth: "76%", padding: "10px 14px",
    borderRadius: 18, fontSize: 13.5,
    lineHeight: 1.6, wordBreak: "break-word",
  },
  bubbleBot: {
    background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.9)",
    borderRadius: "4px 18px 18px 18px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  bubbleUser: {
    background: "linear-gradient(135deg, #6c63ff, #554fd8)",
    color: "#fff", borderRadius: "18px 4px 18px 18px", fontWeight: 500,
  },
  typingDots: { display: "flex", gap: 5, alignItems: "center", padding: "2px 0" },
  dot: { width: 7, height: 7, borderRadius: "50%" },

  // Suggestion pills bar
  suggBar: {
    padding: "8px 16px",
    display: "flex", gap: 7, overflowX: "auto", flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },

  // Input area
  inputWrap: {
    padding: "12px 16px 10px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.25)",
    flexShrink: 0,
  },
  inputBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "4px 6px 4px 14px",
  },
  inputIcon: { fontSize: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 },
  input: {
    flex: 1, padding: "9px 4px",
    color: "#fff", fontSize: 13.5,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
    background: "linear-gradient(135deg, #6c63ff, #554fd8)",
    color: "#fff", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  sendDisabled: { opacity: 0.35, cursor: "not-allowed" },
  powered: {
    textAlign: "center", fontSize: 10.5,
    color: "rgba(255,255,255,0.12)", marginTop: 8,
  },
};