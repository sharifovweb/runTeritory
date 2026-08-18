import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vibration/vibration.dart';
import 'models/player.dart';
import 'services/geo_engine.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RunTerritoryApp());
}

class RunTerritoryApp extends StatelessWidget {
  const RunTerritoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RunTerritory GPS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090D16),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          surface: Color(0xFF0F172A),
        ),
      ),
      home: const GameScreen(),
    );
  }
}

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final MapController _mapController = MapController();
  StreamSubscription<Position>? _positionStream;

  // Defaults: Tashkent Turkiston & Sohibqiron ko'chasi [41.3325, 69.2885]
  LatLng _mapCenter = const LatLng(41.3325, 69.2885);

  late PlayerModel _userPlayer;
  bool _isRunning = true;
  bool _followPlayer = true;
  int _lastTime = DateTime.now().millisecondsSinceEpoch;
  LatLng? _lastPos;

  final List<Color> _colorOptions = const [
    Color(0xFF38BDF8),
    Color(0xFF10B981),
    Color(0xFFA855F7),
    Color(0xFFF43F5E),
    Color(0xFFFBBF24),
  ];

  @override
  void initState() {
    super.initState();
    final initialBase = GeoEngine.createInitialBase(_mapCenter);
    _userPlayer = PlayerModel(
      id: 'user-player',
      name: '',
      color: const Color(0xFF38BDF8),
      position: _mapCenter,
      activeTrail: [],
      basePolygon: [initialBase],
      totalArea: 1017.0,
    );

    _loadSavedDataAndPrompt();
    _startGpsTracking();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }

  Future<void> _loadSavedDataAndPrompt() async {
    final prefs = await SharedPreferences.getInstance();
    final savedName = prefs.getString('user_name') ?? '';
    final savedColorVal = prefs.getInt('user_color');

    setState(() {
      if (savedName.isNotEmpty) _userPlayer.name = savedName;
      if (savedColorVal != null) _userPlayer.color = Color(savedColorVal);
    });

    if (_userPlayer.name.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showNicknameDialog();
      });
    }
  }

  Future<void> _saveProfile(String name, Color color) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_name', name);
    await prefs.setInt('user_color', color.value);
    setState(() {
      _userPlayer.name = name;
      _userPlayer.color = color;
    });
  }

  void _showNicknameDialog() {
    final nameController = TextEditingController(text: _userPlayer.name);
    Color selectedColor = _userPlayer.color;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.directions_run, color: Color(0xFF38BDF8), size: 28),
              SizedBox(width: 10),
              Text('Xush Kelibsiz!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ismingiz va shaxsiy yer rangini tanlang:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
              const SizedBox(height: 14),
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Masalan: Ziyodullo, Runner_99',
                  hintStyle: const TextStyle(color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.06),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 18),
              const Text('Shaxsiy Hududingiz Rangi:', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: _colorOptions.map((c) {
                  final isSelected = selectedColor == c;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedColor = c),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: c,
                        shape: BoxShape.circle,
                        border: isSelected ? Border.all(color: Colors.white, width: 3) : null,
                        boxShadow: isSelected ? [BoxShadow(color: c.withOpacity(0.8), blurRadius: 12)] : null,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: selectedColor,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onPressed: () {
                final txt = nameController.text.trim();
                if (txt.isNotEmpty) {
                  _saveProfile(txt, selectedColor);
                  Navigator.of(ctx).pop();
                }
              },
              child: const Text('O\'yinni Boshlash', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startGpsTracking() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    // High accuracy location fix
    final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.bestForNavigation);
    _updatePosition(LatLng(pos.latitude, pos.longitude));

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: 1,
      ),
    ).listen((p) {
      if (_isRunning) {
        _updatePosition(LatLng(p.latitude, p.longitude));
      }
    });
  }

  void _updatePosition(LatLng newPos) {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (_lastPos != null) {
      final timeDeltaSec = math.max(0.1, (now - _lastTime) / 1000.0);
      final distMeters = GeoEngine.getDistanceMeters(_lastPos!, newPos);
      final currentSpeedKmH = (distMeters / timeDeltaSec) * 3.6;

      if (distMeters >= 1.5) {
        setState(() {
          _userPlayer.position = newPos;
          _userPlayer.speed = currentSpeedKmH;
          _userPlayer.distance += distMeters;
          _mapCenter = newPos;

          if (_followPlayer) {
            _mapController.move(newPos, _mapController.camera.zoom);
          }

          // Check polygon entry/exit
          final isInside = GeoEngine.isPointInPolygon(newPos, _userPlayer.basePolygon[0]);
          if (!isInside) {
            _userPlayer.isOutsideBase = true;
            _userPlayer.activeTrail.add(newPos);
          } else if (_userPlayer.isOutsideBase) {
            // Closed loop back to base!
            _claimTerritory();
          }
        });
      }
    } else {
      setState(() {
        _userPlayer.position = newPos;
        _mapCenter = newPos;
      });
    }

    _lastPos = newPos;
    _lastTime = now;
  }

  void _claimTerritory() {
    if (_userPlayer.activeTrail.length < 2) return;

    final updatedBase = GeoEngine.mergeTrailIntoBase(_userPlayer.basePolygon[0], _userPlayer.activeTrail);
    final newArea = GeoEngine.calculatePolygonArea(updatedBase);

    setState(() {
      _userPlayer.basePolygon = [updatedBase];
      _userPlayer.totalArea = newArea > 0 ? newArea : _userPlayer.totalArea;
      _userPlayer.activeTrail.clear();
      _userPlayer.isOutsideBase = false;
    });

    // Native Vibration Haptics
    Vibration.hasVibrator().then((has) {
      if (has == true) Vibration.vibrate(duration: 200);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Flutter Interactive Map Layer
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _mapCenter,
              initialZoom: 17.5,
              interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.sharifovweb.run_territory_flutter',
              ),

              // Base Territory Polygon Fill Layer
              PolygonLayer(
                polygons: [
                  Polygon(
                    points: _userPlayer.basePolygon[0],
                    color: _userPlayer.color.withOpacity(0.35),
                    borderColor: _userPlayer.color,
                    borderStrokeWidth: 3.5,
                  ),
                ],
              ),

              // Active Running Trail Layer
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _userPlayer.activeTrail,
                    color: _userPlayer.color,
                    strokeWidth: 5.0,
                  ),
                ],
              ),

              // Player Pulsing Location Marker
              MarkerLayer(
                markers: [
                  Marker(
                    point: _userPlayer.position,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: _userPlayer.color,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(color: _userPlayer.color.withOpacity(0.8), blurRadius: 16),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: const Text('🏃', style: TextStyle(fontSize: 22)),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Floating Glassmorphism HUD
          Positioned(
            top: 50,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.88),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.12)),
                boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 20)],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          GestureDetector(
                            onTap: _showNicknameDialog,
                            child: Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                color: _userPlayer.color,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [BoxShadow(color: _userPlayer.color.withOpacity(0.6), blurRadius: 10)],
                              ),
                              alignment: Alignment.center,
                              child: const Text('🏃', style: TextStyle(fontSize: 20)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _userPlayer.name.isEmpty ? 'Yuguruvchi' : _userPlayer.name,
                                style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                              Text(
                                '${_userPlayer.totalArea.toInt()} m²',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: Icon(_followPlayer ? Icons.lock : Icons.lock_open, color: const Color(0xFF38BDF8)),
                        onPressed: () => setState(() => _followPlayer = !_followPlayer),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white10, height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Text('⚡ ${_userPlayer.speed.toStringAsFixed(1)} km/h', style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold)),
                      Text('📏 ${_userPlayer.distance.round()} m', style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _userPlayer.speed >= 1.8 ? Colors.emerald.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _userPlayer.speed >= 1.8 ? '🏃 Yugurmoqda' : '🛑 To\'xtagan',
                          style: TextStyle(color: _userPlayer.speed >= 1.8 ? const Color(0xFF34D399) : const Color(0xFFF87171), fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Bottom Action Bar Controls
          Positioned(
            bottom: 34,
            left: 20,
            right: 20,
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isRunning ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                        elevation: 8,
                      ),
                      onPressed: () => setState(() => _isRunning = !_isRunning),
                      child: Text(
                        _isRunning ? '⏸ To\'xtatish' : '▶ Yugurishni Boshlash',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ),
                ),
                if (_userPlayer.isOutsideBase) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF38BDF8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
                          elevation: 8,
                        ),
                        onPressed: _claimTerritory,
                        child: const Text('✓ Hududni Biriktirish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
