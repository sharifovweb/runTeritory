'use client';

import React from 'react';
import { MapPin, ShieldCheck, X, Check } from 'lucide-react';

interface GPSPermissionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GPSPermissionModal({
  isOpen,
  onConfirm,
  onCancel,
}: GPSPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      backgroundColor: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        padding: '24px',
        color: '#f8fafc',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
      }}>
        {/* Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
          }}>
            <MapPin size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              GPS Geolokatsiyaga Ulanaymi?
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <ShieldCheck size={14} color="#10b981" /> Maxfiylik va Aniq Kuzatuv
            </span>
          </div>
        </div>

        {/* Description Body */}
        <div style={{
          fontSize: '14px',
          color: '#cbd5e1',
          lineHeight: '1.5',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '16px',
          padding: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          O'yinda yugurganda yoki yuraganda real-vaqt rejimida o'zingizning haqiqiy joylashuvingiz orqali xaritada <b>Paper.io 2</b> uslubida yer egallashingiz uchun qurilmangiz GPS signaliga ulanishga ruxsat so'ralmoqda.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '12px 16px',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
            Bekor qilish
          </button>

          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={18} />
            Ha, ulanish
          </button>
        </div>
      </div>
    </div>
  );
}
