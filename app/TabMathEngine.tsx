"use client";
import React, { useState, useEffect, useMemo } from "react";
// @ts-ignore
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { Wifi, Radio, Cpu, Activity, Play } from "lucide-react";

/* ─────────────────────────────────────────────
   STRICT DATA INTERFACES
───────────────────────────────────────────── */
interface TimeSample { t: number; amp: number; }
interface SubCarrierData { index: string; amplitude: number; noise: number; }

/* ─────────────────────────────────────────────
   OFDM SIGNAL GENERATORS
───────────────────────────────────────────── */
function buildOFDMSymbol(noiseLevel: number, tick: number): TimeSample[] {
  const N = 128;
  const data: TimeSample[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const signal =
      Math.sin(2 * Math.PI * 2 * t + tick * 0.05) * 0.9 +
      Math.sin(2 * Math.PI * 5 * t + tick * 0.03) * 0.7 +
      Math.sin(2 * Math.PI * 11 * t + tick * 0.07) * 0.5 +
      Math.sin(2 * Math.PI * 17 * t + tick * 0.04) * 0.4 +
      Math.sin(2 * Math.PI * 23 * t + tick * 0.06) * 0.3;
    const noiseTerm = (Math.random() * 2 - 1) * noiseLevel * 1.5;
    data.push({ t: i, amp: Number((signal + noiseTerm).toFixed(4)) });
  }
  return data;
}

