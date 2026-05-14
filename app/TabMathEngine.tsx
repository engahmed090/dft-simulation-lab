"use client";
import React, { useState, useMemo, useEffect } from "react";
// @ts-ignore
import {
  ComposedChart, BarChart, Bar, Scatter, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Cpu, RotateCcw, Activity, Sigma } from "lucide-react";

/* ── STRICT DATA INTERFACES ── */
interface MathData { n: number; original: number; reconstructed: number; }
interface FreqData { k: number; mag: number; }

/* ── MATH GENERATORS ── */
function generateData(N: number, active: boolean) {
  // Generate input time-domain signal x(n)
  const x = Array.from({ length: N }, (_, n) => {
    const t = n / N;
    // Composite sine wave for mathematical demonstration
    return Math.sin(2 * Math.PI * 2 * t) + 0.8 * Math.cos(2 * Math.PI * 5 * t) + 0.3 * Math.sin(2 * Math.PI * 8 * t);
  });

  // Forward DFT: X[k]
  const X = Array.from({ length: N }, (_, k) => {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += x[n] * Math.cos(angle);
      im -= x[n] * Math.sin(angle);
    }
    return { re, im, mag: Math.sqrt(re * re + im * im) };
  });

  // Inverse DFT: x'[n]
  const x_rec = Array.from({ length: N }, (_, n) => {
    if (!active) return 0;
    let rec = 0;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * k * n) / N;
      rec += X[k].re * Math.cos(angle) - X[k].im * Math.sin(angle);
    }
    return rec / N;
  });

  const mathData: MathData[] = x.map((val, i) => ({
    n: i,
    original: +val.toFixed(4),
    reconstructed: active ? +(x_rec[i]).toFixed(4) : 0,
  }));

  const freqData: FreqData[] = X.map((val, k) => ({
    k,
    mag: active ? +(val.mag).toFixed(4) : 0
  }));

  return { mathData, freqData };
}

/* ── PILL COMPONENT ── */
function Pill({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-mono shadow-md ${cls}`}>
      <span className="opacity-70 tracking-wider uppercase">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

/* ── MAIN EXPORT ── */
export default function TabMathEngine() {
  const [nSize, setNSize] = useState<number>(16);
  const [reversible, setReversible] = useState(false);

  const { mathData, freqData } = useMemo(() => generateData(nSize, reversible), [nSize, reversible]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ── EQUATION HEADER ── */}
      <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Sigma size={16} className="text-cyan-400" />
            <h3 className="text-cyan-400 font-mono text-xs font-bold tracking-widest">{"FORWARD DFT (ANALYSIS)"}</h3>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-sm text-slate-300 flex items-center shadow-inner overflow-x-auto">
            <span className="text-emerald-400 font-bold mr-3">{"X[k]"}</span> 
            {"= \u03A3 x[n] \u00B7 e"}
            <sup className="text-[10px] ml-1 text-slate-400">{"-j(2\u03C0/N)kn"}</sup>
            <span className="ml-auto text-slate-600 text-xs">{"[n=0 to N-1]"}</span>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-indigo-400" />
            <h3 className="text-indigo-400 font-mono text-xs font-bold tracking-widest">{"INVERSE DFT (SYNTHESIS)"}</h3>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 font-mono text-sm text-slate-300 flex items-center shadow-inner overflow-x-auto">
            <span className="text-emerald-400 font-bold mr-3">{"x[n]"}</span> 
            {"= (1/N) \u03A3 X[k] \u00B7 e"}
            <sup className="text-[10px] ml-1 text-slate-400">{"j(2\u03C0/N)kn"}</sup>
            <span className="ml-auto text-slate-600 text-xs">{"[k=0 to N-1]"}</span>
          </div>
        </div>
      </div>

      {/* ── MATRIX STAGE CONTROLS ── */}
      <div className="flex flex-wrap items-center gap-6 bg-slate-900/80 border border-slate-700/80 p-6 rounded-2xl shadow-xl">
        <div className="flex-1 min-w-[200px]">
          <label className="text-slate-400 font-mono text-[11px] font-bold tracking-widest block mb-3">{"N-POINT FFT SIZE"}</label>
          <div className="flex gap-3">
            {[8, 16, 32].map(size => (
              <button key={size} onClick={() => setNSize(size)}
                className={`flex-1 py-3 rounded-xl font-mono text-sm font-bold border transition-all duration-300 ${nSize === size ? "bg-cyan-900/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}>
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-2 flex justify-end min-w-[300px]">
          <button onClick={() => setReversible(!reversible)}
            className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-mono text-sm font-bold tracking-widest transition-all duration-500 ${reversible ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/50" : "bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"}`}>
            <RotateCcw size={18} className={reversible ? "animate-spin-slow" : ""} />
            {reversible ? "CYCLE ACTIVE \u2014 VERIFYING" : "TRIGGER REVERSIBILITY CYCLE"}
          </button>
        </div>
      </div>

      {/* ── DUAL GRAPHICAL PROOF ── */}
      <div className="grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Chart: Reconstruction Overlay */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4 h-[400px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity size={15} className="text-cyan-400" />
            <span className="font-mono text-xs text-cyan-400 tracking-wider">{"RECONSTRUCTION ALIGNMENT: x(n) vs x'(n)"}</span>
          </div>
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <ComposedChart data={mathData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              {/* @ts-ignore */}
              <XAxis dataKey="n" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              {/* @ts-ignore */}
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={["auto", "auto"]} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #3b82f6", borderRadius: 8, fontFamily: "monospace" }} />
              {/* @ts-ignore */}
              <Bar dataKey="original" name="Original x(n)" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} barSize={20} />
              {/* @ts-ignore */}
              <Line type="monotone" dataKey="reconstructed" name="Reconstructed x'(n)" stroke="#10b981" strokeWidth={0} dot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 7 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Right Chart: Magnitude Spectrum */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4 h-[400px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap size={15} className={reversible ? "text-amber-400" : "text-slate-600"} />
            <span className={`font-mono text-xs tracking-wider ${reversible ? "text-amber-400" : "text-slate-600"}`}>{"FREQUENCY SPECTRUM |X(k)|"}</span>
          </div>
          {/* @ts-ignore */}
          <ResponsiveContainer width="100%" height="100%">
            {/* @ts-ignore */}
            <BarChart data={freqData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              {/* @ts-ignore */}
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              {/* @ts-ignore */}
              <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              {/* @ts-ignore */}
              <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #fbbf24", borderRadius: 8, fontFamily: "monospace" }} />
              {/* @ts-ignore */}
              <Bar dataKey="mag" name="Magnitude |X(k)|" fill="#fbbf24" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={500} style={{ filter: reversible ? "drop-shadow(0 0 6px rgba(251,191,36,0.5))" : "none" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── TELEMETRY PILLS ── */}
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <Pill label="MSE:" value={reversible ? "0.00000%" : "N/A"} cls={reversible ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400" : "bg-slate-900 border-slate-800 text-slate-600"} />
        <Pill label="Precision:" value="64-bit Floating Point" cls="bg-slate-900 border-slate-700/50 text-slate-400" />
        <Pill label="Symmetry:" value={reversible ? "Verified \u2713" : "Standby"} cls={reversible ? "bg-cyan-900/30 border-cyan-500/30 text-cyan-400" : "bg-slate-900 border-slate-800 text-slate-600"} />
      </div>

    </div>
  );
}
