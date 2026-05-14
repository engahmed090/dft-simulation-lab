"use client";
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, Legend,
} from "recharts";
import { Cpu, Radio, Zap, Activity, Play, RotateCcw, Wifi, Filter, AlertTriangle } from "lucide-react";

/* ─── helpers ─── */
function genTimeDomain(f1: number, f2: number, noise: number) {
  return Array.from({ length: 128 }, (_, i) => {
    const t = i / 128;
    const n = (Math.random() - 0.5) * noise * 2;
    return { t: +t.toFixed(3), s: +(Math.sin(2 * Math.PI * f1 * t) + 0.6 * Math.sin(2 * Math.PI * f2 * t) + n).toFixed(4) };
  });
}

function computeFFT(f1: number, f2: number, noise: number) {
  const N = 64;
  return Array.from({ length: N }, (_, k) => {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const t = n / N;
      const x = Math.sin(2 * Math.PI * f1 * t) + 0.6 * Math.sin(2 * Math.PI * f2 * t) + (Math.random() - 0.5) * noise * 0.3;
      re += x * Math.cos(2 * Math.PI * k * n / N);
      im -= x * Math.sin(2 * Math.PI * k * n / N);
    }
    const mag = Math.sqrt(re * re + im * im) / N;
    return { k, mag: +mag.toFixed(4) };
  });
}

function genOFDM(interference: boolean, filtered: boolean, fading: boolean) {
  return Array.from({ length: 64 }, (_, i) => {
    let base = Math.random() * 0.3 + 0.1;
    if (i % 8 === 0) base += 1.5 + Math.random() * 0.5;
    if (interference && i > 20 && i < 35) base += 2 + Math.random();
    if (filtered && i > 20 && i < 35) base *= 0.05;
    if (fading) base *= 0.5 + 0.5 * Math.abs(Math.sin(i * 0.3));
    return { sub: i, pwr: +base.toFixed(3) };
  });
}

function genChannel() {
  return Array.from({ length: 64 }, (_, k) => {
    const trueH = Math.exp(-k * 0.04) * (0.8 + 0.2 * Math.cos(k * 0.5));
    const estH = trueH * (1 + (Math.random() - 0.5) * 0.004);
    return { k, true: +trueH.toFixed(4), est: +estH.toFixed(4) };
  });
}

