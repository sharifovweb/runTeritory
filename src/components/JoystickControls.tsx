'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Navigation } from 'lucide-react';

interface JoystickControlsProps {
  onMoveStep: (dLat: number, dLng: number) => void;
  speedKmH: number;
}

export default function JoystickControls({ onMoveStep, speedKmH }: JoystickControlsProps) {
  const activeKeys = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard navigation hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        activeKeys.current.add(k);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      activeKeys.current.delete(k);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Continuous motion loop
    timerRef.current = setInterval(() => {
      if (activeKeys.current.size === 0) return;

      const keys = activeKeys.current;
      let dLat = 0;
      let dLng = 0;
      const step = 0.00004 * (speedKmH / 10); // scale speed

      if (keys.has('w') || keys.has('arrowup')) dLat += step;
      if (keys.has('s') || keys.has('arrowdown')) dLat -= step;
      if (keys.has('d') || keys.has('arrowright')) dLng += step;
      if (keys.has('a') || keys.has('arrowleft')) dLng -= step;

      if (dLat !== 0 || dLng !== 0) {
        onMoveStep(dLat, dLng);
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onMoveStep, speedKmH]);

  const triggerStep = (dLat: number, dLng: number) => {
    const step = 0.00004 * (speedKmH / 10);
    onMoveStep(dLat * step, dLng * step);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '20px',
      zIndex: 1000,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '24px',
      padding: '12px',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Navigation size={12} color="#38bdf8" /> Virtual Yugurish (W,A,S,D)
      </div>

      {/* D-Pad Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gridTemplateRows: 'repeat(3, 40px)', gap: '4px' }}>
        <div />
        <button
          onMouseDown={() => triggerStep(1, 0)}
          onTouchStart={() => triggerStep(1, 0)}
          style={btnStyle}
        >
          <ArrowUp size={18} />
        </button>
        <div />

        <button
          onMouseDown={() => triggerStep(0, -1)}
          onTouchStart={() => triggerStep(0, -1)}
          style={btnStyle}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
          GPS
        </div>
        <button
          onMouseDown={() => triggerStep(0, 1)}
          onTouchStart={() => triggerStep(0, 1)}
          style={btnStyle}
        >
          <ArrowRight size={18} />
        </button>

        <div />
        <button
          onMouseDown={() => triggerStep(-1, 0)}
          onTouchStart={() => triggerStep(-1, 0)}
          style={btnStyle}
        >
          <ArrowDown size={18} />
        </button>
        <div />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(56, 189, 248, 0.15)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '12px',
  color: '#38bdf8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.1s ease',
};
