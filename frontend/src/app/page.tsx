"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [userLanguage, setUserLanguage] = useState("en");

  // Format custom room names into clean URL slugs
  const formatRoomSlug = (rawInput: string) => {
    return rawInput
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ""); // Remove non-alphanumeric chars except hyphens
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedSlug = formatRoomSlug(roomIdInput) || "foreign-desk";
    router.push(`/room/${encodeURIComponent(formattedSlug)}?lang=${userLanguage}`);
  };

  const handleStartRandomRoom = () => {
    const randomRoom = `room-${Math.floor(1000 + Math.random() * 9000)}`;
    router.push(`/room/${randomRoom}?lang=${userLanguage}`);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-parchment text-ink font-serif">
      {/* Dateline Bar */}
      <div className="bg-plum text-parchment font-mono text-[11px] tracking-[0.14em] uppercase">
        <div className="max-w-[1180px] mx-auto px-[40px] py-2 flex justify-between items-center opacity-90">
          <span>Vol. I · No. 01</span>
          <span>The Real-Time Translation Wire</span>
          <span>Est. 2026</span>
        </div>
      </div>

      {/* Ticker Band */}
      <div className="bg-ink overflow-hidden whitespace-nowrap border-b border-brass py-2">
        <div className="inline-block animate-ticker">
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">EN→JA</b> "meeting moved to 4pm" → 「会議は午後4時に変更」
          </span>
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">ES→FR</b> "¿nos vemos mañana?" → "on se voit demain ?"
          </span>
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">DE→HI</b> "danke für die Hilfe" → "मदद के लिए धन्यवाद"
          </span>
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">PT→EN</b> "chegando em 10 minutos" → "arriving in 10 minutes"
          </span>
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">EN→JA</b> "meeting moved to 4pm" → 「会議は午後4時に変更」
          </span>
          <span className="font-mono text-xs text-peri mr-12 tracking-wider">
            <b className="text-parchment font-semibold">ES→FR</b> "¿nos vemos mañana?" → "on se voit demain ?"
          </span>
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="max-w-[1180px] w-full mx-auto px-[40px] py-[18px] flex justify-between items-center">
        <div className="flex gap-9 font-mono text-xs tracking-wider uppercase">
          <a href="#features" className="hover:border-b hover:border-plum transition-all">Features</a>
          <a href="#architecture" className="hover:border-b hover:border-plum transition-all">Architecture</a>
          <a href="#wire" className="hover:border-b hover:border-plum transition-all">Live Wire</a>
        </div>
        <button
          onClick={handleStartRandomRoom}
          className="bg-plum text-parchment font-mono text-xs tracking-wider uppercase px-5 py-2.5 border border-plum hover:bg-plum-deep transition-all cursor-pointer"
        >
          Join Random Room →
        </button>
      </nav>

      {/* Masthead Header */}
      <header className="max-w-[1180px] w-full mx-auto px-[40px] pt-[44px] pb-[28px] text-center">
        <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft mb-3.5">
          A dispatch in every tongue
        </div>
        <h1 className="font-playfair font-black text-6xl md:text-[82px] leading-[0.95] text-plum tracking-tight">
          LINGO <em className="font-serif italic font-normal text-ink">·</em> LATENCY
        </h1>
        <div className="font-mono text-xs tracking-widest uppercase text-ink-soft mt-3.5">
          Real-time chat, translated the instant it arrives
        </div>
      </header>

      <hr className="border-t-2 border-ink max-w-[1180px] w-full mx-auto" />

      {/* Hero Section */}
      <section className="max-w-[1180px] w-full mx-auto px-[40px] pt-[56px] pb-[70px] grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-[56px] items-start">
        <div>
          <div className="font-mono text-xs tracking-[0.14em] uppercase text-plum mb-4">
            — The Wire, Explained —
          </div>
          <h2 className="font-playfair font-bold text-4xl md:text-[44px] leading-[1.08] mb-[22px]">
            Type in yours.<br />They read in theirs.
          </h2>
          <p className="text-lg md:text-[19px] leading-relaxed text-ink-soft mb-8 max-w-[46ch]">
            <span className="float-left font-playfair font-black text-6xl text-plum leading-none pr-3 pt-1">
              E
            </span>
            very message crosses the wire and lands in the reader's own language, before the sender's cursor has even blinked. Create a custom room or enter an existing code to connect.
          </p>

          {/* Dynamic Room Join Box */}
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Name your room (e.g. tokyo-desk, tech-summit)"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="flex-1 min-w-[200px] border border-ink bg-parchment px-4 py-3 font-serif text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-1 focus:ring-plum"
              />
              <select
                value={userLanguage}
                onChange={(e) => setUserLanguage(e.target.value)}
                className="border border-ink bg-parchment-2 px-3 py-3 font-mono text-xs text-ink uppercase focus:outline-none cursor-pointer"
              >
                <option value="en">English (EN)</option>
                <option value="es">Español (ES)</option>
                <option value="ja">日本語 (JA)</option>
                <option value="fr">Français (FR)</option>
                <option value="de">Deutsch (DE)</option>
                <option value="hi">हिन्दी (HI)</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-plum text-parchment font-mono text-xs tracking-wider uppercase px-[26px] py-[14px] border border-plum hover:bg-plum-deep transition-all cursor-pointer font-bold"
              >
                Create / Enter Room →
              </button>
              <button
                type="button"
                onClick={handleStartRandomRoom}
                className="bg-transparent text-ink font-mono text-xs tracking-wider uppercase px-[26px] py-[14px] border border-ink hover:bg-parchment-2 transition-all cursor-pointer"
              >
                Random Room
              </button>
            </div>
          </form>
        </div>

        {/* Live Language Wire Side Panel */}
        <div className="border border-ink bg-parchment-2 p-[22px_24px]">
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-plum border-b border-ink/20 pb-3 mb-3.5">
            Currently on the wire
          </div>
          <div className="divide-y divide-ink/20 text-sm">
            <div className="flex justify-between items-center py-2.5">
              <span><span className="w-1.5 h-1.5 rounded-full bg-brass inline-block mr-2"></span>English</span>
              <span className="text-ink-soft italic text-xs">"see you at 6"</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span><span className="w-1.5 h-1.5 rounded-full bg-brass inline-block mr-2"></span>日本語</span>
              <span className="text-ink-soft italic text-xs">「6時に会おう」</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span><span className="w-1.5 h-1.5 rounded-full bg-brass inline-block mr-2"></span>Français</span>
              <span className="text-ink-soft italic text-xs">"à 18h alors"</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span><span className="w-1.5 h-1.5 rounded-full bg-brass inline-block mr-2"></span>हिन्दी</span>
              <span className="text-ink-soft italic text-xs">"ठीक है, 6 बजे"</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span><span className="w-1.5 h-1.5 rounded-full bg-brass inline-block mr-2"></span>Português</span>
              <span className="text-ink-soft italic text-xs">"combinado, às 6"</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-t border-ink/20 max-w-[1180px] w-full mx-auto" />

      {/* Feature Columns */}
      <section id="features" className="max-w-[1180px] w-full mx-auto px-[40px] pt-[12px] pb-[60px]">
        <div className="flex justify-between items-baseline mb-4">
          <h3 className="font-playfair font-bold italic text-2xl text-plum my-[20px]">What the wire carries</h3>
          <span className="font-mono text-[11px] text-ink-soft tracking-wider">Cols. I–III</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ink/20">
          <div className="pr-0 md:pr-7 py-6 md:py-0">
            <div className="font-mono text-[11px] text-brass tracking-wider mb-2.5">I.</div>
            <h4 className="font-playfair text-xl font-bold mb-2.5">Fan-out, not broadcast</h4>
            <p className="text-sm leading-relaxed text-ink-soft">
              Messages travel once across Redis Pub/Sub and reach every node — no single server holds the whole room state, so any instance can restart mid-conversation without a dropped word.
            </p>
          </div>
          <div className="px-0 md:px-7 py-6 md:py-0">
            <div className="font-mono text-[11px] text-brass tracking-wider mb-2.5">II.</div>
            <h4 className="font-playfair text-xl font-bold mb-2.5">Translated on arrival</h4>
            <p className="text-sm leading-relaxed text-ink-soft">
              Each reader gets their own rendering, cached the moment it's produced, keeping latency minimal regardless of room size.
            </p>
          </div>
          <div className="pl-0 md:pl-7 py-6 md:py-0">
            <div className="font-mono text-[11px] text-brass tracking-wider mb-2.5">III.</div>
            <h4 className="font-playfair text-xl font-bold mb-2.5">Built to survive load</h4>
            <p className="text-sm leading-relaxed text-ink-soft">
              Three Uvicorn nodes, Nginx load balancing, and Redis sliding-window rate limiters guarantee stability under peak concurrent usage.
            </p>
          </div>
        </div>
      </section>

      {/* Production Footer */}
      <footer className="bg-ink text-parchment py-8 px-10 font-mono text-[11px] tracking-wider uppercase border-t border-brass/30">
        <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-center md:text-left">
            <span className="opacity-80 font-bold tracking-widest text-parchment">
              LINGO-LATENCY WIRE
            </span>
            <span className="opacity-50 hidden md:inline">|</span>
            <span className="opacity-60">
              © {new Date().getFullYear()} Sachi Godbole. All Rights Reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 opacity-60">
            <span>FastAPI · Redis · Nginx · Next.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}