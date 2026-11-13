export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type RealityRealm = 'MATERIAL' | 'ABYSSAL';

export type RealityPowerId = 'PHASE_SHIFT' | 'SPATIAL_SEVER' | 'CHRONO_FRACTURE';

export type WeaponId = 'RIFT_SWORD' | 'DUAL_DAGGERS' | 'GRAVITY_GREATSWORD';

export type SkillBranchId = 'REALITY' | WeaponId;

export type SkillId =
  // Reality Mastery branch
  | 'REALITY_VITAL_VESSEL'
  | 'REALITY_RIFT_CONDUIT'
  | 'REALITY_BRINK_COUNTER'
  | 'REALITY_AETHER_STEP'
  // Riftblade branch
  | 'SWORD_RIFT_TEMPEST'
  | 'SWORD_SKYBREAKER'
  | 'SWORD_TWIN_CRESCENT'
  | 'SWORD_SOVEREIGN_SURGE'
  // Twin Voidfangs branch
  | 'DAGGER_PHANTOM_FLURRY'
  | 'DAGGER_CYCLONE_AMBUSH'
  | 'DAGGER_TRIPLE_KUNAI'
  | 'DAGGER_TWIN_ECHOES'
  // Cataclysm Greatsword branch
  | 'GREAT_TITAN_SLAM'
  | 'GREAT_IRON_BASTION'
  | 'GREAT_SINGULARITY_ORB'
  | 'GREAT_EVENT_HORIZON';

export interface SkillNodeDef {
  id: SkillId;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4;
  name: string;
  cost: number;
  requires?: SkillId;
  summary: string;
  comboNote?: string;
}

export type ZoneId = 'CRUCIBLE' | 'CATACOMBS' | 'SPIRE' | 'SANCTUM' | 'THRONE';

export type PlatformKind =
  | 'STONE'
  | 'ONEWAY'
  | 'GATE'
  | 'RIFT_BARRIER'
  | 'CRUSHER';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  realm: 'BOTH' | RealityRealm;
  kind: PlatformKind;
  gateId?: string;
  hangingChains?: boolean;
  crusherBaseY?: number;
  crusherRange?: number;
  crusherSpeed?: number;
  crusherPhase?: number;
}

export interface Ladder {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpikePit {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CastlePropKind =
  | 'BRAZIER'
  | 'CRYSTAL'
  | 'SIGIL_GATE'
  | 'STATUE_ALCOVE'
  | 'BANNER'
  | 'DIAGONAL_CHAIN';

export interface CastleProp {
  id: string;
  kind: CastlePropKind;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  scale?: number;
}

export type InteractableKind = 'ALTAR' | 'RELIC' | 'LEVER' | 'LORE' | 'CHEST';

export interface Interactable {
  id: string;
  kind: InteractableKind;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  description: string;
  powerReward?: RealityPowerId;
  gateId?: string;
  ichorReward?: number;
  flaskReward?: number;
  activated?: boolean;
}

export interface ZoneExit {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  targetZone: ZoneId;
  spawnX: number;
  spawnY: number;
  label: string;
}

export type EnemyKind =
  | 'ASH_STALKER'
  | 'BLOOD_ACOLYTE'
  | 'SPIRE_WARDEN'
  | 'BOSS_VAELOR';

export type EnemyAIState =
  | 'IDLE'
  | 'PATROL'
  | 'CHASE'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'RECOVER'
  | 'STAGGERED'
  | 'DEAD';

export interface EnemySpawn {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
}

export interface Enemy extends EnemySpawn {
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  aiState: EnemyAIState;
  stateTimer: number;
  attackPattern: number;
  parryable: boolean;
  hitThisSwing: boolean;
  flashTimer: number;
  phase: 1 | 2;
  grounded: boolean;
  ichorValue: number;
  baseY: number;
  markedTimer: number;
}

export type ProjectileKind =
  | 'ORB'
  | 'RIFT_CRESCENT'
  | 'RIFT_LANCE'
  | 'VOIDFANG_DAGGER'
  | 'GRAVITY_ORB';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  postureDamage?: number;
  fromPlayer: boolean;
  color: string;
  life: number;
  parryable: boolean;
  kind?: ProjectileKind;
  piercing?: boolean;
  hitIds?: string[];
}

export interface RiftTear {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  timer: number;
  maxTimer: number;
  detonated: boolean;
}

export interface GravityWell {
  id: string;
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  tickTimer: number;
  heavyExplosion?: boolean;
}

export interface EchoClone {
  id: string;
  x: number;
  y: number;
  facing: 1 | -1;
  timer: number;
  maxTimer: number;
  slashTimer: number;
}

export interface SlashArc {
  x: number;
  y: number;
  facing: 1 | -1;
  angleStart: number;
  angleEnd: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  heavy: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  inkOutline?: boolean;
}

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
  pose: 'DODGE' | 'SEVER' | 'ATTACK';
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface DroppedIchor {
  zoneId: ZoneId;
  x: number;
  y: number;
  amount: number;
}

export interface ZoneDef {
  id: ZoneId;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  skyTop: string;
  skyBottom: string;
  accentColor: string;
  mapRect: { x: number; y: number; w: number; h: number };
  platforms: Platform[];
  ladders: Ladder[];
  spikes: SpikePit[];
  props: CastleProp[];
  interactables: Interactable[];
  exits: ZoneExit[];
  spawns: EnemySpawn[];
}

export type AttackVariant =
  | 'NEUTRAL'
  | 'UP_LAUNCHER'
  | 'AIR_PLUNGE'
  | 'DASH_STRIKE'
  | 'GUARD_COUNTER';

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  climbingLadder: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  dropThroughTimer: number;

