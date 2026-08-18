'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import DynamicMap from '@/components/DynamicMap';
import GameHUD from '@/components/GameHUD';
import Leaderboard from '@/components/Leaderboard';
import Controls from '@/components/Controls';
import JoystickControls from '@/components/JoystickControls';
import GPSPermissionModal from '@/components/GPSPermissionModal';
import NicknameModal from '@/components/NicknameModal';
import { Player, Coordinate, GameMode, GPSStatus } from '@/types/game';
import { createInitialBase, isPointInPolygon, mergeTrailIntoBase, getDistanceMeters } from '@/utils/turfEngine';
import { createInitialBots, tickBot, BotState } from '@/utils/botSimulator';
import { soundFx } from '@/utils/soundEffects';
import confetti from 'canvas-confetti';

// Default initial location: Turkiston ko'chasi & Sohibqiron ko'chasi region [41.3325, 69.2885]
const DEFAULT_CENTER: Coordinate = [41.3325, 69.2885];
const STORAGE_KEY = 'runterritory_saved_user_data_v2';

export default function PaperIoGpsGame() {
  const [gameMode, setGameMode] = useState<GameMode>('REAL_GPS');
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [followPlayer, setFollowPlayer] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<Coordinate>(DEFAULT_CENTER);

  // User player state with localStorage recovery
  const [userPlayer, setUserPlayer] = useState<Player>(() => {
    const defaultBase = createInitialBase(DEFAULT_CENTER, 18);
    const defaultState: Player = {
      id: 'user-player',
      name: '',
      color: '#38bdf8',
      isBot: false,
      position: DEFAULT_CENTER,
      activeTrail: [],
      basePolygon: [defaultBase],
      totalArea: 1017,
      speed: 0,
      distance: 0,
      isOutsideBase: false,
      avatarIcon: '🏃',
    };

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.basePolygon && parsed.basePolygon.length > 0) {
            return {
              ...defaultState,
              name: parsed.name || '',
              basePolygon: parsed.basePolygon,
              totalArea: parsed.totalArea || defaultState.totalArea,
              distance: parsed.distance || 0,
              color: parsed.color || defaultState.color,
              position: parsed.position || defaultState.position,
            };
          }
        }
      } catch (err) {
        console.error('Failed to restore saved player data:', err);
      }
    }
    return defaultState;
  });

  // Check if nickname modal needs to be shown on start
  useEffect(() => {
    if (!userPlayer.name || userPlayer.name.trim() === '') {
      setShowNicknameModal(true);
    }
  }, [userPlayer.name]);

  // AI Bots state
  const [bots, setBots] = useState<Player[]>([]);

  // GPS Watch state
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>({
    active: true,
    accuracy: null,
    error: null,
    mode: 'REAL_GPS',
  });

  const lastPosRef = useRef<Coordinate>(DEFAULT_CENTER);
  const lastTimeRef = useRef<number>(Date.now());
  const watchIdRef = useRef<number | null>(null);

  // Auto-save player state to localStorage whenever profile, territory or distance updates
  useEffect(() => {
    if (typeof window !== 'undefined' && userPlayer.name) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            name: userPlayer.name,
            basePolygon: userPlayer.basePolygon,
            totalArea: userPlayer.totalArea,
            distance: userPlayer.distance,
            color: userPlayer.color,
            position: userPlayer.position,
          })
        );
      } catch (err) {
        console.error('Failed to save player data:', err);
      }
    }
  }, [userPlayer.name, userPlayer.basePolygon, userPlayer.totalArea, userPlayer.distance, userPlayer.color, userPlayer.position]);

  // Trigger GPS permission modal on launch if not shown yet
  useEffect(() => {
    if (!showNicknameModal && typeof window !== 'undefined') {
      const hasAsked = sessionStorage.getItem('runterritory_gps_asked');
      if (!hasAsked) {
        setShowGpsModal(true);
      }
    }
  }, [showNicknameModal]);

  const handleNicknameSubmit = (name: string, color: string) => {
    setUserPlayer((prev) => ({
      ...prev,
      name,
      color,
    }));
    setShowNicknameModal(false);
    // Show GPS modal immediately after nickname is entered
    setShowGpsModal(true);
  };

  // High Accuracy GPS Lock Function
  const requestHighAccuracyLocation = useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const exactCoord: Coordinate = [latitude, longitude];

          setUserPlayer((prev) => {
            if (!prev.basePolygon || prev.basePolygon[0].length < 3) {
              const initialBase = createInitialBase(exactCoord, 18);
              return { ...prev, position: exactCoord, basePolygon: [initialBase] };
            }
            return { ...prev, position: exactCoord };
          });

          setMapCenter(exactCoord);
          lastPosRef.current = exactCoord;
          setGpsStatus({
            active: true,
            accuracy: accuracy ? Math.round(accuracy) : null,
            error: null,
            mode: 'REAL_GPS',
          });
        },
        (err) => {
          console.warn('GPS location request error:', err.message);
          setGpsStatus({
            active: false,
            accuracy: null,
            error: err.message,
            mode: 'REAL_GPS',
          });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }
  }, []);

  const handleConfirmGPS = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('runterritory_gps_asked', 'true');
    }
    setShowGpsModal(false);
    requestHighAccuracyLocation();
  };

  const handleCancelGPS = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('runterritory_gps_asked', 'true');
    }
    setShowGpsModal(false);
  };

  // Auto-locate real user GPS position on page launch if permission already granted
  useEffect(() => {
    requestHighAccuracyLocation();
  }, [requestHighAccuracyLocation]);

  // Core movement & territory capture processor
  const processNewPosition = useCallback((newPos: Coordinate) => {
    const now = Date.now();
    const timeDeltaSec = Math.max(0.1, (now - lastTimeRef.current) / 1000);
    const distMeters = getDistanceMeters(lastPosRef.current, newPos);

    // Speed in km/h
    const currentSpeed = (distMeters / timeDeltaSec) * 3.6;

    // Running Threshold Check (Minimum 1.8 km/h or 1.5m movement)
    // Prevents GPS stationary noise / jitter from drawing fake trails when sitting still!
    const isPhysicalMovement = currentSpeed >= 1.8 || distMeters >= 1.5;

    if (gameMode === 'REAL_GPS' && !isPhysicalMovement) {
      // User is stationary at home / standing still -> update speed to 0 and exit early
      setUserPlayer((prev) => ({ ...prev, speed: 0 }));
      return;
    }

    lastPosRef.current = newPos;
    lastTimeRef.current = now;

    setUserPlayer((prev) => {
      const isCurrentlyInside = isPointInPolygon(newPos, prev.basePolygon[0]);
      let updatedTrail = [...prev.activeTrail];
      let updatedBase = prev.basePolygon;
      let newTotalArea = prev.totalArea;
      let isOutside = prev.isOutsideBase;

      if (!isCurrentlyInside) {
        // Exited base or staying outside -> record active trail
        isOutside = true;
        updatedTrail.push(newPos);
        soundFx.playStepSound();
      } else if (isOutside) {
        // Re-entered base polygon -> CLOSE LOOP & CLAIM AREA!
        updatedTrail.push(newPos);

        const { updatedBase: newBaseCoords, newlyCapturedArea } = mergeTrailIntoBase(
          prev.basePolygon[0],
          updatedTrail
        );

        updatedBase = [newBaseCoords];
        newTotalArea += newlyCapturedArea;
        updatedTrail = [];
        isOutside = false;

        // Play celebratory sound & confetti
        soundFx.playAreaClaim();
        if (newlyCapturedArea > 50) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
      }

      return {
        ...prev,
        position: newPos,
        activeTrail: updatedTrail,
        basePolygon: updatedBase,
        totalArea: newTotalArea,
        speed: Math.min(35, currentSpeed), // capped for UI stability
        distance: prev.distance + distMeters,
        isOutsideBase: isOutside,
      };
    });

    setMapCenter(newPos);
  }, [gameMode]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (gameMode !== 'REAL_GPS' || !isRunning) {
      if (watchIdRef.current !== null && typeof window !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGpsStatus((prev) => ({ ...prev, active: false, mode: gameMode }));
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus({
        active: false,
        accuracy: null,
        error: "Geolokatsiya brauzer tomonidan qo'llab-quvvatlanmaydi",
        mode: 'REAL_GPS',
      });
      return;
    }

    // Immediate first fix to snap starting base right to user's physical GPS location!
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const initialCoord: Coordinate = [latitude, longitude];
        const newRealBase = createInitialBase(initialCoord, 18);

        setUserPlayer((prev) => ({
          ...prev,
          position: initialCoord,
          basePolygon: [newRealBase],
          totalArea: 1017,
        }));
        setMapCenter(initialCoord);
        lastPosRef.current = initialCoord;
      },
      (err) => {
        console.warn('Initial GPS fix error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newCoord: Coordinate = [latitude, longitude];

        setGpsStatus({
          active: true,
          accuracy: Math.round(accuracy),
          error: null,
          mode: 'REAL_GPS',
        });

        processNewPosition(newCoord);
      },
      (err) => {
        setGpsStatus({
          active: false,
          accuracy: null,
          error: err.message,
          mode: 'REAL_GPS',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [gameMode, isRunning, processNewPosition]);

  // Simulator movement step handler (from Virtual Joystick or Keyboard)
  const handleSimulatorStep = useCallback((dLat: number, dLng: number) => {
    if (!isRunning) return;
    const currentPos = userPlayer.position;
    const nextPos: Coordinate = [currentPos[0] + dLat, currentPos[1] + dLng];
    processNewPosition(nextPos);
  }, [isRunning, userPlayer.position, processNewPosition]);

  // Manual Claim Loop Trigger
  const handleManualClaim = () => {
    if (!userPlayer.isOutsideBase || userPlayer.activeTrail.length < 2) return;

    const { updatedBase: newBaseCoords, newlyCapturedArea } = mergeTrailIntoBase(
      userPlayer.basePolygon[0],
      userPlayer.activeTrail
    );

    setUserPlayer((prev) => ({
      ...prev,
      basePolygon: [newBaseCoords],
      totalArea: prev.totalArea + newlyCapturedArea,
      activeTrail: [],
      isOutsideBase: false,
    }));

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
    });
  };

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* GPS Permission Modal Prompt on App Entry */}
      <GPSPermissionModal
        isOpen={showGpsModal}
        onConfirm={handleConfirmGPS}
        onCancel={handleCancelGPS}
      />

      {/* Nickname & Personal Color Selection Modal */}
      <NicknameModal
        isOpen={showNicknameModal}
        initialName={userPlayer.name}
        initialColor={userPlayer.color}
        onSubmit={handleNicknameSubmit}
      />

      {/* Top Floating Glassmorphism HUD */}
      <GameHUD
        userPlayer={userPlayer}
        gpsStatus={gpsStatus}
        gameMode={gameMode}
        followPlayer={followPlayer}
        onToggleFollow={() => setFollowPlayer(!followPlayer)}
        onSelectColor={(color) => setUserPlayer((p) => ({ ...p, color }))}
        onToggleMode={() => {}}
        onEditProfile={() => setShowNicknameModal(true)}
      />

      {/* Top Right Live Leaderboard */}
      <Leaderboard userPlayer={userPlayer} bots={bots} />

      {/* Main Interactive Map */}
      <DynamicMap
        userPlayer={userPlayer}
        bots={bots}
        mapCenter={mapCenter}
        followPlayer={followPlayer}
      />

      {/* Bottom Main Action Bar */}
      <Controls
        isRunning={isRunning}
        isOutsideBase={userPlayer.isOutsideBase}
        onToggleRun={() => setIsRunning(!isRunning)}
        onClaimTerritory={handleManualClaim}
        onResetBase={() => {}}
      />
    </main>
  );
}
