import React from 'react';
import { Map, Pause, Sparkles, Volume2, VolumeX } from 'lucide-react';
import berserkerPortrait from '../assets/images/berserker_portrait_1794555855715.jpg';
import bossVaelorPortrait from '../assets/images/boss_vaelor_portrait_1794555856590.jpg';
import { HudSnapshot, RealityPowerId, WeaponId } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  onPause: () => void;
  onToggleMute: () => void;
  onSwitchWeapon: (weaponId: WeaponId) => void;
  onOpenSkillTree: () => void;
  onOpenMap: () => void;
}

const POWER_META: Array<{
  id: RealityPowerId;
  keyLabel: string;
  shortName: string;
  cost: number;
}> = [
  { id: 'PHASE_SHIFT', keyLabel: '1', shortName: 'Phase', cost: 10 },
  { id: 'SPATIAL_SEVER', keyLabel: '2', shortName: 'Sever', cost: 24 },
  { id: 'CHRONO_FRACTURE', keyLabel: '3', shortName: 'Chrono', cost: 35 },
];

const WEAPON_META: Array<{
  id: WeaponId;
  name: string;
  projName: string;
  projCost: number;
  artName: string;
  artCost: number;
}> = [
  {
    id: 'RIFT_SWORD',
    name: 'Riftblade',
    projName: 'Lance',
    projCost: 14,
    artName: 'Surge',
    artCost: 20,
  },
  {
    id: 'DUAL_DAGGERS',
    name: 'Voidfangs',
    projName: 'Kunai',
    projCost: 10,
    artName: 'Mirage',
    artCost: 22,
  },
  {
    id: 'GRAVITY_GREATSWORD',
    name: 'Cataclysm',
    projName: 'Orb',
    projCost: 18,
    artName: 'Crush',
    artCost: 26,
  },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onPause,
  onToggleMute,
  onSwitchWeapon,
  onOpenSkillTree,
  onOpenMap,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const trailPct = Math.max(0, Math.min(100, (hud.trailHp / hud.maxHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));
  const riftPct = Math.max(0, Math.min(100, (hud.riftEnergy / hud.maxRiftEnergy) * 100));
  const activeWeapon = WEAPON_META.find((w) => w.id === hud.weaponId) ?? WEAPON_META[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-5">
      {/* Top Row: Unboxed Slim Vitals (Left) · Minimal Utility Icons (Right) */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Sleek Vitals */}
        <div className="flex items-center gap-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          <div className="w-11 h-11 shrink-0 bg-[#120F18] border border-white/25 overflow-hidden">
            <img
              src={berserkerPortrait}
              alt="Raka portrait"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-1 w-56 sm:w-64">
            {/* HP Bar */}
            <div className="relative h-2.5 w-full bg-[#150E15]/90 border border-black/90 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#E2D9C8]/75 transition-all duration-150"
                style={{ width: `${trailPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#9F1239] to-[#F43F5E]"
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* Stamina & Rift Slim Bars */}
            <div className="relative h-1.5 w-[88%] bg-[#121216]/90 border border-black/85 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#D97706]"
                style={{ width: `${stamPct}%` }}
              />
            </div>
            <div className="relative h-1.5 w-[78%] bg-[#13101D]/90 border border-black/85 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#38BDF8]"
                style={{ width: `${riftPct}%` }}
              />
            </div>

            {/* Inline Tabular Status */}
            <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-[#EAE4D8] pt-0.5">
              <span>
                Flask [Q] <strong className="text-rose-400">{hud.flasks}</strong>/{hud.maxFlasks}
              </span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span>
                Ichor <strong className="text-amber-400">{hud.ichor}</strong>
              </span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className={hud.realm === 'ABYSSAL' ? 'text-rose-400' : 'text-sky-300'}>
                {hud.realm === 'ABYSSAL' ? 'Abyssal' : 'Material'}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Compact Controls & Location Label */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onOpenSkillTree}
              className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium bg-[#0A0910]/85 border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                hud.canAffordSkill
                  ? 'border-amber-400/75 text-amber-200 hover:border-amber-300'
                  : 'border-white/15 text-[#EAE4D8] hover:border-white/35'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Skills [T]</span>
            </button>
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium bg-[#0A0910]/85 border border-white/15 hover:border-white/35 text-[#EAE4D8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map [M]</span>
            </button>
            <button
              onClick={onToggleMute}
              aria-label={hud.muted ? 'Unmute audio' : 'Mute audio'}
              className="flex items-center justify-center w-8 h-8 bg-[#0A0910]/85 border border-white/15 hover:border-white/35 text-[#EAE4D8] transition-colors cursor-pointer"
            >
              {hud.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onPause}
              aria-label="Pause game"
              className="flex items-center justify-center w-8 h-8 bg-[#0A0910]/85 border border-white/15 hover:border-white/35 text-[#EAE4D8] transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] font-display tracking-wide text-[#D6CFC2]/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {hud.zoneName}
          </div>
        </div>
      </div>

      {/* Center Zone / Relic / Lore Banner & Prompt */}
      <div className="flex flex-col items-center justify-center gap-3 my-auto">
        {hud.banner && (
          <div className="bg-[#09080E]/88 border-y border-white/20 px-10 py-3.5 text-center max-w-xl">
            <div className="font-display text-xl md:text-2xl font-bold tracking-wider text-[#F5F0E6]">
              {hud.banner.title}
            </div>
            <div className="text-xs md:text-sm text-[#C9C1B4] mt-1">
              {hud.banner.subtitle}
            </div>
          </div>
        )}

        {hud.prompt && (
          <div className="bg-[#09080E]/88 border border-amber-400/50 px-5 py-2 text-center mt-24">
            <div className="text-xs font-mono-tabular font-bold text-amber-300 tracking-wide">
              {hud.prompt.text}
            </div>
            {hud.prompt.subtext && (
              <div className="text-[11px] text-[#D6CFC2]/80 mt-0.5">{hud.prompt.subtext}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Compact Ability Icons (Left) · Boss Bar (Center) · Compact Weapon Switcher (Right) */}
      <div className="flex items-end justify-between gap-4">
        {/* Compact Skill & Projectile Strip */}
        <div className="flex items-center gap-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {POWER_META.map((pow) => {
            const unlocked = hud.unlockedPowers.includes(pow.id);
            const cooldown =
              pow.id === 'PHASE_SHIFT'
                ? hud.phaseShiftCooldown
                : pow.id === 'SPATIAL_SEVER'
                  ? hud.spatialSeverCooldown
                  : hud.chronoCooldown;
            const active =
              (pow.id === 'PHASE_SHIFT' && hud.realm === 'ABYSSAL') ||
              (pow.id === 'CHRONO_FRACTURE' && hud.chronoActiveTimer > 0);
            const ready = unlocked && hud.riftEnergy >= pow.cost && cooldown <= 0;

            return (
              <div
                key={pow.id}
                className={`relative flex flex-col justify-between w-14 h-12 p-1.5 border ${
                  !unlocked
                    ? 'bg-[#0C0B12]/70 border-white/10 opacity-40'
                    : active
                      ? 'bg-rose-950/85 border-rose-400/75'
                      : ready
                        ? 'bg-[#12111B]/90 border-white/25'
                        : 'bg-[#0E0D15]/85 border-white/10 opacity-75'
                }`}
              >
                <span className="text-[9px] font-mono-tabular text-[#D6CFC2]">
                  [{pow.keyLabel}]
                </span>
                <span className="text-[10px] font-semibold text-[#F5EFE6] truncate">
                  {pow.shortName}
                </span>
                {unlocked && cooldown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-[11px] font-mono-tabular font-bold text-white">
                    {cooldown.toFixed(1)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Weapon Projectile [F] */}
          <div
            className={`relative flex flex-col justify-between w-14 h-12 p-1.5 border ${
              hud.riftEnergy >= activeWeapon.projCost && hud.projectileCooldown <= 0
                ? 'bg-[#101826]/90 border-sky-400/60'
                : 'bg-[#0E0D15]/85 border-white/10 opacity-75'
            }`}
          >
            <span className="text-[9px] font-mono-tabular text-sky-300">[F]</span>
            <span className="text-[10px] font-semibold text-sky-100 truncate">
              {activeWeapon.projName}
            </span>
            {hud.projectileCooldown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-[11px] font-mono-tabular font-bold text-white">
                {hud.projectileCooldown.toFixed(1)}
              </div>
            )}
          </div>

          {/* Weapon Art [R] */}
          <div
            className={`relative flex flex-col justify-between w-14 h-12 p-1.5 border ${
              hud.riftEnergy >= activeWeapon.artCost && hud.weaponArtCooldown <= 0
                ? 'bg-[#1B1424]/90 border-amber-400/60'
                : 'bg-[#0E0D15]/85 border-white/10 opacity-75'
            }`}
          >
            <span className="text-[9px] font-mono-tabular text-amber-300">[R]</span>
            <span className="text-[10px] font-semibold text-amber-100 truncate">
              {activeWeapon.artName}
            </span>
            {hud.weaponArtCooldown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75 text-[11px] font-mono-tabular font-bold text-white">
                {hud.weaponArtCooldown.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Boss Bar (Only when in Throne Hall) */}
        {hud.boss && (
          <div className="flex items-center gap-3 bg-[#09080D]/90 border border-rose-900/60 px-4 py-2.5 min-w-[280px] xl:min-w-[400px]">
            <div className="w-10 h-10 shrink-0 border border-rose-500/40 bg-[#140B0E] overflow-hidden">
              <img
                src={bossVaelorPortrait}
                alt="Vaelor, The Hollowed Sentinel"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <span className="font-display text-xs sm:text-sm font-bold tracking-wide text-[#F5EFE6]">
                  {hud.boss.name}, {hud.boss.title}
                </span>
                <span className="text-[11px] font-mono-tabular text-rose-300">
                  {hud.boss.hp}/{hud.boss.maxHp}
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#1C1014] border border-black overflow-hidden mb-1">
                <div
                  className="h-full bg-gradient-to-r from-[#9F1239] to-[#F43F5E]"
                  style={{ width: `${(hud.boss.hp / hud.boss.maxHp) * 100}%` }}
                />
              </div>
              <div className="h-1 bg-[#1B1712] border border-black overflow-hidden">
                <div
                  className="h-full bg-[#F59E0B]"
                  style={{
                    width: `${Math.min(100, (hud.boss.posture / hud.boss.maxPosture) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Compact Weapon Switcher (Right) */}
        <div className="pointer-events-auto flex items-center gap-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {WEAPON_META.map((w) => {
            const selected = hud.weaponId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => onSwitchWeapon(w.id)}
                className={`px-2.5 h-9 border text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selected
                    ? 'bg-rose-950/85 border-rose-400/75 text-white'
                    : 'bg-[#0C0B12]/85 border-white/15 text-[#A39B8F] hover:text-white hover:border-white/35'
                }`}
              >
                {w.name}
              </button>
            );
          })}
          <span className="hidden md:inline text-[10px] font-mono-tabular text-[#C9C1B4]/80 pl-1.5">
            [Tab]
          </span>
        </div>
      </div>
    </div>
  );
};
