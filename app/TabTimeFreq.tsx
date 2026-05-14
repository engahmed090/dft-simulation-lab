"use client";
import React, { useState, useMemo } from "react";
// @ts-ignore
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Zap, Lock, Unlock, Prism, Mic2, Activity, SplitSquareVertical } from "lucide-react";

/* ── DATA GENERATORS ── */
const COLORS = [
  { n: "Red", f: 2, c: "#ef4444" },
  { n: "Orange", f: 4, c: "#f97316" },
  { n: "Yellow", f: 6, c: "#eab308" },
  { n: "Green", f: 8, c: "#22c55e" },
  { n: "Blue", f: 10, c: "#3b82f6" },
  { n: "Violet", f: 12, c: "#a855f7" }
];

function getPrismT() {
  return Array.from({ length: 200 }, (_, i) => {
    const t = i / 200;
    const s = COLORS.reduce((acc, c) => acc + Math.sin(2 * Math.PI * c.f * t), 0);
    return { t: +t.toFixed(4), s: +s.toFixed(4) };
  });
}

function getPrismF() {
  return Array.from({ length: 15 }, (_, k) => {
    const match = COLORS.find(c => c.f === k);
    return {
      k, mag: match ? 1 : 0.05, fill: match ? match.c : "#1e293b", name: match ? match.n : "None"
    };
  });
}

function getVoiceT() {
  return Array.from({ length: 300 }, (_, i) => {
    const t = i / 300;
    const env = Math.exp(-Math.pow(t - 0.5, 2) * 20) * (0.8 + 0.2 * Math.random());
    const formants = 1.5 * Math.sin(2 * Math.PI * 15 * t) +
                     0.8 * Math.sin(2 * Math.PI * 35 * t + 1.2) +
                     0.4 * Math.sin(2 * Math.PI * 60 * t - 0.5) +
                     (Math.random() - 0.5) * 0.3;
    return { t: +t.toFixed(4), s: +(formants * env).toFixed(4) };
  });
}

function getVoiceF() {
  const N = 80;
  return Array.from({ length: N }, (_, k) => {
    let mag = 0.02 + Math.random() * 0.05;
    let phase = (Math.random() - 0.5) * 2 * Math.PI;

    if (Math.abs(k - 15) < 3) { mag += 1.5; phase = Math.PI / 4; }
    if (Math.abs(k - 35) < 3) { mag += 0.8; phase = -Math.PI / 3; }
    if (Math.abs(k - 60) < 2) { mag += 0.4; phase = Math.PI / 2; }
    
    if (phase > Math.PI) phase -= 2 * Math.PI;
    if (phase < -Math.PI) phase += 2 * Math.PI;

    return { k, mag: +mag.toFixed(4), phase: +phase.toFixed(4) };
  });
}

/* ── OVERLAY ── */
function BlindOverlay({ text, subtext }: { text: string; subtext: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl gap-3 shadow-2xl"
         style={{ backdropFilter: "blur(12px)", background: "rgba(15,23,42,0.85)" }}>
      <Lock size={36} className="text-rose-500" />
      <p className="text-center font-mono leading-6 px-8">
        <span className="text-rose-400 font-bold text-[13px] block tracking-widest">{text}</span>
        <span className="text-slate-400 text-xs block mt-2">{subtext}</span>
      </p>
    </div>
  );
}

