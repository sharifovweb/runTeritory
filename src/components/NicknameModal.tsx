'use client';

import React, { useState } from 'react';
import { IconUser, IconCheck, IconPalette } from '@tabler/icons-react';

interface NicknameModalProps {
  isOpen: boolean;
  initialName?: string;
  initialColor?: string;
  onSubmit: (name: string, color: string) => void;
}

const COLOR_OPTIONS = [
  { name: 'Neon Ko\'k', hex: '#38bdf8' },
  { name: 'Zumrad Yashil', hex: '#10b981' },
  { name: 'Binar Siyohrang', hex: '#a855f7' },
  { name: 'Olovrang Crimson', hex: '#f43f5e' },
  { name: 'Oltin Olov', hex: '#fbbf24' },
];

export default function NicknameModal({
  isOpen,
  initialName = '',
  initialColor = '#38bdf8',
  onSubmit,
}: NicknameModalProps) {
  const [nameInput, setNameInput] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setErrorMsg('Iltimos, ismingiz yoki nik-namengizni kiriting!');
      return;
    }
    onSubmit(trimmed, selectedColor);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(15, 23, 42, 0.96)',
        border: `1px solid ${selectedColor}60`,
        borderRadius: '24px',
        padding: '24px',
        color: '#f8fafc',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px ${selectedColor}30`,
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            background: `${selectedColor}20`,
            border: `1px solid ${selectedColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selectedColor,
          }}>
            <IconUser size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              Xush Kelibsiz!
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Ismingiz va shaxsiy yer rangini tanlang
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Nickname Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nik-name / Ismingiz:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Masalan: Ziyodullo, Runner_99"
              maxLength={20}
              autoFocus
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errorMsg ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '14px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
            {errorMsg && <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 500 }}>{errorMsg}</span>}
          </div>

          {/* Color Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconPalette size={16} color={selectedColor} /> Shaxsiy Hududingiz Rangi:
            </label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              {COLOR_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.hex}
                  onClick={() => setSelectedColor(opt.hex)}
                  title={opt.name}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: opt.hex,
                    border: selectedColor === opt.hex ? '3px solid #ffffff' : 'none',
                    cursor: 'pointer',
                    boxShadow: selectedColor === opt.hex ? `0 0 16px ${opt.hex}` : 'none',
                    transform: selectedColor === opt.hex ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              marginTop: '6px',
              width: '100%',
              background: `linear-gradient(135deg, ${selectedColor} 0%, #0284c7 100%)`,
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: `0 8px 24px ${selectedColor}50`,
              transition: 'all 0.15s ease',
            }}
          >
            <IconCheck size={20} />
            O'yinni Boshlash
          </button>
        </form>
      </div>
    </div>
  );
}