  hp: number;
  maxHp: number;
  trailHp: number;
  stamina: number;
  maxStamina: number;
  staminaRegenDelay: number;
  riftEnergy: number;
  maxRiftEnergy: number;
  flasks: number;
  maxFlasks: number;
  ichor: number;

  weaponId: WeaponId;
  weaponArtCooldown: number;
  projectileCooldown: number;

  comboStep: 0 | 1 | 2 | 3 | 4 | 5;
  attackVariant: AttackVariant;
  attackTimer: number;
  attackTotal: number;
  attackCooldown: number;
  comboWindowTimer: number;
  attackHitIds: string[];
  postDodgeWindowTimer: number;
  guardCounterTimer: number;

  blockHeld: boolean;
  parryWindowTimer: number;
  parryFlashTimer: number;

  dodgeTimer: number;
  dodgeCooldown: number;
  invulnTimer: number;
  hitstunTimer: number;
  healTimer: number;
  executionTimer: number;

  phaseShiftCooldown: number;
  spatialSeverCooldown: number;
  chronoCooldown: number;
  chronoActiveTimer: number;

  realm: RealityRealm;
  unlockedPowers: RealityPowerId[];
  unlockedSkills: SkillId[];
  cloakNodes: Array<{ x: number; y: number }>;
}

export interface HudSnapshot {
  gameState: GameState;
  zoneId: ZoneId;
  zoneName: string;
  zoneSubtitle: string;
  hp: number;
  maxHp: number;
  trailHp: number;
  stamina: number;
  maxStamina: number;
  riftEnergy: number;
  maxRiftEnergy: number;
  flasks: number;
  maxFlasks: number;
  ichor: number;
  realm: RealityRealm;
  weaponId: WeaponId;
  weaponArtCooldown: number;
  projectileCooldown: number;
  armorPct: number;
  unlockedPowers: RealityPowerId[];
  unlockedSkills: SkillId[];
  canAffordSkill: boolean;
  phaseShiftCooldown: number;
  spatialSeverCooldown: number;
  chronoCooldown: number;
  chronoActiveTimer: number;
  visitedZones: ZoneId[];
  boss: {
    name: string;
    title: string;
    hp: number;
    maxHp: number;
    trailHp: number;
    posture: number;
    maxPosture: number;
    staggered: boolean;
    phase: 1 | 2;
  } | null;
  prompt: {
    text: string;
    subtext?: string;
  } | null;
  banner: {
    title: string;
    subtitle: string;
    kind: 'ZONE' | 'RELIC' | 'PARRY' | 'EXECUTION' | 'LORE';
  } | null;
  stats: {
    elapsedSeconds: number;
    parries: number;
    executions: number;
    deaths: number;
    enemiesSlain: number;
  };
  muted: boolean;
  playerNormPos: { x: number; y: number };
}
