"use client";
import React, { useState } from "react";
import TabTimeFreq from "./TabTimeFreq";
import { Activity, Cpu, Radio, Zap } from "lucide-react";

const TABS = [
  { id: 0, label: "Time ↔ Frequency", icon: Activity },
  { id: 1, label: "DFT / IDFT Engine", icon: Cpu },
  { id: 2, label: "Spectrum Analyzer", icon: Radio },
  { id: 3, label: "Channel Estimation", icon: Zap },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 font-sans" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)",
      backgroundSize: "32px 32px",
    }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ── HEADER ── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" /> DSP SIMULATION SUITE v3.0
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent leading-tight">
            Telecommunications Engineering & Signal Processing Suite
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-mono">Master DFT/FFT Interactive Simulation Environment</p>
        </div>

        {/* ── TAB SWITCHER ── */}
        <div className="flex gap-2 mb-6 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700 shadow-lg">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-mono transition-all duration-300 ${
                  activeTab === t.id 
                    ? "bg-gradient-to-r from-cyan-600/80 to-violet-600/80 text-white shadow-md border border-cyan-500/30" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent"
                }`}>
                {/* @ts-ignore */}
                <Icon size={16} className={activeTab === t.id ? "text-cyan-200" : "text-slate-500"} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT RENDERING ── */}
        <div className="animate-in fade-in zoom-in-95 duration-500">
          
          {/* Active Tab 0: Safely imported independent component */}
          {activeTab === 0 && <TabTimeFreq />}
          
          {/* Active Tab 1: Safe Placeholder */}
          {activeTab === 1 && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-16 text-center shadow-xl">
              <Cpu size={56} className="mx-auto text-slate-600 mb-6 animate-pulse" />
              <h2 className="text-2xl font-mono text-slate-300 font-bold tracking-widest">Tab 2: Mathematical Engine Loading...</h2>
              <p className="text-slate-500 font-mono text-sm mt-3">Matrix Operations and Twiddle Factors are currently compiling securely.</p>
            </div>
          )}

          {/* Active Tab 2: Safe Placeholder */}
          {activeTab === 2 && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-16 text-center shadow-xl">
              <Radio size={56} className="mx-auto text-slate-600 mb-6 animate-pulse" />
              <h2 className="text-2xl font-mono text-slate-300 font-bold tracking-widest">Tab 3: Spectrum Analyzer Loading...</h2>
              <p className="text-slate-500 font-mono text-sm mt-3">5G OFDM subcarriers and interference vectors initializing securely.</p>
            </div>
          )}

          {/* Active Tab 3: Safe Placeholder */}
          {activeTab === 3 && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-16 text-center shadow-xl">
              <Zap size={56} className="mx-auto text-slate-600 mb-6 animate-pulse" />
              <h2 className="text-2xl font-mono text-slate-300 font-bold tracking-widest">Tab 4: Channel Estimation Loading...</h2>
              <p className="text-slate-500 font-mono text-sm mt-3">H[k] = Y[k]/X[k] algorithm environment booting securely.</p>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
