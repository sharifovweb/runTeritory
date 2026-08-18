import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

class PlayerModel {
  final String id;
  String name;
  Color color;
  LatLng position;
  List<LatLng> activeTrail;
  List<List<LatLng>> basePolygon;
  double totalArea;
  double speed;
  double distance;
  bool isOutsideBase;
  String avatarIcon;

  PlayerModel({
    required this.id,
    required this.name,
    required this.color,
    required this.position,
    required this.activeTrail,
    required this.basePolygon,
    required this.totalArea,
    this.speed = 0.0,
    this.distance = 0.0,
    this.isOutsideBase = false,
    this.avatarIcon = '🏃',
  });
}
