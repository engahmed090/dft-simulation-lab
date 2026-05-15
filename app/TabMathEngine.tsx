"use client";
import React, { useState, useEffect, useMemo } from "react";
// @ts-ignore
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { Radio, Activity, Zap, Server, ShieldCheck, Power } from "lucide-react";

/* ─────────────────────────────────────────────
   STRICT DATA INTERFACES
───────────────────────────────────────────── */
interface WavePoint { t: number; tx: number; rx: number; }
interface FreqPoint { k: string; rawMag: number; eqMag: number; }

/* ─────────────────────────────────────────────
   ENTERPRISE SIGNAL GENERATORS
───────────────────────────────────────────── */
function generateSignals(tick: number): { timeData: WavePoint[], freqData: FreqPoint[] } {
  const N = 128;
  const timeData: WavePoint[] = [];
  
  // Fading and Noise parameters simulating atmospheric/multipath degradation
  const attenuation = 0.4;
  const noiseFloor = 1.2;
  const multipathDelay = 5;

  const rawTx: number[] = [];

  // Generate TX
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const signal = 
      Math.sin(2 * Math.PI * 4 * t + tick * 0.05) * 1.0 +
      Math.cos(2 * Math.PI * 12 * t + tick * 0.03) * 0.8 +
      Math.sin(2 * Math.PI * 24 * t + tick * 0.07) * 0.6 +
      Math.cos(2 * Math.PI * 36 * t + tick * 0.04) * 0.4;
    rawTx.push(signal);
  }

  // Generate RX with multipath and noise
  for (let i = 0; i < N; i++) {
    const mainPath = rawTx[i] * attenuation;
    const echoPath = i >= multipathDelay ? rawTx[i - multipathDelay] * (attenuation * 0.6) : 0;
    const noise = (Math.random() * 2 - 1) * noiseFloor;
    
    // Add severe chaotic spikes periodically
    const spike = Math.random() > 0.95 ? (Math.random() > 0.5 ? 2.5 : -2.5) : 0;
    
    timeData.push({
      t: i,
      tx: Number(rawTx[i].toFixed(3)),
      rx: Number((mainPath + echoPath + noise + spike).toFixed(3))
    });
  }

  // Frequency Data (Simulating DFT Equalization)
  const freqData: FreqPoint[] = [];
  const carriers = [4, 12, 24, 36, 42, 48]; // Target backbone carriers
  for (let k = 0; k < 64; k++) {
    let isCarrier = false;
    for (let j = 0; j < carriers.length; j++) {
      if (carriers[j] === k) isCarrier = true;
    }

    const baseEq = isCarrier ? 0.8 + (Math.sin(tick * 0.1 + k) * 0.1) : 0.05;
    
    // Raw received magnitude is completely distorted/attenuated
    const rawMag = isCarrier ? baseEq * attenuation * (Math.random() * 0.5 + 0.5) : (Math.random() * 0.3);
    
    // Equalizer perfectly recovers magnitude via channel estimation matrix
    const eqMag = isCarrier ? baseEq : (Math.random() * 0.05);

    freqData.push({
      k: k.toString(),
      rawMag: Number(rawMag.toFixed(3)),
      eqMag: Number(eqMag.toFixed(3))
    });
  }

  return { timeData, freqData };
}

/* ─────────────────────────────────────────────
   PIPELINE COMPONENT
───────────────────────────────────────────── */
interface NodeProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  color: string;
}
function PipeNode({ icon, label, sublabel, active, color }: NodeProps) {
  return (
    <div
      style={{
        border: `1px solid ${active ? color : "#1e293b"}`,
        boxShadow: active ? `0 0 15px ${color}40` : "none",
        background: active ? `${color}10` : "#0f172a",
        transition: "all 0.5s ease"
      }}
      className="rounded-xl p-4 flex flex-col items-center gap-2 w-[160px] relative z-10"
    >
      <div style={{ color: active ? color : "#475569", transition: "color 0.5s" }}>{icon}</div>
      <div className="text-center">
        <div className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: active ? color : "#475569" }}>{label}</div>
        <div className="text-slate-500 text-[9px] font-mono mt-1">{sublabel}</div>
      </div>
    </div>
  );
}

