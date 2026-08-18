export type Coordinate = [number, number]; // [lat, lng]

export interface Player {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
  position: Coordinate;
  activeTrail: Coordinate[];
  basePolygon: Coordinate[][]; // GeoJSON format polygon coordinates: [[[lat, lng], ...]]
  totalArea: number; // in square meters
  speed: number; // in km/h
  distance: number; // in meters
  isOutsideBase: boolean;
  avatarIcon: string;
}

export type GameMode = 'REAL_GPS' | 'SIMULATOR';

export interface GPSStatus {
  active: boolean;
  accuracy: number | null; // meters
  error: string | null;
  mode: GameMode;
}

export interface GameStats {
  userRank: number;
  totalPlayers: number;
  capturedAreaPercent: number;
}
