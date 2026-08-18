'use client';

import React from 'react';
import { Player, GPSStatus, GameMode } from '@/types/game';
import { IconBolt, IconActivity, IconMapPin, IconLock, IconLockOpen, IconVolume, IconVolumeOff } from '@tabler/icons-react';
import { soundFx } from '@/utils/soundEffects';

interface GameHUDProps {
  userPlayer: Player;
  gpsStatus: GPSStatus;
  gameMode: GameMode;
  followPlayer: boolean;
  onToggleFollow: () => void;
  onSelectColor: (color: string) => void;
  onToggleMode: () => void;
}

const PLAYER_COLORS = [
  '#38bdf8', // Neon Sky Blue
  '#10b981', // Emerald Green
  '#a855f7', // Electric Violet
  '#f43f5e', // Neon Crimson
  '#fbbf24', // Amber Gold
];

export default function GameHUD({
  userPlayer,
  gpsStatus,
  gameMode,
  followPlayer,
  onToggleFollow,
  onSelectColor,
  onToggleMode,
}: GameHUDProps) {
  const [isMuted, setIsMuted] = React.useState(false);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const formattedArea = userPlayer.totalArea > 10000
    ? `${(userPlayer.totalArea / 10000).toFixed(2)} gektar`
    : `${userPlayer.totalArea.toLocaleString()} m²`;

  const formattedDistance = userPlayer.distance > 1000
    ? `${(userPlayer.distance / 1000).toFixed(2)} km`
    : `${Math.round(userPlayer.distance)} m`;

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      right: '16px',
      zIndex: 1000,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Top Header Card */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
      }}>
        {/* Main Stats: Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: userPlayer.color,
            boxShadow: `0 0 16px ${userPlayer.color}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '20px',
          }}>
            {userPlayer.avatarIcon || '🏃'}
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 600 }}>
              Egallangan Maydon
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              {formattedArea}
            </div>
          </div>
        </div>

        {/* Center Quick Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="hud-stats-group">
          {/* Speed */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <IconBolt size={14} color="#fbbf24" /> Tezlik
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>
              {userPlayer.speed.toFixed(1)} <span style={{ fontSize: '11px', color: '#64748b' }}>km/h</span>
            </div>
          </div>

          {/* Distance */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              <IconActivity size={14} color="#10b981" /> Masofa
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
              {formattedDistance}
            </div>
          </div>

          {/* Motion Status Badge (Running vs Stationary) */}
          <div style={{
            background: userPlayer.speed >= 1.8 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${userPlayer.speed >= 1.8 ? '#10b981' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '12px',
            padding: '6px 12px',
            color: userPlayer.speed >= 1.8 ? '#34d399' : '#f87171',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {userPlayer.speed >= 1.8 ? '🏃 Yugurmoqda' : '🛑 To\'xtab turibdi'}
          </div>

          {/* GPS Status Badge */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '6px 12px',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconMapPin size={16} />
            Real GPS (Aktiv)
          </div>
        </div>

        {/* Right Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Follow Map Button */}
          <button
            onClick={onToggleFollow}
            title={followPlayer ? "Xaritani qulflash (Markazlash)" : "Xaritani erkin ko'rish"}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: followPlayer ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${followPlayer ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
              color: followPlayer ? '#38bdf8' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {followPlayer ? <IconLock size={18} /> : <IconLockOpen size={18} />}
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            title="Ovozni yoqish/o'chirish"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isMuted ? '#f43f5e' : '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isMuted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
          </button>

          {/* Color Selector */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
            {PLAYER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onSelectColor(c)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: c,
                  border: userPlayer.color === c ? '2px solid #ffffff' : 'none',
                  cursor: 'pointer',
                  boxShadow: userPlayer.color === c ? `0 0 8px ${c}` : 'none',
                  transform: userPlayer.color === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
