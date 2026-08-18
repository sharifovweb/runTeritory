'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Player, Coordinate } from '@/types/game';

interface GameMapProps {
  userPlayer: Player;
  bots: Player[];
  mapCenter: Coordinate;
  followPlayer: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapComponent = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#090d16',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#38bdf8',
      gap: '12px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div className="spinner" style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(56, 189, 248, 0.2)',
        borderTop: '4px solid #38bdf8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>GPS Xaritasi Yuklanmoqda...</span>
    </div>
  ),
});

export default function DynamicMap(props: GameMapProps) {
  return <MapComponent {...props} />;
}
