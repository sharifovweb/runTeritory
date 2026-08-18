'use client';

import React from 'react';
import { Player } from '@/types/game';
import { IconTrophy, IconCrown, IconFlame, IconChevronRight, IconChevronLeft } from '@tabler/icons-react';

interface LeaderboardProps {
  userPlayer: Player;
  bots: Player[];
}

export default function Leaderboard({ userPlayer, bots }: LeaderboardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const allPlayers = [userPlayer, ...bots].sort((a, b) => b.totalArea - a.totalArea);
  const userRank = allPlayers.findIndex((p) => p.id === userPlayer.id) + 1;
  const totalMapArea = allPlayers.reduce((acc, p) => acc + p.totalArea, 0);

  return (
    <div style={{
      position: 'absolute',
      top: '90px',
      right: '16px',
      zIndex: 1000,
      pointerEvents: 'auto',
    }}>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '10px 14px',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <IconTrophy size={18} />
          Reyting (#{userRank})
          <IconChevronLeft size={18} color="#94a3b8" />
        </button>
      )}

      {/* Expanded Leaderboard Drawer */}
      {isOpen && (
        <div style={{
          width: '260px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '16px',
          color: '#f8fafc',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px', color: '#fbbf24' }}>
              <IconCrown size={20} /> Top Hudud Egalari
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <IconChevronRight size={20} />
            </button>
          </div>

          {/* List of Players */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {allPlayers.map((player, idx) => {
              const isUser = player.id === userPlayer.id;
              const percent = totalMapArea > 0 ? Math.round((player.totalArea / totalMapArea) * 100) : 0;

              return (
                <div
                  key={player.id}
                  style={{
                    background: isUser ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isUser ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '12px',
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : '#64748b',
                      width: '16px',
                    }}>
                      #{idx + 1}
                    </span>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: player.color,
                      boxShadow: `0 0 8px ${player.color}`,
                    }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: isUser ? 700 : 500, color: isUser ? '#38bdf8' : '#e2e8f0' }}>
                        {player.name} {isUser ? '(Siz)' : ''}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {player.totalArea.toLocaleString()} m² ({percent}%)
                      </div>
                    </div>
                  </div>

                  {isUser && <IconFlame size={16} color="#38bdf8" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
