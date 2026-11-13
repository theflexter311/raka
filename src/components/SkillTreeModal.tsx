import React, { useState } from 'react';
import { Check, Lock, Sparkles, X } from 'lucide-react';
import { canUnlockSkill, SKILL_BRANCH_META, SKILL_TREE_NODES } from '../game/skills';
import { HudSnapshot, SkillBranchId, SkillId } from '../game/types';

interface SkillTreeModalProps {
  hud: HudSnapshot;
  onUnlockSkill: (skillId: SkillId) => void;
  onClose: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  hud,
  onUnlockSkill,
  onClose,
}) => {
  const [activeBranch, setActiveBranch] = useState<SkillBranchId>(
    hud.weaponId === 'DUAL_DAGGERS' || hud.weaponId === 'GRAVITY_GREATSWORD'
      ? hud.weaponId
      : 'RIFT_SWORD'
  );

  const branchMeta =
    SKILL_BRANCH_META.find((b) => b.id === activeBranch) ?? SKILL_BRANCH_META[0];
  const branchNodes = SKILL_TREE_NODES.filter((n) => n.branch === activeBranch).sort(
    (a, b) => a.tier - b.tier
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-[#0B0A10] border border-white/15 p-6 md:p-7">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-wide text-[#F5EFE6]">
              Skill Tree
            </h2>
            <p className="text-xs text-[#A39B8F] mt-0.5">
              Channel Abyssal Ichor into reality conduits, weapon combos, and upgraded projectiles.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right font-mono-tabular">
              <div className="text-[10px] uppercase tracking-wider text-[#A39B8F]">
                Available Ichor
              </div>
              <div className="text-lg font-bold text-amber-400">{hud.ichor}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close skill tree"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#EAE4D8] bg-[#161520] border border-white/15 hover:border-white/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close [T]</span>
            </button>
          </div>
        </div>

        {/* Branch Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {SKILL_BRANCH_META.map((branch) => {
            const isSelected = branch.id === activeBranch;
            const branchOwned = SKILL_TREE_NODES.filter(
              (n) => n.branch === branch.id && hud.unlockedSkills.includes(n.id)
            ).length;
            const branchAffordable = SKILL_TREE_NODES.some(
              (n) =>
                n.branch === branch.id &&
                canUnlockSkill(n.id, hud.unlockedSkills, hud.ichor)
            );

            return (
              <button
                key={branch.id}
                onClick={() => setActiveBranch(branch.id)}
                className={`flex flex-col items-start px-3.5 py-2.5 border text-left transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#191625] border-white/40 text-white'
                    : branchAffordable
                      ? 'bg-[#13111B] border-amber-400/40 text-[#EAE4D8] hover:border-amber-300/70'
                      : 'bg-[#100F16] border-white/10 text-[#A39B8F] hover:text-white hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: isSelected ? branch.accent : undefined }}
                  >
                    {branch.label}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-[#A39B8F]">
                    {branchOwned}/4
                  </span>
                </div>
                <span className="text-[10px] text-[#8A8277] truncate w-full mt-0.5">
                  {branch.id === 'REALITY'
                    ? 'Vitals & Spatial'
                    : branch.id === 'RIFT_SWORD'
                      ? 'Energy Sword'
                      : branch.id === 'DUAL_DAGGERS'
                        ? 'Dual Daggers'
                        : 'Heavy Greatsword'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Branch Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3
              className="text-sm font-semibold tracking-wide"
              style={{ color: branchMeta.accent }}
            >
              {branchMeta.label}
            </h3>
            <p className="text-xs text-[#A39B8F]">{branchMeta.subtitle}</p>
          </div>
          <span className="text-[11px] font-mono-tabular text-[#C9C1B4]">
            Tier I → Tier IV Progression
          </span>
        </div>

        {/* 4-Tier Connected Skill Progression */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {branchNodes.map((node) => {
            const isUnlocked = hud.unlockedSkills.includes(node.id);
            const prereqMet = !node.requires || hud.unlockedSkills.includes(node.requires);
            const affordable = canUnlockSkill(node.id, hud.unlockedSkills, hud.ichor);
            const reqNode = node.requires
              ? SKILL_TREE_NODES.find((s) => s.id === node.requires)
              : null;

            return (
              <div
                key={node.id}
                className={`flex flex-col justify-between p-4 border transition-colors ${
                  isUnlocked
                    ? 'bg-[#171422] border-emerald-400/50'
                    : affordable
                      ? 'bg-[#15131F] border-amber-400/55'
                      : 'bg-[#0F0E15] border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular mb-2">
                    <span className="uppercase tracking-wider text-[#A39B8F]">
                      Tier {node.tier}
                    </span>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Check className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span
                        className={
                          hud.ichor >= node.cost ? 'text-amber-400 font-semibold' : 'text-[#8A8277]'
                        }
                      >
                        {node.cost} Ichor
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-sm font-bold text-[#F5EFE6] mb-1.5">
                    {node.name}
                  </h4>

                  <p className="text-xs text-[#C9C1B4] leading-relaxed mb-3">
                    {node.summary}
                  </p>

                  {node.comboNote && (
                    <div className="text-[10px] font-mono-tabular text-sky-300 bg-black/40 border border-white/10 px-2 py-1.5 mb-3">
                      {node.comboNote}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10">
                  {isUnlocked ? (
                    <div className="w-full py-2 text-center text-[11px] font-mono-tabular text-emerald-300/90">
                      Active
                    </div>
                  ) : !prereqMet ? (
                    <div className="flex items-center justify-center gap-1.5 w-full py-2 text-[11px] text-[#8A8277]">
                      <Lock className="w-3 h-3" />
                      <span className="truncate">Requires {reqNode?.name}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onUnlockSkill(node.id)}
                      disabled={!affordable}
                      className={`flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        affordable
                          ? 'bg-[#B91C1C] hover:bg-[#DC2626] text-white cursor-pointer'
                          : 'bg-[#181722] text-[#7A736A] border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{affordable ? `Unlock (${node.cost})` : `Need ${node.cost} Ichor`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
