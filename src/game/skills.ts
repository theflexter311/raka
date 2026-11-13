import { SkillBranchId, SkillId, SkillNodeDef } from './types';

export const SKILL_BRANCH_META: Array<{
  id: SkillBranchId;
  label: string;
  subtitle: string;
  accent: string;
}> = [
  {
    id: 'REALITY',
    label: 'Reality Mastery',
    subtitle: 'Vitals, Brink Parries & Spatial Manipulation',
    accent: '#C084FC',
  },
  {
    id: 'RIFT_SWORD',
    label: 'Riftblade',
    subtitle: 'Energy Sword Combos & Piercing Waves',
    accent: '#38BDF8',
  },
  {
    id: 'DUAL_DAGGERS',
    label: 'Twin Voidfangs',
    subtitle: 'Phantom Flurries, Kunai & Mirage Clones',
    accent: '#E879F9',
  },
  {
    id: 'GRAVITY_GREATSWORD',
    label: 'Cataclysm',
    subtitle: 'Armored Poise, Gravity Slams & Singularity Orbs',
    accent: '#F59E0B',
  },
];

export const SKILL_TREE_NODES: SkillNodeDef[] = [
  // ── REALITY MASTERY ──────────────────────────────────────────────────────
  {
    id: 'REALITY_VITAL_VESSEL',
    branch: 'REALITY',
    tier: 1,
    name: 'Blood Vessel',
    cost: 70,
    summary: '+35 Max HP and +1 Crimson Flask capacity (refills immediately).',
  },
  {
    id: 'REALITY_RIFT_CONDUIT',
    branch: 'REALITY',
    tier: 2,
    name: 'Rift Conduit',
    cost: 110,
    requires: 'REALITY_VITAL_VESSEL',
    summary: '+35 Max Rift Energy and 45% faster passive Rift regeneration.',
  },
  {
    id: 'REALITY_BRINK_COUNTER',
    branch: 'REALITY',
    tier: 3,
    name: 'Brink Riposte',
    cost: 150,
    requires: 'REALITY_RIFT_CONDUIT',
    summary: 'Wider Brink Parry window; parrying blasts nearby foes and restores 10 HP.',
  },
  {
    id: 'REALITY_AETHER_STEP',
    branch: 'REALITY',
    tier: 4,
    name: 'Aether Sever',
    cost: 190,
    requires: 'REALITY_BRINK_COUNTER',
    summary: 'Spatial Sever cooldown reduced by 35% and leaves double rift detonations.',
  },

  // ── RIFTBLADE (ENERGY SWORD) ─────────────────────────────────────────────
  {
    id: 'SWORD_RIFT_TEMPEST',
    branch: 'RIFT_SWORD',
    tier: 1,
    name: 'Rift Tempest',
    cost: 80,
    summary: 'Extends Riftblade into a 4-hit combo ending in a spinning dual wave cleave.',
    comboNote: 'Combo: J → J → J → J',
  },
  {
    id: 'SWORD_SKYBREAKER',
    branch: 'RIFT_SWORD',
    tier: 2,
    name: 'Skybreaker Arc',
    cost: 120,
    requires: 'SWORD_RIFT_TEMPEST',
    summary: 'Unlocks rising energy uppercut that launches enemies and fires a diagonal wave.',
    comboNote: 'Combo: W + J (Up Attack) · S + J (Air Plunge)',
  },
  {
    id: 'SWORD_TWIN_CRESCENT',
    branch: 'RIFT_SWORD',
    tier: 3,
    name: 'Twin Rift Lance',
    cost: 160,
    requires: 'SWORD_SKYBREAKER',
    summary: 'Upgrades Rift Discharge [F] to fire twin piercing cyan-crimson lances.',
    comboNote: 'Projectile: [F] Twin Piercing Lances',
  },
  {
    id: 'SWORD_SOVEREIGN_SURGE',
    branch: 'RIFT_SWORD',
    tier: 4,
    name: 'Sovereign Surge',
    cost: 210,
    requires: 'SWORD_TWIN_CRESCENT',
    summary: 'Rift Surge [R] unleashes a 5-wave fan and empowers melee blades for 5s.',
    comboNote: 'Weapon Art: [R] 5-Arc Rift Barrage',
  },

  // ── TWIN VOIDFANGS (DUAL DAGGERS) ────────────────────────────────────────
  {
    id: 'DAGGER_PHANTOM_FLURRY',
    branch: 'DUAL_DAGGERS',
    tier: 1,
    name: 'Phantom Flurry',
    cost: 80,
    summary: 'Unlocks a 5-hit Void Rend finisher with lethal cross-slashes and evasion frames.',
    comboNote: 'Combo: J → J → J → J → J',
  },
  {
    id: 'DAGGER_CYCLONE_AMBUSH',
    branch: 'DUAL_DAGGERS',
    tier: 2,
    name: 'Cyclone Ambush',
    cost: 120,
    requires: 'DAGGER_PHANTOM_FLURRY',
    summary: 'Dodge into Attack lunges with twin blades; W + J performs a rising spin slash.',
    comboNote: 'Combo: Shift → J (Ambush) · W + J (Rising Spin)',
  },
  {
    id: 'DAGGER_TRIPLE_KUNAI',
    branch: 'DUAL_DAGGERS',
    tier: 3,
    name: 'Voidfang Volley',
    cost: 160,
    requires: 'DAGGER_CYCLONE_AMBUSH',
    summary: 'Upgrades [F] Kunai Throw into a 3-dagger fan that marks foes for +35% crit burst.',
    comboNote: 'Projectile: [F] Triple Marking Kunai',
  },
  {
    id: 'DAGGER_TWIN_ECHOES',
    branch: 'DUAL_DAGGERS',
    tier: 4,
    name: 'Twin Mirage Echoes',
    cost: 210,
    requires: 'DAGGER_TRIPLE_KUNAI',
    summary: 'Mirage Anchor [R] summons two parallel Echo Clones that slash and restore Rift.',
    comboNote: 'Weapon Art: [R] Dual Echo Clones',
  },

  // ── CATACLYSM (GRAVITY GREATSWORD) ───────────────────────────────────────
  {
    id: 'GREAT_TITAN_SLAM',
    branch: 'GRAVITY_GREATSWORD',
    tier: 1,
    name: 'Meteor Breaker',
    cost: 85,
    summary: 'Airborne S + J triggers a crushing gravity dive shockwave; 3rd hit deals +25% posture.',
    comboNote: 'Combo: Air S + J (Meteor Dive) · W + J (Lift)',
  },
  {
    id: 'GREAT_IRON_BASTION',
    branch: 'GRAVITY_GREATSWORD',
    tier: 2,
    name: 'Iron Bastion',
    cost: 125,
    requires: 'GREAT_TITAN_SLAM',
    summary: 'Raises Armor to 52% and unlocks a devastating Guard Counter right after blocking.',
    comboNote: 'Combo: Block Hit → J (Guard Counter)',
  },
  {
    id: 'GREAT_SINGULARITY_ORB',
    branch: 'GRAVITY_GREATSWORD',
    tier: 3,
    name: 'Vortex Sphere',
    cost: 165,
    requires: 'GREAT_IRON_BASTION',
    summary: 'Upgrades Gravity Orb [F] to pull nearby enemies inward and rupture on impact.',
    comboNote: 'Projectile: [F] Pulling Gravity Sphere',
  },
  {
    id: 'GREAT_EVENT_HORIZON',
    branch: 'GRAVITY_GREATSWORD',
    tier: 4,
    name: 'Event Horizon',
    cost: 220,
    requires: 'GREAT_SINGULARITY_ORB',
    summary: 'Singularity Crush [R] widens the black hole and detonates with massive AoE force.',
    comboNote: 'Weapon Art: [R] Expanded Singularity',
  },
];

export function canUnlockSkill(
  skillId: SkillId,
  unlocked: SkillId[],
  ichor: number
): boolean {
  if (unlocked.includes(skillId)) return false;
  const node = SKILL_TREE_NODES.find((s) => s.id === skillId);
  if (!node) return false;
  if (node.requires && !unlocked.includes(node.requires)) return false;
  return ichor >= node.cost;
}
