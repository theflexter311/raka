import {
  Afterimage,
  CastleProp,
  DroppedIchor,
  EchoClone,
  Enemy,
  FloatingText,
  GravityWell,
  Interactable,
  Ladder,
  Particle,
  Platform,
  PlayerState,
  Projectile,
  RealityRealm,
  RiftTear,
  SlashArc,
  SpikePit,
  ZoneDef,
} from './types';

export interface RenderContextState {
  zone: ZoneDef;
  player: PlayerState;
  enemies: Enemy[];
  projectiles: Projectile[];
  riftTears: RiftTear[];
  gravityWells: GravityWell[];
  echoClones: EchoClone[];
  slashArcs: SlashArc[];
  particles: Particle[];
  afterimages: Afterimage[];
  floatingTexts: FloatingText[];
  droppedIchor: DroppedIchor | null;
  openGates: Set<string>;
  cameraX: number;
  cameraY: number;
  shakeX: number;
  shakeY: number;
  time: number;
  phaseRippleTimer: number;
  parryFreezeFlash: number;
}

const INK = '#050508';
const EXTRUDE_X = 14;
const EXTRUDE_Y = -12;

export function renderGameFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderContextState
) {
  const {
    zone,
    player,
    enemies,
    projectiles,
    riftTears,
    gravityWells,
    echoClones,
    slashArcs,
    particles,
    afterimages,
    floatingTexts,
    droppedIchor,
    openGates,
    cameraX,
    cameraY,
    shakeX,
    shakeY,
    time,
    phaseRippleTimer,
    parryFreezeFlash,
  } = state;

  ctx.save();

  // 1. Deep Violet-Crimson Gothic Twilight Sky + Distant Misty Viaducts
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (player.realm === 'ABYSSAL') {
    skyGrad.addColorStop(0, '#07020B');
    skyGrad.addColorStop(0.5, '#25091B');
    skyGrad.addColorStop(1, '#3D1023');
  } else {
    skyGrad.addColorStop(0, zone.skyTop);
    skyGrad.addColorStop(0.58, zone.skyBottom);
    skyGrad.addColorStop(1, '#1A0C18');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  drawCastleSkyAndMoon(ctx, width, height, cameraX, player.realm, time);
  drawSkyRifts(ctx, width, height, cameraX, time, player.realm);

  // 2. Multi-Layer 2.5D Castle Parallax: Distant Viaducts & Midground Vaulted Arches
  drawParallaxCastleViaducts(ctx, width, height, cameraX, cameraY, player.realm, time);
  drawMidgroundCathedralNave(ctx, width, height, cameraX, cameraY, player.realm, time);

  if (player.chronoActiveTimer > 0) {
    ctx.fillStyle = 'rgba(88, 28, 135, 0.16)';
    ctx.fillRect(0, 0, width, height);
  }

  // Apply World Camera Transform
  ctx.save();
  ctx.translate(Math.round(-cameraX + shakeX), Math.round(-cameraY + shakeY));

  // 3. Background Castle Props (Sigil Gates, Statue Alcoves, Banners, Diagonal Chains)
  for (const prop of zone.props) {
    if (
      prop.kind === 'SIGIL_GATE' ||
      prop.kind === 'STATUE_ALCOVE' ||
      prop.kind === 'BANNER' ||
      prop.kind === 'DIAGONAL_CHAIN'
    ) {
      drawCastleProp(ctx, prop, player.realm, time);
    }
  }

  // 4. 2.5D Castle Portal Exits
  for (const exit of zone.exits) {
    drawExitArch(ctx, exit.x, exit.y, exit.w, exit.h, exit.label, time);
  }

  // 5. Ladders (behind foreground platform rims)
  for (const ladder of zone.ladders) {
    drawLadder(ctx, ladder);
  }

  // 6. 2.5D Castle Platforms, Bridges, Chained Platforms & Barriers
  for (const plat of zone.platforms) {
    if (plat.kind === 'GATE' && plat.gateId && openGates.has(plat.gateId)) {
      continue;
    }
    drawPlatform25D(ctx, plat, player.realm, time, player.chronoActiveTimer > 0);
  }

  // 7. Spike Pit Hazards
  for (const spk of zone.spikes) {
    drawSpikePit(ctx, spk);
  }

  // 8. Foreground Braziers & Cyan Rift Crystals
  for (const prop of zone.props) {
    if (prop.kind === 'BRAZIER' || prop.kind === 'CRYSTAL') {
      drawCastleProp(ctx, prop, player.realm, time);
    }
  }

  // 9. Dynamic 2.5D Light Pools (Braziers, Cyan Crystals, Altars, Relics, Wells)
  drawDynamicLightPools(ctx, zone, droppedIchor, gravityWells, player, time);

  // 10. Interactables (Altars, Relics, Levers, Lore, Chests)
  for (const inter of zone.interactables) {
    drawInteractable(ctx, inter, time);
  }

  // 11. Dropped Ichor Vessel
  if (droppedIchor && droppedIchor.zoneId === zone.id) {
    drawDroppedIchor(ctx, droppedIchor.x, droppedIchor.y, time);
  }

  // 12. Afterimages
  for (const img of afterimages) {
    drawAfterimage(ctx, img);
  }

  // 13. Active Spatial Sever Rift Tears & Gravity Singularities
  for (const tear of riftTears) {
    drawRiftTear(ctx, tear, time);
  }
  for (const well of gravityWells) {
    drawGravityWell(ctx, well, time);
  }

  // 14. Ground Contact Shadows
  drawContactShadow(ctx, zone, player.x + player.w / 2, player.y + player.h, 20, player.realm);
  for (const enemy of enemies) {
    if (enemy.aiState === 'DEAD') continue;
    drawContactShadow(
      ctx,
      zone,
      enemy.x + enemy.w / 2,
      enemy.y + enemy.h,
      enemy.kind === 'BOSS_VAELOR' ? 42 : 18,
      player.realm
    );
  }

  // 15. Enemies & Boss
  for (const enemy of enemies) {
    if (enemy.aiState === 'DEAD') continue;
    drawEnemy(ctx, enemy, time, player.chronoActiveTimer > 0);
  }

  // 16. Reality Echo Clones (Dual Dagger Ability)
  for (const clone of echoClones) {
    drawEchoClone(ctx, clone, time);
  }

  // 17. Player
  drawPlayer(ctx, player, time);

  // 18. 2.5D Perspective Slash Ribbons
  for (const arc of slashArcs) {
    drawSlashArc(ctx, arc);
  }

  // 19. Projectiles
  for (const proj of projectiles) {
    drawProjectile(ctx, proj, time);
  }

  // 20. Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.fill();
    if (p.inkOutline) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 21. Floating Combat Numbers & Alerts
  for (const ft of floatingTexts) {
    const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${Math.round(16 * ft.scale)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }

  // Chrono-Fracture 2.5D Dome
  if (player.chronoActiveTimer > 0) {
    drawChronoDome(ctx, player.x + player.w / 2, player.y + player.h / 2, time, player.chronoActiveTimer);
  }

  ctx.restore(); // End world camera transform

  // 22. Foreground Silhouette Battlements & Hanging Chains
  drawForegroundFraming(ctx, width, height, cameraX, time);

  // 23. Screen Vignette & Reality Ripples
  drawVignette(ctx, width, height, player.realm, player.hp / player.maxHp);

  if (phaseRippleTimer > 0) {
    const prog = 1 - phaseRippleTimer / 0.35;
    const rad = prog * Math.hypot(width, height) * 0.65;
    ctx.save();
    ctx.strokeStyle = player.realm === 'ABYSSAL' ? '#F43F5E' : '#38BDF8';
    ctx.lineWidth = (1 - prog) * 14;
    ctx.globalAlpha = (1 - prog) * 0.65;
    ctx.beginPath();
    ctx.ellipse(width / 2, height / 2, rad, rad * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (parryFreezeFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 226, 150, ${parryFreezeFlash * 0.32})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  ctx.restore();
}

function drawCastleSkyAndMoon(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  realm: RealityRealm,
  time: number
) {
  ctx.save();
  const moonX = width * 0.38 - cameraX * 0.025;
  const moonY = height * 0.2;
  const glowR = 230 + Math.sin(time * 1.2) * 8;

  // Misty violet-magenta cloud radiance behind arches
  const halo = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, glowR);
  if (realm === 'ABYSSAL') {
    halo.addColorStop(0, 'rgba(244, 63, 94, 0.38)');
    halo.addColorStop(0.5, 'rgba(139, 92, 246, 0.22)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    halo.addColorStop(0, 'rgba(192, 132, 252, 0.26)');
    halo.addColorStop(0.48, 'rgba(159, 18, 57, 0.16)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(moonX, moonY, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Diagonal volumetric mist shafts slanting through vaulted windows
  ctx.fillStyle =
    realm === 'ABYSSAL' ? 'rgba(244, 63, 94, 0.048)' : 'rgba(192, 132, 252, 0.042)';
  for (let i = 0; i < 4; i++) {
    const rx = ((width * 0.15 + i * 340 - cameraX * 0.06) % (width + 420)) - 150;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 135, 0);
    ctx.lineTo(rx - 190, height);
    ctx.lineTo(rx - 340, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSkyRifts(
  ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  cameraX: number,
  time: number,
  realm: RealityRealm
) {
  ctx.save();
  const offset = -(cameraX * 0.05) % 720;
  const riftColor = realm === 'ABYSSAL' ? '#F43F5E' : '#8B5CF6';
  const coreColor = realm === 'ABYSSAL' ? '#FECDD3' : '#DDD6FE';

  for (let i = -1; i < 4; i++) {
    const rx = offset + i * 640 + 200;
    const ry = 70 + (i % 2) * 45;
    const pulse = 0.5 + Math.sin(time * 2 + i) * 0.25;

    ctx.globalAlpha = 0.28 * pulse;
    ctx.strokeStyle = riftColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 36, ry + 50);
    ctx.lineTo(rx + 14, ry + 108);
    ctx.lineTo(rx + 56, ry + 172);
    ctx.stroke();

    ctx.globalAlpha = 0.72 * pulse;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawParallaxCastleViaducts(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  cameraY: number,
  realm: RealityRealm,
  _time: number
) {
  ctx.save();
  const spacing = 520;
  const farOffset = -(cameraX * 0.14) % spacing;
  const base = height + 40 - cameraY * 0.05;
  const spireFill = realm === 'ABYSSAL' ? '#1A0A17' : '#130D1B';

  // Far castle spires & aqueduct bridge silhouette
  for (let i = -1; i < Math.ceil(width / spacing) + 2; i++) {
    const bx = farOffset + i * spacing;

    // Distant jagged cathedral spires
    ctx.fillStyle = spireFill;
    ctx.beginPath();
    ctx.moveTo(bx, base);
    ctx.lineTo(bx + 25, base - 360);
    ctx.lineTo(bx + 52, base - 485);
    ctx.lineTo(bx + 78, base - 365);
    ctx.lineTo(bx + 120, base - 395);
    ctx.lineTo(bx + 148, base - 540);
    ctx.lineTo(bx + 178, base - 395);
    ctx.lineTo(bx + 225, base - 290);
    ctx.lineTo(bx + 360, base - 290);
    ctx.lineTo(bx + 390, base - 455);
    ctx.lineTo(bx + 422, base - 585);
    ctx.lineTo(bx + 455, base - 440);
    ctx.lineTo(bx + 520, base);
    ctx.closePath();
    ctx.fill();

    // Distant arched viaduct span
    const viaY = base - 270;
    ctx.fillStyle = realm === 'ABYSSAL' ? '#230D1F' : '#181022';
    ctx.fillRect(bx, viaY, spacing, 22);
    for (let a = 0; a < 4; a++) {
      const ax = bx + a * 130 + 65;
      ctx.fillRect(ax - 12, viaY + 22, 24, 180);
      ctx.beginPath();
      ctx.moveTo(ax - 55, viaY + 22);
      ctx.quadraticCurveTo(ax, viaY + 62, ax + 55, viaY + 22);
      ctx.lineTo(ax + 55, viaY + 20);
      ctx.lineTo(ax - 55, viaY + 20);
      ctx.closePath();
      ctx.fill();
    }

    // Subtle gothic lancet light slits in distant keeps
    ctx.fillStyle = realm === 'ABYSSAL' ? 'rgba(244,63,94,0.34)' : 'rgba(192,132,252,0.22)';
    ctx.fillRect(bx + 145, base - 455, 5, 34);
    ctx.fillRect(bx + 419, base - 500, 5, 42);
  }
  ctx.restore();
}

function drawMidgroundCathedralNave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  cameraY: number,
  realm: RealityRealm,
  time: number
) {
  ctx.save();
  const spacing = 360;
  const offset = -(cameraX * 0.42) % spacing;
  const baseY = height * 0.96 - cameraY * 0.14;

  for (let i = -1; i < Math.ceil(width / spacing) + 2; i++) {
    const px = offset + i * spacing;

    // Towering stone pier with 2.5D side bevel
    ctx.fillStyle = realm === 'ABYSSAL' ? '#180B16' : '#100E16';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillRect(px, baseY - 540, 48, 580);
    ctx.strokeRect(px, baseY - 540, 48, 580);

    ctx.fillStyle = '#09070D';
    ctx.fillRect(px + 48, baseY - 534, 14, 574);
    ctx.strokeRect(px + 48, baseY - 534, 14, 574);

    // Grand Pointed Gothic Archway overhead connecting piers
    ctx.fillStyle = realm === 'ABYSSAL' ? '#1D0C1A' : '#13101A';
    ctx.beginPath();
    ctx.moveTo(px + 48, baseY - 420);
    ctx.lineTo(px + 48, baseY - 560);
    ctx.lineTo(px + spacing, baseY - 560);
    ctx.lineTo(px + spacing, baseY - 420);
    ctx.quadraticCurveTo(px + spacing * 0.72, baseY - 515, px + spacing * 0.54, baseY - 540);
    ctx.quadraticCurveTo(px + spacing * 0.34, baseY - 515, px + 48, baseY - 420);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tattered fabric banners hanging from arch apex
    const sway = Math.sin(time * 1.4 + i * 1.9) * 4;
    ctx.fillStyle = '#08070B';
    ctx.beginPath();
    ctx.moveTo(px + spacing * 0.52, baseY - 530);
    ctx.lineTo(px + spacing * 0.52 + 22, baseY - 530);
    ctx.lineTo(px + spacing * 0.52 + 18 + sway, baseY - 445);
    ctx.lineTo(px + spacing * 0.52 + 10 + sway, baseY - 468);
    ctx.lineTo(px + spacing * 0.52 + 2 + sway, baseY - 442);
    ctx.closePath();
    ctx.fill();

    // Recessed pointed gothic window glow on pier wall
    const winX = px + 24;
    const winY = baseY - 290;
    const flicker = 0.8 + Math.sin(time * 9 + i * 2.3) * 0.2;
    const glow = ctx.createRadialGradient(winX, winY, 2, winX, winY, 55 * flicker);
    glow.addColorStop(0, 'rgba(244, 63, 94, 0.24)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(winX, winY, 55 * flicker, 0, Math.PI * 2);
    ctx.fill();
  }

  // Abyssal crimson fog rising from lower chasms
  const mistGrad = ctx.createLinearGradient(0, height * 0.66, 0, height);
  mistGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mistGrad.addColorStop(
    1,
    realm === 'ABYSSAL' ? 'rgba(65, 10, 28, 0.44)' : 'rgba(34, 12, 26, 0.38)'
  );
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, height * 0.66, width, height * 0.34);

  ctx.restore();
}

function drawForegroundFraming(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cameraX: number,
  time: number
) {
  ctx.save();
  const spacing = 940;
  const offset = -(cameraX * 1.28) % spacing;

  ctx.fillStyle = '#040407';
  for (let i = -1; i < Math.ceil(width / spacing) + 2; i++) {
    const fx = offset + i * spacing;
    // Jagged foreground parapet / thorny masonry silhouette
    ctx.beginPath();
    ctx.moveTo(fx, height + 10);
    ctx.lineTo(fx + 22, height - 52);
    ctx.lineTo(fx + 48, height - 28);
    ctx.lineTo(fx + 76, height - 66);
    ctx.lineTo(fx + 108, height + 10);
    ctx.closePath();
    ctx.fill();

    // Foreground chain silhouette swaying from ceiling
    const sway = Math.sin(time * 1.3 + i * 2.1) * 7;
    drawChainLine(ctx, fx + 450, -10, fx + 450 + sway * 1.5, 120, '#040407', 6);
  }
  ctx.restore();
}

function drawChainLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = '#2B2B36',
  linkWidth = 3.2
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return;
  const angle = Math.atan2(dy, dx);
  const step = 12;
  const count = Math.floor(dist / step);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  for (let i = 0; i < count; i++) {
    const lx = i * step;
    ctx.strokeStyle = i % 2 === 0 ? color : '#181820';
    ctx.lineWidth = linkWidth;
    ctx.beginPath();
    ctx.ellipse(lx + step / 2, 0, step * 0.48, linkWidth * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCastleProp(
  ctx: CanvasRenderingContext2D,
  prop: CastleProp,
  realm: RealityRealm,
  time: number
) {
  ctx.save();

  if (prop.kind === 'DIAGONAL_CHAIN' && prop.x2 !== undefined && prop.y2 !== undefined) {
    drawChainLine(ctx, prop.x, prop.y, prop.x2, prop.y2, '#282936', 4.2);
    ctx.restore();
    return;
  }

  if (prop.kind === 'BRAZIER') {
    const x = prop.x;
    const y = prop.y;
    const flicker = Math.sin(time * 11 + x * 0.05) * 4;

    // Iron brazier stand
    ctx.fillStyle = '#181822';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x - 10, y - 34);
    ctx.lineTo(x + 10, y - 34);
    ctx.lineTo(x + 16, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bowl rim
    ctx.fillStyle = '#2A2A38';
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 42);
    ctx.lineTo(x + 22, y - 42);
    ctx.lineTo(x + 14, y - 32);
    ctx.lineTo(x - 14, y - 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vibrant Crimson-Rose Flame (matching reference screenshot!)
    const flameH = 26 + flicker;
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 42);
    ctx.quadraticCurveTo(x - 10, y - 42 - flameH * 0.6, x + flicker * 0.25, y - 42 - flameH);
    ctx.quadraticCurveTo(x + 10, y - 42 - flameH * 0.6, x + 13, y - 42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 42);
    ctx.quadraticCurveTo(x, y - 42 - flameH * 0.65, x + 6, y - 42);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    return;
  }

  if (prop.kind === 'CRYSTAL') {
    const x = prop.x;
    const y = prop.y;
    const pulse = 0.8 + Math.sin(time * 4 + x * 0.03) * 0.2;

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;

    // 3-shard glowing cyan crystal cluster (#38BDF8)
    const shards = [
      { ox: -9, h: 24, tilt: -0.24, col: '#0284C7' },
      { ox: 8, h: 20, tilt: 0.28, col: '#0EA5E9' },
      { ox: 0, h: 34, tilt: 0.03, col: '#38BDF8' },
    ];
    for (const s of shards) {
      ctx.save();
      ctx.translate(x + s.ox, y);
      ctx.rotate(s.tilt);
      ctx.fillStyle = s.col;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-4, -s.h * 0.65);
      ctx.lineTo(0, -s.h);
      ctx.lineTo(4, -s.h * 0.65);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bright crystalline core highlight
      ctx.fillStyle = `rgba(224, 242, 254, ${0.8 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(-2, -4);
      ctx.lineTo(0, -s.h * 0.82);
      ctx.lineTo(2, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  if (prop.kind === 'SIGIL_GATE') {
    const s = prop.scale ?? 1;
    const x = prop.x;
    const y = prop.y;
    ctx.translate(x, y);
    ctx.scale(s, s);

    // Ornate Gothic Iron Portcullis Archway
    ctx.fillStyle = '#0B0A10';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-48, 0);
    ctx.lineTo(-48, -110);
    ctx.quadraticCurveTo(-40, -150, 0, -165);
    ctx.quadraticCurveTo(40, -150, 48, -110);
    ctx.lineTo(48, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wrought iron bars
    ctx.strokeStyle = '#24232E';
    ctx.lineWidth = 2.4;
    for (let bx = -32; bx <= 32; bx += 16) {
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, -135 + Math.abs(bx) * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-44, -45);
    ctx.lineTo(44, -45);
    ctx.moveTo(-44, -90);
    ctx.lineTo(44, -90);
    ctx.stroke();

    // Glowing Crimson Rune Diamond above the arch (directly matching screenshot!)
    const pulse = 0.75 + Math.sin(time * 3.4) * 0.25;
    const sigilY = -190;
    ctx.strokeStyle = `rgba(244, 63, 94, ${pulse})`;
    ctx.fillStyle = `rgba(253, 164, 175, ${pulse})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, sigilY - 18);
    ctx.lineTo(11, sigilY);
    ctx.lineTo(0, sigilY + 18);
    ctx.lineTo(-11, sigilY);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(-2, sigilY - 8, 4, 16);

    ctx.restore();
    return;
  }

  if (prop.kind === 'STATUE_ALCOVE') {
    const x = prop.x;
    const y = prop.y;
    // Recessed crimson arch niche with armored knight statue
    const grad = ctx.createLinearGradient(x, y - 165, x, y);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0.36)');
    grad.addColorStop(1, 'rgba(10, 8, 14, 0.75)');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1E1B28';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 36, y);
    ctx.lineTo(x - 36, y - 115);
    ctx.quadraticCurveTo(x, y - 175, x + 36, y - 115);
    ctx.lineTo(x + 36, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Statue silhouette on pedestal
    ctx.fillStyle = '#0D0B12';
    ctx.fillRect(x - 18, y - 24, 36, 24);
    ctx.fillRect(x - 10, y - 92, 20, 68);
    ctx.beginPath();
    ctx.arc(x, y - 102, 9, 0, Math.PI * 2);
    ctx.fill();
    // Vertical rune spear
    ctx.strokeStyle = realm === 'ABYSSAL' ? '#FB7185' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 24);
    ctx.lineTo(x + 12, y - 120);
    ctx.stroke();

    ctx.restore();
    return;
  }

  if (prop.kind === 'BANNER') {
    const x = prop.x;
    const y = prop.y;
    const sway = Math.sin(time * 1.9 + x * 0.02) * 3;
    ctx.fillStyle = '#2A0D18';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillRect(x - 20, y - 4, 40, 6);
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x + 15 + sway, y + 88);
    ctx.lineTo(x + sway, y + 68);
    ctx.lineTo(x - 15 + sway, y + 92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#9F1239';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x + sway * 0.5, y + 52);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLadder(ctx: CanvasRenderingContext2D, ladder: Ladder) {
  ctx.save();
  const { x, y, w, h } = ladder;
  // Rails
  ctx.fillStyle = '#27242E';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(x + 2, y, 5, h);
  ctx.strokeRect(x + 2, y, 5, h);
  ctx.fillRect(x + w - 7, y, 5, h);
  ctx.strokeRect(x + w - 7, y, 5, h);

  // Rungs
  for (let ry = y + 12; ry < y + h - 4; ry += 22) {
    ctx.fillStyle = '#3F3A47';
    ctx.fillRect(x + 5, ry, w - 10, 4);
    ctx.strokeRect(x + 5, ry, w - 10, 4);
    ctx.fillStyle = '#71717A';
    ctx.fillRect(x + 6, ry, w - 12, 1.5);
  }
  ctx.restore();
}

function drawSpikePit(ctx: CanvasRenderingContext2D, spk: SpikePit) {
  ctx.save();
  const spikeW = 18;
  const count = Math.max(2, Math.floor(spk.w / spikeW));
  const actualW = spk.w / count;

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i++) {
    const sx = spk.x + i * actualW;
    ctx.fillStyle = '#333642';
    ctx.beginPath();
    ctx.moveTo(sx + 1, spk.y + spk.h);
    ctx.lineTo(sx + actualW * 0.5, spk.y);
    ctx.lineTo(sx + actualW - 1, spk.y + spk.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blood-stained metallic tip
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(sx + actualW * 0.35, spk.y + spk.h * 0.35);
    ctx.lineTo(sx + actualW * 0.5, spk.y);
    ctx.lineTo(sx + actualW * 0.65, spk.y + spk.h * 0.35);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawExitArch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  time: number
) {
  ctx.save();
  const cx = x + w / 2;
  const pulse = 0.65 + Math.sin(time * 3) * 0.25;

  ctx.fillStyle = '#181520';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h);
  ctx.lineTo(x - 4, y + 30);
  ctx.lineTo(cx, y - 10);
  ctx.lineTo(x + w + 4, y + 30);
  ctx.lineTo(x + w + 4, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#040407';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h);
  ctx.lineTo(x + 8, y + 36);
  ctx.lineTo(cx, y + 4);
  ctx.lineTo(x + w - 8, y + 36);
  ctx.lineTo(x + w - 8, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const grad = ctx.createLinearGradient(cx, y, cx, y + h);
  grad.addColorStop(0, `rgba(225, 29, 72, ${0.48 * pulse})`);
  grad.addColorStop(1, 'rgba(10, 8, 14, 0.08)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(234, 228, 216, 0.86)';
  ctx.fillText(label, cx, y - 16);
  ctx.restore();
}

function drawPlatform25D(
  ctx: CanvasRenderingContext2D,
  plat: Platform,
  currentRealm: RealityRealm,
  time: number,
  chronoSlow: boolean
) {
  const isSolidInRealm = plat.realm === 'BOTH' || plat.realm === currentRealm;
  ctx.save();

  // Suspended Hanging Chains anchoring floating bridge slabs (like reference screenshot!)
  if (plat.hangingChains) {
    const chainAlpha = isSolidInRealm ? 0.92 : 0.28;
    ctx.save();
    ctx.globalAlpha = chainAlpha;
    const midX = plat.x + plat.w / 2;
    drawChainLine(ctx, plat.x + 12, plat.y, midX, plat.y - 165, '#313242', 3);
    drawChainLine(ctx, plat.x + plat.w - 12, plat.y, midX, plat.y - 165, '#313242', 3);
    ctx.restore();
  }

  if (plat.kind === 'RIFT_BARRIER') {
    const grad = ctx.createLinearGradient(plat.x, plat.y, plat.x + plat.w, plat.y + plat.h);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0.78)');
    grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.88)');
    grad.addColorStop(1, 'rgba(225, 29, 72, 0.78)');
    ctx.fillStyle = grad;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w, plat.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 2;
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

    ctx.strokeStyle = '#FFF1F2';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    const midX = plat.x + plat.w / 2;
    for (let sy = plat.y; sy <= plat.y + plat.h; sy += 22) {
      const jx = midX + Math.sin(time * 12 + sy * 0.15) * 7;
      if (sy === plat.y) ctx.moveTo(jx, sy);
      else ctx.lineTo(jx, sy);
    }
    ctx.stroke();

    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FECDD3';
    ctx.fillText('SEVER [2]', midX, plat.y - 16);
    ctx.restore();
    return;
  }

  if (plat.kind === 'CRUSHER') {
    const bodyCol = chronoSlow ? '#1E1B4B' : '#211D29';
    const sideCol = chronoSlow ? '#131033' : '#0E0D14';
    const topCol = chronoSlow ? '#4338CA' : '#353145';

    // Overhead Iron Chain
    drawChainLine(ctx, plat.x + plat.w / 2, plat.y - 120, plat.x + plat.w / 2, plat.y, '#333645', 3.4);

    ctx.fillStyle = sideCol;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(plat.x + plat.w, plat.y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + plat.h + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = bodyCol;
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(plat.x + plat.w * 0.55, plat.y, plat.w * 0.45, plat.h);

    ctx.fillStyle = topCol;
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w, plat.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = chronoSlow ? '#A855F7' : '#E11D48';
    ctx.fillRect(plat.x + 8, plat.y + 12, plat.w - 16, 8);

    ctx.fillStyle = '#CBD5E1';
    const spikeCount = 3;
    const sw = plat.w / spikeCount;
    for (let i = 0; i < spikeCount; i++) {
      ctx.beginPath();
      ctx.moveTo(plat.x + i * sw + 2, plat.y + plat.h);
      ctx.lineTo(plat.x + i * sw + sw / 2, plat.y + plat.h + 15);
      ctx.lineTo(plat.x + (i + 1) * sw - 2, plat.y + plat.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    ctx.restore();
    return;
  }

  if (plat.kind === 'GATE') {
    ctx.fillStyle = '#0D0D12';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(plat.x + plat.w, plat.y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + plat.h + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18181E';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(plat.x + 6, plat.y + plat.h / 2 - 12, plat.w - 12, 24);
    ctx.restore();
    return;
  }

  if (!isSolidInRealm) {
    const ghostStroke =
      plat.realm === 'ABYSSAL'
        ? 'rgba(244, 63, 94, 0.48)'
        : 'rgba(148, 163, 184, 0.42)';
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = ghostStroke;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(plat.x + 1, plat.y + 1, plat.w - 2, plat.h - 2);
    ctx.beginPath();
    ctx.moveTo(plat.x, plat.y);
    ctx.lineTo(plat.x + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
    ctx.lineTo(plat.x + plat.w, plat.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle =
      plat.realm === 'ABYSSAL'
        ? 'rgba(225, 29, 72, 0.06)'
        : 'rgba(148, 163, 184, 0.05)';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.restore();
    return;
  }

  // Solid 2.5D Castle Stone Masonry
  let topDeck = '#322F3E';
  let frontFace = '#1B1924';
  let frontShadow = '#0E0D14';
  let sideFace = '#0A090E';
  let rimColor = '#B5AEBC';

  if (plat.realm === 'ABYSSAL') {
    topDeck = '#4E172A';
    frontFace = '#2B0D18';
    frontShadow = '#16060D';
    sideFace = '#0F0409';
    rimColor = '#FB7185';
  } else if (plat.realm === 'MATERIAL') {
    topDeck = '#343C4D';
    frontFace = '#1D222E';
    frontShadow = '#10141C';
    sideFace = '#0B0D13';
    rimColor = '#38BDF8';
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;

  // 2.5D Right Side Depth Face
  ctx.fillStyle = sideFace;
  ctx.beginPath();
  ctx.moveTo(plat.x + plat.w, plat.y);
  ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
  ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + plat.h + EXTRUDE_Y);
  ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2.5D Walkable Top Deck
  ctx.fillStyle = topDeck;
  ctx.beginPath();
  ctx.moveTo(plat.x, plat.y);
  ctx.lineTo(plat.x + EXTRUDE_X, plat.y + EXTRUDE_Y);
  ctx.lineTo(plat.x + plat.w + EXTRUDE_X, plat.y + EXTRUDE_Y);
  ctx.lineTo(plat.x + plat.w, plat.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Front Masonry Face
  ctx.fillStyle = frontFace;
  ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

  if (plat.kind !== 'ONEWAY') {
    ctx.fillStyle = frontShadow;
    ctx.fillRect(plat.x, plat.y + 18, plat.w, Math.max(0, plat.h - 18));

    // Ashlar castle stonework seams
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.lineWidth = 1.6;
    for (let bx = plat.x + 56; bx < plat.x + plat.w - 14; bx += 56) {
      ctx.beginPath();
      ctx.moveTo(bx, plat.y + 4);
      ctx.lineTo(bx - 4, plat.y + Math.min(plat.h, 38));
      ctx.stroke();
    }

    // Underside Gothic Arch Ribs & Stalactite Stone Teeth on elevated Castle Bridges!
    if (plat.w >= 260 && plat.h >= 28 && plat.h <= 50 && plat.y < 800) {
      ctx.fillStyle = '#0D0C12';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      const archSpan = 160;
      for (let ax = plat.x + 28; ax + archSpan <= plat.x + plat.w - 20; ax += archSpan + 24) {
        // Supporting gothic corbel arch beneath bridge
        ctx.beginPath();
        ctx.moveTo(ax, plat.y + plat.h);
        ctx.quadraticCurveTo(ax + archSpan * 0.5, plat.y + plat.h + 44, ax + archSpan, plat.y + plat.h);
        ctx.lineTo(ax + archSpan - 12, plat.y + plat.h + 52);
        ctx.lineTo(ax + archSpan, plat.y + plat.h + 95);
        ctx.lineTo(ax + archSpan - 26, plat.y + plat.h + 95);
        ctx.quadraticCurveTo(ax + archSpan * 0.5, plat.y + plat.h + 18, ax + 26, plat.y + plat.h + 95);
        ctx.lineTo(ax, plat.y + plat.h + 95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Hanging stone stalactites / weathered masonry teeth
      ctx.fillStyle = '#15131C';
      for (let sx = plat.x + 24; sx < plat.x + plat.w - 24; sx += 44) {
        ctx.beginPath();
        ctx.moveTo(sx, plat.y + plat.h);
        ctx.lineTo(sx + 5, plat.y + plat.h + 14);
        ctx.lineTo(sx + 10, plat.y + plat.h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Rim highlight
  ctx.fillStyle = rimColor;
  ctx.fillRect(plat.x, plat.y, plat.w, 3.5);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);

  if (plat.realm !== 'BOTH') {
    const glow = 0.55 + Math.sin(time * 4) * 0.3;
    ctx.fillStyle =
      plat.realm === 'ABYSSAL' ? `rgba(244,63,94,${glow})` : `rgba(56,189,248,${glow})`;
    ctx.fillRect(plat.x + plat.w / 2 - 14, plat.y + plat.h / 2 - 2, 28, 4);
  }

  ctx.restore();
}

function drawDynamicLightPools(
  ctx: CanvasRenderingContext2D,
  zone: ZoneDef,
  droppedIchor: DroppedIchor | null,
  gravityWells: GravityWell[],
  player: PlayerState,
  time: number
) {
  ctx.save();

  // Castle Braziers & Cyan Crystal Light Pools
  for (const prop of zone.props) {
    if (prop.kind !== 'BRAZIER' && prop.kind !== 'CRYSTAL') continue;
    const pulse = 0.85 + Math.sin(time * 7 + prop.x * 0.05) * 0.15;
    const isCrystal = prop.kind === 'CRYSTAL';
    const col = isCrystal
      ? `rgba(56, 189, 248, ${0.32 * pulse})`
      : `rgba(225, 29, 72, ${0.3 * pulse})`;

    ctx.save();
    ctx.translate(prop.x, prop.y - 4);
    ctx.scale(1.9, 0.52);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 74);
    grad.addColorStop(0, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Altars & Relics light pools
  for (const inter of zone.interactables) {
    if (inter.kind !== 'ALTAR' && inter.kind !== 'RELIC') continue;
    if (inter.kind === 'RELIC' && inter.activated) continue;
    const cx = inter.x + inter.w / 2 + 4;
    const cy = inter.y + inter.h - 4;
    const pulse = 0.85 + Math.sin(time * 5) * 0.15;
    const col =
      inter.kind === 'ALTAR'
        ? `rgba(225, 29, 72, ${0.28 * pulse})`
        : `rgba(56, 189, 248, ${0.3 * pulse})`;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.8, 0.48);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 68);
    grad.addColorStop(0, col);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (droppedIchor && droppedIchor.zoneId === zone.id) {
    ctx.save();
    ctx.translate(droppedIchor.x, droppedIchor.y - 4);
    ctx.scale(1.6, 0.45);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 46);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.34)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const well of gravityWells) {
    ctx.save();
    ctx.translate(well.x, well.y);
    ctx.scale(1.3, 0.55);
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, well.radius);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.34)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, well.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Subtle weapon-colored rim aura around player
  ctx.save();
  const px = player.x + player.w / 2;
  const py = player.y + player.h * 0.55;
  const pGrad = ctx.createRadialGradient(px, py, 6, px, py, 78);
  pGrad.addColorStop(
    0,
    player.weaponId === 'DUAL_DAGGERS'
      ? 'rgba(192, 132, 252, 0.16)'
      : player.weaponId === 'GRAVITY_GREATSWORD'
        ? 'rgba(245, 158, 11, 0.16)'
        : 'rgba(56, 189, 248, 0.18)'
  );
  pGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(px, py, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  zone: ZoneDef,
  cx: number,
  feetY: number,
  radius: number,
  realm: RealityRealm
) {
  let groundY: number | null = null;
  for (const plat of zone.platforms) {
    if (plat.kind === 'RIFT_BARRIER' || plat.kind === 'GATE') continue;
    if (plat.realm !== 'BOTH' && plat.realm !== realm) continue;
    if (cx >= plat.x - 10 && cx <= plat.x + plat.w + 10 && plat.y >= feetY - 8) {
      if (groundY === null || plat.y < groundY) {
        groundY = plat.y;
      }
    }
  }
  if (groundY === null) return;
  const dist = Math.max(0, groundY - feetY);
  if (dist > 170) return;
  const scale = Math.max(0.32, 1 - dist / 190);

  ctx.save();
  ctx.fillStyle = `rgba(3, 3, 6, ${0.62 * scale})`;
  ctx.beginPath();
  ctx.ellipse(cx + 3, groundY - 3, radius * scale, 5.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawInteractable(
  ctx: CanvasRenderingContext2D,
  inter: Interactable,
  time: number
) {
  ctx.save();
  const cx = inter.x + inter.w / 2;
  const bottom = inter.y + inter.h;

  if (inter.kind === 'ALTAR') {
    ctx.fillStyle = '#0F0E15';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx + 3, bottom - 48, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1D1C26';
    ctx.beginPath();
    ctx.moveTo(inter.x + 6, bottom);
    ctx.lineTo(inter.x + 14, bottom - 34);
    ctx.lineTo(inter.x + 4, bottom - 44);
    ctx.lineTo(inter.x + inter.w - 4, bottom - 44);
    ctx.lineTo(inter.x + inter.w - 14, bottom - 34);
    ctx.lineTo(inter.x + inter.w - 6, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const flameH = 28 + Math.sin(time * 7) * 5;
    ctx.fillStyle = inter.activated ? '#E11D48' : '#7F1D1D';
    ctx.beginPath();
    ctx.moveTo(cx - 14, bottom - 44);
    ctx.quadraticCurveTo(cx - 8, bottom - 44 - flameH, cx, bottom - 44 - flameH - 8);
    ctx.quadraticCurveTo(cx + 8, bottom - 44 - flameH, cx + 14, bottom - 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FECDD3';
    ctx.beginPath();
    ctx.moveTo(cx - 6, bottom - 44);
    ctx.lineTo(cx, bottom - 44 - flameH * 0.65);
    ctx.lineTo(cx + 6, bottom - 44);
    ctx.closePath();
    ctx.fill();
  } else if (inter.kind === 'CHEST') {
    // 2.5D Ornate Brass-Bound Castle Chest
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;

    // 2.5D right side depth
    ctx.fillStyle = '#1C1410';
    ctx.beginPath();
    ctx.moveTo(inter.x + inter.w, inter.y + 14);
    ctx.lineTo(inter.x + inter.w + 9, inter.y + 7);
    ctx.lineTo(inter.x + inter.w + 9, bottom - 6);
    ctx.lineTo(inter.x + inter.w, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Base chest body
    ctx.fillStyle = '#2F2017';
    ctx.fillRect(inter.x + 2, inter.y + 18, inter.w - 4, inter.h - 18);
    ctx.strokeRect(inter.x + 2, inter.y + 18, inter.w - 4, inter.h - 18);

    // Brass corner & band trim
    ctx.fillStyle = '#B45309';
    ctx.fillRect(inter.x + 6, inter.y + 18, 5, inter.h - 18);
    ctx.fillRect(inter.x + inter.w - 11, inter.y + 18, 5, inter.h - 18);

    if (inter.activated) {
      // Hinged open lid tilted backward
      ctx.fillStyle = '#3B281D';
      ctx.beginPath();
      ctx.moveTo(inter.x + 2, inter.y + 18);
      ctx.lineTo(inter.x + 12, inter.y + 2);
      ctx.lineTo(inter.x + inter.w + 6, inter.y + 2);
      ctx.lineTo(inter.x + inter.w - 2, inter.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Closed arched lid
      ctx.fillStyle = '#3D2A1E';
      ctx.beginPath();
      ctx.moveTo(inter.x + 1, inter.y + 18);
      ctx.quadraticCurveTo(cx, inter.y + 3, inter.x + inter.w - 1, inter.y + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden clasp lock
      const glint = 0.65 + Math.sin(time * 4.5) * 0.35;
      ctx.fillStyle = `rgba(251, 191, 36, ${glint})`;
      ctx.fillRect(cx - 4, inter.y + 15, 8, 9);
      ctx.strokeRect(cx - 4, inter.y + 15, 8, 9);
    }
  } else if (inter.kind === 'RELIC') {
    ctx.fillStyle = '#12121A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(inter.x + 8, bottom - 24);
    ctx.lineTo(inter.x + 15, bottom - 30);
    ctx.lineTo(inter.x + inter.w - 1, bottom - 30);
    ctx.lineTo(inter.x + inter.w - 8, bottom - 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1C1B24';
    ctx.fillRect(inter.x + 8, bottom - 24, inter.w - 16, 24);
    ctx.strokeRect(inter.x + 8, bottom - 24, inter.w - 16, 24);

    if (inter.activated) {
      ctx.restore();
      return;
    }
    const hoverY = inter.y + 20 + Math.sin(time * 3.5) * 6;
    const crystalColor =
      inter.powerReward === 'CHRONO_FRACTURE' ? '#A855F7' : '#38BDF8';
    ctx.fillStyle = crystalColor;
    ctx.beginPath();
    ctx.moveTo(cx, hoverY - 19);
    ctx.lineTo(cx - 14, hoverY);
    ctx.lineTo(cx, hoverY + 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = inter.powerReward === 'CHRONO_FRACTURE' ? '#6B21A8' : '#0284C7';
    ctx.beginPath();
    ctx.moveTo(cx, hoverY - 19);
    ctx.lineTo(cx + 14, hoverY);
    ctx.lineTo(cx, hoverY + 19);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.moveTo(cx, hoverY - 8);
    ctx.lineTo(cx + 5, hoverY);
    ctx.lineTo(cx, hoverY + 8);
    ctx.lineTo(cx - 5, hoverY);
    ctx.closePath();
    ctx.fill();
  } else if (inter.kind === 'LEVER') {
    ctx.fillStyle = '#20212A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.fillRect(inter.x + 6, bottom - 18, inter.w - 12, 18);
    ctx.strokeRect(inter.x + 6, bottom - 18, inter.w - 12, 18);

    const angle = inter.activated ? 0.55 : -0.55;
    ctx.save();
    ctx.translate(cx, bottom - 18);
    ctx.rotate(angle);
    ctx.fillStyle = inter.activated ? '#10B981' : '#F59E0B';
    ctx.fillRect(-3, -36, 6, 36);
    ctx.strokeRect(-3, -36, 6, 36);
    ctx.beginPath();
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (inter.kind === 'LORE') {
    ctx.fillStyle = '#101118';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(inter.x + inter.w - 4, bottom);
    ctx.lineTo(inter.x + inter.w + 5, bottom - 8);
    ctx.lineTo(inter.x + inter.w + 3, inter.y + 6);
    ctx.lineTo(cx + 6, inter.y - 6);
    ctx.lineTo(cx, inter.y);
    ctx.lineTo(inter.x + inter.w - 6, inter.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1A1B23';
    ctx.beginPath();
    ctx.moveTo(inter.x + 4, bottom);
    ctx.lineTo(inter.x + 6, inter.y + 12);
    ctx.lineTo(cx, inter.y);
    ctx.lineTo(inter.x + inter.w - 6, inter.y + 12);
    ctx.lineTo(inter.x + inter.w - 4, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(cx - 2, inter.y + 18, 4, 24);
  }

  ctx.restore();
}

function drawDroppedIchor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
) {
  ctx.save();
  const hover = Math.sin(time * 4) * 5;
  ctx.fillStyle = 'rgba(225, 29, 72, 0.24)';
  ctx.beginPath();
  ctx.arc(x, y - 24 + hover, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#EF4444';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 42 + hover);
  ctx.lineTo(x + 11, y - 22 + hover);
  ctx.lineTo(x, y - 6 + hover);
  ctx.lineTo(x - 11, y - 22 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawAfterimage(ctx: CanvasRenderingContext2D, img: Afterimage) {
  ctx.save();
  ctx.globalAlpha = (img.life / img.maxLife) * 0.48;
  ctx.fillStyle = img.color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;

  const cx = img.x + 17;
  ctx.beginPath();
  ctx.moveTo(cx - img.facing * 16, img.y + 10);
  ctx.lineTo(cx + img.facing * 14, img.y + 4);
  ctx.lineTo(cx + img.facing * 12, img.y + 60);
  ctx.lineTo(cx - img.facing * 20, img.y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRiftTear(
  ctx: CanvasRenderingContext2D,
  tear: RiftTear,
  time: number
) {
  ctx.save();
  const prog = tear.timer / tear.maxTimer;
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 10 * (0.6 + prog * 0.6);
  ctx.beginPath();
  ctx.moveTo(tear.x1, tear.y1);
  ctx.lineTo(tear.x2, tear.y2);
  ctx.stroke();

  ctx.strokeStyle = '#F0F9FF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jx =
      tear.x1 + (tear.x2 - tear.x1) * t + (i > 0 && i < steps ? Math.sin(time * 40 + i) * 7 : 0);
    const jy =
      tear.y1 + (tear.y2 - tear.y1) * t + (i > 0 && i < steps ? Math.cos(time * 35 + i) * 7 : 0);
    if (i === 0) ctx.moveTo(jx, jy);
    else ctx.lineTo(jx, jy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  time: number
) {
  ctx.save();

  if (p.invulnTimer > 0 && Math.floor(time * 24) % 2 === 0 && p.dodgeTimer <= 0) {
    ctx.globalAlpha = 0.55;
  }

  const cx = p.x + p.w / 2;
  const bottom = p.y + p.h - 2;
  const f = p.facing;

  // Flowing tattered crimson-black cloak
  if (p.cloakNodes.length > 1) {
    ctx.save();
    ctx.fillStyle = '#4A121E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(p.cloakNodes[0].x, p.cloakNodes[0].y);
    for (let i = 1; i < p.cloakNodes.length; i++) {
      ctx.lineTo(p.cloakNodes[i].x, p.cloakNodes[i].y);
    }
    for (let i = p.cloakNodes.length - 1; i >= 0; i--) {
      ctx.lineTo(
        p.cloakNodes[i].x - f * (6 + i * 2),
        p.cloakNodes[i].y + 14 + i * 2
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.translate(cx, bottom);
  ctx.scale(f, 1);

  const isRunning = p.grounded && Math.abs(p.vx) > 25;
  const climbOsc = p.climbingLadder ? Math.sin(p.y * 0.14) : 0;
  const stride = p.climbingLadder ? climbOsc * 0.6 : isRunning ? Math.sin(time * 14) : 0;
  const bob = p.climbingLadder ? 0 : isRunning ? Math.abs(Math.cos(time * 14)) * 3 : Math.sin(time * 3) * 1.5;

  if (p.dodgeTimer > 0) {
    ctx.rotate(0.28);
  } else if (isRunning) {
    ctx.rotate(0.11);
  }

  const isHeavyArmor = p.weaponId === 'GRAVITY_GREATSWORD';
  const isDaggers = p.weaponId === 'DUAL_DAGGERS';

  // Back Leg
  ctx.fillStyle = isHeavyArmor ? '#14151D' : '#0E0E14';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  const legW = isHeavyArmor ? 11 : 9;
  ctx.fillRect(-10 - stride * 7, -24, legW, 24);
  ctx.strokeRect(-10 - stride * 7, -24, legW, 24);

  // Front Leg
  ctx.fillStyle = isHeavyArmor ? '#2B2D3D' : '#1E1E28';
  ctx.fillRect(2 + stride * 7, -24, legW, 24);
  ctx.strokeRect(2 + stride * 7, -24, legW, 24);

  // Torso
  const chestW = isHeavyArmor ? 17 : 14;
  ctx.fillStyle = isHeavyArmor ? '#2A2C3B' : isDaggers ? '#1B1726' : '#22222C';
  ctx.beginPath();
  ctx.moveTo(-(chestW - 2), -22 - bob);
  ctx.lineTo(-chestW, -49 - bob);
  ctx.lineTo(chestW, -49 - bob);
  ctx.lineTo(chestW - 3, -22 - bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isHeavyArmor ? '#555878' : '#3E3E4E';
  ctx.fillRect(2, -46 - bob, isHeavyArmor ? 10 : 8, 18);
  if (isHeavyArmor) {
    ctx.fillStyle = '#A855F7';
    ctx.fillRect(-3, -43 - bob, 6, 10);
  }

  // Waist sash
  ctx.fillStyle = isDaggers ? '#7E22CE' : isHeavyArmor ? '#D97706' : '#9F1239';
  ctx.fillRect(-(chestW - 2), -26 - bob, (chestW - 2) * 2, 6);
  ctx.strokeRect(-(chestW - 2), -26 - bob, (chestW - 2) * 2, 6);

  // Pauldrons
  ctx.fillStyle = isHeavyArmor ? '#20222E' : '#1A1A22';
  ctx.beginPath();
  ctx.moveTo(-16, -42 - bob);
  ctx.lineTo(isHeavyArmor ? -23 : -18, isHeavyArmor ? -58 - bob : -53 - bob);
  ctx.lineTo(-4, -51 - bob);
  ctx.lineTo(0, -41 - bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (isHeavyArmor) {
    ctx.beginPath();
    ctx.moveTo(4, -42 - bob);
    ctx.lineTo(18, -55 - bob);
    ctx.lineTo(19, -42 - bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Head
  ctx.fillStyle = '#B8AEA2';
  ctx.fillRect(-7, -61 - bob, 14, 13);
  ctx.strokeRect(-7, -61 - bob, 14, 13);

  if (isHeavyArmor) {
    ctx.fillStyle = '#20222D';
    ctx.fillRect(-8, -64 - bob, 17, 10);
    ctx.strokeRect(-8, -64 - bob, 17, 10);
    ctx.beginPath();
    ctx.moveTo(-6, -64 - bob);
    ctx.lineTo(-15, -75 - bob);
    ctx.lineTo(-1, -66 - bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#2A2C38';
    ctx.beginPath();
    ctx.moveTo(-10, -56 - bob);
    ctx.lineTo(-14, -64 - bob);
    ctx.lineTo(-5, -67 - bob);
    ctx.lineTo(0, -70 - bob);
    ctx.lineTo(8, -66 - bob);
    ctx.lineTo(11, -58 - bob);
    ctx.lineTo(2, -57 - bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glowing Eye Scar
  ctx.fillStyle = isDaggers ? '#E879F9' : isHeavyArmor ? '#F59E0B' : '#38BDF8';
  ctx.fillRect(2, -57 - bob, 5, 3);

  // Weapons
  if (p.weaponId === 'DUAL_DAGGERS') {
    const swingT = p.attackTimer > 0 ? 1 - p.attackTimer / Math.max(0.01, p.attackTotal) : 0;
    const d1Ang =
      p.attackTimer > 0
        ? p.comboStep % 2 === 1
          ? -1.4 + swingT * 3.1
          : 1.4 - swingT * 2.9
        : p.blockHeld
          ? -0.2
          : 0.7;
    const d2Ang =
      p.attackTimer > 0
        ? p.comboStep % 2 === 0
          ? -1.6 + swingT * 3.2
          : 1.5 - swingT * 3.0
        : p.blockHeld
          ? 0.35
          : -1.2;

    drawDagger(ctx, -6, -34 - bob, d2Ang);
    drawDagger(ctx, 11, -32 - bob, d1Ang);
  } else if (p.weaponId === 'RIFT_SWORD') {
    let swordAngle = -0.35;
    let swordX = 8;
    let swordY = -33 - bob;
    if (p.attackTimer > 0) {
      const t = 1 - p.attackTimer / Math.max(0.01, p.attackTotal);
      if (p.attackVariant === 'UP_LAUNCHER') {
        swordAngle = 1.6 - t * 3.4;
      } else if (p.attackVariant === 'AIR_PLUNGE') {
        swordAngle = Math.PI - 0.15;
      } else {
        swordAngle = p.comboStep % 2 === 0 ? 1.4 - t * 3.0 : -1.5 + t * 2.9;
      }
      swordX = 11;
    } else if (p.blockHeld) {
      swordAngle = -0.08;
      swordX = 14;
      swordY = -38 - bob;
    }

    ctx.save();
    ctx.translate(swordX, swordY);
    ctx.rotate(swordAngle);
    ctx.fillStyle = '#333645';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-3, -44);
    ctx.lineTo(1, -56);
    ctx.lineTo(4, -42);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Electric-cyan rift edge vein
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(1, -46, 2.5, 42);
    ctx.fillStyle = '#18181F';
    ctx.fillRect(-8, -2, 16, 5);
    ctx.strokeRect(-8, -2, 16, 5);
    ctx.restore();
  } else {
    let swordAngle = -0.62;
    let swordX = -8;
    let swordY = -36 - bob;

    if (p.attackTimer > 0) {
      const t = 1 - p.attackTimer / Math.max(0.01, p.attackTotal);
      if (p.attackVariant === 'AIR_PLUNGE') {
        swordAngle = Math.PI;
      } else if (p.attackVariant === 'UP_LAUNCHER') {
        swordAngle = 1.8 - t * 3.5;
      } else if (p.comboStep === 1) {
        swordAngle = -1.7 + t * 3.1;
      } else if (p.comboStep === 2) {
        swordAngle = 1.5 - t * 3.2;
      } else {
        swordAngle = -2.3 + t * 3.9;
      }
      swordX = 9;
    } else if (p.blockHeld) {
      swordAngle = -0.05;
      swordX = 15;
      swordY = -38 - bob;
    }

    ctx.save();
    ctx.translate(swordX, swordY);
    ctx.rotate(swordAngle);

    ctx.fillStyle = '#3E4152';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-7, -58);
    ctx.lineTo(0, -72);
    ctx.lineTo(8, -56);
    ctx.lineTo(6, -38);
    ctx.lineTo(3, -34);
    ctx.lineTo(7, -28);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.comboStep === 3 && p.attackTimer > 0 ? '#C084FC' : '#F59E0B';
    ctx.fillRect(-1.5, -56, 3, 46);

    ctx.fillStyle = '#18181F';
    ctx.fillRect(-12, -2, 24, 7);
    ctx.strokeRect(-12, -2, 24, 7);
    ctx.restore();
  }

  // Guard / Brink Parry Barrier Arc
  if (p.blockHeld || p.parryFlashTimer > 0) {
    ctx.save();
    const isParryActive = p.parryWindowTimer > 0 || p.parryFlashTimer > 0;
    ctx.strokeStyle = isParryActive ? '#FDE047' : '#94A3B8';
    ctx.lineWidth = isParryActive ? 4 : 2.5;
    ctx.beginPath();
    ctx.ellipse(12, -35 - bob, 24, 30, 0, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();
  }

  // Guard Counter ready indicator aura
  if (p.guardCounterTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -35 - bob, 26, -1.2, 1.2);
    ctx.stroke();
    ctx.restore();
  }

  if (p.healTimer > 0) {
    ctx.save();
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -32, 28 + Math.sin(time * 18) * 4, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  time: number,
  chronoSlow: boolean
) {
  ctx.save();
  const cx = e.x + e.w / 2;
  const bottom = e.y + e.h - 2;

  ctx.translate(cx, bottom);
  ctx.scale(e.facing, 1);

  const isFlashing = e.flashTimer > 0;
  const wobble = e.aiState === 'PATROL' || e.aiState === 'CHASE' ? Math.sin(time * 9) * 2 : 0;

  if (e.kind === 'ASH_STALKER') {
    // Hollowed Castle Swordsman
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#14131A';
    ctx.fillRect(-9, -20, 6, 20);
    ctx.strokeRect(-9, -20, 6, 20);

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#26242E';
    ctx.fillRect(3, -20, 6, 20);
    ctx.strokeRect(3, -20, 6, 20);

    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(-9, -46 + wobble);
    ctx.lineTo(13, -42 + wobble);
    ctx.lineTo(10, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron knight skull-visor
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#353440';
    ctx.beginPath();
    ctx.arc(6, -49 + wobble, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FB7185';
    ctx.fillRect(8, -51 + wobble, 5, 3);

    ctx.save();
    ctx.translate(10, -30 + wobble);
    ctx.rotate(e.aiState === 'TELEGRAPH' ? -1.1 : e.aiState === 'ATTACK' ? 1.2 : 0.25);
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, -12);
    ctx.lineTo(17, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (e.kind === 'BLOOD_ACOLYTE') {
    // Floating Abyssal Crimson-Core Wraith (matching reference screenshot!)
    const floatY = Math.sin(time * 3.6 + e.x * 0.02) * 6;
    ctx.translate(0, floatY);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;

    // Tattered flowing ghostly tendrils trailing behind
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#1B0D18';
    ctx.beginPath();
    ctx.moveTo(-14, -52);
    ctx.lineTo(10, -50);
    ctx.lineTo(14, -18);
    ctx.quadraticCurveTo(2, -10 + Math.sin(time * 8) * 5, -18, 2);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-26, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Crimson Core in chest ribcage
    ctx.fillStyle = e.aiState === 'TELEGRAPH' ? '#FDE047' : '#F43F5E';
    ctx.beginPath();
    ctx.arc(2, -36, 7 + Math.sin(time * 9) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath();
    ctx.arc(2, -36, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hooded skeletal head
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#110912';
    ctx.beginPath();
    ctx.arc(2, -59, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FB7185';
    ctx.fillRect(5, -60, 5, 3);
  } else if (e.kind === 'SPIRE_WARDEN') {
    // Heavy Shield-Bearing Castle Knight (matching reference screenshot!)
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8;

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#161822';
    ctx.fillRect(-15, -28, 11, 28);
    ctx.strokeRect(-15, -28, 11, 28);

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#2A2E3D';
    ctx.fillRect(4, -28, 11, 28);
    ctx.strokeRect(4, -28, 11, 28);

    ctx.fillRect(-20, -68 + wobble, 40, 42);
    ctx.strokeRect(-20, -68 + wobble, 40, 42);

    ctx.fillStyle = '#3D4257';
    ctx.fillRect(4, -64 + wobble, 12, 30);

    // Visor Helm with crest horn
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#181A22';
    ctx.fillRect(-10, -85 + wobble, 20, 19);
    ctx.strokeRect(-10, -85 + wobble, 20, 19);
    ctx.beginPath();
    ctx.moveTo(-4, -85 + wobble);
    ctx.lineTo(-14, -97 + wobble);
    ctx.lineTo(4, -85 + wobble);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F43F5E';
    ctx.fillRect(2, -78 + wobble, 7, 3);

    // Greatsword raised/swung
    ctx.save();
    ctx.translate(12, -50 + wobble);
    ctx.rotate(e.aiState === 'TELEGRAPH' ? -1.1 : e.aiState === 'ATTACK' ? 1.25 : -0.25);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-2.5, -56, 5, 72);
    ctx.strokeRect(-2.5, -56, 5, 72);
    ctx.restore();

    // Heavy Castle Kite Shield on foreground arm
    ctx.save();
    ctx.translate(18, -42 + wobble);
    ctx.fillStyle = '#252836';
    ctx.beginPath();
    ctx.moveTo(-10, -24);
    ctx.lineTo(12, -20);
    ctx.lineTo(10, 18);
    ctx.lineTo(0, 30);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(1, -18);
    ctx.lineTo(1, 22);
    ctx.stroke();
    ctx.restore();
  } else if (e.kind === 'BOSS_VAELOR') {
    const p2 = e.phase === 2;
    const breath = Math.sin(time * 3) * 3;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;

    ctx.fillStyle = p2 ? '#3F0C15' : '#1B1A22';
    ctx.beginPath();
    ctx.moveTo(-16, -110 + breath);
    ctx.lineTo(-52, -10);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#13141B';
    ctx.fillRect(-24, -46, 16, 46);
    ctx.strokeRect(-24, -46, 16, 46);

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#252633';
    ctx.fillRect(8, -46, 16, 46);
    ctx.strokeRect(8, -46, 16, 46);

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#282934';
    ctx.beginPath();
    ctx.moveTo(-28, -44);
    ctx.lineTo(-34, -112 + breath);
    ctx.lineTo(34, -112 + breath);
    ctx.lineTo(26, -44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p2 ? '#F43F5E' : '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-10, -98 + breath);
    ctx.lineTo(10, -98 + breath);
    ctx.lineTo(6, -62 + breath);
    ctx.lineTo(-6, -62 + breath);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#181920';
    ctx.beginPath();
    ctx.moveTo(-36, -98 + breath);
    ctx.lineTo(-44, -124 + breath);
    ctx.lineTo(-18, -116 + breath);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(36, -98 + breath);
    ctx.lineTo(44, -124 + breath);
    ctx.lineTo(18, -116 + breath);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#1B1C24';
    ctx.fillRect(-15, -142 + breath, 30, 30);
    ctx.strokeRect(-15, -142 + breath, 30, 30);
    ctx.beginPath();
    ctx.moveTo(-12, -138 + breath);
    ctx.lineTo(-28, -162 + breath);
    ctx.lineTo(-6, -144 + breath);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -138 + breath);
    ctx.lineTo(28, -162 + breath);
    ctx.lineTo(6, -144 + breath);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p2 ? '#FECDD3' : '#FBBF24';
    ctx.fillRect(2, -130 + breath, 9, 4);

    ctx.save();
    ctx.translate(22, -82 + breath);
    let bAngle = -0.35;
    if (e.aiState === 'TELEGRAPH') bAngle = -1.65;
    else if (e.aiState === 'ATTACK') bAngle = 1.45;
    else if (e.aiState === 'STAGGERED') bAngle = 0.85;
    ctx.rotate(bAngle);

    ctx.fillStyle = '#313340';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-8, -98);
    ctx.lineTo(0, -118);
    ctx.lineTo(9, -96);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p2 ? '#F43F5E' : '#F59E0B';
    ctx.fillRect(-2, -92, 4, 82);
    ctx.restore();
  }

  if (chronoSlow) {
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w / 2 - 4, -e.h - 4, e.w + 8, e.h + 8);
  }

  ctx.restore();

  // World-Space Parry Glint, Voidfang Mark, Execution Marker & Enemy HP
  ctx.save();

  if (e.markedTimer > 0) {
    const mx = cx;
    const my = e.y + e.h * 0.45;
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, my - 11);
    ctx.lineTo(mx + 11, my);
    ctx.lineTo(mx, my + 11);
    ctx.lineTo(mx - 11, my);
    ctx.closePath();
    ctx.stroke();
  }

  if (e.aiState === 'TELEGRAPH' && e.parryable) {
    const glintSize = 14 + Math.sin(time * 28) * 4;
    const gx = cx;
    const gy = e.y - 16;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy - glintSize);
    ctx.lineTo(gx + glintSize, gy);
    ctx.lineTo(gx, gy + glintSize);
    ctx.lineTo(gx - glintSize, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (e.aiState === 'STAGGERED') {
    const pulse = 1 + Math.sin(time * 12) * 0.08;
    ctx.save();
    ctx.translate(cx, e.y - 24);
    ctx.scale(pulse, pulse);
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.fillRect(-52, -14, 104, 22);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-52, -14, 104, 22);
    ctx.fillStyle = '#FDE047';
    ctx.fillText('[E] EXECUTE', 0, 2);
    ctx.restore();
  } else if (e.kind !== 'BOSS_VAELOR' && (e.hp < e.maxHp || e.posture > 0)) {
    const bw = 48;
    const bx = cx - bw / 2;
    const by = e.y - 16;
    ctx.fillStyle = INK;
    ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(bx, by + 6, bw * Math.min(1, e.posture / e.maxPosture), 2);
  }
  ctx.restore();
}

function drawSlashArc(ctx: CanvasRenderingContext2D, arc: SlashArc) {
  ctx.save();
  const alpha = arc.life / arc.maxLife;
  ctx.globalAlpha = alpha;
  ctx.translate(arc.x, arc.y);
  ctx.scale(arc.facing, 1);

  ctx.strokeStyle = arc.color;
  ctx.lineWidth = arc.heavy ? 20 * alpha : 12 * alpha;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, arc.radius, arc.radius * 0.78, -0.18, arc.angleStart, arc.angleEnd);
  ctx.stroke();

  ctx.strokeStyle = '#FFFBEB';
  ctx.lineWidth = arc.heavy ? 5.5 * alpha : 3 * alpha;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    arc.radius + 3,
    (arc.radius + 3) * 0.78,
    -0.18,
    arc.angleStart + 0.1,
    arc.angleEnd - 0.1
  );
  ctx.stroke();
  ctx.restore();
}

function drawDagger(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#3B3452';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-3, -22);
  ctx.lineTo(2, -30);
  ctx.lineTo(4, -14);
  ctx.lineTo(2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#E879F9';
  ctx.fillRect(0.5, -24, 2, 20);
  ctx.restore();
}

function drawGravityWell(
  ctx: CanvasRenderingContext2D,
  well: GravityWell,
  time: number
) {
  ctx.save();
  const alpha = Math.min(1, well.timer * 2.2);
  ctx.globalAlpha = alpha;

  const grad = ctx.createRadialGradient(well.x, well.y, 8, well.x, well.y, well.radius);
  grad.addColorStop(0, 'rgba(88, 28, 135, 0.78)');
  grad.addColorStop(0.45, 'rgba(168, 85, 247, 0.24)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#C084FC';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.ellipse(
    well.x,
    well.y,
    well.radius * 0.75,
    well.radius * 0.38,
    Math.sin(time * 2) * 0.2,
    time * 4,
    time * 4 + Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#090512';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(well.x, well.y, 18 + Math.sin(time * 14) * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawEchoClone(
  ctx: CanvasRenderingContext2D,
  clone: EchoClone,
  time: number
) {
  ctx.save();
  const alpha = Math.min(0.82, clone.timer * 1.4);
  ctx.globalAlpha = alpha;
  ctx.translate(clone.x + 17, clone.y + 60);
  ctx.scale(clone.facing, 1);

  ctx.fillStyle = '#7E22CE';
  ctx.strokeStyle = '#E9D5FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-14, -50);
  ctx.lineTo(0, -64);
  ctx.lineTo(14, -48);
  ctx.lineTo(10, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (clone.slashTimer > 0) {
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(16, -32, 34, 24, 0, -1.1 + Math.sin(time * 20) * 0.2, 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  time: number
) {
  ctx.save();

  if (proj.kind === 'RIFT_LANCE') {
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.translate(proj.x, proj.y);
    ctx.rotate(angle);

    // Outer electric-cyan aura
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    glow.addColorStop(0, 'rgba(186, 230, 253, 0.9)');
    glow.addColorStop(0.45, 'rgba(56, 189, 248, 0.45)');
    glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(-6, 0, 36, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged lightning filament tail
    ctx.strokeStyle = '#7DD3FC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-38, 0);
    ctx.lineTo(-24, Math.sin(time * 55) * 6);
    ctx.lineTo(-12, Math.cos(time * 60) * 5);
    ctx.lineTo(14, 0);
    ctx.stroke();

    // Lance spearhead
    ctx.fillStyle = '#E0F2FE';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (proj.kind === 'VOIDFANG_DAGGER') {
    const angle = Math.atan2(proj.vy, proj.vx);
    ctx.translate(proj.x, proj.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#E879F9';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -4.5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-26, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (proj.kind === 'GRAVITY_ORB') {
    ctx.translate(proj.x, proj.y);
    const pulse = 1 + Math.sin(time * 18) * 0.12;
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, proj.radius * 2.2);
    aura.addColorStop(0, 'rgba(168, 85, 247, 0.7)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, proj.radius * 1.5, proj.radius * 0.6, time * 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#090512';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (proj.kind === 'RIFT_CRESCENT') {
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.translate(proj.x, proj.y);
    ctx.scale(dir, 1);
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.9, -1.05, 1.05);
    ctx.arc(-8, 0, proj.radius * 1.45, 1.05, -1.05, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(3, 0, proj.radius * 1.35, -0.75, 0.75);
    ctx.arc(-2, 0, proj.radius * 1.05, 0.75, -0.75, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillStyle = proj.color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, proj.radius + Math.sin(time * 24) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF2F2';
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, proj.radius * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawChronoDome(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  time: number,
  remaining: number
) {
  ctx.save();
  const alpha = Math.min(1, remaining * 1.2) * 0.52;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 260, 195, 0, time * 0.8, time * 0.8 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#E9D5FF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 248, 182, 0, -time * 0.6, -time * 0.6 + Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  realm: RealityRealm,
  hpRatio: number
) {
  ctx.save();
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.34,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  if (hpRatio < 0.3) {
    grad.addColorStop(1, 'rgba(127, 29, 29, 0.52)');
  } else if (realm === 'ABYSSAL') {
    grad.addColorStop(1, 'rgba(56, 8, 24, 0.48)');
  } else {
    grad.addColorStop(1, 'rgba(5, 5, 8, 0.46)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
