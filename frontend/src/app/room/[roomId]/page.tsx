"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

interface ChatMessage {
  type?: string;
  sender_id?: string;
  display_name?: string;
  language?: string;
  text?: string;
  original_text?: string;
  translation_cached?: boolean;
  timestamp?: string;
  user_id?: string;
  text_content?: string;
}

interface PresenceUser {
  user_id: string;
  display_name: string;
  language: string;
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = (params?.roomId as string) || "foreign-desk";
  const userLang = searchParams?.get("lang") || "en";

  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  const socketRef = useRef<WebSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Prevent SSR Hydration Mismatches
  useEffect(() => {
    setMounted(true);
    const generatedId = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    setUserId(generatedId);
    setDisplayName(`Correspondent_${generatedId.slice(-4)}`);
  }, []);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect to WebSocket and Fetch REST Chat History
  useEffect(() => {
    if (!mounted || !userId) return;

    const backendHost = "127.0.0.1:8080";
    const httpProtocol = "http";
    const wsProtocol = "ws";

    // 1. Fetch Chat History via REST API
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${httpProtocol}://${backendHost}/api/v1/chat/history/${roomId}?limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formattedHistory: ChatMessage[] = data.map((item: any) => ({
              type: "message",
              user_id: item.user_id,
              display_name: item.display_name,
              text: item.text_content,
              timestamp: item.created_at,
              language: item.original_language,
            }));
            setMessages(formattedHistory);
          }
        }
      } catch (err) {
        console.warn("Backend server not reached for history fetch. Make sure Nginx & FastAPI are running on port 8080.");
      }
    };

    fetchHistory();

    // 2. Establish WebSocket Connection through Nginx Load Balancer
    const wsUrl = `${wsProtocol}://${backendHost}/ws/chat/${roomId}?user_id=${userId}&display_name=${encodeURIComponent(
      displayName || `User_${userId.slice(-4)}`
    )}&language=${userLang}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message" || data.type === "chat") {
            const payload = data.payload || data;

            // Normalize message text field so it's never empty
            const normalizedMsg: ChatMessage = {
              ...payload,
              text: payload.text || payload.text_content || payload.translated_text || payload.message || "",
            };

            setMessages((prev) => [...prev, normalizedMsg]);
          } else if (data.type === "presence_update") {
            if (data.active_users) {
              setPresenceList(data.active_users);
            }
          } else if (data.type === "system_notice" || data.error) {
            setMessages((prev) => [
              ...prev,
              {
                type: "system",
                text: data.message || data.error || "System Alert",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        } catch (err) {
          console.error("Error parsing WebSocket frame:", err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
      };

      ws.onerror = () => {
        setConnectionStatus("disconnected");
      };
    } catch (err) {
      setConnectionStatus("disconnected");
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [mounted, userId, roomId, userLang, displayName]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: "message",
      text: inputText.trim(),
    };

    socketRef.current.send(JSON.stringify(payload));
    setInputText("");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-parchment text-ink flex items-center justify-center font-serif">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft animate-pulse">
          Connecting to dispatch wire...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-parchment text-ink font-serif">
      {/* Dateline Bar */}
      <div className="bg-plum text-parchment font-mono text-[11px] tracking-[0.14em] uppercase">
        <div className="max-w-[1180px] mx-auto px-[40px] py-2 flex justify-between items-center opacity-90">
          <button onClick={() => router.push("/")} className="hover:underline cursor-pointer">
            ← Return to Wire
          </button>
          <span>Room: {roomId}</span>
          <span>
            Status:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "text-emerald-400 font-bold"
                  : connectionStatus === "connecting"
                  ? "text-amber-300"
                  : "text-rose-400 font-bold"
              }
            >
              ● {connectionStatus.toUpperCase()}
            </span>
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-[1180px] w-full mx-auto px-[40px] py-8 flex-1 flex flex-col">
        {/* Newspaper Room Header */}
        <div className="border-b-2 border-ink pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft mb-1">
              Live Cable Transmission · Language: {userLang.toUpperCase()}
            </div>
            <h1 className="font-playfair font-black text-4xl md:text-5xl text-plum">
              Dispatch Room: <span className="italic font-serif text-ink">{roomId}</span>
            </h1>
          </div>
          <div className="font-mono text-xs text-ink-soft">
            User ID: <span className="font-semibold">{userId}</span>
          </div>
        </div>

        {/* Browser Frame */}
        <div className="border border-ink bg-parchment-2 flex-1 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink bg-parchment-2">
            <div className="w-2.5 h-2.5 rounded-full bg-ink/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-ink/20"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-ink/20"></div>
            <div className="ml-3 font-mono text-[11px] text-ink-soft">
              lingo-latency.wire/room/{roomId}?lang={userLang}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] flex-1 min-h-[520px]">
            {/* Sidebar */}
            <div className="bg-plum text-peri p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-ink">
              <div>
                <div className="font-playfair italic text-2xl text-parchment mb-1">{roomId}</div>
                <div className="font-mono text-[10px] tracking-wider uppercase opacity-70 mb-6">
                  {presenceList.length || 1} Correspondents Online
                </div>

                <div className="font-mono text-[11px] tracking-wider uppercase opacity-60 mb-3 border-b border-peri/20 pb-1">
                  On The Line
                </div>

                <div className="space-y-2">
                  {presenceList.length > 0 ? (
                    presenceList.map((u, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-serif text-parchment">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="truncate">{u.display_name || u.user_id}</span>
                        <span className="font-mono text-[10px] text-peri opacity-70">({u.language})</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-serif text-parchment">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>You ({displayName || "Me"})</span>
                      <span className="font-mono text-[10px] text-peri opacity-70">({userLang})</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-peri/20 font-mono text-[10px] opacity-60">
                Encrypted · Redis Pub/Sub Mesh
              </div>
            </div>

            {/* Chat Feed */}
            <div className="bg-parchment p-6 flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-2">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-ink-soft italic font-serif">
                    No cable dispatches yet. Type a message below to test the translation wire.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine =
                      msg.sender_id === userId ||
                      msg.user_id === userId ||
                      msg.display_name === displayName;

                    if (msg.type === "system") {
                      return (
                        <div key={i} className="text-center my-2 font-mono text-xs text-rose-700 bg-rose-100/60 py-1.5 px-3 border border-rose-300">
                          ⚠️ {msg.text}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={i}
                        className={`max-w-[75%] ${isMine ? "ml-auto text-right" : "mr-auto text-left"}`}
                      >
                        <div className="font-mono text-[10px] tracking-wider uppercase text-ink-soft mb-1">
                          {isMine
                            ? `You · sent in ${userLang.toUpperCase()}`
                            : `${msg.display_name || "Correspondent"} · ${msg.language?.toUpperCase() || "LANG"} → ${userLang.toUpperCase()}`}
                        </div>
                        <div
                          className={`p-3.5 text-sm leading-relaxed border ${
                            isMine
                              ? "bg-peri border-peri-deep text-ink"
                              : "bg-parchment-2 border-ink/20 text-ink"
                          }`}
                        >
                          {msg.text || msg.text_content || (msg as any).translated_text || (msg as any).message || "Empty dispatch"}
                        </div>
                        {msg.original_text && msg.original_text !== msg.text && (
                          <div className="font-mono text-[10px] text-brass italic mt-1">
                            original: {msg.original_text}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-ink/20 flex gap-2">
                <input
                  type="text"
                  placeholder="Write in your language…"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 border border-ink bg-parchment px-4 py-2.5 font-serif text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-plum"
                />
                <button
                  type="submit"
                  disabled={connectionStatus !== "connected"}
                  className="bg-plum text-parchment font-mono text-xs tracking-wider uppercase px-6 py-2.5 border border-plum hover:bg-plum-deep transition-all cursor-pointer disabled:opacity-50"
                >
                  Send →
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-ink text-parchment py-4 px-10 font-mono text-[11px] tracking-wider uppercase flex justify-between items-center">
        <span className="opacity-60">Lingo-Latency — Wire Active</span>
        <span className="opacity-60">Nginx Port 8080 Mesh</span>
      </footer>
    </div>
  );
}