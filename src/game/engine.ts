import { soundEngine } from './audio';
import { renderGameFrame } from './renderer';
import { canUnlockSkill, SKILL_TREE_NODES } from './skills';
import {
  Afterimage,
  DroppedIchor,
  EchoClone,
  Enemy,
  EnemyKind,
  EnemySpawn,
  FloatingText,
  GameState,
  GravityWell,
  HudSnapshot,
  Particle,
  Platform,
  PlayerState,
  Projectile,
  RiftTear,
  SkillId,
  SlashArc,
  WeaponId,
  ZoneDef,
  ZoneId,
} from './types';
import { createWorldZones } from './world';

const GRAVITY = 1950;
const PLAYER_SPEED = 330;
const JUMP_VEL = -755;

export class KhazanEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudUpdate: (hud: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private hudSyncTimer = 0;
  private time = 0;

  private gameState: GameState = 'TITLE_MENU';
  private zones: Record<ZoneId, ZoneDef>;
  private currentZoneId: ZoneId = 'CRUCIBLE';
  private visitedZones: Set<ZoneId> = new Set(['CRUCIBLE']);
  private openGates: Set<string> = new Set();
  private defeatedBoss = false;

  private lastAltarZone: ZoneId = 'CRUCIBLE';
  private lastAltarX = 190;
  private lastAltarY = 620;
  private lastSafeX = 190;
  private lastSafeY = 620;

  private player: PlayerState;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private riftTears: RiftTear[] = [];
  private gravityWells: GravityWell[] = [];
  private echoClones: EchoClone[] = [];
  private slashArcs: SlashArc[] = [];
  private particles: Particle[] = [];
  private afterimages: Afterimage[] = [];
  private floatingTexts: FloatingText[] = [];
  private droppedIchor: DroppedIchor | null = null;

  private cameraX = 0;
  private cameraY = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private hitstopTimer = 0;
  private phaseRippleTimer = 0;
  private parryFreezeFlash = 0;

  private activeBanner: HudSnapshot['banner'] = null;
  private bannerTimer = 0;

  private stats = {
    elapsedSeconds: 0,
    parries: 0,
    executions: 0,
    deaths: 0,
    enemiesSlain: 0,
  };

  // Input state
  private keys: Set<string> = new Set();
  private jumpJustPressed = false;
  private attackJustPressed = false;
  private projectileJustPressed = false;
  private dodgeJustPressed = false;
  private interactJustPressed = false;
  private healJustPressed = false;
  private phaseJustPressed = false;
  private severJustPressed = false;
  private chronoJustPressed = false;
  private weaponArtJustPressed = false;
  private weaponSwapJustPressed = false;
  private parryJustPressed = false;
  private blockMouseHeld = false;

  constructor(canvas: HTMLCanvasElement, onHudUpdate: (hud: HudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize 2D context');
    this.ctx = context;
    this.onHudUpdate = onHudUpdate;

    this.zones = createWorldZones();
    this.player = this.createInitialPlayer(190, 620);
    this.spawnEnemiesForZone('CRUCIBLE');
    this.snapCamera();
  }

  private createInitialPlayer(x: number, y: number): PlayerState {
    const cloakNodes = Array.from({ length: 5 }, (_, i) => ({
      x: x + 17 - i * 6,
      y: y + 18 + i * 7,
    }));
    return {
      x,
      y,
      w: 34,
      h: 62,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      climbingLadder: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      dropThroughTimer: 0,

      hp: 120,
      maxHp: 120,
      trailHp: 120,
      stamina: 100,
      maxStamina: 100,
      staminaRegenDelay: 0,
      riftEnergy: 100,
      maxRiftEnergy: 100,
      flasks: 3,
      maxFlasks: 3,
      ichor: 0,

      weaponId: 'RIFT_SWORD',
      weaponArtCooldown: 0,
      projectileCooldown: 0,

      comboStep: 0,
      attackVariant: 'NEUTRAL',
      attackTimer: 0,
      attackTotal: 0.25,
      attackCooldown: 0,
      comboWindowTimer: 0,
      attackHitIds: [],
      postDodgeWindowTimer: 0,
      guardCounterTimer: 0,

      blockHeld: false,
      parryWindowTimer: 0,
      parryFlashTimer: 0,

      dodgeTimer: 0,
      dodgeCooldown: 0,
      invulnTimer: 0,
      hitstunTimer: 0,
      healTimer: 0,
      executionTimer: 0,

      phaseShiftCooldown: 0,
      spatialSeverCooldown: 0,
      chronoCooldown: 0,
      chronoActiveTimer: 0,

      realm: 'MATERIAL',
      unlockedPowers: ['PHASE_SHIFT'],
      unlockedSkills: [],
      cloakNodes,
    };
  }

  public mount() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('blur', this.handleBlur);

    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
    this.emitHud();
  }

  public unmount() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('blur', this.handleBlur);
  }

  public startNewGame() {
    this.zones = createWorldZones();
    this.currentZoneId = 'CRUCIBLE';
    this.visitedZones = new Set(['CRUCIBLE']);
    this.openGates = new Set();
    this.defeatedBoss = false;
    this.lastAltarZone = 'CRUCIBLE';
    this.lastAltarX = 190;
    this.lastAltarY = 620;
    this.lastSafeX = 190;
    this.lastSafeY = 620;
    this.droppedIchor = null;
    this.stats = {
      elapsedSeconds: 0,
      parries: 0,
      executions: 0,
      deaths: 0,
      enemiesSlain: 0,
    };

    this.player = this.createInitialPlayer(190, 620);
    this.clearTransientFX();
    this.spawnEnemiesForZone('CRUCIBLE');
    this.snapCamera();
    this.gameState = 'PLAYING';
    this.showBanner('The Ashen Crucible', 'Outer Ramparts · Reality Fracture I', 'ZONE', 3.2);
    soundEngine.playAltarRest();
    this.emitHud();
  }

  public setGameState(next: GameState) {
    this.gameState = next;
    this.keys.clear();
    this.blockMouseHeld = false;
    this.emitHud();
  }

  public respawnAtAltar() {
    this.currentZoneId = this.lastAltarZone;
    this.player.x = this.lastAltarX;
    this.player.y = this.lastAltarY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.player.trailHp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.riftEnergy = this.player.maxRiftEnergy;
    this.player.flasks = this.player.maxFlasks;
    this.player.hitstunTimer = 0;
    this.player.invulnTimer = 0.8;
    this.player.attackTimer = 0;
    this.player.dodgeTimer = 0;
    this.player.chronoActiveTimer = 0;
    this.clearTransientFX();
    this.spawnEnemiesForZone(this.currentZoneId);
    this.snapCamera();
    this.gameState = 'PLAYING';
    soundEngine.playAltarRest();
    this.showBanner(
      this.zones[this.currentZoneId].name,
      'Reformed at Blood Altar',
      'ZONE',
      2.6
    );
    this.emitHud();
  }

  public continueAfterVictory() {
    this.gameState = 'PLAYING';
    this.emitHud();
  }

  public toggleMute(): boolean {
    const next = !soundEngine.isMuted();
    soundEngine.setMuted(next);
    this.emitHud();
    return next;
  }

  public switchWeapon(weaponId?: WeaponId) {
    const order: WeaponId[] = ['RIFT_SWORD', 'DUAL_DAGGERS', 'GRAVITY_GREATSWORD'];
    const p = this.player;
    const nextId =
      weaponId ?? order[(order.indexOf(p.weaponId) + 1) % order.length];
    if (nextId === p.weaponId) return;

    p.weaponId = nextId;
    p.comboStep = 0;
    p.attackTimer = 0;
    p.attackCooldown = 0.08;
    soundEngine.playWeaponSwap();

    const labels: Record<WeaponId, { name: string; color: string }> = {
      RIFT_SWORD: { name: 'Riftblade', color: '#F43F5E' },
      DUAL_DAGGERS: { name: 'Twin Voidfangs', color: '#C084FC' },
      GRAVITY_GREATSWORD: { name: 'Cataclysm Greatsword', color: '#F59E0B' },
    };
    const meta = labels[nextId];
    this.spawnFloatingText(p.x + p.w / 2, p.y - 16, meta.name.toUpperCase(), meta.color, 1.0);
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, meta.color, 12, 160);
    this.emitHud();
  }

  private hasSkill(skillId: SkillId): boolean {
    return this.player.unlockedSkills.includes(skillId);
  }

  public unlockSkill(skillId: SkillId): boolean {
    const p = this.player;
    if (!canUnlockSkill(skillId, p.unlockedSkills, p.ichor)) return false;
    const node = SKILL_TREE_NODES.find((s) => s.id === skillId);
    if (!node) return false;

    p.ichor -= node.cost;
    p.unlockedSkills.push(skillId);

    if (skillId === 'REALITY_VITAL_VESSEL') {
      p.maxHp += 35;
      p.hp = Math.min(p.maxHp, p.hp + 35);
      p.trailHp = p.hp;
      p.maxFlasks += 1;
      p.flasks = p.maxFlasks;
    } else if (skillId === 'REALITY_RIFT_CONDUIT') {
      p.maxRiftEnergy += 35;
      p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 35);
    }

    soundEngine.playSkillUnlock();
    this.spawnFloatingText(p.x + p.w / 2, p.y - 18, `UNLOCKED: ${node.name.toUpperCase()}`, '#FDE047', 1.05);
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#C084FC', 20, 200);
    this.emitHud();
    return true;
  }

  private getArmorMitigation(): number {
    if (this.player.weaponId === 'GRAVITY_GREATSWORD') {
      return this.hasSkill('GREAT_IRON_BASTION') ? 0.52 : 0.38;
    }
    if (this.player.weaponId === 'RIFT_SWORD') return 0.12;
    return 0;
  }

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handleBlur = () => {
    this.keys.clear();
    this.blockMouseHeld = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.gameState !== 'PLAYING') return;
    if (e.button === 0) {
      this.attackJustPressed = true;
    } else if (e.button === 2) {
      this.blockMouseHeld = true;
      this.parryJustPressed = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.blockMouseHeld = false;
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = e.code;

    if (code === 'Escape' || code === 'KeyP') {
      if (this.gameState === 'PLAYING') {
        this.setGameState('PAUSED');
        return;
      } else if (this.gameState === 'PAUSED') {
        this.setGameState('PLAYING');
        return;
      }
    }

    if (this.gameState !== 'PLAYING') return;

    if (
      [
        'Space',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
      ].includes(code)
    ) {
      e.preventDefault();
    }

    if (!this.keys.has(code)) {
      if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
        this.jumpJustPressed = true;
      }
      if (code === 'KeyJ' || code === 'KeyZ') {
        this.attackJustPressed = true;
      }
      if (code === 'KeyF' || code === 'Digit5') {
        this.projectileJustPressed = true;
      }
      if (code === 'KeyK' || code === 'KeyX') {
        this.parryJustPressed = true;
      }
      if (code === 'KeyL' || code === 'KeyC' || code === 'ShiftLeft' || code === 'ShiftRight') {
        this.dodgeJustPressed = true;
      }
      if (code === 'KeyE') {
        this.interactJustPressed = true;
      }
      if (code === 'KeyQ' || code === 'KeyH') {
        this.healJustPressed = true;
      }
      if (code === 'Digit1' || code === 'KeyU') {
        this.phaseJustPressed = true;
      }
      if (code === 'Digit2' || code === 'KeyI') {
        this.severJustPressed = true;
      }
      if (code === 'Digit3' || code === 'KeyO') {
        this.chronoJustPressed = true;
      }
      if (code === 'Digit4' || code === 'KeyR') {
        this.weaponArtJustPressed = true;
      }
      if (code === 'Tab' || code === 'KeyV') {
        this.weaponSwapJustPressed = true;
      }
    }

    this.keys.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private loop = (timestamp: number) => {
    const rawDt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;

    if (this.gameState === 'PLAYING') {
      this.update(rawDt);
    }

    this.render();

    this.hudSyncTimer += rawDt;
    if (this.hudSyncTimer >= 0.05) {
      this.hudSyncTimer = 0;
      this.emitHud();
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.time += dt;
    this.stats.elapsedSeconds += dt;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.activeBanner = null;
      }
    }

    if (this.phaseRippleTimer > 0) {
      this.phaseRippleTimer = Math.max(0, this.phaseRippleTimer - dt);
    }
    if (this.parryFreezeFlash > 0) {
      this.parryFreezeFlash = Math.max(0, this.parryFreezeFlash - dt * 3.5);
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.consumeSingleFrameInputs();
      return;
    }

    const zone = this.zones[this.currentZoneId];
    const p = this.player;

    // 1. Update Crushers (slowed by Chrono-Fracture!)
    const worldScale = p.chronoActiveTimer > 0 ? 0.2 : 1;
    for (const plat of zone.platforms) {
      if (plat.kind === 'CRUSHER' && plat.crusherBaseY !== undefined) {
        plat.crusherPhase =
          (plat.crusherPhase || 0) + dt * (plat.crusherSpeed || 3.5) * worldScale;
        const s = (Math.sin(plat.crusherPhase) + 1) * 0.5; // 0..1
        plat.y = plat.crusherBaseY + s * (plat.crusherRange || 80);
      }
    }

    // 2. Player Update
    this.updatePlayer(dt, zone);

    // 3. Enemies & Boss Update
    this.updateEnemies(dt * worldScale, zone);

    // 4. Projectiles Update
    this.updateProjectiles(dt * worldScale, zone);

    // 5. Rift Tears, Gravity Wells & Reality Echo Clones
    this.updateRiftTears(dt);
    this.updateGravityWells(dt);
    this.updateEchoClones(dt);

    // 6. Visual FX Update
    this.updateVisualFX(dt, zone);

    // 7. Reclaim Dropped Ichor if close
    if (this.droppedIchor && this.droppedIchor.zoneId === this.currentZoneId) {
      const dx = p.x + p.w / 2 - this.droppedIchor.x;
      const dy = p.y + p.h / 2 - (this.droppedIchor.y - 20);
      if (Math.hypot(dx, dy) < 46) {
        p.ichor += this.droppedIchor.amount;
        this.spawnFloatingText(
          p.x + p.w / 2,
          p.y - 12,
          `+${this.droppedIchor.amount} ICHOR RECLAIMED`,
          '#FDE047',
          1.0
        );
        soundEngine.playRelicUnlock();
        this.droppedIchor = null;
      }
    }

    // 8. Check Zone Exits
    for (const exit of zone.exits) {
      if (
        p.x + p.w > exit.x &&
        p.x < exit.x + exit.w &&
        p.y + p.h > exit.y &&
        p.y < exit.y + exit.h
      ) {
        this.transitionToZone(exit.targetZone, exit.spawnX, exit.spawnY);
        break;
      }
    }

    // 9. Camera Smooth Follow
    this.updateCamera(dt, zone);

    this.consumeSingleFrameInputs();
  }

  private consumeSingleFrameInputs() {
    this.jumpJustPressed = false;
    this.attackJustPressed = false;
    this.projectileJustPressed = false;
    this.dodgeJustPressed = false;
    this.interactJustPressed = false;
    this.healJustPressed = false;
    this.phaseJustPressed = false;
    this.severJustPressed = false;
    this.chronoJustPressed = false;
    this.weaponArtJustPressed = false;
    this.weaponSwapJustPressed = false;
    this.parryJustPressed = false;
  }

  private updatePlayer(dt: number, zone: ZoneDef) {
    const p = this.player;

    // Trail HP smooth catch-up
    if (p.trailHp > p.hp) {
      p.trailHp = Math.max(p.hp, p.trailHp - 42 * dt);
    } else {
      p.trailHp = p.hp;
    }

    // Cooldowns & timers
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    p.dropThroughTimer = Math.max(0, p.dropThroughTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.comboWindowTimer = Math.max(0, p.comboWindowTimer - dt);
    p.postDodgeWindowTimer = Math.max(0, p.postDodgeWindowTimer - dt);
    p.guardCounterTimer = Math.max(0, p.guardCounterTimer - dt);
    p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hitstunTimer = Math.max(0, p.hitstunTimer - dt);
    p.parryWindowTimer = Math.max(0, p.parryWindowTimer - dt);
    p.parryFlashTimer = Math.max(0, p.parryFlashTimer - dt);
    p.phaseShiftCooldown = Math.max(0, p.phaseShiftCooldown - dt);
    p.spatialSeverCooldown = Math.max(0, p.spatialSeverCooldown - dt);
    p.chronoCooldown = Math.max(0, p.chronoCooldown - dt);
    p.chronoActiveTimer = Math.max(0, p.chronoActiveTimer - dt);
    p.weaponArtCooldown = Math.max(0, p.weaponArtCooldown - dt);
    p.projectileCooldown = Math.max(0, p.projectileCooldown - dt);
    p.executionTimer = Math.max(0, p.executionTimer - dt);

    // Passive Rift Energy regeneration
    const riftRegen = this.hasSkill('REALITY_RIFT_CONDUIT') ? 13.0 : 8.5;
    p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + riftRegen * dt);

    // Stamina regen
    if (p.staminaRegenDelay > 0) {
      p.staminaRegenDelay = Math.max(0, p.staminaRegenDelay - dt);
    } else if (!p.blockHeld) {
      p.stamina = Math.min(p.maxStamina, p.stamina + 34 * dt);
    }

    // Read movement input
    const moveLeft = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const moveRight = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const upHeld = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const downHeld = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    const blockInput =
      this.keys.has('KeyK') || this.keys.has('KeyX') || this.blockMouseHeld;

    // Ladder detection
    const pxCenter = p.x + p.w / 2;
    const pyFeet = p.y + p.h;
    const overlappingLadder = zone.ladders.find(
      (lad) =>
        pxCenter >= lad.x - 10 &&
        pxCenter <= lad.x + lad.w + 10 &&
        pyFeet >= lad.y + 4 &&
        p.y <= lad.y + lad.h - 4
    );

    if (overlappingLadder && (upHeld || downHeld) && p.attackTimer <= 0 && p.dodgeTimer <= 0) {
      p.climbingLadder = true;
      p.x = overlappingLadder.x + overlappingLadder.w / 2 - p.w / 2;
      p.vx = 0;
      p.vy = upHeld ? -235 : downHeld ? 235 : 0;
      p.grounded = false;
      p.coyoteTimer = 0.08;
    } else if (p.climbingLadder) {
      if (!overlappingLadder || this.jumpJustPressed) {
        p.climbingLadder = false;
      } else {
        p.vx = 0;
        p.vy = 0;
      }
    }

    if (this.jumpJustPressed) {
      if (downHeld && p.grounded) {
        p.dropThroughTimer = 0.22;
        p.grounded = false;
      } else if (!p.climbingLadder || moveLeft || moveRight || this.keys.has('Space')) {
        p.climbingLadder = false;
        p.jumpBufferTimer = 0.13;
      }
    }

    // Weapon Swap (`Tab` / `V`)
    if (this.weaponSwapJustPressed && p.hitstunTimer <= 0) {
      this.switchWeapon();
    }

    // Reality Powers, Weapon Art & Unique Projectile
    if (p.hitstunTimer <= 0) {
      if (this.phaseJustPressed && p.unlockedPowers.includes('PHASE_SHIFT')) {
        this.triggerPhaseShift(zone);
      }
      if (this.severJustPressed && p.unlockedPowers.includes('SPATIAL_SEVER')) {
        this.triggerSpatialSever(zone);
      }
      if (this.chronoJustPressed && p.unlockedPowers.includes('CHRONO_FRACTURE')) {
        this.triggerChronoFracture();
      }
      if (this.weaponArtJustPressed) {
        this.triggerWeaponArt(zone);
      }
      if (this.projectileJustPressed) {
        this.triggerWeaponProjectile();
      }
    }

    // Interact / Execute (`E`)
    if (this.interactJustPressed && p.hitstunTimer <= 0) {
      if (!this.tryExecuteNearbyEnemy()) {
        this.tryInteract(zone);
      }
    }

    // Healing Flask (`Q` / `H`)
    if (this.healJustPressed && p.hitstunTimer <= 0 && p.healTimer <= 0) {
      if (p.flasks > 0 && p.hp < p.maxHp) {
        p.flasks -= 1;
        p.healTimer = 0.42;
        p.hp = Math.min(p.maxHp, p.hp + 52);
        soundEngine.playHeal();
        this.spawnFloatingText(p.x + p.w / 2, p.y - 10, '+52 HP', '#4ADE80', 1.0);
        this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#EF4444', 16, 170);
      }
    }

    if (p.healTimer > 0) {
      p.healTimer = Math.max(0, p.healTimer - dt);
    }

    // Dodge Roll (`L` / `C` / `Shift`)
    const dodgeCost = p.weaponId === 'DUAL_DAGGERS' ? 14 : 20;
    if (
      this.dodgeJustPressed &&
      p.dodgeCooldown <= 0 &&
      p.dodgeTimer <= 0 &&
      p.hitstunTimer <= 0 &&
      p.stamina >= dodgeCost
    ) {
      p.climbingLadder = false;
      p.stamina -= dodgeCost;
      p.staminaRegenDelay = 0.52;
      if (moveLeft) p.facing = -1;
      else if (moveRight) p.facing = 1;
      p.dodgeTimer = p.weaponId === 'DUAL_DAGGERS' ? 0.26 : 0.24;
      p.dodgeCooldown = p.weaponId === 'DUAL_DAGGERS' ? 0.28 : 0.36;
      p.invulnTimer = Math.max(p.invulnTimer, p.weaponId === 'DUAL_DAGGERS' ? 0.32 : 0.28);
      p.postDodgeWindowTimer = 0.45;
      p.attackTimer = 0;
      p.vx = p.facing * (p.weaponId === 'DUAL_DAGGERS' ? 740 : 640);
      p.vy = Math.min(p.vy, 0);
      soundEngine.playDodge();
      this.spawnBurst(
        p.x + p.w / 2,
        p.y + p.h - 10,
        p.weaponId === 'DUAL_DAGGERS' ? '#E879F9' : '#38BDF8',
        8,
        120
      );
    }

    // Guard & Brink Parry
    if (this.parryJustPressed && p.hitstunTimer <= 0 && p.dodgeTimer <= 0 && p.attackTimer <= 0) {
      p.parryWindowTimer = this.hasSkill('REALITY_BRINK_COUNTER') ? 0.28 : 0.21;
    }
    p.blockHeld =
      blockInput &&
      !p.climbingLadder &&
      p.hitstunTimer <= 0 &&
      p.dodgeTimer <= 0 &&
      p.attackTimer <= 0 &&
      p.stamina > 4;

    // Weapon-Specific Multi-Branch Combo Attacks
    const minStam = p.weaponId === 'DUAL_DAGGERS' ? 8 : p.weaponId === 'RIFT_SWORD' ? 12 : 18;
    if (
      this.attackJustPressed &&
      p.attackCooldown <= 0 &&
      p.dodgeTimer <= 0 &&
      p.hitstunTimer <= 0 &&
      p.healTimer <= 0 &&
      p.stamina >= minStam
    ) {
      p.climbingLadder = false;
      if (moveLeft) p.facing = -1;
      else if (moveRight) p.facing = 1;

      this.executeWeaponComboAttack(upHeld, downHeld);
    }

    // Active Attack Hitbox Check & Plunge Landing Shockwave
    if (p.attackTimer > 0) {
      p.attackTimer = Math.max(0, p.attackTimer - dt);
      if (p.attackTimer > p.attackTotal * 0.16 && p.attackTimer < p.attackTotal * 0.9) {
        this.checkPlayerAttackHits();
      }
    }

    // Horizontal Movement
    if (p.climbingLadder) {
      // Handled by ladder state above
    } else if (p.dodgeTimer > 0) {
      p.dodgeTimer = Math.max(0, p.dodgeTimer - dt);
      if (Math.random() < 0.7) {
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          life: 0.18,
          maxLife: 0.18,
          pose: 'DODGE',
          color: p.weaponId === 'DUAL_DAGGERS' ? '#E879F9' : '#38BDF8',
        });
      }
    } else if (p.hitstunTimer > 0) {
      p.vx *= Math.pow(0.05, dt);
    } else if (p.attackTimer > 0) {
      p.vx *= Math.pow(0.1, dt);
    } else {
      let targetVx = 0;
      const weaponSpeedMult =
        p.weaponId === 'DUAL_DAGGERS' ? 1.18 : p.weaponId === 'GRAVITY_GREATSWORD' ? 0.92 : 1.0;
      const moveMult = (p.blockHeld || p.healTimer > 0 ? 0.45 : 1) * weaponSpeedMult;
      if (moveLeft) {
        targetVx -= PLAYER_SPEED * moveMult;
        if (!p.blockHeld) p.facing = -1;
      }
      if (moveRight) {
        targetVx += PLAYER_SPEED * moveMult;
        if (!p.blockHeld) p.facing = 1;
      }
      const accel = p.grounded ? 2600 : 1700;
      if (p.vx < targetVx) p.vx = Math.min(targetVx, p.vx + accel * dt);
      else if (p.vx > targetVx) p.vx = Math.max(targetVx, p.vx - accel * dt);
    }

    // Jump execution (with Coyote & Jump Buffer)
    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0 && p.hitstunTimer <= 0 && p.dodgeTimer <= 0) {
      p.climbingLadder = false;
      p.vy = JUMP_VEL;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      this.spawnBurst(p.x + p.w / 2, p.y + p.h, '#94A3B8', 6, 90);
    }

    // Variable jump height cut
    const jumpHeld =
      this.keys.has('Space') || this.keys.has('KeyW') || this.keys.has('ArrowUp');
    if (!p.climbingLadder && !jumpHeld && p.vy < -260) {
      p.vy += GRAVITY * 1.4 * dt;
    }

    // Gravity
    if (!p.climbingLadder) {
      p.vy = Math.min(1150, p.vy + GRAVITY * dt);
    }

    // Move & Collide X
    p.x += p.vx * dt;
    this.resolveCollisionsX(zone);

    // Move & Collide Y
    const wasAirborne = !p.grounded;
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    p.grounded = false;
    this.resolveCollisionsY(zone, prevBottom);

    // Plunge attack landing shockwave!
    if (wasAirborne && p.grounded && p.attackTimer > 0 && p.attackVariant === 'AIR_PLUNGE') {
      this.triggerPlungeImpact();
    }

    if (p.grounded) {
      p.coyoteTimer = 0.11;
      this.recordSafePositionIfValid(zone);
    }

    // Floor Spike Pit Hazards
    for (const spk of zone.spikes) {
      if (
        p.x + p.w - 4 > spk.x &&
        p.x + 4 < spk.x + spk.w &&
        p.y + p.h > spk.y + 4 &&
        p.y < spk.y + spk.h
      ) {
        if (p.invulnTimer <= 0) {
          p.hp -= 22;
          soundEngine.playHurt();
          this.triggerShake(0.22, 9);
          this.spawnBurst(p.x + p.w / 2, p.y + p.h, '#EF4444', 18, 220);
          if (p.hp <= 0) {
            this.handlePlayerDeath();
            return;
          } else {
            p.x = this.lastSafeX;
            p.y = this.lastSafeY;
            p.vx = 0;
            p.vy = 0;
            p.invulnTimer = 1.05;
            this.spawnFloatingText(p.x + p.w / 2, p.y - 12, '-22 SPIKES', '#EF4444', 1.0);
          }
        }
        break;
      }
    }

    // Pit Fall Recovery
    if (p.y > zone.height + 100) {
      p.hp -= 22;
      soundEngine.playHurt();
      this.triggerShake(0.2, 8);
      if (p.hp <= 0) {
        this.handlePlayerDeath();
      } else {
        p.x = this.lastSafeX;
        p.y = this.lastSafeY;
        p.vx = 0;
        p.vy = 0;
        p.invulnTimer = 1.0;
        this.spawnFloatingText(p.x + p.w / 2, p.y - 10, '-22 ABYSS FALL', '#EF4444', 1);
      }
    }

    // Update Cloak Cloth Physics
    const anchorX = p.x + p.w / 2 - p.facing * 8;
    const anchorY = p.y + 18;
    p.cloakNodes[0].x = anchorX;
    p.cloakNodes[0].y = anchorY;
    for (let i = 1; i < p.cloakNodes.length; i++) {
      const prev = p.cloakNodes[i - 1];
      const curr = p.cloakNodes[i];
      curr.y += 140 * dt;
      curr.x -= p.facing * 45 * dt;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const maxLen = 8.5;
      if (dist > maxLen) {
        curr.x = prev.x + (dx / dist) * maxLen;
        curr.y = prev.y + (dy / dist) * maxLen;
      }
    }
  }

  private isPlatformSolidForPlayer(plat: Platform): boolean {
    if (plat.kind === 'GATE' && plat.gateId && this.openGates.has(plat.gateId)) {
      return false;
    }
    return plat.realm === 'BOTH' || plat.realm === this.player.realm;
  }

  private resolveCollisionsX(zone: ZoneDef) {
    const p = this.player;
    for (const plat of zone.platforms) {
      if (plat.kind === 'ONEWAY' || !this.isPlatformSolidForPlayer(plat)) continue;
      if (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y < plat.y + plat.h &&
        p.y + p.h > plat.y
      ) {
        if (p.vx > 0) {
          p.x = plat.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = plat.x + plat.w;
          p.vx = 0;
        }
      }
    }
  }

  private resolveCollisionsY(zone: ZoneDef, prevBottom: number) {
    const p = this.player;
    for (const plat of zone.platforms) {
      if (!this.isPlatformSolidForPlayer(plat)) continue;

      if (plat.kind === 'ONEWAY') {
        if (
          p.dropThroughTimer <= 0 &&
          p.vy >= 0 &&
          prevBottom <= plat.y + 10 &&
          p.x + p.w > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + p.h >= plat.y &&
          p.y + p.h <= plat.y + plat.h + 14
        ) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        }
        continue;
      }

      if (
        p.x < plat.x + plat.w &&
        p.x + p.w > plat.x &&
        p.y < plat.y + plat.h &&
        p.y + p.h > plat.y
      ) {
        // Crusher hazard damage if slamming down onto player
        if (plat.kind === 'CRUSHER' && p.y > plat.y + plat.h * 0.45) {
          this.damagePlayer(28, p.facing === 1 ? -1 : 1, false);
          p.y = plat.y + plat.h + 2;
          p.vy = 180;
          continue;
        }

        if (p.vy >= 0 && prevBottom <= plat.y + 22) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.h;
          p.vy = 0;
        }
      }
    }
  }

  private recordSafePositionIfValid(zone: ZoneDef) {
    const p = this.player;
    for (const plat of zone.platforms) {
      if (
        plat.realm === 'BOTH' &&
        plat.kind === 'STONE' &&
        p.x + 6 >= plat.x &&
        p.x + p.w - 6 <= plat.x + plat.w &&
        Math.abs(p.y + p.h - plat.y) < 4
      ) {
        this.lastSafeX = p.x;
        this.lastSafeY = p.y - 2;
        break;
      }
    }
  }

  private triggerPhaseShift(zone: ZoneDef) {
    const p = this.player;
    if (p.phaseShiftCooldown > 0 || p.riftEnergy < 10) return;
    p.riftEnergy -= 10;
    p.phaseShiftCooldown = 0.22;
    p.realm = p.realm === 'MATERIAL' ? 'ABYSSAL' : 'MATERIAL';
    this.phaseRippleTimer = 0.35;
    soundEngine.playPhaseShift(p.realm === 'ABYSSAL');
    this.spawnBurst(
      p.x + p.w / 2,
      p.y + p.h / 2,
      p.realm === 'ABYSSAL' ? '#EF4444' : '#CBD5E1',
      18,
      200
    );

    // Safety unstuck if phasing onto a newly solidified platform
    for (const plat of zone.platforms) {
      if (plat.kind === 'STONE' && plat.realm === p.realm) {
        if (
          p.x < plat.x + plat.w &&
          p.x + p.w > plat.x &&
          p.y < plat.y + plat.h &&
          p.y + p.h > plat.y
        ) {
          p.y = plat.y - p.h - 2;
          p.vy = Math.min(0, p.vy);
        }
      }
    }
  }

  private triggerSpatialSever(zone: ZoneDef) {
    const p = this.player;
    if (p.spatialSeverCooldown > 0 || p.riftEnergy < 24) return;
    p.riftEnergy -= 24;
    p.spatialSeverCooldown = this.hasSkill('REALITY_AETHER_STEP') ? 0.58 : 0.9;
    p.invulnTimer = Math.max(p.invulnTimer, 0.32);

    const startX = p.x + p.w / 2;
    const startY = p.y + p.h / 2;
    const stepDist = 240;
    let targetX = p.x;

    // Step forward incrementally: pass through RIFT_BARRIER, stop before solid STONE/GATE!
    const steps = 24;
    const dx = (stepDist / steps) * p.facing;
    for (let i = 1; i <= steps; i++) {
      const testX = p.x + dx * i;
      let blocked = false;
      for (const plat of zone.platforms) {
        if (plat.kind === 'ONEWAY' || plat.kind === 'RIFT_BARRIER') continue;
        if (!this.isPlatformSolidForPlayer(plat)) continue;
        if (
          testX < plat.x + plat.w &&
          testX + p.w > plat.x &&
          p.y + 4 < plat.y + plat.h &&
          p.y + p.h - 4 > plat.y
        ) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
      targetX = testX;

      if (i % 6 === 0) {
        this.afterimages.push({
          x: testX,
          y: p.y,
          facing: p.facing,
          life: 0.25,
          maxLife: 0.25,
          pose: 'SEVER',
          color: '#38BDF8',
        });
      }
    }

    p.x = targetX;
    p.vy = Math.min(p.vy, -60);

    const endX = p.x + p.w / 2;
    const endY = p.y + p.h / 2;

    // Leave exploding spatial tear line (double scar with Aether Step)
    this.riftTears.push({
      id: `tear_${Math.random()}`,
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      timer: 0.45,
      maxTimer: 0.45,
      detonated: false,
    });
    if (this.hasSkill('REALITY_AETHER_STEP')) {
      this.riftTears.push({
        id: `tear2_${Math.random()}`,
        x1: startX,
        y1: startY - 22,
        x2: endX,
        y2: endY + 22,
        timer: 0.72,
        maxTimer: 0.72,
        detonated: false,
      });
    }

    // Immediate slice damage along the path
    const minX = Math.min(startX, endX) - 24;
    const maxX = Math.max(startX, endX) + 24;
    for (const e of this.enemies) {
      if (e.aiState === 'DEAD') continue;
      if (
        e.x + e.w >= minX &&
        e.x <= maxX &&
        e.y + e.h >= p.y - 20 &&
        e.y <= p.y + p.h + 20
      ) {
        this.damageEnemy(e, 26, 28, p.facing, false);
      }
    }

    soundEngine.playSpatialSever();
    this.triggerShake(0.14, 6);
    this.spawnBurst(endX, endY, '#38BDF8', 18, 220);
  }

  private triggerChronoFracture() {
    const p = this.player;
    if (p.chronoCooldown > 0 || p.riftEnergy < 35) return;
    p.riftEnergy -= 35;
    p.chronoActiveTimer = 3.8;
    p.chronoCooldown = 7.0;
    soundEngine.playChronoFracture();
    this.triggerShake(0.18, 7);
    this.spawnFloatingText(p.x + p.w / 2, p.y - 14, 'TIME FRACTURED', '#C084FC', 1.1);
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#A855F7', 24, 280);
  }

  private triggerWeaponProjectile() {
    const p = this.player;
    if (p.projectileCooldown > 0) return;
    const cx = p.x + p.w / 2 + p.facing * 24;
    const cy = p.y + p.h * 0.44;

    if (p.weaponId === 'RIFT_SWORD') {
      if (p.riftEnergy < 14) return;
      p.riftEnergy -= 14;
      p.projectileCooldown = 0.55;
      const twin = this.hasSkill('SWORD_TWIN_CRESCENT');
      if (twin) {
        this.spawnPlayerProjectile(cx, cy - 11, p.facing * 760, -35, 22, 18, '#38BDF8', 'RIFT_LANCE', true, 14);
        this.spawnPlayerProjectile(cx, cy + 11, p.facing * 760, 35, 22, 18, '#F43F5E', 'RIFT_LANCE', true, 14);
      } else {
        this.spawnPlayerProjectile(cx, cy, p.facing * 760, 0, 28, 22, '#38BDF8', 'RIFT_LANCE', true, 15);
      }
      soundEngine.playRiftLance();
      this.spawnBurst(cx, cy, '#38BDF8', 12, 190);
      this.spawnFloatingText(cx, p.y - 10, twin ? 'TWIN RIFT LANCE' : 'RIFT DISCHARGE', '#38BDF8', 0.9);
    } else if (p.weaponId === 'DUAL_DAGGERS') {
      if (p.riftEnergy < 12) return;
      p.riftEnergy -= 12;
      p.projectileCooldown = 0.42;
      const triple = this.hasSkill('DAGGER_TRIPLE_KUNAI');
      if (triple) {
        this.spawnPlayerProjectile(cx, cy, p.facing * 820, 0, 16, 12, '#E879F9', 'VOIDFANG_DAGGER', false, 10);
        this.spawnPlayerProjectile(cx, cy - 6, p.facing * 790, -145, 16, 12, '#38BDF8', 'VOIDFANG_DAGGER', false, 10);
        this.spawnPlayerProjectile(cx, cy + 6, p.facing * 790, 145, 16, 12, '#38BDF8', 'VOIDFANG_DAGGER', false, 10);
      } else {
        this.spawnPlayerProjectile(cx, cy, p.facing * 820, 0, 22, 16, '#E879F9', 'VOIDFANG_DAGGER', false, 11);
      }
      soundEngine.playDaggerThrow();
      this.spawnBurst(cx, cy, '#E879F9', 9, 160);
    } else {
      // GRAVITY_GREATSWORD: Gravity Pulse Orb
      if (p.riftEnergy < 18) return;
      p.riftEnergy -= 18;
      p.projectileCooldown = 0.85;
      const upgraded = this.hasSkill('GREAT_SINGULARITY_ORB');
      this.spawnPlayerProjectile(
        cx,
        cy,
        p.facing * 310,
        0,
        upgraded ? 42 : 30,
        upgraded ? 45 : 32,
        '#A855F7',
        'GRAVITY_ORB',
        false,
        upgraded ? 22 : 17
      );
      soundEngine.playGravityOrb();
      this.spawnBurst(cx, cy, '#A855F7', 14, 180);
      this.spawnFloatingText(cx, p.y - 12, upgraded ? 'VORTEX SPHERE' : 'GRAVITY ORB', '#C084FC', 0.92);
    }
  }

  private spawnPlayerProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    postureDamage: number,
    color: string,
    kind: NonNullable<Projectile['kind']>,
    piercing: boolean,
    radius: number
  ) {
    this.projectiles.push({
      id: `pproj_${Math.random()}`,
      x,
      y,
      vx,
      vy,
      radius,
      damage,
      postureDamage,
      fromPlayer: true,
      color,
      life: kind === 'GRAVITY_ORB' ? 1.85 : 1.1,
      parryable: false,
      kind,
      piercing,
      hitIds: [],
    });
  }

  private triggerWeaponArt(zone: ZoneDef) {
    const p = this.player;
    if (p.weaponArtCooldown > 0) return;

    if (p.weaponId === 'RIFT_SWORD') {
      if (p.riftEnergy < 20) return;
      p.riftEnergy -= 20;
      p.weaponArtCooldown = 1.6;
      const cx = p.x + p.w / 2 + p.facing * 26;
      const cy = p.y + p.h * 0.45;
      const sovereign = this.hasSkill('SWORD_SOVEREIGN_SURGE');
      this.fireRiftCrescent(cx, cy, p.facing * 700, 0, sovereign ? 42 : 34);
      this.fireRiftCrescent(cx, cy - 10, p.facing * 650, -135, 26);
      this.fireRiftCrescent(cx, cy + 10, p.facing * 650, 135, 26);
      if (sovereign) {
        this.fireRiftCrescent(cx, cy - 16, p.facing * 610, -260, 24);
        this.fireRiftCrescent(cx, cy + 16, p.facing * 610, 260, 24);
      }
      soundEngine.playRiftWave();
      this.triggerShake(0.14, 5);
      this.spawnBurst(cx, cy, '#38BDF8', 18, 220);
      this.spawnFloatingText(cx, p.y - 12, sovereign ? 'SOVEREIGN SURGE' : 'RIFT SURGE', '#38BDF8', 1.0);
    } else if (p.weaponId === 'DUAL_DAGGERS') {
      if (p.riftEnergy < 22) return;
      p.riftEnergy -= 22;
      p.weaponArtCooldown = 2.2;
      p.invulnTimer = Math.max(p.invulnTimer, 0.35);

      const originX = p.x;
      const originY = p.y;
      const originFacing = p.facing;

      // Summon Reality Echo Clone(s)
      this.echoClones.push({
        id: `echo_${Math.random()}`,
        x: originX,
        y: originY,
        facing: originFacing,
        timer: 2.3,
        maxTimer: 2.3,
        slashTimer: 0.25,
      });

      if (this.hasSkill('DAGGER_TWIN_ECHOES')) {
        this.echoClones.push({
          id: `echo2_${Math.random()}`,
          x: Math.max(24, Math.min(zone.width - p.w - 24, originX + originFacing * 72)),
          y: originY,
          facing: originFacing === 1 ? -1 : 1,
          timer: 2.3,
          maxTimer: 2.3,
          slashTimer: 0.12,
        });
      }

      // Find nearest live enemy within 380px to reality-blink behind
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      let nearest: Enemy | null = null;
      let bestDist = 380;
      for (const e of this.enemies) {
        if (e.aiState === 'DEAD') continue;
        const d = Math.hypot(e.x + e.w / 2 - px, e.y + e.h / 2 - py);
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }

      if (nearest) {
        const behindDir: 1 | -1 = nearest.x + nearest.w / 2 >= px ? 1 : -1;
        let destX =
          behindDir === 1 ? nearest.x + nearest.w + 8 : nearest.x - p.w - 8;
        destX = Math.max(24, Math.min(zone.width - p.w - 24, destX));
        p.x = destX;
        p.y = nearest.y + nearest.h - p.h;
        p.facing = behindDir === 1 ? -1 : 1;
        this.damageEnemy(nearest, 34, 42, p.facing, true);
        this.slashArcs.push({
          x: nearest.x + nearest.w / 2,
          y: nearest.y + nearest.h * 0.45,
          facing: p.facing,
          angleStart: -1.6,
          angleEnd: 1.6,
          radius: 56,
          color: '#E879F9',
          life: 0.18,
          maxLife: 0.18,
          heavy: true,
        });
      } else {
        p.x = Math.max(24, Math.min(zone.width - p.w - 24, p.x + p.facing * 170));
      }

      soundEngine.playMirageBlink();
      this.triggerShake(0.14, 5);
      this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#E879F9', 20, 230);
      this.spawnFloatingText(p.x + p.w / 2, p.y - 14, 'MIRAGE ANCHOR', '#F5D0FE', 1.05);
    } else {
      // GRAVITY_GREATSWORD: Singularity Crush
      if (p.riftEnergy < 26) return;
      p.riftEnergy -= 26;
      p.weaponArtCooldown = 3.2;
      const horizon = this.hasSkill('GREAT_EVENT_HORIZON');

      const wx = Math.max(60, Math.min(zone.width - 60, p.x + p.w / 2 + p.facing * 155));
      const wy = p.y + p.h / 2 - 18;
      this.gravityWells.push({
        id: `grav_${Math.random()}`,
        x: wx,
        y: wy,
        radius: horizon ? 245 : 175,
        timer: 2.3,
        maxTimer: 2.3,
        tickTimer: 0.3,
        heavyExplosion: horizon,
      });

      soundEngine.playGravityWell(false);
      this.triggerShake(0.18, 7);
      this.spawnBurst(wx, wy, '#A855F7', 22, 240);
      this.spawnFloatingText(wx, wy - 24, horizon ? 'EVENT HORIZON' : 'SINGULARITY CRUSH', '#C084FC', 1.1);
    }
  }

  private fireRiftCrescent(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number
  ) {
    this.projectiles.push({
      id: `crescent_${Math.random()}`,
      x,
      y,
      vx,
      vy,
      radius: 14,
      damage,
      postureDamage: 22,
      fromPlayer: true,
      color: '#38BDF8',
      life: 1.15,
      parryable: false,
      kind: 'RIFT_CRESCENT',
      piercing: true,
      hitIds: [],
    });
  }

  private executeWeaponComboAttack(upHeld: boolean, downHeld: boolean) {
    const p = this.player;
    p.attackHitIds = [];
    p.comboWindowTimer = 0.72;
    p.staminaRegenDelay = 0.55;

    // 1. Check Guard Counter (Cataclysm Greatsword Iron Bastion)
    if (p.guardCounterTimer > 0 && p.weaponId === 'GRAVITY_GREATSWORD' && this.hasSkill('GREAT_IRON_BASTION')) {
      p.guardCounterTimer = 0;
      p.attackVariant = 'GUARD_COUNTER';
      p.comboStep = 3;
      p.attackTotal = 0.28;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = 0.26;
      p.stamina = Math.max(0, p.stamina - 16);
      p.vx = p.facing * 290;
      soundEngine.playSlash(3);
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 26,
        y: p.y + p.h * 0.44,
        facing: p.facing,
        angleStart: -1.45,
        angleEnd: 1.45,
        radius: 92,
        color: '#FDE047',
        life: 0.22,
        maxLife: 0.22,
        heavy: true,
      });
      this.spawnFloatingText(p.x + p.w / 2, p.y - 16, 'GUARD COUNTER', '#FDE047', 1.0);
      return;
    }

    // 2. Check Air Plunge (S + Attack while airborne)
    if (!p.grounded && downHeld) {
      p.attackVariant = 'AIR_PLUNGE';
      p.comboStep = 3;
      p.attackTotal = 0.45;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = 0.28;
      p.stamina = Math.max(0, p.stamina - 14);
      p.vy = p.weaponId === 'GRAVITY_GREATSWORD' ? 860 : 750;
      p.vx = p.facing * 90;
      soundEngine.playSlash(3);
      this.slashArcs.push({
        x: p.x + p.w / 2,
        y: p.y + p.h * 0.65,
        facing: p.facing,
        angleStart: 0.4,
        angleEnd: 2.7,
        radius: p.weaponId === 'GRAVITY_GREATSWORD' ? 74 : 52,
        color: p.weaponId === 'DUAL_DAGGERS' ? '#E879F9' : p.weaponId === 'RIFT_SWORD' ? '#38BDF8' : '#A855F7',
        life: 0.22,
        maxLife: 0.22,
        heavy: true,
      });
      return;
    }

    // 3. Check Rising Launcher (W + Attack)
    if (upHeld) {
      p.attackVariant = 'UP_LAUNCHER';
      p.comboStep = 2;
      p.attackTotal = p.weaponId === 'GRAVITY_GREATSWORD' ? 0.32 : 0.22;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = p.attackTotal + 0.04;
      p.stamina = Math.max(0, p.stamina - 14);
      p.vy = p.weaponId === 'DUAL_DAGGERS' ? -360 : p.weaponId === 'RIFT_SWORD' ? -240 : -180;
      p.vx = p.facing * 120;
      soundEngine.playLauncher();
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 16,
        y: p.y + p.h * 0.25,
        facing: p.facing,
        angleStart: 1.2,
        angleEnd: -1.65,
        radius: p.weaponId === 'GRAVITY_GREATSWORD' ? 82 : 62,
        color: p.weaponId === 'DUAL_DAGGERS' ? '#E879F9' : p.weaponId === 'RIFT_SWORD' ? '#38BDF8' : '#F59E0B',
        life: 0.18,
        maxLife: 0.18,
        heavy: true,
      });
      if (p.weaponId === 'RIFT_SWORD' && this.hasSkill('SWORD_SKYBREAKER')) {
        this.fireRiftCrescent(p.x + p.w / 2 + p.facing * 20, p.y + 12, p.facing * 480, -340, 22);
      }
      return;
    }

    // 4. Check Dodge Ambush Strike (Attack immediately after dodge)
    if (p.postDodgeWindowTimer > 0) {
      p.postDodgeWindowTimer = 0;
      p.attackVariant = 'DASH_STRIKE';
      p.comboStep = 2;
      p.attackTotal = p.weaponId === 'DUAL_DAGGERS' ? 0.18 : 0.24;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = p.attackTotal;
      p.stamina = Math.max(0, p.stamina - 12);
      p.vx = p.facing * (p.weaponId === 'DUAL_DAGGERS' ? 540 : 410);
      soundEngine.playDaggerSlash(3);
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 24,
        y: p.y + p.h * 0.45,
        facing: p.facing,
        angleStart: -0.9,
        angleEnd: 0.9,
        radius: 66,
        color: p.weaponId === 'DUAL_DAGGERS' ? '#E879F9' : p.weaponId === 'RIFT_SWORD' ? '#38BDF8' : '#F59E0B',
        life: 0.16,
        maxLife: 0.16,
        heavy: true,
      });
      return;
    }

    // 5. Neutral Chain Combo (Weapon-Unique Step Counts & Skills)
    p.attackVariant = 'NEUTRAL';
    const maxCombo =
      p.weaponId === 'DUAL_DAGGERS'
        ? this.hasSkill('DAGGER_PHANTOM_FLURRY')
          ? 5
          : 4
        : p.weaponId === 'RIFT_SWORD'
          ? this.hasSkill('SWORD_RIFT_TEMPEST')
            ? 4
            : 3
          : 3;

    const nextStep =
      p.comboWindowTimer > 0 && p.comboStep < maxCombo
        ? ((p.comboStep + 1) as 1 | 2 | 3 | 4 | 5)
        : 1;
    p.comboStep = nextStep;

    if (p.weaponId === 'DUAL_DAGGERS') {
      const isFinisher = nextStep >= 4;
      p.attackTotal = nextStep === 5 ? 0.22 : nextStep === 4 ? 0.18 : 0.11;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = nextStep === 5 ? 0.24 : nextStep === 4 ? 0.2 : 0.11;
      p.stamina -= isFinisher ? 11 : 8;
      p.vx = p.facing * (nextStep === 5 ? 320 : nextStep === 4 ? 250 : 175);
      if (nextStep === 5) p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      soundEngine.playDaggerSlash(nextStep);
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 16,
        y: p.y + p.h * 0.45,
        facing: p.facing,
        angleStart: nextStep % 2 === 0 ? 1.15 : -1.15,
        angleEnd: nextStep % 2 === 0 ? -1.15 : 1.15,
        radius: nextStep === 5 ? 64 : nextStep === 4 ? 54 : 44,
        color: nextStep === 5 ? '#38BDF8' : nextStep === 4 ? '#E879F9' : '#F5D0FE',
        life: 0.13,
        maxLife: 0.13,
        heavy: isFinisher,
      });
    } else if (p.weaponId === 'RIFT_SWORD') {
      const isFinisher = nextStep >= 3;
      p.attackTotal = nextStep === 4 ? 0.28 : nextStep === 3 ? 0.25 : 0.18;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = nextStep === 4 ? 0.3 : nextStep === 3 ? 0.27 : 0.18;
      p.stamina -= isFinisher ? 16 : 12;
      p.vx = p.facing * (isFinisher ? 220 : 145);
      soundEngine.playSlash(nextStep);
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 20,
        y: p.y + p.h * 0.45,
        facing: p.facing,
        angleStart: nextStep === 2 ? 1.0 : -1.3,
        angleEnd: nextStep === 2 ? -1.3 : 1.25,
        radius: nextStep === 4 ? 82 : nextStep === 3 ? 68 : 56,
        color: nextStep >= 3 ? '#38BDF8' : '#E2D9C8',
        life: 0.16,
        maxLife: 0.16,
        heavy: isFinisher,
      });
      if (nextStep === 3) {
        this.fireRiftCrescent(p.x + p.w / 2 + p.facing * 24, p.y + p.h * 0.44, p.facing * 640, 0, 24);
        soundEngine.playRiftWave();
      } else if (nextStep === 4) {
        // Rift Tempest spinning dual wave
        this.fireRiftCrescent(p.x + p.w / 2 + p.facing * 24, p.y + p.h * 0.42, p.facing * 680, 0, 30);
        this.fireRiftCrescent(p.x + p.w / 2 - p.facing * 24, p.y + p.h * 0.42, -p.facing * 540, 0, 22);
        soundEngine.playRiftWave();
      }
    } else {
      // GRAVITY_GREATSWORD
      p.attackTotal = nextStep === 3 ? 0.38 : 0.28;
      p.attackTimer = p.attackTotal;
      p.attackCooldown = nextStep === 3 ? 0.4 : 0.28;
      p.stamina -= nextStep === 3 ? 26 : 19;
      p.vx = p.facing * (nextStep === 3 ? 235 : 135);
      soundEngine.playSlash(nextStep);
      this.slashArcs.push({
        x: p.x + p.w / 2 + p.facing * 24,
        y: p.y + p.h * 0.45,
        facing: p.facing,
        angleStart: nextStep === 2 ? 1.1 : -1.35,
        angleEnd: nextStep === 2 ? -1.35 : 1.3,
        radius: nextStep === 3 ? 88 : 70,
        color: nextStep === 3 ? '#A855F7' : '#F59E0B',
        life: 0.2,
        maxLife: 0.2,
        heavy: true,
      });
      if (nextStep === 3) {
        this.triggerShake(0.18, 7);
        this.spawnBurst(p.x + p.w / 2 + p.facing * 45, p.y + p.h - 4, '#A855F7', 16, 210);
      }
    }
  }

  private triggerPlungeImpact() {
    const p = this.player;
    const slamRadius =
      p.weaponId === 'GRAVITY_GREATSWORD'
        ? this.hasSkill('GREAT_TITAN_SLAM')
          ? 165
          : 120
        : 85;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h;
    soundEngine.playHit(true);
    this.triggerShake(0.2, p.weaponId === 'GRAVITY_GREATSWORD' ? 10 : 6);
    this.spawnBurst(
      cx,
      cy - 6,
      p.weaponId === 'GRAVITY_GREATSWORD' ? '#A855F7' : '#38BDF8',
      20,
      240
    );
    for (const e of this.enemies) {
      if (e.aiState === 'DEAD') continue;
      const dist = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h - cy);
      if (dist <= slamRadius) {
        const dmg = p.weaponId === 'GRAVITY_GREATSWORD' ? 46 : 28;
        const post = p.weaponId === 'GRAVITY_GREATSWORD' ? 48 : 26;
        this.damageEnemy(e, dmg, post, e.x + e.w / 2 >= cx ? 1 : -1, true);
      }
    }
  }

  private checkPlayerAttackHits() {
    const p = this.player;
    const reach =
      p.weaponId === 'GRAVITY_GREATSWORD'
        ? p.comboStep === 3
          ? 106
          : 88
        : p.weaponId === 'DUAL_DAGGERS'
          ? p.attackVariant === 'DASH_STRIKE'
            ? 74
            : 60
          : p.comboStep >= 3
            ? 84
            : 72;
    const hx = p.facing === 1 ? p.x + p.w - 4 : p.x - reach + 4;
    const hy = p.attackVariant === 'UP_LAUNCHER' ? p.y - 34 : p.y - 10;
    const hw = reach;
    const hh = p.attackVariant === 'UP_LAUNCHER' ? p.h + 36 : p.h + 20;

    for (const e of this.enemies) {
      if (e.aiState === 'DEAD' || p.attackHitIds.includes(e.id)) continue;
      if (hx < e.x + e.w && hx + hw > e.x && hy < e.y + e.h && hy + hh > e.y) {
        p.attackHitIds.push(e.id);
        let dmg = 22;
        let postureDmg = 20;
        let isHeavy = false;

        if (p.weaponId === 'DUAL_DAGGERS') {
          const ambushMult =
            (p.attackVariant === 'DASH_STRIKE' || p.attackVariant === 'UP_LAUNCHER') &&
            this.hasSkill('DAGGER_CYCLONE_AMBUSH')
              ? 1.45
              : 1;
          dmg = Math.round((p.comboStep === 5 ? 32 : p.comboStep === 4 ? 26 : 15) * ambushMult);
          postureDmg = p.comboStep >= 4 ? 24 : 13;
          isHeavy = p.comboStep >= 4 || p.attackVariant !== 'NEUTRAL';
          p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 10);
        } else if (p.weaponId === 'RIFT_SWORD') {
          dmg = p.comboStep === 4 ? 38 : p.comboStep === 3 ? 32 : p.comboStep === 2 ? 24 : 20;
          postureDmg = p.comboStep >= 3 ? 28 : 18;
          isHeavy = p.comboStep >= 3 || p.attackVariant !== 'NEUTRAL';
          p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 9);
        } else {
          const titanMult = p.comboStep === 3 && this.hasSkill('GREAT_TITAN_SLAM') ? 1.25 : 1;
          dmg = Math.round(
            (p.attackVariant === 'GUARD_COUNTER'
              ? 58
              : p.comboStep === 3
                ? 54
                : p.comboStep === 2
                  ? 38
                  : 32) * titanMult
          );
          postureDmg = Math.round((p.comboStep === 3 ? 52 : 34) * titanMult);
          isHeavy = true;
          p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 11);
          if (p.comboStep === 3 && e.kind !== 'BOSS_VAELOR') {
            e.vy = -260;
          }
        }

        // Upward Launcher lift
        if (p.attackVariant === 'UP_LAUNCHER' && e.kind !== 'BOSS_VAELOR') {
          e.vy = -380;
          e.grounded = false;
        }

        // Detonate Voidfang Kunai Mark if active!
        if (e.markedTimer > 0) {
          e.markedTimer = 0;
          dmg = Math.round(dmg * 1.35);
          postureDmg += 15;
          this.spawnBurst(e.x + e.w / 2, e.y + e.h * 0.4, '#E879F9', 16, 230);
          this.spawnFloatingText(e.x + e.w / 2, e.y - 18, 'RIFT MARK DETONATION', '#E879F9', 0.95);
        }

        this.damageEnemy(e, dmg, postureDmg, p.facing, isHeavy);
      }
    }
  }

  private tryExecuteNearbyEnemy(): boolean {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    for (const e of this.enemies) {
      if (e.aiState !== 'STAGGERED') continue;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      if (Math.hypot(cx - ex, cy - ey) < 115) {
        p.x = ex - p.facing * 42 - p.w / 2;
        p.invulnTimer = 0.65;
        p.executionTimer = 0.35;
        p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 30);

        const execDmg = e.kind === 'BOSS_VAELOR' ? 145 : 130;
        e.posture = 0;
        e.aiState = 'RECOVER';
        e.stateTimer = 0.8;
        this.damageEnemy(e, execDmg, 0, p.facing, true);
        this.stats.executions += 1;
        soundEngine.playExecution();
        this.hitstopTimer = 0.095;
        this.triggerShake(0.32, 13);
        this.showBanner('FATAL EXECUTION', `${execDmg} Critical Sever`, 'EXECUTION', 1.4);
        this.spawnBurst(ex, ey, '#EF4444', 32, 340);
        return true;
      }
    }
    return false;
  }

  private tryInteract(zone: ZoneDef) {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;

    for (const inter of zone.interactables) {
      const ix = inter.x + inter.w / 2;
      const iy = inter.y + inter.h / 2;
      if (Math.hypot(px - ix, py - iy) > 78) continue;

      if (inter.kind === 'ALTAR') {
        inter.activated = true;
        this.lastAltarZone = zone.id;
        this.lastAltarX = inter.x + 10;
        this.lastAltarY = inter.y + inter.h - p.h;
        p.hp = p.maxHp;
        p.trailHp = p.maxHp;
        p.stamina = p.maxStamina;
        p.riftEnergy = p.maxRiftEnergy;
        p.flasks = p.maxFlasks;
        this.spawnEnemiesForZone(zone.id);
        soundEngine.playAltarRest();
        this.spawnBurst(ix, iy, '#EF4444', 24, 210);
        this.showBanner('Blood Altar Kindle', 'Flasks & Vitality Restored · Respawn Bound', 'ZONE', 2.4);
        return;
      }

      if (inter.kind === 'RELIC' && !inter.activated && inter.powerReward) {
        inter.activated = true;
        if (!p.unlockedPowers.includes(inter.powerReward)) {
          p.unlockedPowers.push(inter.powerReward);
        }
        p.riftEnergy = p.maxRiftEnergy;
        soundEngine.playRelicUnlock();
        this.spawnBurst(ix, iy, '#A855F7', 30, 260);
        this.showBanner(inter.title, inter.description, 'RELIC', 4.6);
        return;
      }

      if (inter.kind === 'LEVER' && !inter.activated && inter.gateId) {
        inter.activated = true;
        this.openGates.add(inter.gateId);
        soundEngine.playParry();
        this.triggerShake(0.2, 6);
        this.showBanner('Shortcut Unsealed', inter.description, 'ZONE', 2.8);
        return;
      }

      if (inter.kind === 'CHEST' && !inter.activated) {
        inter.activated = true;
        const ichorGain = inter.ichorReward ?? 120;
        p.ichor += ichorGain;
        p.flasks = Math.min(p.maxFlasks, p.flasks + 1);
        soundEngine.playChestOpen();
        this.spawnBurst(ix, iy, '#FDE047', 26, 250);
        this.spawnFloatingText(ix, iy - 18, `+${ichorGain} ICHOR`, '#FDE047', 1.15);
        this.showBanner(inter.title, inter.description, 'RELIC', 3.4);
        return;
      }

      if (inter.kind === 'LORE') {
        soundEngine.playPhaseShift(false);
        this.showBanner(inter.title, inter.description, 'LORE', 5.0);
        return;
      }
    }
  }

  private damageEnemy(
    e: Enemy,
    dmg: number,
    postureDmg: number,
    dir: 1 | -1,
    heavy: boolean
  ) {
    e.hp = Math.max(0, e.hp - dmg);
    e.flashTimer = 0.12;
    if (e.kind !== 'BOSS_VAELOR') {
      e.vx = dir * (heavy ? 240 : 140);
    }

    if (e.aiState !== 'STAGGERED') {
      e.posture = Math.min(e.maxPosture, e.posture + postureDmg);
      if (e.posture >= e.maxPosture && e.hp > 0) {
        e.aiState = 'STAGGERED';
        e.stateTimer = 3.4;
        e.parryable = false;
        soundEngine.playParry();
        this.spawnFloatingText(e.x + e.w / 2, e.y - 20, 'POSTURE BROKEN!', '#FDE047', 1.15);
      }
    }

    soundEngine.playHit(heavy);
    this.hitstopTimer = heavy ? 0.068 : 0.038;
    this.triggerShake(heavy ? 0.18 : 0.09, heavy ? 8 : 4);
    this.spawnBurst(e.x + e.w / 2, e.y + e.h * 0.4, '#EF4444', heavy ? 16 : 9, 200);
    this.spawnFloatingText(
      e.x + e.w / 2,
      e.y + 8,
      `${dmg}`,
      heavy ? '#FDE047' : '#F8FAFC',
      heavy ? 1.2 : 0.95
    );

    if (e.hp <= 0) {
      e.aiState = 'DEAD';
      this.player.ichor += e.ichorValue;
      this.stats.enemiesSlain += 1;
      this.spawnBurst(e.x + e.w / 2, e.y + e.h / 2, '#DC2626', 28, 270);
      this.spawnFloatingText(
        e.x + e.w / 2,
        e.y - 10,
        `+${e.ichorValue} ICHOR`,
        '#F59E0B',
        1.05
      );

      if (e.kind === 'BOSS_VAELOR') {
        this.defeatedBoss = true;
        soundEngine.playRelicUnlock();
        this.triggerShake(0.45, 14);
        this.gameState = 'VICTORY';
        this.emitHud();
      }
    }
  }

  private damagePlayer(dmg: number, knockDir: 1 | -1, parryable: boolean) {
    const p = this.player;
    if (p.invulnTimer > 0) return false;

    // 1. Check Brink Parry!
    if (parryable && p.parryWindowTimer > 0) {
      p.parryWindowTimer = 0;
      p.parryFlashTimer = 0.25;
      p.invulnTimer = 0.35;
      p.stamina = Math.min(p.maxStamina, p.stamina + 18);
      p.riftEnergy = Math.min(p.maxRiftEnergy, p.riftEnergy + 22);
      if (this.hasSkill('REALITY_BRINK_COUNTER')) {
        p.hp = Math.min(p.maxHp, p.hp + 10);
        const px = p.x + p.w / 2;
        const py = p.y + p.h / 2;
        for (const en of this.enemies) {
          if (en.aiState === 'DEAD') continue;
          if (Math.hypot(en.x + en.w / 2 - px, en.y + en.h / 2 - py) < 160) {
            this.damageEnemy(en, 24, 34, p.facing, true);
          }
        }
      }
      this.stats.parries += 1;
      this.hitstopTimer = 0.085;
      this.parryFreezeFlash = 1.0;
      this.triggerShake(0.22, 9);
      soundEngine.playParry();
      this.spawnBurst(p.x + p.w / 2 + p.facing * 20, p.y + 24, '#FDE047', 22, 290);
      this.spawnFloatingText(p.x + p.w / 2, p.y - 16, 'BRINK PARRY', '#FDE047', 1.2);
      return 'PARRIED';
    }

    // 2. Check Guard Block
    if (p.blockHeld && p.stamina >= 15) {
      p.stamina -= 18;
      p.staminaRegenDelay = 0.7;
      if (this.hasSkill('GREAT_IRON_BASTION') && p.weaponId === 'GRAVITY_GREATSWORD') {
        p.guardCounterTimer = 0.95;
      }
      const chip = Math.ceil(dmg * 0.28);
      p.hp = Math.max(0, p.hp - chip);
      p.vx = knockDir * 220;
      soundEngine.playBlock();
      this.triggerShake(0.12, 5);
      this.spawnBurst(p.x + p.w / 2, p.y + 26, '#94A3B8', 10, 160);
      this.spawnFloatingText(p.x + p.w / 2, p.y - 8, `BLOCKED -${chip}`, '#CBD5E1', 0.9);
      if (p.hp <= 0) this.handlePlayerDeath();
      return 'BLOCKED';
    }

    // 3. Direct Hit (with Heavy Armor Mitigation & Greatsword Hyper-Armor Poise)
    const mitigation = this.getArmorMitigation();
    const finalDmg = Math.max(1, Math.round(dmg * (1 - mitigation)));
    const hasHyperArmor =
      p.weaponId === 'GRAVITY_GREATSWORD' && p.attackTimer > 0;

    p.hp = Math.max(0, p.hp - finalDmg);
    p.invulnTimer = 0.55;
    if (!hasHyperArmor) {
      p.hitstunTimer = 0.22;
      p.attackTimer = 0;
      p.healTimer = 0;
      p.vx = knockDir * 270;
      p.vy = -190;
    } else {
      this.spawnFloatingText(p.x + p.w / 2, p.y - 26, 'POISE', '#F59E0B', 0.9);
    }
    soundEngine.playHurt();
    this.triggerShake(0.22, 10);
    this.spawnBurst(p.x + p.w / 2, p.y + 30, '#EF4444', 16, 220);
    this.spawnFloatingText(p.x + p.w / 2, p.y - 12, `-${finalDmg}`, '#EF4444', 1.1);

    if (p.hp <= 0) {
      this.handlePlayerDeath();
    }
    return 'HIT';
  }

  private handlePlayerDeath() {
    const p = this.player;
    this.stats.deaths += 1;
    if (p.ichor > 0) {
      this.droppedIchor = {
        zoneId: this.currentZoneId,
        x: p.x + p.w / 2,
        y: p.y + p.h,
        amount: p.ichor,
      };
      p.ichor = 0;
    }
    this.gameState = 'GAME_OVER';
    this.emitHud();
  }

  private updateEnemies(dt: number, zone: ZoneDef) {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;

    for (const e of this.enemies) {
      if (e.aiState === 'DEAD') continue;
      e.flashTimer = Math.max(0, e.flashTimer - dt);
      e.stateTimer = Math.max(0, e.stateTimer - dt);
      e.markedTimer = Math.max(0, e.markedTimer - dt);

      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      const distX = px - ex;
      const distY = py - ey;
      const dist = Math.hypot(distX, distY);

      // Boss Phase 2 transition
      if (e.kind === 'BOSS_VAELOR' && e.phase === 1 && e.hp <= e.maxHp * 0.55) {
        e.phase = 2;
        soundEngine.playBossRoar();
        this.triggerShake(0.4, 12);
        this.spawnBurst(ex, ey, '#EF4444', 36, 320);
        this.showBanner(
          'Vaelor · Abyssal Awakening',
          'The Hollowed Core Ignites — Phase II',
          'ZONE',
          3.0
        );
      }

      if (e.aiState === 'STAGGERED') {
        e.vx *= Math.pow(0.05, dt);
        if (e.stateTimer <= 0) {
          e.aiState = 'RECOVER';
          e.stateTimer = 0.5;
          e.posture = e.maxPosture * 0.25;
        }
      } else if (e.aiState === 'RECOVER') {
        e.vx *= Math.pow(0.05, dt);
        if (e.stateTimer <= 0) {
          e.aiState = 'CHASE';
        }
      } else if (e.aiState === 'TELEGRAPH') {
        e.vx *= Math.pow(0.08, dt);
        if (e.stateTimer <= 0) {
          e.aiState = 'ATTACK';
          e.hitThisSwing = false;
          if (e.kind === 'BLOOD_ACOLYTE') {
            this.fireProjectile(
              ex + e.facing * 20,
              ey - 12,
              e.facing * 380,
              (py - ey) * 0.5,
              18,
              '#EF4444',
              true
            );
            e.stateTimer = 0.35;
          } else if (e.kind === 'BOSS_VAELOR') {
            if (e.attackPattern === 2) {
              // Abyssal Leap Slam / Shockwave
              e.vx = e.facing * 360;
              e.stateTimer = 0.35;
            } else if (e.attackPattern === 3) {
              // Molten Orb Barrage
              for (let k = -1; k <= 1; k++) {
                this.fireProjectile(
                  ex + e.facing * 35,
                  ey - 25,
                  e.facing * 390,
                  k * 105,
                  20,
                  e.phase === 2 ? '#EF4444' : '#F59E0B',
                  true
                );
              }
              e.stateTimer = 0.4;
            } else {
              // Cleave / Dash Slash
              e.vx = e.facing * (e.phase === 2 ? 440 : 280);
              e.stateTimer = 0.26;
            }
          } else {
            e.vx = e.facing * (e.kind === 'SPIRE_WARDEN' ? 220 : 290);
            e.stateTimer = 0.24;
          }
        }
      } else if (e.aiState === 'ATTACK') {
        if (!e.hitThisSwing && e.kind !== 'BLOOD_ACOLYTE') {
          const reach = e.kind === 'BOSS_VAELOR' ? 112 : e.kind === 'SPIRE_WARDEN' ? 78 : 56;
          const ax = e.facing === 1 ? e.x + e.w * 0.4 : e.x + e.w * 0.6 - reach;
          if (
            ax < p.x + p.w &&
            ax + reach > p.x &&
            e.y - 12 < p.y + p.h &&
            e.y + e.h + 8 > p.y
          ) {
            e.hitThisSwing = true;
            const dmg =
              e.kind === 'BOSS_VAELOR'
                ? e.phase === 2
                  ? 32
                  : 26
                : e.kind === 'SPIRE_WARDEN'
                  ? 24
                  : 16;
            const res = this.damagePlayer(dmg, e.facing, e.parryable);
            if (res === 'PARRIED') {
              const pGain = e.kind === 'BOSS_VAELOR' ? 42 : 75;
              e.posture = Math.min(e.maxPosture, e.posture + pGain);
              if (e.posture >= e.maxPosture) {
                e.aiState = 'STAGGERED';
                e.stateTimer = 3.5;
              } else {
                e.aiState = 'RECOVER';
                e.stateTimer = 0.85;
              }
            }
          }
        }

        if (e.stateTimer <= 0) {
          // Boss shockwave on Pattern 2 slam
          if (e.kind === 'BOSS_VAELOR' && e.attackPattern === 2) {
            this.triggerShake(0.24, 9);
            this.fireProjectile(ex - 25, e.y + e.h - 18, -360, 0, 22, '#EF4444', false);
            this.fireProjectile(ex + 25, e.y + e.h - 18, 360, 0, 22, '#EF4444', false);
          }
          e.aiState = 'RECOVER';
          e.stateTimer = e.kind === 'BOSS_VAELOR' ? (e.phase === 2 ? 0.62 : 0.88) : 0.72;
        }
      } else {
        // IDLE / PATROL / CHASE
        const aggroRange = e.kind === 'BOSS_VAELOR' ? 1400 : 420;
        const attackRange =
          e.kind === 'BLOOD_ACOLYTE'
            ? 340
            : e.kind === 'BOSS_VAELOR'
              ? 150
              : e.kind === 'SPIRE_WARDEN'
                ? 88
                : 68;

        if (dist < aggroRange && Math.abs(distY) < 260) {
          e.aiState = 'CHASE';
          e.facing = distX >= 0 ? 1 : -1;

          if (
            dist <= attackRange ||
            (e.kind === 'BOSS_VAELOR' && dist > 320 && Math.random() < 0.025)
          ) {
            e.aiState = 'TELEGRAPH';
            e.parryable = true;
            if (e.kind === 'BOSS_VAELOR') {
              if (dist > 300) {
                e.attackPattern = 3; // Molten Barrage
              } else {
                const roll = Math.random();
                e.attackPattern = roll < 0.45 ? 1 : roll < 0.8 ? 2 : 3;
              }
              e.parryable = e.attackPattern !== 2;
              e.stateTimer = e.phase === 2 ? 0.46 : 0.58;
            } else {
              e.stateTimer = e.kind === 'SPIRE_WARDEN' ? 0.54 : 0.42;
            }
            soundEngine.playEnemyTelegraph();
          } else {
            const speed =
              e.kind === 'BOSS_VAELOR'
                ? e.phase === 2
                  ? 185
                  : 145
                : e.kind === 'BLOOD_ACOLYTE'
                  ? 85
                  : e.kind === 'SPIRE_WARDEN'
                    ? 105
                    : 155;
            e.vx = e.facing * speed;
          }
        } else {
          e.aiState = 'PATROL';
          const pSpeed = e.kind === 'BOSS_VAELOR' ? 0 : 75;
          e.vx = e.facing * pSpeed;
          if (e.x <= e.patrolMinX) e.facing = 1;
          else if (e.x + e.w >= e.patrolMaxX) e.facing = -1;
        }
      }

      // Gravity & Platform collision for grounded enemies; spectral float for Abyssal Wraiths
      if (e.kind !== 'BLOOD_ACOLYTE') {
        e.vy = Math.min(1000, e.vy + GRAVITY * dt);
      } else {
        e.vy = Math.sin(this.time * 2.8 + e.x * 0.02) * 28;
      }

      e.x += e.vx * dt;
      e.x = Math.max(e.patrolMinX - 40, Math.min(e.patrolMaxX + 40 - e.w, e.x));

      const prevB = e.y + e.h;
      e.y += e.vy * dt;
      if (e.kind === 'BLOOD_ACOLYTE') {
        e.y = Math.max(e.baseY - 35, Math.min(e.baseY + 35, e.y));
      } else {
        for (const plat of zone.platforms) {
          if (plat.realm !== 'BOTH' || plat.kind === 'RIFT_BARRIER' || plat.kind === 'GATE') continue;
          if (
            e.vy >= 0 &&
            prevB <= plat.y + 18 &&
            e.x + e.w > plat.x &&
            e.x < plat.x + plat.w &&
            e.y + e.h >= plat.y &&
            e.y + e.h <= plat.y + plat.h + 18
          ) {
            e.y = plat.y - e.h;
            e.vy = 0;
            e.grounded = true;
          }
        }
      }
    }
  }

  private fireProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color: string,
    parryable: boolean
  ) {
    this.projectiles.push({
      id: `proj_${Math.random()}`,
      x,
      y,
      vx,
      vy,
      radius: 9,
      damage,
      fromPlayer: false,
      color,
      life: 2.8,
      parryable,
    });
  }

  private updateProjectiles(dt: number, zone: ZoneDef) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Gravity Pulse Orb pulls enemies inward while flying!
      if (proj.fromPlayer && proj.kind === 'GRAVITY_ORB') {
        const pullRadius = this.hasSkill('GREAT_SINGULARITY_ORB') ? 195 : 135;
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          const dx = proj.x - (e.x + e.w / 2);
          const dy = proj.y - (e.y + e.h / 2);
          const d = Math.hypot(dx, dy);
          if (d < pullRadius && d > 10) {
            const strength = e.kind === 'BOSS_VAELOR' ? 65 : 220;
            e.x += (dx / d) * strength * dt;
          }
        }
      }

      if (proj.life <= 0) {
        if (proj.kind === 'GRAVITY_ORB') {
          this.detonateGravityOrb(proj);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit solid stone walls
      let hitWall = false;
      for (const plat of zone.platforms) {
        if (plat.kind !== 'STONE' || !this.isPlatformSolidForPlayer(plat)) continue;
        if (
          proj.x > plat.x &&
          proj.x < plat.x + plat.w &&
          proj.y > plat.y &&
          proj.y < plat.y + plat.h
        ) {
          hitWall = true;
          break;
        }
      }
      if (hitWall) {
        if (proj.kind === 'GRAVITY_ORB') {
          this.detonateGravityOrb(proj);
        } else {
          this.spawnBurst(proj.x, proj.y, proj.color, 6, 110);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.fromPlayer) {
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          if (proj.hitIds && proj.hitIds.includes(e.id)) continue;
          if (
            proj.x + proj.radius > e.x &&
            proj.x - proj.radius < e.x + e.w &&
            proj.y + proj.radius > e.y &&
            proj.y - proj.radius < e.y + e.h
          ) {
            if (proj.kind === 'GRAVITY_ORB') {
              this.detonateGravityOrb(proj);
              this.projectiles.splice(i, 1);
              break;
            }
            const dealDmg =
              proj.kind === 'RIFT_CRESCENT' ||
              proj.kind === 'RIFT_LANCE' ||
              proj.kind === 'VOIDFANG_DAGGER'
                ? proj.damage
                : proj.damage * 2;
            const postDmg = proj.postureDamage ?? 26;
            if (proj.kind === 'VOIDFANG_DAGGER') {
              e.markedTimer = 4.5;
              p.stamina = Math.min(p.maxStamina, p.stamina + 12);
            }
            this.damageEnemy(e, dealDmg, postDmg, proj.vx >= 0 ? 1 : -1, proj.kind !== 'VOIDFANG_DAGGER');
            if (proj.piercing && proj.hitIds) {
              proj.hitIds.push(e.id);
            } else {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else {
        if (
          proj.x + proj.radius > p.x &&
          proj.x - proj.radius < p.x + p.w &&
          proj.y + proj.radius > p.y &&
          proj.y - proj.radius < p.y + p.h
        ) {
          const res = this.damagePlayer(proj.damage, proj.vx >= 0 ? 1 : -1, proj.parryable);
          if (res === 'PARRIED') {
            proj.fromPlayer = true;
            proj.vx = -proj.vx * 1.45;
            proj.vy = -proj.vy * 0.5;
            proj.color = '#FDE047';
            proj.life = 2.0;
          } else {
            this.projectiles.splice(i, 1);
          }
        }
      }
    }
  }

  private detonateGravityOrb(proj: Projectile) {
    const aoe = this.hasSkill('GREAT_SINGULARITY_ORB') ? 145 : 105;
    soundEngine.playGravityWell(true);
    this.triggerShake(0.18, 7);
    this.spawnBurst(proj.x, proj.y, '#C084FC', 22, 260);
    for (const e of this.enemies) {
      if (e.aiState === 'DEAD') continue;
      const d = Math.hypot(e.x + e.w / 2 - proj.x, e.y + e.h / 2 - proj.y);
      if (d <= aoe) {
        this.damageEnemy(e, proj.damage, proj.postureDamage ?? 34, e.x + e.w / 2 >= proj.x ? 1 : -1, true);
      }
    }
  }

  private updateRiftTears(dt: number) {
    for (let i = this.riftTears.length - 1; i >= 0; i--) {
      const tear = this.riftTears[i];
      tear.timer -= dt;
      if (tear.timer <= 0 && !tear.detonated) {
        tear.detonated = true;
        const mx = (tear.x1 + tear.x2) / 2;
        const my = (tear.y1 + tear.y2) / 2;
        soundEngine.playHit(true);
        this.triggerShake(0.16, 7);
        this.spawnBurst(mx, my, '#EF4444', 22, 260);
        const minX = Math.min(tear.x1, tear.x2) - 42;
        const maxX = Math.max(tear.x1, tear.x2) + 42;
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          if (
            e.x + e.w >= minX &&
            e.x <= maxX &&
            Math.abs(e.y + e.h / 2 - my) < 90
          ) {
            this.damageEnemy(e, 38, 36, e.x + e.w / 2 >= mx ? 1 : -1, true);
          }
        }
        this.riftTears.splice(i, 1);
      }
    }
  }

  private updateGravityWells(dt: number) {
    for (let i = this.gravityWells.length - 1; i >= 0; i--) {
      const well = this.gravityWells[i];
      well.timer -= dt;
      well.tickTimer -= dt;

      // Pull enemies and enemy projectiles inward
      for (const e of this.enemies) {
        if (e.aiState === 'DEAD') continue;
        const ex = e.x + e.w / 2;
        const ey = e.y + e.h / 2;
        const dx = well.x - ex;
        const dy = well.y - ey;
        const dist = Math.hypot(dx, dy);
        if (dist < well.radius && dist > 8) {
          const pull = e.kind === 'BOSS_VAELOR' ? 110 : 320;
          e.x += (dx / dist) * pull * dt;
          if (e.kind !== 'BOSS_VAELOR') {
            e.y += (dy / dist) * pull * 0.45 * dt;
          }
        }
      }

      for (const proj of this.projectiles) {
        if (proj.fromPlayer) continue;
        const dx = well.x - proj.x;
        const dy = well.y - proj.y;
        const dist = Math.hypot(dx, dy);
        if (dist < well.radius) {
          proj.vx += (dx / (dist || 1)) * 650 * dt;
          proj.vy += (dy / (dist || 1)) * 650 * dt;
          if (dist < 24) proj.life = 0;
        }
      }

      if (well.tickTimer <= 0) {
        well.tickTimer = 0.45;
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          const d = Math.hypot(e.x + e.w / 2 - well.x, e.y + e.h / 2 - well.y);
          if (d < well.radius) {
            this.damageEnemy(e, 14, 15, e.x + e.w / 2 >= well.x ? -1 : 1, false);
          }
        }
      }

      if (well.timer <= 0) {
        soundEngine.playGravityWell(true);
        this.triggerShake(0.28, well.heavyExplosion ? 13 : 10);
        this.spawnBurst(well.x, well.y, '#C084FC', well.heavyExplosion ? 42 : 30, 340);
        const burstDmg = well.heavyExplosion ? 76 : 46;
        const burstPosture = well.heavyExplosion ? 70 : 48;
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          const d = Math.hypot(e.x + e.w / 2 - well.x, e.y + e.h / 2 - well.y);
          if (d < well.radius + 25) {
            this.damageEnemy(e, burstDmg, burstPosture, e.x + e.w / 2 >= well.x ? 1 : -1, true);
          }
        }
        this.gravityWells.splice(i, 1);
      }
    }
  }

  private updateEchoClones(dt: number) {
    for (let i = this.echoClones.length - 1; i >= 0; i--) {
      const clone = this.echoClones[i];
      clone.timer -= dt;
      clone.slashTimer -= dt;

      if (clone.slashTimer <= 0) {
        clone.slashTimer = 0.45;
        const cx = clone.x + 17;
        const cy = clone.y + 31;
        for (const e of this.enemies) {
          if (e.aiState === 'DEAD') continue;
          const d = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy);
          if (d < 105) {
            this.damageEnemy(e, 18, 22, clone.facing, false);
            this.player.riftEnergy = Math.min(this.player.maxRiftEnergy, this.player.riftEnergy + 6);
          }
        }
      }

      if (clone.timer <= 0) {
        this.spawnBurst(clone.x + 17, clone.y + 31, '#C084FC', 10, 140);
        this.echoClones.splice(i, 1);
      }
    }
  }

  private updateVisualFX(dt: number, zone: ZoneDef) {
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      this.slashArcs[i].life -= dt;
      if (this.slashArcs[i].life <= 0) this.slashArcs.splice(i, 1);
    }
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].life -= dt;
      if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Ambient ash & embers around camera
    if (this.particles.length < 140 && Math.random() < 0.45) {
      this.particles.push({
        x: this.cameraX + Math.random() * this.canvas.width,
        y: this.cameraY + this.canvas.height + 10,
        vx: -18 + Math.random() * 36,
        vy: -35 - Math.random() * 45,
        size: 2 + Math.random() * 3,
        color: this.player.realm === 'ABYSSAL' || zone.id === 'THRONE' ? '#EF4444' : '#F59E0B',
        life: 2.5 + Math.random() * 2,
        maxLife: 4.5,
        gravity: -4,
      });
    }
  }

  private transitionToZone(targetZone: ZoneId, spawnX: number, spawnY: number) {
    this.currentZoneId = targetZone;
    this.visitedZones.add(targetZone);
    this.player.x = spawnX;
    this.player.y = spawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.lastSafeX = spawnX;
    this.lastSafeY = spawnY;
    this.clearTransientFX();
    this.spawnEnemiesForZone(targetZone);
    this.snapCamera();

    const z = this.zones[targetZone];
    this.showBanner(z.name, z.subtitle, 'ZONE', 3.2);
    if (targetZone === 'THRONE' && !this.defeatedBoss) {
      soundEngine.playBossRoar();
    }
    this.emitHud();
  }

  private spawnEnemiesForZone(zoneId: ZoneId) {
    const zone = this.zones[zoneId];
    this.enemies = zone.spawns
      .filter((sp) => !(sp.kind === 'BOSS_VAELOR' && this.defeatedBoss))
      .map((sp) => this.createEnemyFromSpawn(sp));
  }

  private createEnemyFromSpawn(sp: EnemySpawn): Enemy {
    const specs: Record<
      EnemyKind,
      { w: number; h: number; hp: number; posture: number; ichor: number }
    > = {
      ASH_STALKER: { w: 34, h: 58, hp: 75, posture: 60, ichor: 45 },
      BLOOD_ACOLYTE: { w: 36, h: 66, hp: 65, posture: 50, ichor: 55 },
      SPIRE_WARDEN: { w: 48, h: 86, hp: 165, posture: 105, ichor: 120 },
      BOSS_VAELOR: { w: 72, h: 150, hp: 780, posture: 150, ichor: 1000 },
    };
    const s = specs[sp.kind];
    return {
      ...sp,
      w: s.w,
      h: s.h,
      vx: 0,
      vy: 0,
      facing: -1,
      hp: s.hp,
      maxHp: s.hp,
      posture: 0,
      maxPosture: s.posture,
      aiState: 'IDLE',
      stateTimer: 0.4,
      attackPattern: 1,
      parryable: true,
      hitThisSwing: false,
      flashTimer: 0,
      phase: 1,
      grounded: false,
      ichorValue: s.ichor,
      baseY: sp.y,
      markedTimer: 0,
    };
  }

  private clearTransientFX() {
    this.projectiles = [];
    this.riftTears = [];
    this.gravityWells = [];
    this.echoClones = [];
    this.slashArcs = [];
    this.afterimages = [];
  }

  private updateCamera(dt: number, zone: ZoneDef) {
    const vw = this.canvas.width;
    const vh = this.canvas.height;
    const targetX =
      this.player.x + this.player.w / 2 + this.player.facing * 85 - vw / 2;
    const targetY = this.player.y + this.player.h / 2 - vh * 0.56;

    const clampedX = Math.max(0, Math.min(Math.max(0, zone.width - vw), targetX));
    const clampedY = Math.max(0, Math.min(Math.max(0, zone.height - vh), targetY));

    const smooth = 1 - Math.exp(-8.5 * dt);
    this.cameraX += (clampedX - this.cameraX) * smooth;
    this.cameraY += (clampedY - this.cameraY) * smooth;
  }

  private snapCamera() {
    const zone = this.zones[this.currentZoneId];
    const vw = this.canvas.width || window.innerWidth;
    const vh = this.canvas.height || window.innerHeight;
    this.cameraX = Math.max(
      0,
      Math.min(Math.max(0, zone.width - vw), this.player.x - vw / 2)
    );
    this.cameraY = Math.max(
      0,
      Math.min(Math.max(0, zone.height - vh), this.player.y - vh * 0.56)
    );
  }

  private triggerShake(duration: number, intensity: number) {
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  private spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number
  ) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 3 + Math.random() * 4,
        color,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        gravity: 520,
        inkOutline: true,
      });
    }
  }

  private spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    scale: number
  ) {
    this.floatingTexts.push({
      x,
      y,
      vy: -48,
      text,
      color,
      life: 0.85,
      maxLife: 0.85,
      scale,
    });
  }

  private showBanner(
    title: string,
    subtitle: string,
    kind: NonNullable<HudSnapshot['banner']>['kind'],
    duration: number
  ) {
    this.activeBanner = { title, subtitle, kind };
    this.bannerTimer = duration;
  }

  private getContextualPrompt(): HudSnapshot['prompt'] {
    const p = this.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;

    for (const e of this.enemies) {
      if (e.aiState === 'STAGGERED') {
        const dist = Math.hypot(px - (e.x + e.w / 2), py - (e.y + e.h / 2));
        if (dist < 115) {
          return { text: '[E] Execute', subtext: 'Fatal Posture Blow' };
        }
      }
    }

    const zone = this.zones[this.currentZoneId];
    for (const inter of zone.interactables) {
      if ((inter.kind === 'RELIC' || inter.kind === 'LEVER' || inter.kind === 'CHEST') && inter.activated) continue;
      const dist = Math.hypot(
        px - (inter.x + inter.w / 2),
        py - (inter.y + inter.h / 2)
      );
      if (dist < 78) {
        if (inter.kind === 'ALTAR') return { text: '[E] Rest at Blood Altar', subtext: inter.title };
        if (inter.kind === 'RELIC') return { text: `[E] Claim ${inter.title}` };
        if (inter.kind === 'LEVER') return { text: '[E] Pull Lever', subtext: inter.title };
        if (inter.kind === 'CHEST') return { text: '[E] Open Chest', subtext: inter.title };
        if (inter.kind === 'LORE') return { text: '[E] Read Inscription', subtext: inter.title };
      }
    }
    return null;
  }

  private render() {
    const zone = this.zones[this.currentZoneId];
    const shakeX =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;
    const shakeY =
      this.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * this.shakeIntensity : 0;

    renderGameFrame(this.ctx, this.canvas.width, this.canvas.height, {
      zone,
      player: this.player,
      enemies: this.enemies,
      projectiles: this.projectiles,
      riftTears: this.riftTears,
      gravityWells: this.gravityWells,
      echoClones: this.echoClones,
      slashArcs: this.slashArcs,
      particles: this.particles,
      afterimages: this.afterimages,
      floatingTexts: this.floatingTexts,
      droppedIchor: this.droppedIchor,
      openGates: this.openGates,
      cameraX: this.cameraX,
      cameraY: this.cameraY,
      shakeX,
      shakeY,
      time: this.time,
      phaseRippleTimer: this.phaseRippleTimer,
      parryFreezeFlash: this.parryFreezeFlash,
    });
  }

  private emitHud() {
    const zone = this.zones[this.currentZoneId];
    const boss = this.enemies.find(
      (e) => e.kind === 'BOSS_VAELOR' && e.aiState !== 'DEAD'
    );
    const canAffordSkill = SKILL_TREE_NODES.some((n) =>
      canUnlockSkill(n.id, this.player.unlockedSkills, this.player.ichor)
    );

    this.onHudUpdate({
      gameState: this.gameState,
      zoneId: this.currentZoneId,
      zoneName: zone.name,
      zoneSubtitle: zone.subtitle,
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      trailHp: this.player.trailHp,
      stamina: Math.ceil(this.player.stamina),
      maxStamina: this.player.maxStamina,
      riftEnergy: Math.ceil(this.player.riftEnergy),
      maxRiftEnergy: this.player.maxRiftEnergy,
      flasks: this.player.flasks,
      maxFlasks: this.player.maxFlasks,
      ichor: this.player.ichor,
      realm: this.player.realm,
      weaponId: this.player.weaponId,
      weaponArtCooldown: this.player.weaponArtCooldown,
      projectileCooldown: this.player.projectileCooldown,
      armorPct: Math.round(this.getArmorMitigation() * 100),
      unlockedPowers: [...this.player.unlockedPowers],
      unlockedSkills: [...this.player.unlockedSkills],
      canAffordSkill,
      phaseShiftCooldown: this.player.phaseShiftCooldown,
      spatialSeverCooldown: this.player.spatialSeverCooldown,
      chronoCooldown: this.player.chronoCooldown,
      chronoActiveTimer: this.player.chronoActiveTimer,
      visitedZones: Array.from(this.visitedZones),
      boss: boss
        ? {
            name: 'Vaelor',
            title: 'Hollowed Castellan',
            hp: Math.ceil(boss.hp),
            maxHp: boss.maxHp,
            trailHp: boss.hp,
            posture: boss.posture,
            maxPosture: boss.maxPosture,
            staggered: boss.aiState === 'STAGGERED',
            phase: boss.phase,
          }
        : null,
      prompt: this.gameState === 'PLAYING' ? this.getContextualPrompt() : null,
      banner: this.activeBanner,
      stats: { ...this.stats },
      muted: soundEngine.isMuted(),
      playerNormPos: {
        x: Math.max(0, Math.min(1, this.player.x / zone.width)),
        y: Math.max(0, Math.min(1, this.player.y / zone.height)),
      },
    });
  }
}