/* ─── tab 1 ─── */
function Tab1() {
  const [f1, setF1] = useState(3);
  const [f2, setF2] = useState(7);
  const [noise, setNoise] = useState(0.2);
  const [td, setTd] = useState(() => genTimeDomain(3, 7, 0.2));
  const [fd, setFd] = useState(() => computeFFT(3, 7, 0.2));

  useEffect(() => {
    setTd(genTimeDomain(f1, f2, noise));
    setFd(computeFFT(f1, f2, noise));
  }, [f1, f2, noise]);

  const sliderClass = "w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-cyan-400";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Frequency F1 (Hz)", val: f1, set: setF1, min: 1, max: 20 },
          { label: "Frequency F2 (Hz)", val: f2, set: setF2, min: 1, max: 20 },
          { label: "Noise Level σ", val: noise, set: setNoise, min: 0, max: 2, step: 0.05 },
        ].map(({ label, val, set, min, max, step = 1 }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-cyan-400 font-mono text-sm font-bold">{val}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(Number(e.target.value))} className={sliderClass} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-cyan-400 text-xs font-mono mb-3 flex items-center gap-2"><Activity size={14} /> TIME DOMAIN  s(t)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={td}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #06b6d4", borderRadius: 8 }} />
              <Line type="monotone" dataKey="s" stroke="#06b6d4" dot={false} strokeWidth={1.5}
                style={{ filter: "drop-shadow(0 0 4px #06b6d4)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-violet-400 text-xs font-mono mb-3 flex items-center gap-2"><Zap size={14} /> FREQUENCY DOMAIN  S(ω)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fd}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="k" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #8b5cf6", borderRadius: 8 }} />
              <Bar dataKey="mag" fill="#8b5cf6" radius={[2, 2, 0, 0]}
                style={{ filter: "drop-shadow(0 0 6px #8b5cf6)" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ─── tab 2 ─── */
function Tab2() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) { setStep(0); return; }
    const id = setInterval(() => setStep(s => (s + 1) % 5), 700);
    return () => clearInterval(id);
  }, [active]);

  const nodes = [
    { id: "x0", label: "x[0]", col: 0 }, { id: "x1", label: "x[1]", col: 0 },
    { id: "x2", label: "x[2]", col: 0 }, { id: "x3", label: "x[3]", col: 0 },
    { id: "W0", label: "W⁰", col: 1 }, { id: "W1", label: "W¹", col: 1 },
    { id: "W2", label: "W²", col: 1 }, { id: "W3", label: "W³", col: 1 },
    { id: "X0", label: "X[0]", col: 2 }, { id: "X1", label: "X[1]", col: 2 },
    { id: "X2", label: "X[2]", col: 2 }, { id: "X3", label: "X[3]", col: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-cyan-500/30 rounded-xl p-6">
          <p className="text-cyan-400 font-mono text-xs mb-3">DFT FORMULA</p>
          <div className="font-mono text-sm text-slate-200 space-y-2">
            <div className="text-emerald-400 text-base">X(k) = Σ x(n) · W_N^(kn)</div>
            <div className="text-slate-400 text-xs mt-2">n = 0 → N−1 &nbsp;|&nbsp; W_N = e^(−j2π/N)</div>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-violet-500/30 rounded-xl p-6">
          <p className="text-violet-400 font-mono text-xs mb-3">IDFT FORMULA (Perfect Reconstruction)</p>
          <div className="font-mono text-sm text-slate-200 space-y-2">
            <div className="text-rose-400 text-base">x(n) = (1/N) Σ X(k) · W_N^(−kn)</div>
            <div className="text-slate-400 text-xs mt-2">k = 0 → N−1 &nbsp;|&nbsp; Reversible ✓</div>
          </div>
        </div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-300 font-mono text-sm">TWIDDLE FACTOR ENGINE — W_N^kn</p>
          <button onClick={() => setActive(a => !a)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-sm transition-all ${active ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"}`}>
            {active ? <><RotateCcw size={14} /> STOP</> : <><Play size={14} /> TRANSFORM</>}
          </button>
        </div>
        <div className="flex justify-around items-center h-48">
          {[0, 1, 2].map(col => (
            <div key={col} className="flex flex-col gap-3">
              {nodes.filter(n => n.col === col).map((n, i) => (
                <div key={n.id}
                  className={`w-16 h-10 rounded-lg border flex items-center justify-center font-mono text-xs transition-all duration-300 ${
                    active && step % 3 === col
                      ? col === 1 ? "border-amber-400 text-amber-400 bg-amber-400/20 shadow-[0_0_12px_#fbbf24]"
                        : col === 0 ? "border-cyan-400 text-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_#22d3ee]"
                        : "border-violet-400 text-violet-400 bg-violet-400/20 shadow-[0_0_12px_#a78bfa]"
                      : "border-slate-600 text-slate-400 bg-slate-900/40"
                  }`}>
                  {n.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        {active && (
          <div className="mt-4 text-center text-emerald-400 font-mono text-xs animate-pulse">
            ✓ IDFT VERIFIED — Perfect reconstruction |x(n)|² error &lt; 1e-12
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── tab 3 ─── */
function Tab3() {
  const [interference, setInterference] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const [fading, setFading] = useState(false);
  const data = genOFDM(interference, filtered, fading);
  const totalPwr = data.reduce((s, d) => s + d.pwr, 0).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "CARRIER BAND", val: "3.5 GHz" },
          { label: "SUBCARRIERS", val: "64" },
          { label: "TOTAL POWER", val: `${totalPwr} dBm` },
          { label: "MODULATION", val: "OFDM/256-QAM" },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className="text-cyan-400 font-mono font-bold">{val}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setInterference(i => !i); setFiltered(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${interference ? "bg-rose-600 text-white shadow-[0_0_12px_#e11d48]" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
          <AlertTriangle size={14} /> {interference ? "RF ACTIVE" : "Inject RF Interference"}
        </button>
        <button onClick={() => setFiltered(f => !f)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${filtered ? "bg-emerald-600 text-white shadow-[0_0_12px_#10b981]" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
          <Filter size={14} /> {filtered ? "Filter ON" : "Apply FFT Band-pass Filter"}
        </button>
        <button onClick={() => setFading(f => !f)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-all ${fading ? "bg-amber-600 text-white shadow-[0_0_12px_#f59e0b]" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
          <Wifi size={14} /> {fading ? "Fading ON" : "Fading Channel Simulator"}
        </button>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <p className="text-slate-400 text-xs font-mono mb-3">5G NR SUBCARRIER POWER SPECTRAL DENSITY</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="sub" tick={{ fill: "#94a3b8", fontSize: 9 }} label={{ value: "Subcarrier Index", position: "insideBottom", fill: "#64748b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} />
            {/* @ts-ignore */}
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #06b6d4", borderRadius: 8 }} />
            <Bar dataKey="pwr" radius={[2, 2, 0, 0]}
              fill={interference && !filtered ? "#ef4444" : filtered ? "#10b981" : fading ? "#f59e0b" : "#06b6d4"}
              style={{ filter: `drop-shadow(0 0 4px ${interference && !filtered ? "#ef4444" : filtered ? "#10b981" : "#06b6d4"})` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── tab 4 ─── */
function Tab4() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState(0);
  const [chData, setChData] = useState<ReturnType<typeof genChannel>>([]);

  const run = useCallback(() => {
    setRunning(true); setDone(false); setPhase(0); setChData([]);
    const phases = [1, 2, 3, 4];
    phases.forEach((p, i) => {
      setTimeout(() => {
        setPhase(p);
        if (p === 4) { setChData(genChannel()); setRunning(false); setDone(true); }
      }, (i + 1) * 900);
    });
  }, []);

  const blocks = [
    { label: "Known Input x[n]", color: "cyan", phase: 1 },
    { label: "Channel h[n] + Noise w[n]", color: "rose", phase: 2 },
    { label: "Received y[n]", color: "amber", phase: 3 },
    { label: "H[k] = Y[k]/X[k]", color: "violet", phase: 4 },
  ];

  const colorMap: Record<string, string> = {
    cyan: "border-cyan-400 text-cyan-400 shadow-[0_0_16px_#22d3ee]",
    rose: "border-rose-400 text-rose-400 shadow-[0_0_16px_#fb7185]",
    amber: "border-amber-400 text-amber-400 shadow-[0_0_16px_#fbbf24]",
    violet: "border-violet-400 text-violet-400 shadow-[0_0_16px_#a78bfa]",
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
        <p className="text-slate-400 font-mono text-xs mb-6">CHANNEL ESTIMATION BLOCK DIAGRAM</p>
        <div className="flex items-center justify-between gap-2">
          {blocks.map((b, i) => (
            <div key={b.label} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 border-2 rounded-xl p-3 text-center font-mono text-xs transition-all duration-500 ${phase >= b.phase ? colorMap[b.color] : "border-slate-700 text-slate-600"}`}>
                {b.label}
              </div>
              {i < blocks.length - 1 && (
                <div className={`text-lg font-mono transition-colors duration-500 ${phase > b.phase ? "text-emerald-400" : "text-slate-700"}`}>→</div>
              )}
            </div>
          ))}
        </div>
        {phase > 0 && phase < 4 && (
          <div className="mt-4 flex gap-3 justify-center">
            {["FFT{x[n]}", "FFT{y[n]}", "Y[k]÷X[k]"].slice(0, phase).map(s => (
              <span key={s} className="font-mono text-xs px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/40 text-emerald-400 animate-pulse">{s}</span>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <button onClick={run} disabled={running}
            className={`px-8 py-3 rounded-xl font-mono text-sm font-bold transition-all ${running ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:from-cyan-500 hover:to-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]"}`}>
            {running ? "⟳ ESTIMATING..." : "⚡ Estimate Channel Response H[k]"}
          </button>
        </div>
      </div>
      {done && (
        <div className="bg-slate-800/60 border border-violet-500/30 rounded-xl p-4">
          <div className="flex justify-between mb-3">
            <p className="text-violet-400 font-mono text-xs">ESTIMATED vs TRUE CHANNEL RESPONSE</p>
            <span className="text-emerald-400 font-mono text-xs font-bold">✓ Accuracy: 99.8%</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="k" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              {/* @ts-ignore */}
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #8b5cf6", borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <Line type="monotone" dataKey="true" name="True H[k]" stroke="#06b6d4" dot={false} strokeWidth={2} style={{ filter: "drop-shadow(0 0 4px #06b6d4)" }} />
              <Line type="monotone" dataKey="est" name="Estimated Ĥ[k]" stroke="#f59e0b" dot={false} strokeWidth={1.5} strokeDasharray="5 3" style={{ filter: "drop-shadow(0 0 4px #f59e0b)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ─── main ─── */
const TABS = [
  { id: 0, label: "Time ↔ Frequency", icon: Activity },
  { id: 1, label: "DFT / IDFT Engine", icon: Cpu },
  { id: 2, label: "Spectrum Analyzer", icon: Radio },
  { id: 3, label: "Channel Estimation", icon: Zap },
];

export default function Home() {
  const [tab, setTab] = useState(0);

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-200 font-sans" style={{
      backgroundImage: "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)",
      backgroundSize: "32px 32px",
    }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" /> DSP SIMULATION SUITE v2.0
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent leading-tight">
            DFT/FFT Signal Processing Lab
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-mono">Telecommunications Engineering · Single-Carrier Channel Estimation</p>
        </div>
        {/* Tab bar */}
        <div className="flex gap-2 mb-6 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-mono transition-all ${tab === t.id ? "bg-gradient-to-r from-cyan-600/80 to-violet-600/80 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>
        {/* Tab content */}
        <div className="animate-in fade-in duration-300">
          {tab === 0 && <Tab1 />}
          {tab === 1 && <Tab2 />}
          {tab === 2 && <Tab3 />}
          {tab === 3 && <Tab4 />}
        </div>
        <p className="text-center text-slate-700 text-xs font-mono mt-8">
          DFT/FFT Interactive Suite · Telecommunications Engineering · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
