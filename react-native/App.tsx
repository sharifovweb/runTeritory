import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Polygon, Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as turf from '@turf/turf';

interface Coordinate {
  latitude: number;
  longitude: number;
}

const DEFAULT_REGION = {
  latitude: 41.3325,
  longitude: 69.2885,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

const COLOR_OPTIONS = ['#38bdf8', '#10b981', '#a855f7', '#f43f5e', '#fbbf24'];

export default function App() {
  // Profile & Game State
  const [nickname, setNickname] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('#38bdf8');
  const [showNameModal, setShowNameModal] = useState<boolean>(true);
  const [tempName, setTempName] = useState<string>('');

  // Location & Game Engine State
  const [currentPos, setCurrentPos] = useState<Coordinate | null>(null);
  const [basePolygon, setBasePolygon] = useState<Coordinate[]>([]);
  const [activeTrail, setActiveTrail] = useState<Coordinate[]>([]);
  const [totalArea, setTotalArea] = useState<number>(1017);
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isOutsideBase, setIsOutsideBase] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const lastPosRef = useRef<Coordinate | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const mapRef = useRef<MapView | null>(null);

  // 1. Initial Location & Permission Setup
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS Ruxsati Berilmadi', 'Xaritada yer egallash uchun GPS ruxsatini bering.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const initialCoord = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentPos(initialCoord);
      createInitialBase(initialCoord);
    })();
  }, []);

  // 2. High Accuracy Real-time Location Watcher
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          if (!isRunning) return;

          const newCoord = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          processNewPosition(newCoord);
        }
      );
    })();

    return () => {
      subscription?.remove();
    };
  }, [isRunning, basePolygon, isOutsideBase]);

  // Create initial 18m radius circle polygon around player
  const createInitialBase = (center: Coordinate) => {
    const pt = turf.point([center.longitude, center.latitude]);
    const circle = turf.circle(pt, 0.018, { units: 'kilometers', steps: 32 });
    const coords = circle.geometry.coordinates[0].map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
    setBasePolygon(coords);
  };

  // Process physical runner movement
  const processNewPosition = (newPos: Coordinate) => {
    if (!lastPosRef.current) {
      lastPosRef.current = newPos;
      return;
    }

    const now = Date.now();
    const timeDeltaSec = Math.max(0.1, (now - lastTimeRef.current) / 1000);

    const from = turf.point([lastPosRef.current.longitude, lastPosRef.current.latitude]);
    const to = turf.point([newPos.longitude, newPos.latitude]);
    const distKm = turf.distance(from, to, { units: 'kilometers' });
    const distMeters = distKm * 1000;

    const currentSpeedKmH = (distMeters / timeDeltaSec) * 3.6;
    setSpeed(currentSpeedKmH);

    // Motion threshold: must physically move > 1.5m to update trail
    if (distMeters >= 1.5) {
      setCurrentPos(newPos);
      setDistance((prev) => prev + distMeters);
      lastPosRef.current = newPos;
      lastTimeRef.current = now;

      // Check if inside base polygon
      if (basePolygon.length >= 3) {
        const polyCoords = basePolygon.map((c) => [c.longitude, c.latitude]);
        polyCoords.push(polyCoords[0]);
        const turfBase = turf.polygon([polyCoords]);
        const playerPt = turf.point([newPos.longitude, newPos.latitude]);
        const isInside = turf.booleanPointInPolygon(playerPt, turfBase);

        if (!isInside) {
          setIsOutsideBase(true);
          setActiveTrail((prev) => [...prev, newPos]);
        } else if (isOutsideBase) {
          // Closed loop back into base!
          claimTerritory([...activeTrail, newPos]);
        }
      }
    }
  };

  // Merge trail into base polygon using Turf union
  const claimTerritory = (trail: Coordinate[]) => {
    if (trail.length < 2 || basePolygon.length < 3) return;

    try {
      const baseRing = basePolygon.map((c) => [c.longitude, c.latitude]);
      baseRing.push(baseRing[0]);
      const basePoly = turf.polygon([baseRing]);

      const trailRing = trail.map((c) => [c.longitude, c.latitude]);
      trailRing.push(trailRing[0]);
      const trailPoly = turf.polygon([trailRing]);

      const union = turf.union(turf.featureCollection([basePoly, trailPoly]));

      if (union && union.geometry.type === 'Polygon') {
        const newCoords = union.geometry.coordinates[0].map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setBasePolygon(newCoords);

        const newAreaM2 = Math.round(turf.area(union));
        setTotalArea(newAreaM2);
        setActiveTrail([]);
        setIsOutsideBase(false);

        // Native Haptic Vibration
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.log('Union error:', err);
    }
  };

  const handleStartGame = () => {
    if (!tempName.trim()) {
      Alert.alert('Iltimos', 'Ismingizni kiriting!');
      return;
    }
    setNickname(tempName.trim());
    setShowNameModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Main Native Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        region={
          currentPos
            ? {
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
                latitudeDelta: 0.004,
                longitudeDelta: 0.004,
              }
            : DEFAULT_REGION
        }
        showsUserLocation
        showsMyLocationButton
      >
        {/* Base Territory Polygon */}
        {basePolygon.length >= 3 && (
          <Polygon
            coordinates={basePolygon}
            fillColor={`${userColor}50`}
            strokeColor={userColor}
            strokeWidth={3}
          />
        )}

        {/* Active Trail Polyline */}
        {activeTrail.length >= 2 && (
          <Polyline
            coordinates={activeTrail}
            strokeColor={userColor}
            strokeWidth={5}
          />
        )}

        {/* Player Marker */}
        {currentPos && (
          <Marker coordinate={currentPos} title={nickname || 'Siz'}>
            <View style={[styles.markerCircle, { backgroundColor: userColor }]}>
              <Text style={styles.markerText}>🏃</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Floating Glass HUD */}
      <View style={styles.hudCard}>
        <View style={styles.hudRow}>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: userColor }]}
            onPress={() => setShowNameModal(true)}
          >
            <Text style={styles.avatarText}>🏃</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.hudName}>{nickname || 'Yuguruvchi'}</Text>
            <Text style={styles.hudArea}>{totalArea.toLocaleString()} m²</Text>
          </View>
        </View>

        <View style={styles.hudStatsRow}>
          <Text style={styles.statText}>⚡ {speed.toFixed(1)} km/h</Text>
          <Text style={styles.statText}>📏 {Math.round(distance)} m</Text>
          <View style={[styles.badge, { backgroundColor: speed >= 1.8 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
            <Text style={{ color: speed >= 1.8 ? '#34d399' : '#f87171', fontWeight: 'bold', fontSize: 12 }}>
              {speed >= 1.8 ? '🏃 Yugurmoqda' : '🛑 To\'xtagan'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Floating Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isRunning ? '#ef4444' : '#10b981' }]}
          onPress={() => setIsRunning(!isRunning)}
        >
          <Text style={styles.btnText}>
            {isRunning ? '⏸ To\'xtatish' : '▶ Yugurishni Boshlash'}
          </Text>
        </TouchableOpacity>

        {isOutsideBase && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#38bdf8' }]}
            onPress={() => claimTerritory(activeTrail)}
          >
            <Text style={styles.btnText}>✓ Hududni Biriktirish</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nickname & Profile Setup Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: userColor }]}>
            <Text style={styles.modalTitle}>Xush Kelibsiz!</Text>
            <Text style={styles.modalSub}>Ismingiz va yer rangini tanlang:</Text>

            <TextInput
              style={styles.input}
              placeholder="Masalan: Ziyodullo, Runner_99"
              placeholderTextColor="#64748b"
              value={tempName}
              onChangeText={setTempName}
            />

            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    userColor === c && styles.selectedColor,
                  ]}
                  onPress={() => setUserColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: userColor }]}
              onPress={handleStartGame}
            >
              <Text style={styles.startBtnText}>O'yinni Boshlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerText: {
    fontSize: 18,
  },
  hudCard: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  hudName: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  hudArea: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '800',
  },
  hudStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  colorCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  startBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
