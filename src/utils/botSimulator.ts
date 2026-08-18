import { Player, Coordinate } from '@/types/game';
import { createInitialBase, mergeTrailIntoBase, getDistanceMeters } from './turfEngine';

export interface BotState extends Player {
  angle: number; // current heading angle in radians
  state: 'INSIDE' | 'EXCURSION'; // inside base or running outside to capture area
  excursionSteps: number;
  maxExcursionSteps: number;
}

const BOT_NAMES = ['CyberRunner_UZ', 'PaperKing_99', 'NeonVolt', 'TurboSpeed_Tash'];
const BOT_COLORS = ['#38bdf8', '#a855f7', '#f43f5e', '#fbbf24'];

/**
 * Spawns initial AI bots around user starting position
 */
export function createInitialBots(userPos: Coordinate, count: number = 3): BotState[] {
  const bots: BotState[] = [];
  const radiusOffset = 0.0008; // ~80 meters around user

  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count + Math.random() * 0.5;
    const botLat = userPos[0] + Math.sin(angle) * radiusOffset;
    const botLng = userPos[1] + Math.cos(angle) * radiusOffset;
    const pos: Coordinate = [botLat, botLng];
    const base = createInitialBase(pos, 12);

    bots.push({
      id: `bot-${i + 1}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      color: BOT_COLORS[i % BOT_COLORS.length],
      isBot: true,
      position: pos,
      activeTrail: [],
      basePolygon: [base],
      totalArea: 450,
      speed: 8 + Math.floor(Math.random() * 5),
      distance: Math.floor(Math.random() * 500),
      isOutsideBase: false,
      avatarIcon: ['🏃', '⚡', '🚀', '🔥'][i % 4],
      angle: Math.random() * 2 * Math.PI,
      state: 'INSIDE',
      excursionSteps: 0,
      maxExcursionSteps: 15 + Math.floor(Math.random() * 15),
    });
  }

  return bots;
}

/**
 * Updates position and territory capture logic for one tick of AI bot simulation
 */
export function tickBot(bot: BotState): BotState {
  const stepSize = 0.00003; // ~3 meters per tick
  const updatedBot = { ...bot };

  // Randomly adjust angle slightly
  updatedBot.angle += (Math.random() - 0.5) * 0.4;

  const nextLat = updatedBot.position[0] + Math.sin(updatedBot.angle) * stepSize;
  const nextLng = updatedBot.position[1] + Math.cos(updatedBot.angle) * stepSize;
  const nextPos: Coordinate = [nextLat, nextLng];

  // Update distance
  const movedMeters = getDistanceMeters(updatedBot.position, nextPos);
  updatedBot.distance += movedMeters;
  updatedBot.position = nextPos;

  if (updatedBot.state === 'INSIDE') {
    updatedBot.excursionSteps++;
    if (updatedBot.excursionSteps > 5) {
      // Start excursion outside base
      updatedBot.state = 'EXCURSION';
      updatedBot.excursionSteps = 0;
      updatedBot.activeTrail = [nextPos];
      updatedBot.isOutsideBase = true;
    }
  } else {
    // Excursion mode: record trail
    updatedBot.activeTrail = [...updatedBot.activeTrail, nextPos];
    updatedBot.excursionSteps++;

    // Turn back towards initial base when reaching max excursion
    if (updatedBot.excursionSteps >= updatedBot.maxExcursionSteps) {
      const baseCenter = updatedBot.basePolygon[0][0];
      const dx = baseCenter[1] - nextPos[1];
      const dy = baseCenter[0] - nextPos[0];
      updatedBot.angle = Math.atan2(dy, dx);
    }

    // Check if returned near base to claim area
    const startPoint = updatedBot.activeTrail[0];
    const distToStart = getDistanceMeters(nextPos, startPoint);

    if (updatedBot.excursionSteps > 8 && (distToStart < 15 || updatedBot.excursionSteps > updatedBot.maxExcursionSteps + 10)) {
      // Claim area!
      const { updatedBase, newlyCapturedArea } = mergeTrailIntoBase(
        updatedBot.basePolygon[0],
        updatedBot.activeTrail
      );

      updatedBot.basePolygon = [updatedBase];
      updatedBot.totalArea += newlyCapturedArea;
      updatedBot.activeTrail = [];
      updatedBot.state = 'INSIDE';
      updatedBot.isOutsideBase = false;
      updatedBot.excursionSteps = 0;
      updatedBot.maxExcursionSteps = 12 + Math.floor(Math.random() * 20);
    }
  }

  return updatedBot;
}
