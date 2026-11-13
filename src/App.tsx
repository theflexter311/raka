/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CastleMapModal } from './components/CastleMapModal';
import { GameHUD } from './components/GameHUD';
import { OverlayModals } from './components/OverlayModals';
import { SkillTreeModal } from './components/SkillTreeModal';
import { TitleScreen } from './components/TitleScreen';
import { KhazanEngine } from './game/engine';
import { HudSnapshot, SkillId } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  gameState: 'TITLE_MENU',
  zoneId: 'CRUCIBLE',
  zoneName: 'Outer Gatehouse',
  zoneSubtitle: 'Castle Virel · Lower Bridge & Ramparts',
  hp: 120,
  maxHp: 120,
  trailHp: 120,
  stamina: 100,
  maxStamina: 100,
  riftEnergy: 100,
  maxRiftEnergy: 100,
  flasks: 3,
  maxFlasks: 3,
  ichor: 0,
  realm: 'MATERIAL',
  weaponId: 'RIFT_SWORD',
  weaponArtCooldown: 0,
  projectileCooldown: 0,
  armorPct: 12,
  unlockedPowers: ['PHASE_SHIFT'],
  unlockedSkills: [],
  canAffordSkill: false,
  phaseShiftCooldown: 0,
  spatialSeverCooldown: 0,
  chronoCooldown: 0,
  chronoActiveTimer: 0,
  visitedZones: ['CRUCIBLE'],
  boss: null,
  prompt: null,
  banner: null,
  stats: {
    elapsedSeconds: 0,
    parries: 0,
    executions: 0,
    deaths: 0,
    enemiesSlain: 0,
  },
  muted: false,
  playerNormPos: { x: 0.1, y: 0.7 },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<KhazanEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const engine = new KhazanEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engine.mount();
    engineRef.current = engine;

    return () => {
      window.removeEventListener('resize', resize);
      engine.unmount();
      engineRef.current = null;
    };
  }, []);

  // Automatically close modal overlays if gameplay resumes via Escape
  useEffect(() => {
    if (hud.gameState === 'PLAYING') {
      setShowSkillTree(false);
      setShowMapModal(false);
    }
  }, [hud.gameState]);

  const toggleSkillTree = useCallback(() => {
    if (hud.gameState === 'TITLE_MENU' || hud.gameState === 'GAME_OVER') return;
    if (showSkillTree) {
      setShowSkillTree(false);
      engineRef.current?.setGameState('PLAYING');
    } else {
      setShowMapModal(false);
      setShowControlsModal(false);
      setShowSkillTree(true);
      if (hud.gameState === 'PLAYING') {
        engineRef.current?.setGameState('PAUSED');
      }
    }
  }, [hud.gameState, showSkillTree]);

  const toggleMapModal = useCallback(() => {
    if (hud.gameState === 'TITLE_MENU' || hud.gameState === 'GAME_OVER') return;
    if (showMapModal) {
      setShowMapModal(false);
      engineRef.current?.setGameState('PLAYING');
    } else {
      setShowSkillTree(false);
      setShowControlsModal(false);
      setShowMapModal(true);
      if (hud.gameState === 'PLAYING') {
        engineRef.current?.setGameState('PAUSED');
      }
    }
  }, [hud.gameState, showMapModal]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyT') {
        toggleSkillTree();
      } else if (e.code === 'KeyM') {
        toggleMapModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSkillTree, toggleMapModal]);

  const handleStartGame = () => {
    setShowControlsModal(false);
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.startNewGame();
  };

  const handlePause = () => {
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.setGameState('PAUSED');
  };

  const handleResume = () => {
    setShowControlsModal(false);
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.setGameState('PLAYING');
  };

  const handleRespawnAtAltar = () => {
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.respawnAtAltar();
  };

  const handleRestartGame = () => {
    setShowControlsModal(false);
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.startNewGame();
  };

  const handleReturnToTitle = () => {
    setShowControlsModal(false);
    setShowSkillTree(false);
    setShowMapModal(false);
    engineRef.current?.setGameState('TITLE_MENU');
  };

  const handleContinueVictory = () => {
    engineRef.current?.continueAfterVictory();
  };

  const handleToggleMute = () => {
    engineRef.current?.toggleMute();
  };

  const handleUnlockSkill = (skillId: SkillId) => {
    engineRef.current?.unlockSkill(skillId);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07070A]">
      {/* Primary 60fps 2.5D Dark Castle Action Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        aria-label="Raka Fractured Reality game canvas"
      />

      {/* Title Menu Overlay */}
      {hud.gameState === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-30">
          <TitleScreen
            onStartGame={handleStartGame}
            onOpenControls={() => setShowControlsModal(true)}
            muted={hud.muted}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* Active Gameplay HUD */}
      {hud.gameState !== 'TITLE_MENU' && (
        <GameHUD
          hud={hud}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          onSwitchWeapon={(id) => engineRef.current?.switchWeapon(id)}
          onOpenSkillTree={toggleSkillTree}
          onOpenMap={toggleMapModal}
        />
      )}

      {/* Skill Tree Modal [T] */}
      {showSkillTree && (
        <SkillTreeModal
          hud={hud}
          onUnlockSkill={handleUnlockSkill}
          onClose={toggleSkillTree}
        />
      )}

      {/* Castle Map Modal [M] */}
      {showMapModal && <CastleMapModal hud={hud} onClose={toggleMapModal} />}

      {/* Pause, Death, Victory & Controls Modals */}
      <OverlayModals
        hud={hud}
        showControlsModal={showControlsModal}
        hidePauseCard={showSkillTree || showMapModal || showControlsModal}
        onCloseControls={() => setShowControlsModal(false)}
        onOpenControls={() => setShowControlsModal(true)}
        onResume={handleResume}
        onRespawnAtAltar={handleRespawnAtAltar}
        onRestartGame={handleRestartGame}
        onReturnToTitle={handleReturnToTitle}
        onContinueVictory={handleContinueVictory}
      />
    </div>
  );
}
