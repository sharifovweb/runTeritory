import 'dart:math' as math;
import 'package:latlong2/latlong.dart';

class GeoEngine {
  static const Distance _distanceCalculator = Distance();

  /// Calculates distance in meters between two LatLng coordinates
  static double getDistanceMeters(LatLng p1, LatLng p2) {
    return _distanceCalculator.as(LengthUnit.Meter, p1, p2);
  }

  /// Creates a circular polygon around a center point with radius in meters
  static List<LatLng> createInitialBase(LatLng center, {double radiusMeters = 18.0}) {
    const int points = 32;
    final List<LatLng> poly = [];
    const double earthRadius = 6371000.0; // meters

    final double latRad = center.latitude * (math.pi / 180.0);
    final double lngRad = center.longitude * (math.pi / 180.0);
    final double d = radiusMeters / earthRadius;

    for (int i = 0; i < points; i++) {
      final double bearing = (i * 360.0 / points) * (math.pi / 180.0);

      final double pLat = math.asin(
        math.sin(latRad) * math.cos(d) + math.cos(latRad) * math.sin(d) * math.cos(bearing),
      );

      final double pLng = lngRad +
          math.atan2(
            math.sin(bearing) * math.sin(d) * math.cos(latRad),
            math.cos(d) - math.sin(latRad) * math.sin(pLat),
          );

      poly.add(LatLng(pLat * (180.0 / math.pi), pLng * (180.0 / math.pi)));
    }

    if (poly.isNotEmpty && poly.first != poly.last) {
      poly.add(poly.first);
    }
    return poly;
  }

  /// Checks if a point is inside a polygon using Ray Casting algorithm
  static bool isPointInPolygon(LatLng point, List<LatLng> polygon) {
    if (polygon.length < 3) return false;
    bool inside = false;
    int j = polygon.length - 1;

    for (int i = 0; i < polygon.length; i++) {
      final xi = polygon[i].latitude;
      final yi = polygon[i].longitude;
      final xj = polygon[j].latitude;
      final yj = polygon[j].longitude;

      final bool intersect = ((yi > point.longitude) != (yj > point.longitude)) &&
          (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
      j = i;
    }
    return inside;
  }

  /// Estimates area of a polygon in square meters
  static double calculatePolygonArea(List<LatLng> polygon) {
    if (polygon.length < 3) return 0.0;
    double area = 0.0;
    const double radius = 6378137.0; // Earth radius in meters

    for (int i = 0; i < polygon.length; i++) {
      final p1 = polygon[i];
      final p2 = polygon[(i + 1) % polygon.length];

      final double radLat1 = p1.latitude * math.pi / 180.0;
      final double radLat2 = p2.latitude * math.pi / 180.0;
      final double radLng1 = p1.longitude * math.pi / 180.0;
      final double radLng2 = p2.longitude * math.pi / 180.0;

      area += (radLng2 - radLng1) * (2 + math.sin(radLat1) + math.sin(radLat2));
    }

    area = (area * radius * radius / 2.0).abs();
    return area;
  }

  /// Merges active trail with base polygon upon loop closure
  static List<LatLng> mergeTrailIntoBase(List<LatLng> basePoly, List<LatLng> trail) {
    if (trail.length < 2) return basePoly;

    final List<LatLng> merged = List<LatLng>.from(basePoly);
    if (merged.isNotEmpty && merged.first == merged.last) {
      merged.removeLast();
    }

    merged.addAll(trail);
    if (merged.isNotEmpty && merged.first != merged.last) {
      merged.add(merged.first);
    }
    return merged;
  }
}
