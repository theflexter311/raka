import React from 'react';
import { X } from 'lucide-react';
import { HudSnapshot, ZoneId } from '../game/types';

interface CastleMapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
}

const CASTLE_ZONES: Array<{
  id: ZoneId;
  label: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hasAltar?: boolean;
  hasChest?: boolean;
  isBoss?: boolean;
}> = [
  {
    id: 'CRUCIBLE',
    label: 'Outer Gatehouse',
    subtitle: 'Altar · Chest · Spatial Sever Relic',
    x: 24,
    y: 168,
    w: 120,
    h: 58,
    hasAltar: true,
    hasChest: true,
  },
  {
    id: 'CATACOMBS',
    label: 'Crimson Undercroft',
    subtitle: 'Altar · Chest · Chrono-Fracture Relic',
    x: 164,
    y: 174,
    w: 118,
    h: 82,
    hasAltar: true,
    hasChest: true,
  },
  {
    id: 'SPIRE',
    label: 'Grand Belltower',
    subtitle: 'Chained Spans · Chest · Temporal Crushers',
    x: 302,
    y: 72,
    w: 102,
    h: 152,
    hasChest: true,
  },
  {
    id: 'SANCTUM',
    label: 'Royal Chapel',
    subtitle: 'Final Blood Altar · Treasury Chest',
    x: 424,
    y: 72,
    w: 96,
    h: 54,
    hasAltar: true,
    hasChest: true,
  },
  {
    id: 'THRONE',
    label: 'Sovereign Throne',
    subtitle: 'Lord Vaelor, Hollowed Sentinel',
    x: 540,
    y: 56,
    w: 116,
    h: 72,
    isBoss: true,
  },
];

export const CastleMapModal: React.FC<CastleMapModalProps> = ({ hud, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-[#0B0A10] border border-white/15 p-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-wide text-[#F5EFE6]">
              Castle Virel · Cartography
            </h2>
            <p className="text-xs text-[#A39B8F] mt-0.5">
              Current Location: <span className="text-[#EAE4D8] font-medium">{hud.zoneName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close castle map"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EAE4D8] bg-[#161520] border border-white/15 hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close [M]</span>
          </button>
        </div>

        <svg
          viewBox="0 0 680 290"
          className="w-full h-auto bg-[#06050A] border border-white/10 mb-5"
          aria-label="Castle Virel full map"
        >
          {/* Castle Wing Connectors */}
          <line x1="144" y1="196" x2="164" y2="196" stroke="#71717A" strokeWidth="3" />
          <line x1="282" y1="198" x2="302" y2="198" stroke="#71717A" strokeWidth="3" />
          <line x1="404" y1="98" x2="424" y2="98" stroke="#71717A" strokeWidth="3" />
          <line x1="520" y1="98" x2="540" y2="98" stroke="#71717A" strokeWidth="3" />

          {CASTLE_ZONES.map((z) => {
            const visited = hud.visitedZones.includes(z.id);
            const active = hud.zoneId === z.id;
            return (
              <g key={z.id}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  fill={
                    active
                      ? 'rgba(225, 29, 72, 0.28)'
                      : visited
                        ? 'rgba(39, 39, 50, 0.6)'
                        : 'rgba(18, 18, 24, 0.4)'
                  }
                  stroke={
                    active
                      ? '#F43F5E'
                      : visited
                        ? '#A1A1AA'
                        : 'rgba(255,255,255,0.14)'
                  }
                  strokeWidth={active ? 2 : 1.2}
                />
                <text
                  x={z.x + z.w / 2}
                  y={z.y + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={visited || active ? '#F5EFE6' : '#71717A'}
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {z.label}
                </text>

                {z.hasAltar && (
                  <circle cx={z.x + 14} cy={z.y + z.h - 14} r={4} fill="#F43F5E" />
                )}
                {z.hasChest && (
                  <rect
                    x={z.x + z.w - 18}
                    y={z.y + z.h - 18}
                    width={8}
                    height={8}
                    fill="#F59E0B"
                  />
                )}
                {z.isBoss && (
                  <text
                    x={z.x + z.w / 2}
                    y={z.y + z.h / 2 + 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#FDA4AF"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    LORD VAELOR
                  </text>
                )}

                {active && (
                  <circle
                    cx={z.x + hud.playerNormPos.x * z.w}
                    cy={z.y + hud.playerNormPos.y * z.h}
                    r={5.5}
                    fill="#FDE047"
                    stroke="#050508"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#C9C1B4]">
          <div className="flex items-center flex-wrap gap-5">
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#FDE047]" />
              You
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#F43F5E]" />
              Blood Altar
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#F59E0B]" />
              Gilded Chest
            </span>
          </div>
          <span className="font-mono-tabular text-[11px] text-[#A39B8F]">
            Explored: {hud.visitedZones.length} / 5 Wings
          </span>
        </div>
      </div>
    </div>
  );
};
