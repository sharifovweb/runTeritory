import * as turf from '@turf/turf';
import { Coordinate } from '@/types/game';

/**
 * Converts [lat, lng] to Turf GeoJSON position [lng, lat]
 */
export function toTurfCoord(coord: Coordinate): [number, number] {
  return [coord[1], coord[0]];
}

/**
 * Converts Turf GeoJSON position [lng, lat] back to [lat, lng]
 */
export function fromTurfCoord(coord: [number, number] | number[]): Coordinate {
  return [coord[1], coord[0]];
}

/**
 * Calculates distance between two GPS points in meters
 */
export function getDistanceMeters(p1: Coordinate, p2: Coordinate): number {
  const from = turf.point(toTurfCoord(p1));
  const to = turf.point(toTurfCoord(p2));
  return turf.distance(from, to, { units: 'meters' });
}

/**
 * Calculates area of a polygon in square meters
 */
export function calculatePolygonArea(coords: Coordinate[]): number {
  if (!coords || coords.length < 3) return 0;
  try {
    // Ensure loop is closed for Turf
    const turfCoords = coords.map(toTurfCoord);
    if (
      turfCoords[0][0] !== turfCoords[turfCoords.length - 1][0] ||
      turfCoords[0][1] !== turfCoords[turfCoords.length - 1][1]
    ) {
      turfCoords.push(turfCoords[0]);
    }
    const polygon = turf.polygon([turfCoords]);
    return Math.round(turf.area(polygon));
  } catch (err) {
    console.error('Error calculating polygon area:', err);
    return 0;
  }
}

/**
 * Creates an initial circular base polygon (12 vertices, default 15m radius) around GPS center
 */
export function createInitialBase(center: Coordinate, radiusMeters: number = 15): Coordinate[] {
  const centerPoint = turf.point(toTurfCoord(center));
  const options = { steps: 16, units: 'meters' as const };
  const circle = turf.circle(centerPoint, radiusMeters, options);
  const ring = circle.geometry.coordinates[0];
  return ring.map(fromTurfCoord);
}

/**
 * Checks if a point [lat, lng] is inside a polygon [lat, lng][]
 */
export function isPointInPolygon(point: Coordinate, polygonCoords: Coordinate[]): boolean {
  if (!polygonCoords || polygonCoords.length < 3) return false;
  try {
    const pt = turf.point(toTurfCoord(point));
    const turfRing = polygonCoords.map(toTurfCoord);
    if (
      turfRing[0][0] !== turfRing[turfRing.length - 1][0] ||
      turfRing[0][1] !== turfRing[turfRing.length - 1][1]
    ) {
      turfRing.push(turfRing[0]);
    }
    const poly = turf.polygon([turfRing]);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error('Error checking point in polygon:', err);
    return false;
  }
}

/**
 * Merges a trail [lat, lng][] with an existing base polygon [lat, lng][]
 * when the trail exits and re-enters the base (Paper.io loop closure mechanism).
 */
export function mergeTrailIntoBase(
  baseCoords: Coordinate[],
  trailCoords: Coordinate[]
): { updatedBase: Coordinate[]; newlyCapturedArea: number } {
  if (!trailCoords || trailCoords.length < 2) {
    return { updatedBase: baseCoords, newlyCapturedArea: 0 };
  }

  try {
    // 1. Prepare base polygon in Turf format
    const turfBaseRing = baseCoords.map(toTurfCoord);
    if (
      turfBaseRing[0][0] !== turfBaseRing[turfBaseRing.length - 1][0] ||
      turfBaseRing[0][1] !== turfBaseRing[turfBaseRing.length - 1][1]
    ) {
      turfBaseRing.push(turfBaseRing[0]);
    }
    const basePoly = turf.polygon([turfBaseRing]);

    // 2. Prepare trail polyline + closure line back to start of trail or closest base point
    const turfTrailRing = trailCoords.map(toTurfCoord);
    
    // Ensure closed loop
    if (
      turfTrailRing[0][0] !== turfTrailRing[turfTrailRing.length - 1][0] ||
      turfTrailRing[0][1] !== turfTrailRing[turfTrailRing.length - 1][1]
    ) {
      turfTrailRing.push(turfTrailRing[0]);
    }

    // A valid GeoJSON polygon ring must have at least 4 positions
    if (turfTrailRing.length < 4) {
      return { updatedBase: baseCoords, newlyCapturedArea: 0 };
    }

    const trailPoly = turf.polygon([turfTrailRing]);

    // 3. Union base and captured trail polygon
    const unionResult = turf.union(turf.featureCollection([basePoly, trailPoly]));

    if (!unionResult) {
      return { updatedBase: baseCoords, newlyCapturedArea: 0 };
    }

    // Extract updated outer ring coordinates
    let newCoords: [number, number][] = [];
    if (unionResult.geometry.type === 'Polygon') {
      newCoords = unionResult.geometry.coordinates[0] as [number, number][];
    } else if (unionResult.geometry.type === 'MultiPolygon') {
      // If result is multipolygon, pick the largest outer polygon
      let maxArea = 0;
      let largestPoly: [number, number][] = [];
      unionResult.geometry.coordinates.forEach((polyCoords) => {
        const poly = turf.polygon(polyCoords);
        const a = turf.area(poly);
        if (a > maxArea) {
          maxArea = a;
          largestPoly = polyCoords[0] as [number, number][];
        }
      });
      newCoords = largestPoly;
    }

    const updatedBase = newCoords.map(fromTurfCoord);
    const prevArea = Math.round(turf.area(basePoly));
    const newArea = Math.round(turf.area(turf.polygon([newCoords])));
    const newlyCapturedArea = Math.max(0, newArea - prevArea);

    return { updatedBase, newlyCapturedArea };
  } catch (err) {
    console.error('Failed to merge trail into base:', err);
    return { updatedBase: baseCoords, newlyCapturedArea: 0 };
  }
}
