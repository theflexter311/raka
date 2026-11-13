import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import titleBackdrop from '../assets/images/khazan_title_backdrop_1794555855533.jpg';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenControls: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenControls,
  muted,
  onToggleMute,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07070A]">
      {/* Generated Key Art Backdrop */}
      <img
        src={titleBackdrop}
        alt="Scarred berserker standing before the shattered gothic citadel"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
      />

      {/* Measured Contrast Scrim */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070A] via-[#07070A]/82 to-[#07070A]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070A] via-transparent to-[#07070A]/60" />

      {/* Top Audio Toggle */}
      <div className="relative z-10 flex items-center justify-end px-8 py-6">
        <button
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#D6CFC2] bg-[#121218]/80 border border-white/15 hover:border-white/35 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Audio Muted' : 'Audio On'}</span>
        </button>
      </div>

      {/* Main Title & Actions */}
      <main className="relative z-10 flex flex-col justify-center h-[calc(100%-88px)] max-w-3xl px-10 md:px-16 pb-10">
        <div className="flex items-center gap-3 text-xs font-medium tracking-widest text-[#D6CFC2]/75 uppercase mb-4">
          <span>2D Dark Fantasy Metroidvania</span>
          <span aria-hidden="true">·</span>
          <span>Soulslike Action</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wide text-[#F3EFE6] leading-[1.08] text-balance mb-5">
          Raka: Fractured Reality
        </h1>

        <p className="text-base md:text-lg text-[#C9C1B4] leading-relaxed max-w-xl mb-8">
          Storm the vaulted halls of Castle Virel with three distinct weapons and stolen powers over space and time. Master unique combo chains, unleash weapon projectiles [F], evolve through the Skill Tree [T], and dethrone Lord Vaelor.
        </p>

        {/* Primary & Secondary Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-12">
          <button
            onClick={onStartGame}
            className="px-8 py-3.5 text-sm font-semibold tracking-wider uppercase text-white bg-[#B91C1C] hover:bg-[#DC2626] border border-red-400/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            Start Game
          </button>

          <button
            onClick={onOpenControls}
            className="px-6 py-3.5 text-sm font-medium tracking-wide text-[#EAE4D8] bg-[#14141B]/90 hover:bg-[#1E1E28] border border-white/15 hover:border-white/30 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Controls
          </button>
        </div>

        {/* Clean Unboxed Arsenal & Reality Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 max-w-2xl">
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-sky-300 mb-1">
              Riftblade · Energy Sword
            </h2>
            <p className="text-xs text-[#A39B8F] leading-relaxed">
              Piercing Rift Lance [F], Skybreaker launchers, and multi-wave Rift Surge [R].
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-fuchsia-300 mb-1">
              Twin Voidfangs · Daggers
            </h2>
            <p className="text-xs text-[#A39B8F] leading-relaxed">
              5-hit flurry, Voidfang Kunai [F] that marks foes, and Mirage Anchor [R] echo clones.
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-amber-300 mb-1">
              Cataclysm · Heavy Plate
            </h2>
            <p className="text-xs text-[#A39B8F] leading-relaxed">
              Up to 52% armor, pulling Gravity Orb [F], guard counters, and Singularity Crush [R].
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