function ArrowLink({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex-1 h-1 relative -mx-2 z-0" style={{ minWidth: "40px" }}>
      <div className="absolute inset-0" style={{ background: "#1e293b" }} />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${color})`,
          width: active ? "100%" : "0%",
          transition: "width 1s ease",
          boxShadow: active ? `0 0 10px ${color}` : "none"
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function TabMathEngine() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    let intervalId: any;
    if (running) {
      intervalId = setInterval(() => setTick(t => t + 1), 100);
    } else {
      setStage(0);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (tick === 4) setStage(1);
    if (tick === 12) setStage(2);
    if (tick === 20) setStage(3);
    if (tick === 26) setStage(4);
  }, [tick, running]);

  const { timeData, freqData } = useMemo(() => generateSignals(tick), [tick]);

  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-950/50 rounded-lg border border-blue-500/30">
            <Server size={24} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-slate-200 font-mono text-sm font-bold tracking-widest uppercase">
              {"Enterprise Microwave Backbone Link"}
            </h2>
            <p className="text-slate-500 font-mono text-[10px] mt-1">
              {"Simulating Multipath Fading, Attenuation, and DFT Equalization Recovery"}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setTick(0); setStage(0); setRunning(r => !r); }}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-mono text-xs font-bold tracking-widest transition-all duration-300 border uppercase ${
            running
              ? "bg-red-950/40 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              : "bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]"
          }`}
        >
          {running ? <Power size={16} /> : <Zap size={16} />}
          <span>{running ? "Terminate Link" : "Initialize Backbone Transmission"}</span>
        </button>
      </div>

      {/* ── ARCHITECTURE PIPELINE ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.1)_0,transparent_100%)] pointer-events-none" />
        <div className="text-slate-600 font-mono text-[10px] tracking-widest mb-6 uppercase border-b border-slate-800 pb-2">
          {"Layer 1 Physical Transmission Pipeline"}
        </div>
        <div className="flex items-center justify-between px-4">
          
          <PipeNode icon={<Activity size={24} />} label="TX NODE" sublabel="Clean QAM Signal" active={stage >= 1} color="#3b82f6" />
          <ArrowLink active={stage >= 2} color="#3b82f6" />
          
          <PipeNode icon={<Radio size={24} className={running && stage >= 2 ? "animate-pulse" : ""} />} label="ATMOSPHERIC CHANNEL" sublabel="Multipath + Severe Noise" active={stage >= 2} color="#f97316" />
          <ArrowLink active={stage >= 3} color="#f97316" />
          
          <PipeNode icon={<Activity size={24} />} label="RX NODE" sublabel="Degraded Capture" active={stage >= 3} color="#ef4444" />
          <ArrowLink active={stage >= 4} color="#ef4444" />
          
          <PipeNode icon={<ShieldCheck size={24} />} label="DFT EQUALIZER" sublabel="Sub-carrier Recovery" active={stage >= 4} color="#10b981" />
          
        </div>
      </div>

      {/* ── CHANNEL MEDIUM VISUALIZATION ── */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="text-amber-500 font-mono text-[10px] tracking-widest mb-4 uppercase flex items-center gap-2">
          <Zap size={12} /> {"The Channel Medium (Time-Domain Wave Degredation)"}
        </div>
        <div className="h-24 w-full bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center">
          {/* Animated wave passing through */}
          <div className="absolute left-0 h-full w-full flex items-center px-2">
            {timeData.filter((_, i) => i % 2 === 0).map((pt, i) => (
              <div 
                key={i} 
                className="flex-1 flex items-center justify-center h-full relative"
              >
                {/* Clean Wave Indicator */}
                <div 
                  className="absolute w-1 rounded-full bg-blue-500/20"
                  style={{ height: running && stage >= 1 ? `${Math.abs(pt.tx) * 20 + 2}px` : '2px', transition: 'height 0.2s' }}
                />
                {/* Degraded Wave Indicator */}
                <div 
                  className="absolute w-1.5 rounded-full"
                  style={{ 
                    height: running && stage >= 2 ? `${Math.abs(pt.rx) * 15 + 2}px` : '0px', 
                    background: stage >= 2 ? (Math.abs(pt.rx) > 2 ? '#ef4444' : '#f97316') : 'transparent',
                    boxShadow: stage >= 2 ? `0 0 8px ${Math.abs(pt.rx) > 2 ? '#ef4444' : '#f97316'}` : 'none',
                    transition: 'height 0.05s',
                    zIndex: 10
                  }}
                />
              </div>
            ))}
          </div>
          <div className="absolute right-4 top-2 text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {"[SIMULATING 20km RF LINK]"}
          </div>
        </div>
      </div>

      {/* ── RECHARTS ── */}
      <div className="grid grid-cols-2 gap-6">
        
        {/* CHART 1: Degraded Time-Domain */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-[360px] flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Activity size={14} className="text-red-400" />
            <span className="font-mono text-[10px] text-red-400 tracking-widest uppercase">
              {"Degraded Time-Domain Waveform"}
            </span>
          </div>
          <div className="flex-1">
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <LineChart data={timeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                {/* @ts-ignore */}
                <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} interval={20} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={[-4, 4]} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #ef4444", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
                {/* @ts-ignore */}
                <Line type="monotone" dataKey="rx" name="Received Signal" stroke={running && stage >= 3 ? "#ef4444" : "#475569"} strokeWidth={1} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Equalized Frequency Domain */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-xl h-[360px] flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
              {"Recovered Spectrum (DFT Equalization)"}
            </span>
          </div>
          <div className="flex-1">
            {/* @ts-ignore */}
            <ResponsiveContainer width="100%" height="100%">
              {/* @ts-ignore */}
              <BarChart data={freqData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="10%">
                {/* @ts-ignore */}
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                {/* @ts-ignore */}
                <XAxis dataKey="k" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} interval={7} />
                {/* @ts-ignore */}
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} domain={[0, 1]} />
                {/* @ts-ignore */}
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #10b981", borderRadius: 8, fontFamily: "monospace", fontSize: 10 }} />
                {/* @ts-ignore */}
                <Bar dataKey="rawMag" name="Raw Rx (Distorted)" fill={running && stage >= 3 ? "#f97316" : "#1e293b"} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                {/* @ts-ignore */}
                <Bar dataKey="eqMag" name="Recovered (Equalized)" fill={running && stage >= 4 ? "#10b981" : "#1e293b"} isAnimationActive={false} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
