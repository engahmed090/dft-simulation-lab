"use client";
import { useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  ShieldAlert, ShieldCheck, Radio,
  Activity, Zap, Lock, Unlock, Eye, EyeOff,
} from "lucide-react";

/* ─────────────────────────── data helpers ─────────────────────────── */

function buildTime(tFreq: number, jFreq: number, jAmp: number, filtered: boolean) {
  return Array.from({ length: 300 }, (_, i) => {
    const t = i / 300;
    const target = Math.sin(2 * Math.PI * tFreq * t);
    const jammer = filtered
      ? 0
      : jAmp * Math.sin(2 * Math.PI * jFreq * t + 1.1) +
        jAmp * 0.35 * Math.cos(2 * Math.PI * jFreq * 2.3 * t) +
        (Math.random() - 0.5) * jAmp * 0.28;
    return { t: +(t).toFixed(4), s: +(target + jammer).toFixed(4) };
  });
}

function buildFreq(tFreq: number, jFreq: number, jAmp: number, filtered: boolean) {
  const N = 80;
  return Array.from({ length: N }, (_, k) => {
    const tBin = Math.round((tFreq / 20) * N);
    const jBin = Math.round((jFreq / 20) * N);
    const isTarget = Math.abs(k - tBin) <= 1;
    const isJammer = Math.abs(k - jBin) <= 1;
    const targetMag = isTarget ? 0.88 + Math.random() * 0.06 : Math.random() * 0.018;
    const jamMag    = isJammer && !filtered ? jAmp * 0.48 + Math.random() * 0.04 : 0;
    return { k, target: +targetMag.toFixed(4), jammer: +jamMag.toFixed(4) };
  });
}

/* ─────────────────────────── sub-components ───────────────────────── */

function BlindOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl gap-3"
      style={{ backdropFilter: "blur(8px)", background: "rgba(15,23,42,0.80)" }}
    >
      <Lock size={32} className="text-rose-500" />
      <p className="text-center font-mono leading-6 px-6">
        <span className="text-rose-400 font-bold text-sm block">SYSTEM BLIND</span>
        <span className="text-slate-400 text-xs block">Frequency Components Unknown</span>
        <span className="text-slate-600 text-[10px] block mt-1">
          Like separating mixed coffee &amp; milk in the time domain
        </span>
      </p>
    </div>
  );
}

