'use client';

import React from 'react';
import { IconPlayerPlay, IconPlayerPause, IconCircleCheck } from '@tabler/icons-react';
import { soundFx } from '@/utils/soundEffects';

interface ControlsProps {
  isRunning: boolean;
  isOutsideBase: boolean;
  onToggleRun: () => void;
  onClaimTerritory: () => void;
  onResetBase: () => void;
}

export default function Controls({
  isRunning,
  isOutsideBase,
  onToggleRun,
  onClaimTerritory,
  onResetBase,
}: ControlsProps) {
  const handleClaim = () => {
    soundFx.playAreaClaim();
    onClaimTerritory();
  };

  return (
    <div className="controls-bar" style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '28px',
      padding: '8px 16px',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
    }}>
      {/* Start / Pause Running Button */}
      <button
        className="controls-btn"
        onClick={onToggleRun}
        style={{
          background: isRunning
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '20px',
          padding: '12px 24px',
          fontSize: '15px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: isRunning ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 0 20px rgba(16, 185, 129, 0.5)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isRunning ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
        {isRunning ? 'Yugurishni To\'xtatish' : 'Yugurishni Boshlash'}
      </button>

      {/* Claim Loop Area Button (Only active when outside base drawing a trail) */}
      {isOutsideBase && (
        <button
          className="controls-btn"
          onClick={handleClaim}
          style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
            animation: 'pulse 1.5s infinite',
          }}
        >
          <IconCircleCheck size={20} />
          Hududni Biriktirish
        </button>
      )}

    </div>
  );
}
