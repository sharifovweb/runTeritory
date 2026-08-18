'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Player, Coordinate } from '@/types/game';

interface GameMapProps {
  userPlayer: Player;
  bots: Player[];
  mapCenter: Coordinate;
  followPlayer: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

// Helper component to smoothly center map on user when followPlayer is active
function MapRecenter({ center, follow }: { center: Coordinate; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (follow && center) {
      map.setView(center, map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [center, follow, map]);
  return null;
}

// Custom Leaflet pulse marker for player
function createCustomMarkerIcon(color: string, iconText: string, isUser: boolean = false) {
  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: ${color};
        opacity: 0.35;
        animation: pulse-ring 2s infinite ease-out;
      "></div>
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #0f172a;
        box-shadow: 0 0 15px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #fff;
      ">
        ${iconText}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-map-icon',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

export default function GameMap({ userPlayer, bots, mapCenter, followPlayer, onMapClick }: GameMapProps) {
  const allPlayers = [userPlayer, ...bots];

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={17}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapRecenter center={mapCenter} follow={followPlayer} />

        {/* Standard High-Detail OpenStreetMap Layer (Matching User Screenshot) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Render Base Polygons for User and Bots */}
        {allPlayers.map((player) =>
          player.basePolygon.map((polyCoords, polyIdx) => (
            <Polygon
              key={`base-${player.id}-${polyIdx}`}
              positions={polyCoords}
              pathOptions={{
                color: player.color,
                fillColor: player.color,
                fillOpacity: player.id === userPlayer.id ? 0.35 : 0.25,
                weight: player.id === userPlayer.id ? 4 : 2,
                dashArray: player.id === userPlayer.id ? undefined : '4, 4',
              }}
            />
          ))
        )}

        {/* Render Active Trails */}
        {allPlayers.map((player) => {
          if (!player.activeTrail || player.activeTrail.length < 2) return null;
          return (
            <Polyline
              key={`trail-${player.id}`}
              positions={player.activeTrail}
              pathOptions={{
                color: player.color,
                weight: player.id === userPlayer.id ? 6 : 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          );
        })}

        {/* Render Player & Bot Markers */}
        {allPlayers.map((player) => (
          <Marker
            key={`marker-${player.id}`}
            position={player.position}
            icon={createCustomMarkerIcon(
              player.color,
              player.avatarIcon || (player.id === userPlayer.id ? '🏃' : '🤖'),
              player.id === userPlayer.id
            )}
            eventHandlers={{
              click: () => {
                if (onMapClick) onMapClick(player.position[0], player.position[1]);
              },
            }}
          >
            <Popup className="cyber-popup">
              <div style={{ padding: '4px', textAlign: 'center' }}>
                <strong style={{ color: player.color }}>{player.name}</strong>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>
                  Hudud: <b>{player.totalArea.toLocaleString()} m²</b>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Tezlik: {player.speed.toFixed(1)} km/h
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