interface PillProps { label: string; value: string; cls: string }
function Pill({ label, value, cls }: PillProps) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono ${cls}`}>
      <span className="opacity-60">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/* ─────────────────────────── main component ───────────────────────── */

export default function TabTimeFreq() {
  const [tFreq,    setTFreq]    = useState(3);
  const [jFreq,    setJFreq]    = useState(12);
  const [jAmp,     setJAmp]     = useState(2.5);
  const [dftOn,    setDftOn]    = useState(false);
  const [filtered, setFiltered] = useState(false);

  const toggleDft = useCallback(() => {
    setDftOn(v => { if (v) setFiltered(false); return !v; });
  }, []);

  const resetOnSlide = useCallback((fn: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      fn(Number(e.target.value));
      setFiltered(false);
    }, []);

  const tdData = useMemo(() => buildTime(tFreq, jFreq, jAmp, filtered), [tFreq, jFreq, jAmp, filtered]);
  const fdData = useMemo(() => buildFreq(tFreq, jFreq, jAmp, filtered), [tFreq, jFreq, jAmp, filtered]);

  /* derived state */
  const ber       = filtered ? "0.01%" : dftOn  ? "18.3%" : "48.5%";
  const berLabel  = filtered ? "Clean Payload ✓" : dftOn  ? "Partially Exposed" : "Link Failing ✗";
  const berCls    = filtered
    ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-400"
    : dftOn
    ? "border-amber-500/40 bg-amber-900/20 text-amber-400"
    : "border-rose-500/40 bg-rose-900/20 text-rose-400";

  const snr       = filtered ? "34.6 dB" : dftOn ? "9.8 dB" : "−4.2 dB";
  const waveColor = filtered ? "#10b981" : "#f97316";
  const waveGlow  = filtered ? "#10b981" : "#f97316";

  const timeLabel = filtered
    ? "RECOVERED TARGET SIGNAL — Pure Sinusoid (IDFT Reconstructed)"
    : "RECEIVED WAVEFORM — ⚠ Jammer Composite (Time Domain Blind State)";

  const modeCls   = filtered
    ? "border-emerald-500/30 bg-emerald-900/10 text-emerald-400"
    : dftOn
    ? "border-cyan-500/30 bg-cyan-900/10 text-cyan-400"
    : "border-rose-500/30 bg-rose-900/10 text-rose-400";
  const modeLabel = filtered ? "SIGNAL RECOVERED" : dftOn ? "DFT ENGINE ACTIVE" : "SYSTEM BLIND";
  const modeDot   = filtered ? "bg-emerald-400" : dftOn ? "bg-cyan-400" : "bg-rose-500";

  return (
    <div className="space-y-5">

      {/* ── CONTROL PANEL ── */}
      <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Radio size={13} className="text-cyan-400" />
          <span className="text-cyan-400 font-mono text-[11px] tracking-widest">
            SCENARIO — RESCUING WIRELESS PAYLOAD FROM JAMMING NOISE
          </span>
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono ${modeCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block ${modeDot}`} />
            {modeLabel}
          </div>
        </div>

        {/* sliders */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: "Target Data Freq", unit: "Hz",  val: tFreq, set: setTFreq, min: 1,   max: 15,  step: 1,   accent: "#22d3ee" },
            { label: "Jammer Noise Freq",unit: "Hz",  val: jFreq, set: setJFreq, min: 2,   max: 20,  step: 1,   accent: "#f87171" },
            { label: "Jammer Power",     unit: "Amp", val: jAmp,  set: setJAmp,  min: 0.5, max: 4.0, step: 0.1, accent: "#fb923c" },
          ] as const).map(({ label, unit, val, set, min, max, step, accent }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-[11px]">{label}</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: accent }}>
                  {val} {unit}
                </span>
              </div>
              <input
                type="range" min={min} max={max} step={step} value={val}
                onChange={resetOnSlide(set as (v: number) => void)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700"
                style={{ accentColor: accent }}
              />
            </div>
          ))}
        </div>

        {/* master controls row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* DFT toggle */}
          <button
            onClick={toggleDft}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              dftOn
                ? "bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-[0_0_22px_rgba(139,92,246,0.45)]"
                : "bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
            }`}
          >
            {dftOn
              ? <><Unlock size={14} /> DFT Engine ON — X-Ray Vision</>
              : <><Lock    size={14} /> Bypassed / Time Domain Only</>
            }
          </button>

          {/* scrub button */}
          <button
            onClick={() => { if (dftOn && !filtered) setFiltered(true); }}
            disabled={!dftOn || filtered}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all duration-300 ${
              filtered
                ? "bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 cursor-default"
                : dftOn
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-[0_0_18px_rgba(16,185,129,0.4)]"
                : "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed opacity-40"
            }`}
          >
            {filtered
              ? <><ShieldCheck size={14} /> Jammer Nulled ✓</>
              : <><ShieldAlert size={14} /> Scrub Jamming Noise</>
            }
          </button>

          {/* eye icon hint */}
          <div className="ml-auto text-slate-600 text-xs font-mono flex items-center gap-1.5">
            {dftOn ? <Eye size={12} className="text-cyan-500" /> : <EyeOff size={12} />}
            {dftOn ? "Spectrum visible" : "Spectrum locked"}
          </div>
        </div>
      </div>

      {/* ── DUAL CHARTS ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* LEFT — Time Domain */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Activity size={13} style={{ color: waveColor }} />
            <span className="font-mono text-[10px] leading-tight" style={{ color: waveColor }}>
              {timeLabel}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={["auto", "auto"]} />
              {/* @ts-ignore */}
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: `1px solid ${waveColor}`,
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone" dataKey="s" stroke={waveColor}
                dot={false} strokeWidth={filtered ? 2 : 1.4}
                style={{ filter: `drop-shadow(0 0 6px ${waveGlow})` }}
                isAnimationActive animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* telemetry row */}
          <div className="flex flex-wrap gap-2">
            <Pill label="BER:" value={`${ber} (${berLabel})`} cls={berCls} />
            <Pill
              label="SNR:"
              value={snr}
              cls={
                filtered
                  ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-400"
                  : dftOn
                  ? "border-amber-500/40 bg-amber-900/20 text-amber-400"
                  : "border-rose-500/40 bg-rose-900/20 text-rose-400"
              }
            />
            <Pill
              label="Mode:"
              value={filtered ? "IDFT Reconstructed" : dftOn ? "DFT Processing" : "Raw Time Domain"}
              cls="border-slate-700 bg-slate-900/40 text-slate-400"
            />
          </div>
        </div>

        {/* RIGHT — Frequency Domain */}
        <div className="relative bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Zap size={13} className={dftOn ? "text-violet-400" : "text-slate-600"} />
            <span className={`font-mono text-[10px] ${dftOn ? "text-violet-400" : "text-slate-600"}`}>
              {dftOn
                ? filtered
                  ? "FREQUENCY SPECTRUM S(ω) — Jammer Nulled via Notch Filter"
                  : "FREQUENCY SPECTRUM S(ω) — Target + Jammer Components Visible"
                : "FREQUENCY SPECTRUM S(ω) — LOCKED"
              }
            </span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fdData} barGap={1} barCategoryGap="8%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="k"
                tick={{ fill: "#475569", fontSize: 9 }}
                tickLine={false}
                label={{ value: "Frequency Bin  k →", position: "insideBottom", fill: "#475569", fontSize: 10 }}
              />
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              {/* @ts-ignore */}
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #8b5cf6",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />

              {/* target stems — green */}
              <Bar dataKey="target" name="Target Payload" radius={[3, 3, 0, 0]}
                isAnimationActive animationDuration={450}>
                {fdData.map((_, i) => (
                  <Cell
                    key={`t-${i}`}
                    fill={dftOn ? "#10b981" : "#1e293b"}
                    style={{ filter: dftOn ? "drop-shadow(0 0 5px #10b981)" : "none" }}
                  />
                ))}
              </Bar>

              {/* jammer stems — red, collapses when filtered */}
              <Bar dataKey="jammer" name="Jamming Noise" radius={[3, 3, 0, 0]}
                isAnimationActive animationDuration={450}>
                {fdData.map((_, i) => (
                  <Cell
                    key={`j-${i}`}
                    fill={dftOn && !filtered ? "#ef4444" : "#1e293b"}
                    style={{ filter: dftOn && !filtered ? "drop-shadow(0 0 10px #ef4444)" : "none" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* frosted blind overlay when DFT off */}
          {!dftOn && <BlindOverlay />}

          {/* freq telemetry */}
          <div className="flex flex-wrap gap-2">
            <Pill
              label="Target @"
              value={dftOn ? `${tFreq} Hz ✓` : "???"}
              cls={dftOn ? "border-emerald-500/40 bg-emerald-900/20 text-emerald-400" : "border-slate-700 bg-slate-900/40 text-slate-500"}
            />
            <Pill
              label="Jammer @"
              value={dftOn ? (filtered ? "NULLED ✓" : `${jFreq} Hz  ⚠`) : "???"}
              cls={
                dftOn
                  ? filtered
                    ? "border-slate-600 bg-slate-900/40 text-slate-500"
                    : "border-rose-500/40 bg-rose-900/20 text-rose-400"
                  : "border-slate-700 bg-slate-900/40 text-slate-500"
              }
            />
            <Pill
              label="Surgery:"
              value={filtered ? "Spectrum Scrub ✓" : dftOn ? "Ready to Scrub" : "Unavailable"}
              cls={
                filtered
                  ? "border-violet-500/40 bg-violet-900/20 text-violet-400"
                  : "border-slate-700 bg-slate-900/40 text-slate-400"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
