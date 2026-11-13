import React from 'react';
import { HudSnapshot } from '../game/types';

interface OverlayModalsProps {
  hud: HudSnapshot;
  showControlsModal: boolean;
  hidePauseCard?: boolean;
  onCloseControls: () => void;
  onOpenControls: () => void;
  onResume: () => void;
  onRespawnAtAltar: () => void;
  onRestartGame: () => void;
  onReturnToTitle: () => void;
  onContinueVictory: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export const OverlayModals: React.FC<OverlayModalsProps> = ({
  hud,
  showControlsModal,
  hidePauseCard = false,
  onCloseControls,
  onOpenControls,
  onResume,
  onRespawnAtAltar,
  onRestartGame,
  onReturnToTitle,
  onContinueVictory,
}) => {
  if (showControlsModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-2xl bg-[#0D0D13] border border-white/15 p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="font-display text-2xl font-bold text-[#F5EFE6]">
              Controls & Weapon Combos
            </h2>
            <button
              onClick={onCloseControls}
              className="px-4 py-1.5 text-xs font-medium text-[#EAE4D8] bg-[#181822] border border-white/15 hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Movement & Weapon Combos
              </h3>
              <div className="space-y-2 text-xs text-[#D6CFC2]">
                <div className="flex justify-between gap-4">
                  <span>Move / Climb Ladder</span>
                  <span className="font-mono-tabular text-white">A D · W S</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Jump / Drop Ledge</span>
                  <span className="font-mono-tabular text-white">Space / S + Space</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Primary Combo Chain</span>
                  <span className="font-mono-tabular text-white">J / Z / LMB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Rising Launcher / Air Plunge</span>
                  <span className="font-mono-tabular text-white">W+J / Air S+J</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Dash Ambush / Guard Counter</span>
                  <span className="font-mono-tabular text-white">Dodge→J / Block→J</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Guard & Brink Parry</span>
                  <span className="font-mono-tabular text-white">K / X / RMB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Rift Dodge (i-frames)</span>
                  <span className="font-mono-tabular text-white">L / C / Shift</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                Powers, Projectiles & Castle
              </h3>
              <div className="space-y-2 text-xs text-[#D6CFC2]">
                <div className="flex justify-between gap-4">
                  <span>Phase Shift (Invert Realm)</span>
                  <span className="font-mono-tabular text-white">1 / U</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Spatial Sever (Rift Blink)</span>
                  <span className="font-mono-tabular text-white">2 / I</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Chrono-Fracture (Time Slow)</span>
                  <span className="font-mono-tabular text-white">3 / O</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Weapon Projectile (Lance/Kunai/Orb)</span>
                  <span className="font-mono-tabular text-white">F / 5</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Weapon Art (Surge/Mirage/Crush)</span>
                  <span className="font-mono-tabular text-white">4 / R</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Swap Weapon · Skill Tree · Map</span>
                  <span className="font-mono-tabular text-white">Tab · T · M</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Execute / Altar / Chest · Flask</span>
                  <span className="font-mono-tabular text-white">E · Q</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#A39B8F] leading-relaxed mt-6 pt-4 border-t border-white/10">
            Spend Ichor in the Skill Tree [T] to unlock extended combo finishers, directional launchers, and upgraded [F] weapon projectiles. Tap Guard on golden-crimson enemy flashes for a Brink Parry into an [E] Execution.
          </p>
        </div>
      </div>
    );
  }

  if (hud.gameState === 'PAUSED' && !hidePauseCard) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
        <div className="w-full max-w-sm bg-[#0D0D13] border border-white/15 p-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-wider text-[#F5EFE6] mb-2">
            Paused
          </h2>
          <p className="text-xs text-[#A39B8F] mb-6">{hud.zoneName}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onResume}
              className="w-full py-3 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#DC2626] transition-colors cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={onOpenControls}
              className="w-full py-3 text-sm font-medium text-[#EAE4D8] bg-[#161620] hover:bg-[#1E1E2B] border border-white/12 transition-colors cursor-pointer"
            >
              Controls
            </button>
            <button
              onClick={onRestartGame}
              className="w-full py-3 text-sm font-medium text-[#EAE4D8] bg-[#161620] hover:bg-[#1E1E2B] border border-white/12 transition-colors cursor-pointer"
            >
              Restart Run
            </button>
            <button
              onClick={onReturnToTitle}
              className="w-full py-3 text-sm font-medium text-[#A39B8F] hover:text-white transition-colors cursor-pointer"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.gameState === 'GAME_OVER') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#090305]/88 p-4">
        <div className="w-full max-w-md bg-[#0E0A0D] border border-red-900/50 p-8 text-center">
          <h2 className="font-display text-4xl font-extrabold tracking-widest text-red-500 mb-3">
            YOU FELL
          </h2>
          <p className="text-sm text-[#C9C1B4] leading-relaxed mb-7">
            Your spilled Ichor remains where you fell. Rise at the last Blood Altar to reclaim what was lost.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRespawnAtAltar}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#DC2626] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rise at Altar
            </button>
            <button
              onClick={onReturnToTitle}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#D6CFC2] bg-[#161419] hover:bg-[#1E1B22] border border-white/12 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hud.gameState === 'VICTORY') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/82 p-4">
        <div className="w-full max-w-lg bg-[#0D0D13] border border-amber-500/35 p-8 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-amber-400 mb-2">
            Hollowed Sentinel Vanquished
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-wide text-[#F5EFE6] mb-3">
            Reality Mended
          </h2>
          <p className="text-sm text-[#C9C1B4] leading-relaxed mb-6">
            Vaelor’s molten core shatters across the Throne. The fractured citadel settles beneath a quiet obsidian sky.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-white/10 mb-7 text-center font-mono-tabular">
            <div>
              <div className="text-[11px] text-[#A39B8F]">Time</div>
              <div className="text-base font-bold text-white mt-0.5">
                {formatDuration(hud.stats.elapsedSeconds)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#A39B8F]">Parries</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {hud.stats.parries}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#A39B8F]">Executions</div>
              <div className="text-base font-bold text-red-400 mt-0.5">
                {hud.stats.executions}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#A39B8F]">Deaths</div>
              <div className="text-base font-bold text-[#EAE4D8] mt-0.5">
                {hud.stats.deaths}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onRestartGame}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#DC2626] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Play Again
            </button>
            <button
              onClick={onContinueVictory}
              className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-[#EAE4D8] bg-[#161620] hover:bg-[#1E1E2B] border border-white/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
