import 'package:geolocator/geolocator.dart';

class LocationService {
  static Future<Position> getLocation() async {
    return await Geolocator.getCurrentPosition();
  }
}
