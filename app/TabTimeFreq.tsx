"use client";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { ShieldAlert, ShieldCheck, Zap, Radio, Activity, Lock, Unlock } from "lucide-react";

/* ── data generators ── */
function buildTimeDomain(
  targetFreq: number,
  jamFreq: number,
  jamAmp: number,
  filtered: boolean
) {
  return Array.from({ length: 256 }, (_, i) => {
    const t = i / 256;
    const target = Math.sin(2 * Math.PI * targetFreq * t);
    const jammer = filtered ? 0 : jamAmp * Math.sin(2 * Math.PI * jamFreq * t + 0.3) +
      (jamAmp * 0.4) * Math.sin(2 * Math.PI * jamFreq * 1.7 * t);
    const noise  = filtered ? 0 : (Math.random() - 0.5) * jamAmp * 0.25;
    return { t: +(t).toFixed(4), s: +(target + jammer + noise).toFixed(4) };
  });
}

function buildFreqDomain(
  targetFreq: number,
  jamFreq: number,
  jamAmp: number,
  filtered: boolean
) {
  const N = 64;
  return Array.from({ length: N }, (_, k) => {
    const isTarget = Math.abs(k - Math.round(targetFreq * 2)) < 2;
    const isJammer = Math.abs(k - Math.round(jamFreq * 1.5)) < 2;
    const targetMag = isTarget ? 0.9 + Math.random() * 0.08 : Math.random() * 0.02;
    const jamMag    = isJammer && !filtered ? jamAmp * 0.55 + Math.random() * 0.06 : 0;
    return { k, target: +targetMag.toFixed(4), jammer: +jamMag.toFixed(4) };
  });
}

/* ── custom overlays ── */
function BlindOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
      style={{ backdropFilter: "blur(6px)", background: "rgba(15,23,42,0.75)" }}>
      <Lock size={28} className="text-rose-500 mb-2" />
      <p className="text-rose-400 font-mono text-xs font-bold text-center leading-5 px-4">
        SYSTEM BLIND<br />
        <span className="text-slate-400 font-normal">Frequency Components Unknown</span><br />
        <span className="text-slate-500 text-[10px]">(Like separating mixed coffee & milk in the time domain)</span>
      </p>
    </div>
  );
}