export default function TabTimeFreq() {
  const [scenario, setScenario] = useState<1 | 2>(1);
  const [dftOn, setDftOn] = useState(false);

  const prismTd = useMemo(() => getPrismT(), []);
  const prismFd = useMemo(() => getPrismF(), []);
  const voiceTd = useMemo(() => getVoiceT(), []);
  const voiceFd = useMemo(() => getVoiceF(), []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── TOP SWITCHERS ── */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        <div className="flex gap-4 p-1.5 bg-slate-950/50 rounded-xl border border-slate-800">
          <button onClick={() => { setScenario(1); setDftOn(false); }}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-lg font-mono text-sm transition-all duration-300 ${scenario === 1 ? "bg-slate-800 text-white shadow-lg border border-slate-600" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}`}>
            <Prism size={18} className={scenario === 1 ? "text-cyan-400" : ""} />
            SCENARIO 1: LIGHT PRISM ANALOGY
          </button>
          <button onClick={() => { setScenario(2); setDftOn(false); }}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-lg font-mono text-sm transition-all duration-300 ${scenario === 2 ? "bg-slate-800 text-white shadow-lg border border-slate-600" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}`}>
            <Mic2 size={18} className={scenario === 2 ? "text-cyan-400" : ""} />
            SCENARIO 2: COMPLEX SURAT VOCAL PAYLOAD
          </button>
        </div>

        <div className="flex items-center justify-center pt-2">
          <button onClick={() => setDftOn(!dftOn)}
            className={`flex items-center justify-center gap-4 px-12 py-5 rounded-2xl font-mono text-lg font-bold tracking-widest transition-all duration-500 ${dftOn ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 text-white shadow-[0_0_35px_rgba(217,70,239,0.4)]" : "bg-slate-800 border-2 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"}`}>
            {dftOn ? <><Unlock size={22} className="animate-pulse" /> DFT PARSING ACTIVE</> : <><Lock size={22} /> ACTIVATE DFT ENGINE</>}
          </button>
        </div>
      </div>

      {/* ── SCENARIO 1: PRISM ── */}
      {scenario === 1 && (
        <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity size={15} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)]" />
              <span className="font-mono text-xs text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)] tracking-wider">UNIFIED COMPOSITE WAVEFORM s(t) (WHITE LIGHT)</span>
            </div>
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height={320}>
              {/* @ts-ignore */}
              <LineChart data={prismTd}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #fff", borderRadius: 8, color: "#fff", fontFamily: "monospace" }} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="s" stroke="#ffffff" dot={false} strokeWidth={2.5} style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Prism size={15} className={dftOn ? "text-fuchsia-400" : "text-slate-600"} />
              <span className={`font-mono text-xs tracking-wider ${dftOn ? "text-fuchsia-400" : "text-slate-600"}`}>DISCRETE SPECTRUM S(ω) — COLOR WAVELENGTHS</span>
            </div>
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height={320}>
              {/* @ts-ignore */}
              <BarChart data={prismFd} barCategoryGap="20%">
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #d946ef", borderRadius: 8, fontFamily: "monospace" }} />
                {/* @ts-ignore */}
                <Bar dataKey="mag" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={600}>
                  {prismFd.map((entry, i) => (
                    // @ts-ignore
                    <Cell key={`cell-${i}`} fill={entry.fill} style={entry.fill !== "#1e293b" ? { filter: `drop-shadow(0 0 10px ${entry.fill})` } : {}} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {!dftOn && <BlindOverlay text="BLIND STATE" subtext="Unified wavelengths merged. Internal components unreadable." />}
          </div>
        </div>
      )}

      {/* ── SCENARIO 2: VOICE ── */}
      {scenario === 2 && (
        <div className="grid grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="col-span-5 bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Mic2 size={15} className="text-cyan-400" />
              <span className="font-mono text-xs text-cyan-400 tracking-wider">COMPLEX VOCAL PAYLOAD s(t)</span>
            </div>
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height={480}>
              {/* @ts-ignore */}
              <LineChart data={voiceTd} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #22d3ee", borderRadius: 8, fontFamily: "monospace" }} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="s" stroke="#22d3ee" dot={false} strokeWidth={1} style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.6))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-7 relative bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-xl overflow-hidden">
            <div className="flex-1 p-5 border-b border-slate-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <SplitSquareVertical size={14} className={dftOn ? "text-amber-400" : "text-slate-600"} />
                <span className={`font-mono text-[11px] tracking-wider ${dftOn ? "text-amber-400" : "text-slate-600"}`}>MAGNITUDE SPECTRUM |X(ω)|</span>
              </div>
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <BarChart data={voiceFd} barGap={0} barCategoryGap="10%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  {/* @ts-ignore */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  {/* @ts-ignore */}
                  <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
                  {/* @ts-ignore */}
                  <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
                  {/* @ts-ignore */}
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #fbbf24", borderRadius: 8, fontFamily: "monospace" }} />
                  {/* @ts-ignore */}
                  <Bar dataKey="mag" fill="#fbbf24" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={600} style={{ filter: dftOn ? "drop-shadow(0 0 5px rgba(251,191,36,0.5))" : "none" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <SplitSquareVertical size={14} className={dftOn ? "text-indigo-400" : "text-slate-600"} />
                <span className={`font-mono text-[11px] tracking-wider ${dftOn ? "text-indigo-400" : "text-slate-600"}`}>PHASE SPECTRUM ∠X(ω) [-π to +π]</span>
              </div>
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  {/* @ts-ignore */}
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  {/* @ts-ignore */}
                  <XAxis dataKey="k" type="number" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={[0, 79]} />
                  {/* @ts-ignore */}
                  <YAxis dataKey="phase" type="number" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={[-3.15, 3.15]} ticks={[-3.14, 0, 3.14]} tickFormatter={(v) => v === 0 ? "0" : v > 0 ? "+π" : "-π"} />
                  {/* @ts-ignore */}
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: "#0f172a", border: "1px solid #818cf8", borderRadius: 8, fontFamily: "monospace" }} />
                  {/* @ts-ignore */}
                  <Scatter name="Phase" data={voiceFd} fill="#818cf8" shape="circle" isAnimationActive animationDuration={600} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {!dftOn && <BlindOverlay text="CRITICAL BLINDNESS" subtext="Magnitude and Phase geometry locked inside raw time-domain chaos." />}
          </div>
        </div>
      )}
    </div>
  );
}
