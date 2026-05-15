"use client";
import React, { useState, useMemo } from "react";
// @ts-ignore
import {
  LineChart, Line, ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Play, Activity, Plus, ArrowRight, Zap, Target, Binary, Server } from "lucide-react";

/* ─────────────────────────────────────────────
   STRICT DATA INTERFACES
───────────────────────────────────────────── */
interface TimeData { n: number; x: number; y: number; }
interface FreqData { k: number; trueH: number; estH: number | null; }

/* ─────────────────────────────────────────────
   SIMULATION ENGINE
───────────────────────────────────────────── */
function computeChannel(noiseVariance: number, executed: boolean): { timeData: TimeData[], freqData: FreqData[] } {
  const N = 64;
  const timeData: TimeData[] = [];
  const freqData: FreqData[] = [];

  // H(k) true response
  const trueH = (k: number) => 1.2 - 0.6 * Math.sin(2 * Math.PI * k / N) + 0.3 * Math.cos(6 * Math.PI * k / N);

  // Time domain inputs
  const x = new Array(N).fill(0);
  for (let n = 0; n < N; n++) {
    // Construct an input with sufficient energy across bins
    x[n] = Math.sin(2 * Math.PI * 2 * (n/N)) + 0.8 * Math.cos(2 * Math.PI * 7 * (n/N)) + 0.5 * Math.sin(2 * Math.PI * 15 * (n/N)) + 0.5 * Math.cos(2 * Math.PI * 22 * (n/N));
  }

  // Frequency domain X[k]
  const Xre = new Array(N).fill(0);
  const Xim = new Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    for (let n = 0; n < N; n++) {
      Xre[k] += x[n] * Math.cos(-2 * Math.PI * k * n / N);
      Xim[k] += x[n] * Math.sin(-2 * Math.PI * k * n / N);
    }
  }

  // Frequency domain Y[k] with channel and noise
  const Yre = new Array(N).fill(0);
  const Yim = new Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    const H = trueH(k);
    const n_re = (Math.random() * 2 - 1) * noiseVariance * 15;
    const n_im = (Math.random() * 2 - 1) * noiseVariance * 15;
    Yre[k] = Xre[k] * H + n_re;
    Yim[k] = Xim[k] * H + n_im;
  }

  // Time domain y[n]
  const y = new Array(N).fill(0);
  for (let n = 0; n < N; n++) {
    for (let k = 0; k < N; k++) {
      y[n] += Yre[k] * Math.cos(2 * Math.PI * k * n / N) - Yim[k] * Math.sin(2 * Math.PI * k * n / N);
    }
    y[n] = y[n] / N;
    
    timeData.push({
      n,
      x: Number(x[n].toFixed(3)),
      y: Number(y[n].toFixed(3))
    });
  }

  // Estimate H[k]
  for (let k = 0; k < N; k++) {
    const Xmag = Math.sqrt(Xre[k]*Xre[k] + Xim[k]*Xim[k]);
    const Ymag = Math.sqrt(Yre[k]*Yre[k] + Yim[k]*Yim[k]);
    
    let estH = null;
    if (executed && Xmag > 5) {
      estH = Ymag / Xmag;
    }

    freqData.push({
      k,
      trueH: Number(trueH(k).toFixed(3)),
      estH: estH !== null ? Number(estH.toFixed(3)) : null
    });
  }

  return { timeData, freqData };
}