/* ── pill ── */
function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${color}`}>
      <span className="opacity-60">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/* ── main export ── */
export default function TabTimeFreq() {
  const [targetFreq, setTargetFreq] = useState(4);
  const [jamFreq,    setJamFreq]    = useState(11);
  const [jamAmp,     setJamAmp]     = useState(1.4);
  const [dftActive,  setDftActive]  = useState(false);
  const [filtered,   setFiltered]   = useState(false);

  /* reset filter when DFT toggled off */
  useEffect(() => { if (!dftActive) setFiltered(false); }, [dftActive]);

  const tdData = useMemo(
    () => buildTimeDomain(targetFreq, jamFreq, jamAmp, filtered),
    [targetFreq, jamFreq, jamAmp, filtered]
  );
  const fdData = useMemo(
    () => buildFreqDomain(targetFreq, jamFreq, jamAmp, filtered),
    [targetFreq, jamFreq, jamAmp, filtered]
  );

  const ber = filtered ? "0.01%" : dftActive ? "18.3%" : "48.5%";
  const berLabel = filtered ? "Optimal ✓" : dftActive ? "Partially Resolved" : "Signal Lost ✗";
  const berColor = filtered
    ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-400"
    : dftActive
    ? "border-amber-500/40 bg-amber-900/30 text-amber-400"
    : "border-rose-500/40 bg-rose-900/30 text-rose-400";

  const waveColor   = filtered ? "#10b981" : "#f97316";
  const waveGlow    = filtered ? "#10b981"  : "#f97316";
  const stageALabel = filtered
    ? "RECOVERED PAYLOAD — Clean Sinusoid (Target Signal Only)"
    : "RECEIVED WAVEFORM (Time Domain) — ⚠ Critical Blind State";

  const sliderCls = "w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-cyan-400";

  return (
    <div className="space-y-5">

      {/* ── control panel ── */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio size={14} className="text-cyan-400" />
          <span className="text-cyan-400 font-mono text-xs tracking-widest">SCENARIO CONTROL — JAMMER RESCUE</span>
        </div>

        {/* sliders */}
        <div className="grid grid-cols-3 gap-5">
          {[
            { label: "Target Signal Freq", unit: "Hz", val: targetFreq, set: setTargetFreq, min: 1, max: 15, step: 1, accent: "#22d3ee" },
            { label: "Jammer Noise Freq",  unit: "Hz", val: jamFreq,    set: setJamFreq,   min: 1, max: 20, step: 1, accent: "#f87171" },
            { label: "Jammer Power",       unit: "Amp",val: jamAmp,     set: setJamAmp,    min: 0.2, max: 3, step: 0.1, accent: "#fb923c" },
          ].map(({ label, unit, val, set, min, max, step, accent }) => (
            <div key={label} className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-3">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="font-mono text-xs font-bold" style={{ color: accent }}>{val} {unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => { set(Number(e.target.value)); setFiltered(false); }}
                className={sliderCls} style={{ accentColor: accent }} />
            </div>
          ))}
        </div>

        {/* mode toggle + filter button */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => setDftActive(a => !a)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              dftActive
                ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.45)]"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}>
            {dftActive ? <><Unlock size={14} /> DFT ENGINE ACTIVE (X-Ray Vision)</> : <><Lock size={14} /> Bypassed / Time Domain Only</>}
          </button>

          <button
            onClick={() => dftActive && setFiltered(true)}
            disabled={!dftActive || filtered}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              dftActive && !filtered
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                : filtered
                ? "bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 cursor-default"
                : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50"
            }`}>
            {filtered ? <><ShieldCheck size={14} /> Jammer Scrubbed ✓</> : <><ShieldAlert size={14} /> Apply Digital Filter (Scrub Jammer)</>}
          </button>

          {/* live status badge */}
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono ${
            filtered ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-400"
            : dftActive ? "border-cyan-500/40 bg-cyan-900/20 text-cyan-400"
            : "border-rose-500/40 bg-rose-900/20 text-rose-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${filtered ? "bg-emerald-400" : dftActive ? "bg-cyan-400" : "bg-rose-500"}`} />
            {filtered ? "SIGNAL RECOVERED" : dftActive ? "DFT ACTIVE" : "SYSTEM BLIND"}
          </div>
        </div>
      </div>

      {/* ── dual charts ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Stage A — Time Domain */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: waveColor }} />
              <span className="font-mono text-[11px]" style={{ color: waveColor }}>STAGE A — {stageALabel}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={tdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={["auto", "auto"]} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ background: "#0f172a", border: `1px solid ${waveColor}`, borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="s" stroke={waveColor} dot={false} strokeWidth={1.8}
                style={{ filter: `drop-shadow(0 0 5px ${waveGlow})` }}
                isAnimationActive={true} animationDuration={400} />
            </LineChart>
          </ResponsiveContainer>

          {/* telemetry pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Pill label="BER:" value={`${ber} (${berLabel})`} color={berColor} />
            <Pill label="SNR:" value={filtered ? "34.2 dB" : dftActive ? "11.4 dB" : "-3.1 dB"}
              color={filtered ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-400"
                : dftActive ? "border-amber-500/40 bg-amber-900/30 text-amber-400"
                : "border-rose-500/40 bg-rose-900/30 text-rose-400"} />
            <Pill label="Mode:" value={filtered ? "IDFT Reconstructed" : dftActive ? "DFT Active" : "Raw Time Domain"}
              color="border-slate-600 bg-slate-900/40 text-slate-400" />
          </div>
        </div>

        {/* Stage B — Frequency Domain */}
        <div className="relative bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className={dftActive ? "text-violet-400" : "text-slate-600"} />
            <span className={`font-mono text-[11px] ${dftActive ? "text-violet-400" : "text-slate-600"}`}>
              STAGE B — FREQUENCY DOMAIN S(ω) {dftActive ? "— UNLOCKED" : "— LOCKED"}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={fdData} barGap={0} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} label={{ value: "Frequency Bin k", position: "insideBottom", fill: "#475569", fontSize: 10 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #8b5cf6", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="target" name="Target Payload" stackId="a" radius={[3, 3, 0, 0]}
                isAnimationActive={true} animationDuration={500}>
                {fdData.map((_, i) => (
                  <Cell key={i} fill={dftActive ? "#10b981" : "#1e293b"}
                    style={{ filter: dftActive ? "drop-shadow(0 0 5px #10b981)" : "none" }} />
                ))}
              </Bar>
              <Bar dataKey="jammer" name="Jamming Noise" stackId="b" radius={[3, 3, 0, 0]}
                isAnimationActive={true} animationDuration={500}>
                {fdData.map((_, i) => (
                  <Cell key={i} fill={dftActive && !filtered ? "#ef4444" : "#1e293b"}
                    style={{ filter: dftActive && !filtered ? "drop-shadow(0 0 8px #ef4444)" : "none" }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* blind overlay */}
          {!dftActive && <BlindOverlay />}

          {/* freq domain pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Pill label="Target:" value={dftActive ? `${targetFreq} Hz ✓` : "???"}
              color={dftActive ? "border-emerald-500/40 bg-emerald-900/30 text-emerald-400" : "border-slate-600 bg-slate-900/40 text-slate-500"} />
            <Pill label="Jammer:" value={dftActive ? (filtered ? "0 (Nulled)" : `${jamFreq} Hz ⚠`) : "???"}
              color={dftActive ? (filtered ? "border-slate-600 bg-slate-900/40 text-slate-500" : "border-rose-500/40 bg-rose-900/30 text-rose-400") : "border-slate-600 bg-slate-900/40 text-slate-500"} />
            <Pill label="Surgery:" value={filtered ? "Precise ✓" : dftActive ? "Ready" : "Unavailable"}
              color={filtered ? "border-violet-500/40 bg-violet-900/30 text-violet-400" : "border-slate-600 bg-slate-900/40 text-slate-400"} />
          </div>
        </div>
      </div>
    </div>
  );
}
