import React, { useState } from 'react';
import { Sparkles, Orbit, Award, Users, ArrowUpRight, Zap } from 'lucide-react';

interface ConstellationNode {
  id: string;
  name: string;
  level: number;
  referralsCount: number;
  status: 'active' | 'supercritical' | 'stellar';
  x: number;
  y: number;
  color: string;
}

interface ReferralConstellationGraphProps {
  creatorCode?: string;
  creatorName?: string;
  initialEnergy?: number;
}

export const ReferralConstellationGraph: React.FC<ReferralConstellationGraphProps> = ({
  creatorCode = 'CREATOR-PLUG',
  creatorName = 'You',
  initialEnergy = 4.85,
}) => {
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(initialEnergy);

  React.useEffect(() => {
    const handleEnergyUpdate = (e: CustomEvent<number>) => {
      if (e.detail != null) setEnergyLevel(e.detail);
    };
    window.addEventListener('moneyos:constellation_energy_updated', handleEnergyUpdate as EventListener);
    return () => {
      window.removeEventListener('moneyos:constellation_energy_updated', handleEnergyUpdate as EventListener);
    };
  }, []);

  // Simulated galactic constellation nodes
  const nodes: ConstellationNode[] = [
    { id: 'node_1', name: '@crypto_syndicate', level: 4, referralsCount: 38, status: 'supercritical', x: 120, y: 80, color: '#00ff88' },
    { id: 'node_2', name: '@alpha_plug', level: 3, referralsCount: 22, status: 'stellar', x: 280, y: 70, color: '#38bdf8' },
    { id: 'node_3', name: '@creator_wealth', level: 2, referralsCount: 14, status: 'active', x: 330, y: 190, color: '#a855f7' },
    { id: 'node_4', name: '@viral_shorts', level: 5, referralsCount: 57, status: 'supercritical', x: 230, y: 260, color: '#ffd700' },
    { id: 'node_5', name: '@digital_nomad', level: 2, referralsCount: 9, status: 'active', x: 90, y: 220, color: '#ec4899' },
    { id: 'node_6', name: '@tok_monetize', level: 3, referralsCount: 19, status: 'stellar', x: 50, y: 140, color: '#06b6d4' },
  ];

  const centerX = 200;
  const centerY = 160;

  return (
    <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-4">
      {/* Glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-30" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-plug-accent/15 text-plug-accent text-[10px] font-mono font-bold uppercase tracking-wider border border-plug-accent/30 mb-1">
            <Orbit className="w-3 h-3" />
            Celestial Network Web
          </div>
          <h3 className="text-lg font-black text-white">Referral Constellation Map</h3>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
          6 Active Stars
        </span>
      </div>

      {/* Constellation Canvas (SVG) */}
      <div className="w-full h-80 rounded-2xl bg-black/80 border border-slate-800/80 relative flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 400 320" className="w-full h-full">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbital Rings */}
          <circle cx={centerX} cy={centerY} r={80} fill="none" stroke="#1e293b" strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
          <circle cx={centerX} cy={centerY} r={130} fill="none" stroke="#1e293b" strokeWidth={1} strokeDasharray="4 6" opacity={0.4} />

          {/* Energy Conduits between Center & Nodes */}
          {nodes.map((node) => (
            <g key={`line_${node.id}`}>
              <line
                x1={centerX}
                y1={centerY}
                x2={node.x}
                y2={node.y}
                stroke={node.color}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                opacity={0.5}
                className="animate-pulse"
              />
            </g>
          ))}

          {/* Center Creator Supernova Star */}
          <g filter="url(#glow)">
            <circle cx={centerX} cy={centerY} r={22} fill="url(#sunGlow)" />
            <circle cx={centerX} cy={centerY} r={14} fill="#00ff88" />
            <circle cx={centerX} cy={centerY} r={8} fill="#ffffff" />
            <text x={centerX} y={centerY + 28} fill="#00ff88" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {creatorName} (Hub)
            </text>
          </g>

          {/* Orbiting Creator Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 12 : 9}
                  fill={node.color}
                  opacity={0.9}
                  filter="url(#glow)"
                />
                <circle cx={node.x} cy={node.y} r={isSelected ? 5 : 3.5} fill="#ffffff" />
                <text
                  x={node.x}
                  y={node.y - 12}
                  fill="#cbd5e1"
                  fontSize="8"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Inspector Overlay */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <div>
                <strong className="text-white block">{selectedNode.name}</strong>
                <span className="text-[10px] text-slate-400">Level {selectedNode.level} • {selectedNode.status.toUpperCase()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-plug-accent font-black block">+{selectedNode.referralsCount} Network Referrals</span>
              <span className="text-[10px] text-emerald-400">+$380.00/mo yield</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400 font-mono text-center">
        Each referred creator forms an energy node in your constellation, generating recurring ARR as their own network expands.
      </p>
    </div>
  );
};

export default ReferralConstellationGraph;
