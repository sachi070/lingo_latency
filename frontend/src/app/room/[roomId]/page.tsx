"use client";

import { useEffect, useState, useRef, use } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

// Black Outlined SVG Icons
const MicIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const SpeakerIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

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

  // Safely extract parameter string
  const rawRoomId = params?.roomId;
  const roomId = Array.isArray(rawRoomId) ? rawRoomId[0] : (rawRoomId as string) || "foreign-desk";
  const userLang = searchParams?.get("lang") || "en";

  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // Typing Indicator State
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Mounted setup
  useEffect(() => {
    setMounted(true);
    if (!userId) {
      const generatedId = `user_${Math.floor(1000 + Math.random() * 9000)}`;
      setUserId(generatedId);
      setDisplayName(`Correspondent_${generatedId.slice(-4)}`);
    }
  }, [userId]);

  // Inline Language Selector
  const handleLanguageChange = (newLang: string) => {
    router.push(`/room/${roomId}?lang=${newLang}`);
  };

  const copyRoomLink = () => {
    const codeToCopy = roomId;
    const handleSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(codeToCopy)
        .then(handleSuccess)
        .catch(() => fallbackCopy(codeToCopy, handleSuccess));
    } else {
      fallbackCopy(codeToCopy, handleSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      if (document.execCommand("copy")) {
        onSuccess();
      }
    } catch (err) {
      console.error("Copy command failed:", err);
    }

    document.body.removeChild(textArea);
  };

  // Export Chat Dispatches
  const exportDispatches = (format: "txt" | "json" = "txt") => {
    if (messages.length === 0) return;

    let content = "";
    let mimeType = "text/plain";
    let extension = "txt";

    if (format === "txt") {
      const header =
        `==================================================\n` +
        `  LINGO-LATENCY WIRE DISPATCH LOG\n` +
        `  Room: ${roomId.toUpperCase()}\n` +
        `  Language: ${userLang.toUpperCase()}\n` +
        `  Export Date: ${new Date().toLocaleString()}\n` +
        `==================================================\n\n`;

      const body = messages
        .filter((m) => m.type !== "system")
        .map((m) => {
          const sender = m.display_name || m.user_id || "Correspondent";
          const text = m.text || m.text_content || "";
          const orig = m.original_text ? ` (Original: ${m.original_text})` : "";
          const time = m.timestamp ? `[${new Date(m.timestamp).toLocaleTimeString()}] ` : "";
          return `${time}${sender}: ${text}${orig}`;
        })
        .join("\n\n");

      content = header + body;
    } else {
      mimeType = "application/json";
      extension = "json";
      content = JSON.stringify(
        {
          room_id: roomId,
          user_language: userLang,
          exported_at: new Date().toISOString(),
          dispatches: messages,
        },
        null,
        2
      );
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wire-log-${roomId}-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Text-to-Speech Function
  const speakText = (text: string, lang: string) => {
    if (!("speechSynthesis" in window) || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      en: "en-US",
      es: "es-ES",
      ja: "ja-JP",
      fr: "fr-FR",
      de: "de-DE",
      hi: "hi-IN",
    };

    utterance.lang = langMap[lang] || lang || "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang =
        userLang === "ja" ? "ja-JP" : userLang === "es" ? "es-ES" : userLang === "fr" ? "fr-FR" : "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [userLang]);

  // Toggle Dictation Mic
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // WebSocket and Room Switch Handler
  useEffect(() => {
    if (!mounted || !userId) return;

    setMessages([]);
    setConnectionStatus("connecting");

    const backendHost = "127.0.0.1:8080";
    const httpProtocol = "http";
    const wsProtocol = "ws";

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
        console.warn("Backend server not reached for history fetch.");
      }
    };

    fetchHistory();

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

            const normalizedMsg: ChatMessage = {
              ...payload,
              text: payload.text || payload.text_content || payload.translated_text || payload.message || "",
            };

            setMessages((prev) => [...prev, normalizedMsg]);
            setTypingUser(null);
          } else if (data.type === "typing") {
            if (data.user_id !== userId) {
              setTypingUser(data.display_name || data.user_id || "A correspondent");

              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                setTypingUser(null);
              }, 3000);
            }
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

      ws.onclose = () => setConnectionStatus("disconnected");
      ws.onerror = () => setConnectionStatus("disconnected");
    } catch (err) {
      setConnectionStatus("disconnected");
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [mounted, userId, roomId, userLang, displayName]);

  // Typing Broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    const now = Date.now();
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      if (now - lastTypingSentRef.current > 2000) {
        lastTypingSentRef.current = now;
        socketRef.current.send(
          JSON.stringify({
            type: "typing",
            display_name: displayName,
          })
        );
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
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
        {/* Room Header */}
        <div className="border-b-2 border-ink pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft mb-1">
              Live Cable Transmission · Language: {userLang.toUpperCase()}
            </div>
            <h1 className="font-playfair font-black text-4xl md:text-5xl text-plum">
              Dispatch Room: <span className="italic font-serif text-ink">{roomId}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Inline Language Selector */}
            <div className="border border-ink bg-parchment-2 px-2.5 py-1.5 flex items-center gap-1.5 font-mono text-xs">
              <GlobeIcon className="w-3.5 h-3.5 opacity-60" />
              <select
                value={userLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent font-mono text-xs uppercase cursor-pointer focus:outline-none"
              >
                <option value="en">English (EN)</option>
                <option value="es">Spanish (ES)</option>
                <option value="ja">Japanese (JA)</option>
                <option value="fr">French (FR)</option>
                <option value="de">German (DE)</option>
                <option value="hi">Hindi (HI)</option>
              </select>
            </div>

            {/* Room Invite Code Badge */}
            <div className="border border-ink bg-parchment-2 px-3 py-1.5 font-mono text-xs text-ink flex items-center gap-2">
              <span className="opacity-60 uppercase text-[10px]">Code:</span>
              <span className="font-bold tracking-wider">{roomId.toUpperCase()}</span>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={copyRoomLink}
              className="bg-plum text-parchment font-mono text-xs tracking-wider uppercase px-3.5 py-1.5 border border-plum hover:bg-plum-deep transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 stroke-current" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5 stroke-current" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            {/* Export Log Button */}
            <button
              type="button"
              onClick={() => exportDispatches("txt")}
              disabled={messages.length === 0}
              title="Export dispatch transcripts"
              className="bg-parchment-2 text-ink font-mono text-xs tracking-wider uppercase px-3 py-1.5 border border-ink hover:bg-parchment-3 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              <DownloadIcon className="w-3.5 h-3.5 stroke-current" />
              <span>Export Log</span>
            </button>
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
                    No cable dispatches yet. Type or dictate a message below.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine =
                      msg.sender_id === userId ||
                      msg.user_id === userId ||
                      msg.display_name === displayName;

                    const msgText =
                      msg.text || msg.text_content || (msg as any).translated_text || (msg as any).message || "";

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

                        {/* Bubble Container */}
                        <div
                          className={`p-3.5 text-sm leading-relaxed border flex justify-between items-start gap-3 ${
                            isMine
                              ? "bg-peri border-peri-deep text-ink"
                              : "bg-parchment-2 border-ink/20 text-ink"
                          }`}
                        >
                          <span className="flex-1 text-left">{msgText || "Empty dispatch"}</span>

                          {/* Speaker Button */}
                          <button
                            type="button"
                            onClick={() => speakText(msgText, userLang)}
                            title="Read dispatch out loud"
                            className="opacity-60 hover:opacity-100 transition-opacity p-1.5 border border-ink/30 rounded bg-parchment/60 hover:bg-parchment text-ink cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <SpeakerIcon className="w-3.5 h-3.5 stroke-current" />
                          </button>
                        </div>

                        {msg.original_text && msg.original_text !== msgText && (
                          <div className="font-mono text-[10px] text-brass italic mt-1">
                            original: {msg.original_text}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="font-mono text-[11px] text-ink-soft italic animate-pulse py-1">
                    ✍️ {typingUser} is transmitting a dispatch...
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Composer Form */}
              <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-ink/20 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={isListening ? "Listening to your dictation..." : "Write in your language…"}
                  value={inputText}
                  onChange={handleInputChange}
                  className={`flex-1 border border-ink px-4 py-2.5 font-serif text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-plum ${
                    isListening ? "bg-amber-50 border-amber-500 animate-pulse" : "bg-parchment"
                  }`}
                />

                {/* Mic Button */}
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Stop Listening" : "Start Dictating"}
                    className={`px-3.5 py-2.5 border border-ink font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isListening
                        ? "bg-rose-700 text-parchment animate-pulse"
                        : "bg-parchment-2 text-ink hover:bg-parchment-3"
                    }`}
                  >
                    <MicIcon className="w-4 h-4 stroke-current" />
                    <span>{isListening ? "REC" : "MIC"}</span>
                  </button>
                )}

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

      {/* Production Footer */}
      <footer className="bg-ink text-parchment py-4 px-10 font-mono text-[11px] tracking-wider uppercase flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-brass/20">
        <div className="flex items-center gap-3">
          <span className="opacity-80 font-bold">Lingo-Latency</span>
          <span className="opacity-40">·</span>
          <span className="opacity-60">© {new Date().getFullYear()} Sachi Godbole</span>
        </div>
        <div className="opacity-50 text-[10px]">
          Encrypted Multi-Lingual Cable Mesh · All Rights Reserved
        </div>
      </footer>
    </div>
  );
}