/* ─────────────────────────────────────────────
   NODE COMPONENT
───────────────────────────────────────────── */
function BlockNode({ label, sub, color, border }: { label: string, sub: string, color: string, border: string }) {
  return (
    <div className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[120px] shadow-lg`} style={{ background: color, borderColor: border }}>
      <span className="font-mono text-[10px] font-bold text-slate-200 tracking-widest">{label}</span>
      <span className="font-mono text-[9px] text-slate-400 mt-0.5">{sub}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN UI
───────────────────────────────────────────── */
export default function TabChannelEst() {
  const [noise, setNoise] = useState(0.2);
  const [executed, setExecuted] = useState(false);
  
  const { timeData, freqData } = useMemo(() => computeChannel(noise, executed), [noise, executed]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ── CONTROLS & HEADER ── */}
      <div className="flex flex-wrap items-center gap-6 bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {"Relevance of DFT to Single-Carrier Channel Estimation"}
          </h2>
          <p className="text-slate-400 text-xs font-mono mt-2">
            {"Demonstrating the mathematical simplicity: H[k] = Y[k] / X[k]"}
          </p>
        </div>
        
        <div className="flex-1 min-w-[200px] border-l border-slate-700 pl-6">
          <div className="flex justify-between mb-2">
            <label className="text-slate-400 font-mono text-[10px] tracking-widest uppercase">{"Noise Power (Variance)"}</label>
            <span className={`font-mono text-[11px] font-bold ${noise > 0.5 ? "text-red-400" : "text-emerald-400"}`}>{(noise*100).toFixed(0)}{"%"}</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={noise}
            onChange={(e) => { setNoise(parseFloat(e.target.value)); setExecuted(false); }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-800"
            style={{ background: `linear-gradient(90deg, #10b981 ${noise * 100}%, #1e293b ${noise * 100}%)` }}
          />
        </div>

        <button
          onClick={() => setExecuted(true)}
          className={`px-8 py-4 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-300 border uppercase flex items-center gap-2 ${
            executed 
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]"
          }`}
        >
          {executed ? <Target size={16} /> : <Play size={16} />}
          {"Execute DFT Channel Estimation"}
        </button>
      </div>

      {/* ── DUAL BLOCK DIAGRAMS ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-8">
        
        {/* ROW 1: Time Domain */}
        <div>
          <div className="text-slate-600 font-mono text-[10px] tracking-widest mb-4 uppercase">
            {"ROW 1: Physical Layer (Time Domain Convolution)"}
          </div>
          <div className="flex items-center justify-between gap-2 px-2">
            <BlockNode label="Input x[n]" sub="Known Preamble" color="#0f172a" border="#3b82f6" />
            <ArrowRight size={16} className="text-slate-600" />
            <BlockNode label="Channel h[n]" sub="Unknown Fading" color="#0f172a" border="#f59e0b" />
            <ArrowRight size={16} className="text-slate-600" />
            <div className="p-3 rounded-full border border-red-500 bg-red-950/30 text-red-400 flex flex-col items-center">
               <Plus size={16} />
               <span className="text-[8px] absolute -mt-4 text-red-400">{"w[n] Noise"}</span>
            </div>
            <ArrowRight size={16} className="text-slate-600" />
            <BlockNode label="Received y[n]" sub="Distorted Wave" color="#0f172a" border="#ef4444" />
          </div>
        </div>

        {/* ROW 2: Frequency Domain */}
        <div className="border-t border-slate-800 pt-6">
          <div className="text-slate-600 font-mono text-[10px] tracking-widest mb-4 uppercase">
            {"ROW 2: Processing Layer (Frequency Domain Equalization)"}
          </div>
          <div className="flex items-center justify-between gap-2 px-2">
            <BlockNode label="[ x[n], y[n] ]" sub="Sample Buffers" color="#0f172a" border="#64748b" />
            <ArrowRight size={16} className="text-slate-600" />
            <BlockNode label="DFT Engine" sub="FFT Algorithm" color="#0f172a" border="#8b5cf6" />
            <ArrowRight size={16} className="text-slate-600" />
            <div className={`px-6 py-4 rounded-xl border shadow-lg transition-all duration-700 ${executed ? "bg-emerald-900/20 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]" : "bg-slate-900 border-slate-700"}`}>
              <div className={`font-mono text-xl font-bold tracking-widest ${executed ? "text-emerald-400" : "text-slate-500"}`}>
                {"H[k] = Y[k] / X[k]"}
              </div>
              <div className="text-[9px] font-mono text-center mt-1 text-slate-500">{"(FOR X[k] ≠ 0)"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECHARTS SECTION ── */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* CHART 1: TIME DOMAIN */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-[380px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <span className="font-mono text-[10px] text-blue-400 tracking-widest uppercase">{"Time Domain Observation"}</span>
            </div>
          </div>
          <div className="flex-1">
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <LineChart data={timeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="n" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} interval={10} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={['auto', 'auto']} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #3b82f6", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
                {/* @ts-ignore */}
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="x" name="Input x[n]" stroke="#3b82f6" strokeWidth={1} dot={false} isAnimationActive={false} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="y" name="Received y[n]" stroke="#f97316" strokeWidth={1} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: FREQ DOMAIN */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-[380px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-emerald-400" />
              <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">{"Frequency Domain Estimation"}</span>
            </div>
          </div>
          <div className="flex-1">
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <ComposedChart data={freqData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} interval={10} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={[0, 2.5]} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #10b981", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
                {/* @ts-ignore */}
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="trueH" name="True Channel |H(k)|" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                {/* @ts-ignore */}
                <Scatter dataKey="estH" name="Estimated H[k]" fill="#10b981" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