function buildSubCarriers(noiseLevel: number, tick: number): SubCarrierData[] {
  const carriers = [2, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const N = 64;
  const data: SubCarrierData[] = [];
  for (let k = 0; k < N; k++) {
    let isActive = false;
    for (let j = 0; j < carriers.length; j++) {
      if (carriers[j] === k) {
        isActive = true;
        break;
      }
    }
    const base = isActive ? 0.7 + Math.sin(tick * 0.1 + k) * 0.15 : 0.05;
    const n = noiseLevel * (Math.random() * 0.6 + 0.2);
    const mag = Math.max(0, base + n * (Math.random() > 0.5 ? 1 : -1) * 0.3);
    const noisyFlag = noiseLevel > 0.4 && Math.random() > 0.65 ? 1 : 0;
    data.push({ index: k.toString(), amplitude: Number(mag.toFixed(3)), noise: noisyFlag });
  }
  return data;
}

/* ─────────────────────────────────────────────
   ANIMATED BIT STREAM DISPLAY
───────────────────────────────────────────── */
function BitStream({ active, tick }: { active: boolean; tick: number }) {
  const bits = "10110100111001011010010110110010";
  const offset = tick % bits.length;
  const displayBits: string[] = [];
  for (let i = 0; i < 24; i++) {
    displayBits.push(bits[(i + offset) % bits.length]);
  }
  
  return (
    <div className="flex gap-0.5 font-mono text-xs overflow-hidden select-none">
      {displayBits.map((b, i) => (
        <span
          key={i}
          style={{
            color: active ? (b === "1" ? "#22d3ee" : "#818cf8") : "#334155",
            textShadow: active ? `0 0 8px ${b === "1" ? "#22d3ee" : "#818cf8"}` : "none",
            transition: "color 0.2s",
          }}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PIPELINE NODE COMPONENT
───────────────────────────────────────────── */
interface NodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  color: string;
  glow: string;
  children?: React.ReactNode;
}
function PipelineNode({ icon, label, sublabel, active, color, glow, children }: NodeProps) {
  return (
    <div
      style={{
        border: `1px solid ${active ? color : "#1e293b"}`,
        boxShadow: active ? `0 0 20px ${glow}` : "none",
        transition: "all 0.4s ease",
        background: active ? `${glow}10` : "#0f172a",
      }}
      className="rounded-2xl p-4 flex flex-col items-center gap-2 min-w-[130px]"
    >
      <div style={{ color: active ? color : "#475569" }} className="transition-colors duration-300">
        {icon}
      </div>
      <div className="text-center">
        <div
          className="font-mono text-[10px] font-bold tracking-widest"
          style={{ color: active ? color : "#475569" }}
        >
          {label}
        </div>
        <div className="text-slate-600 text-[9px] font-mono mt-0.5">{sublabel}</div>
      </div>
      {children ? <div className="w-full mt-1">{children}</div> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONNECTOR ARROW
───────────────────────────────────────────── */
function Arrow({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center flex-shrink-0">
      <div
        style={{
          width: 40,
          height: 2,
          background: active
            ? `linear-gradient(90deg, transparent, ${color}, transparent)`
            : "#1e293b",
          boxShadow: active ? `0 0 6px ${color}` : "none",
          transition: "all 0.4s ease",
        }}
      />
      <div
        style={{
          borderLeft: `8px solid ${active ? color : "#1e293b"}`,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          transition: "all 0.4s ease",
          filter: active ? `drop-shadow(0 0 4px ${color})` : "none",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHANNEL WAVES VISUAL
───────────────────────────────────────────── */
function ChannelWaves({ active, noiseLevel }: { active: boolean; noiseLevel: number }) {
  const isHigh = noiseLevel > 0.5;
  const waves = [0, 1, 2, 3, 4, 5, 6];
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {waves.map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: active
              ? isHigh
                ? `hsl(${0 + i * 5}, 90%, 55%)`
                : `hsl(${180 + i * 8}, 90%, 55%)`
              : "#1e293b",
            height: active ? `${16 + Math.sin(i * 1.2) * 10}px` : "4px",
            boxShadow: active
              ? isHigh
                ? "0 0 8px rgba(239,68,68,0.7)"
                : "0 0 6px rgba(6,182,212,0.5)"
              : "none",
            animation: active ? `waveAnim ${0.4 + i * 0.1}s ease-in-out infinite alternate` : "none",
            transition: "all 0.3s",
          }}
        />
      ))}
      <style>{`@keyframes waveAnim { from { transform: scaleY(0.6); } to { transform: scaleY(1.3); } }`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function TabMathEngine() {
  const [running, setRunning] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0.2);
  const [tick, setTick] = useState(0);
  const [stage, setStage] = useState(0); // 0=idle, 1=bits, 2=dsp, 3=channel, 4=rx

  /* tick animation */
  useEffect(() => {
    let intervalId: any;
    if (running) {
      intervalId = setInterval(() => {
        setTick((t) => t + 1);
      }, 120);
    } else {
      setStage(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [running]);

  /* stage progression */
  useEffect(() => {
    if (!running) return;
    if (tick === 3) setStage(1);
    if (tick === 8) setStage(2);
    if (tick === 14) setStage(3);
    if (tick === 20) setStage(4);
  }, [tick, running]);

  const timeDomain = useMemo(() => buildOFDMSymbol(noiseLevel, tick), [noiseLevel, tick]);
  const subCarriers = useMemo(() => buildSubCarriers(noiseLevel, tick), [noiseLevel, tick]);

  const isHighNoise = noiseLevel > 0.5;

  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER BADGE ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Wifi size={13} />
          <span className="tracking-widest">{"Wi-Fi 6 OFDM SIMULATION — IEEE 802.11ax"}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono border ${isHighNoise ? "bg-red-950/40 border-red-500/40 text-red-400" : "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${isHighNoise ? "bg-red-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
          {isHighNoise ? "CHANNEL DEGRADED" : "CHANNEL CLEAR"}
        </div>
      </div>

      {/* ── CONCEPT CAPTION ── */}
      <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3 text-xs font-mono text-slate-400">
        <span className="text-cyan-400 font-bold">{"SCENARIO: "}</span>
        {"Inside a Wi-Fi 6 router, the DSP chip runs IFFT to map binary data onto 64 orthogonal sub-carriers (OFDM). "}
        {"At the receiver, the DFT perfectly separates them — even through a noisy RF channel."}
      </div>

      {/* ── CONTROLS ── */}
      <div className="flex flex-wrap items-center gap-6 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
        <button
          onClick={() => { setTick(0); setStage(0); setRunning((r) => !r); }}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-mono text-sm font-bold tracking-widest transition-all duration-300 border ${
            running
              ? "bg-red-900/40 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              : "bg-gradient-to-r from-cyan-600 to-violet-600 border-cyan-400/40 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
          }`}
        >
          {running ? <Activity size={18} /> : <Play size={18} />}
          <span>{running ? "STOP TRANSMISSION" : "START TRANSMISSION"}</span>
        </button>

        <div className="flex-1 min-w-[220px]">
          <div className="flex justify-between mb-2">
            <label className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">
              {"Channel Interference / Noise"}
            </label>
            <span className={`font-mono text-[11px] font-bold ${isHighNoise ? "text-red-400" : "text-emerald-400"}`}>
              {Math.round(noiseLevel * 100)}{"%"}
            </span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={noiseLevel}
            onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(90deg, ${isHighNoise ? "#ef4444" : "#06b6d4"} ${noiseLevel * 100}%, #1e293b ${noiseLevel * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
            <span>{"CLEAN"}</span><span>{"MODERATE"}</span><span>{"INTERFERENCE"}</span>
          </div>
        </div>

        <div className="flex gap-4 text-[10px] font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center">
            <div className="text-slate-600 tracking-wider">{"FFT SIZE"}</div>
            <div className="text-cyan-400 font-bold mt-0.5">{"64-pt"}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center">
            <div className="text-slate-600 tracking-wider">{"GUARD INT."}</div>
            <div className="text-cyan-400 font-bold mt-0.5">{"16 smp"}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center">
            <div className="text-slate-600 tracking-wider">{"BAND"}</div>
            <div className="text-cyan-400 font-bold mt-0.5">{"5 GHz"}</div>
          </div>
        </div>
      </div>

      {/* ── ANIMATED PIPELINE ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-slate-600 font-mono text-[10px] tracking-widest mb-4 uppercase">
          {"Live Router Architecture — Internal DSP Pipeline"}
        </div>
        <div className="flex items-center justify-center flex-wrap gap-0">

          {/* Node 1: Binary Source */}
          <PipelineNode
            icon={<Activity size={22} />}
            label="BINARY STREAM"
            sublabel="User Data (MAC Layer)"
            active={stage >= 1}
            color="#22d3ee"
            glow="rgba(34,211,238,0.4)"
          >
            <BitStream active={stage >= 1} tick={tick} />
          </PipelineNode>

          <Arrow active={stage >= 2} color="#22d3ee" />

          {/* Node 2: DSP / IFFT */}
          <PipelineNode
            icon={<Cpu size={22} className={running && stage >= 2 ? "animate-spin" : ""} style={{ animationDuration: "1.5s" }} />}
            label="Wi-Fi DSP CHIP"
            sublabel="IFFT / Sub-carrier Mapping"
            active={stage >= 2}
            color="#a78bfa"
            glow="rgba(167,139,250,0.4)"
          >
            {stage >= 2 ? (
              <div className="grid grid-cols-7 gap-0.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: `${8 + Math.abs(Math.sin(i + tick * 0.3)) * 16}px`,
                      background: "#a78bfa",
                      borderRadius: 1,
                      boxShadow: "0 0 4px rgba(167,139,250,0.6)",
                      transition: "height 0.12s",
                    }}
                  />
                ))}
              </div>
            ) : null}
          </PipelineNode>

          <Arrow active={stage >= 3} color="#a78bfa" />

          {/* Node 3: Antenna / Channel */}
          <PipelineNode
            icon={<Radio size={22} />}
            label="RF CHANNEL"
            sublabel={isHighNoise ? "⚠ High Interference" : "5 GHz Band"}
            active={stage >= 3}
            color={isHighNoise ? "#ef4444" : "#06b6d4"}
            glow={isHighNoise ? "rgba(239,68,68,0.4)" : "rgba(6,182,212,0.3)"}
          >
            <ChannelWaves active={stage >= 3} noiseLevel={noiseLevel} />
          </PipelineNode>

          <Arrow active={stage >= 4} color={isHighNoise ? "#f97316" : "#10b981"} />

          {/* Node 4: Receiver DSP */}
          <PipelineNode
            icon={<Wifi size={22} />}
            label="RECEIVER DSP"
            sublabel="FFT / Equalizer / Decode"
            active={stage >= 4}
            color="#10b981"
            glow="rgba(16,185,129,0.4)"
          >
            {stage >= 4 ? (
              <div className="text-center font-mono text-[10px] text-emerald-400 font-bold">
                {isHighNoise ? (
                  <span className="text-amber-400">{"⚠ BER: "}{(noiseLevel * 8).toFixed(1)}{"%"}</span>
                ) : (
                  <span>{"✓ BER: 0.0%"}</span>
                )}
              </div>
            ) : null}
          </PipelineNode>

        </div>
      </div>

      {/* ── DUAL RECHARTS ── */}
      <div className="grid grid-cols-2 gap-6">

        {/* LEFT: Time Domain */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-3 h-[340px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-shrink-0">
            <Activity size={14} className="text-cyan-400" />
            <span className="font-mono text-[11px] text-cyan-400 tracking-wider uppercase">
              {"Time Domain — OFDM Symbol (Air Interface)"}
            </span>
            {isHighNoise && running ? (
              <span className="ml-auto text-[9px] font-mono text-red-400 animate-pulse">{"CHAOTIC"}</span>
            ) : null}
          </div>
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <LineChart data={timeDomain} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              {/* @ts-ignore */}
              <XAxis dataKey="t" tick={{ fill: "#334155", fontSize: 8 }} tickLine={false} interval={15} />
              {/* @ts-ignore */}
              <YAxis tick={{ fill: "#334155", fontSize: 8 }} tickLine={false} domain={["auto", "auto"]} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #06b6d4", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
              {/* @ts-ignore */}
              <Line type="monotone" dataKey="amp" stroke={running && isHighNoise ? "#ef4444" : "#06b6d4"} strokeWidth={1.2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT: Frequency Domain Sub-carriers */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-3 h-[340px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-shrink-0">
            <Activity size={14} className="text-amber-400" />
            <span className="font-mono text-[11px] text-amber-400 tracking-wider uppercase">
              {"Frequency Domain — 64 OFDM Sub-carriers (DFT Output)"}
            </span>
          </div>
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <BarChart data={subCarriers} margin={{ top: 5, right: 10, left: -25, bottom: 0 }} barCategoryGap="5%">
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              {/* @ts-ignore */}
              <XAxis dataKey="index" tick={{ fill: "#334155", fontSize: 8 }} tickLine={false} interval={7} />
              {/* @ts-ignore */}
              <YAxis tick={{ fill: "#334155", fontSize: 8 }} tickLine={false} domain={[0, 1.1]} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #fbbf24", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
              {/* @ts-ignore */}
              <Bar dataKey="amplitude" fill="#fbbf24" isAnimationActive={false} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── INSIGHT FOOTER ── */}
      <div className="grid grid-cols-3 gap-4 text-[11px] font-mono">
        <div className="rounded-xl p-4 border" style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.25)" }}>
          <div className="tracking-widest text-slate-500 text-[9px] mb-1">{"DFT ORTHOGONALITY"}</div>
          <div className="font-bold text-sm" style={{ color: "#fbbf24" }}>{"64 sub-carriers"}</div>
          <div className="text-slate-600 text-[9px] mt-1">{"Δf = 78.125 kHz each"}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: noiseLevel > 0.5 ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)", borderColor: noiseLevel > 0.5 ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)" }}>
          <div className="tracking-widest text-slate-500 text-[9px] mb-1">{"TIME DOMAIN CHAOS"}</div>
          <div className="font-bold text-sm" style={{ color: noiseLevel > 0.5 ? "#ef4444" : "#10b981" }}>{noiseLevel > 0.5 ? "HIGH DISTORTION" : "NOMINAL"}</div>
          <div className="text-slate-600 text-[9px] mt-1">{"SNR ≈ "}{Math.round((1 - noiseLevel) * 40)}{" dB"}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "rgba(34,211,238,0.06)", borderColor: "rgba(34,211,238,0.25)" }}>
          <div className="tracking-widest text-slate-500 text-[9px] mb-1">{"DFT SEPARATION"}</div>
          <div className="font-bold text-sm" style={{ color: "#22d3ee" }}>{"PERFECT"}</div>
          <div className="text-slate-600 text-[9px] mt-1">{"Orthogonal → no inter-carrier interference"}</div>
        </div>
      </div>

    </div>
  );
}
