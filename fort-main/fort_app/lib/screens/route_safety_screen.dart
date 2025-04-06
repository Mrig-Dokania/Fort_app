import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:dio/dio.dart';
import 'package:flutter_polyline_points_plus/flutter_polyline_points_plus.dart';
import '../constants.dart';

class RouteSafetyScreen extends StatefulWidget {
  @override
  _RouteSafetyScreenState createState() => _RouteSafetyScreenState();
}

class _RouteSafetyScreenState extends State<RouteSafetyScreen> {
  final TextEditingController _originController = TextEditingController();
  final TextEditingController _destinationController = TextEditingController();
  GoogleMapController? _mapController;
  Set<Polyline> _polylines = {};
  LatLng _initialPosition = LatLng(19.0751, 72.8777);
  final PolylinePoints _polylinePoints = PolylinePoints();
  bool _isLoading = false;

  Future<void> fetchRoute() async {
    if (_originController.text.isEmpty || _destinationController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter origin and destination')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final dio = Dio();
      final response = await dio.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
            'X-Goog-Api-Key': 'AIzaSyCGd7EqcASxhtn_I35PwZFMFo74eCe2Hcs', // API KEY BHAI
          },
        ),
        data: {
          "origin": {"address": _originController.text},
          "destination": {"address": _destinationController.text},
          "travelMode": "DRIVE",
          "routingPreference": "TRAFFIC_AWARE",
        },
      );

      if (response.statusCode == 200) {
        final encodedPolyline = response.data['routes'][0]['polyline']['encodedPolyline'];
        final points = _polylinePoints.decodePolyline(encodedPolyline);

        setState(() {
          _polylines = {
            Polyline(
              polylineId: PolylineId('main_route'),
              points: points.map((p) => LatLng(p.latitude, p.longitude)).toList(),
              color: Colors.blue,
              width: 5,
            )
          };
        });

        _zoomToRoute(points);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _zoomToRoute(List<PointLatLng> points) {
    final bounds = _calculateBounds(points);
    _mapController?.animateCamera(CameraUpdate.newLatLngBounds(bounds, 50));
  }

  LatLngBounds _calculateBounds(List<PointLatLng> points) {
    double? minLat, maxLat, minLng, maxLng;
    for (final point in points) {
      minLat = (minLat == null || point.latitude < minLat) ? point.latitude : minLat;
      maxLat = (maxLat == null || point.latitude > maxLat) ? point.latitude : maxLat;
      minLng = (minLng == null || point.longitude < minLng) ? point.longitude : minLng;
      maxLng = (maxLng == null || point.longitude > maxLng) ? point.longitude : maxLng;
    }
    return LatLngBounds(
      southwest: LatLng(minLat!, minLng!),
      northeast: LatLng(maxLat!, maxLng!),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Route Safety')),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _originController,
                  decoration: InputDecoration(
                    labelText: 'Origin',
                    hintText: 'Enter starting location',
                  ),
                ),
                TextField(
                  controller: _destinationController,
                  decoration: InputDecoration(
                    labelText: 'Destination',
                    hintText: 'Enter destination',
                  ),
                ),
                SizedBox(height: 16),
                ElevatedButton.icon(
                  icon: _isLoading 
                    ? SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Icon(Icons.directions),
                  label: Text('Find Safest Route'),
                  onPressed: _isLoading ? null : fetchRoute,
                ),
              ],
            ),
          ),
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: _initialPosition,
                zoom: 12,
              ),
              polylines: _polylines,
              onMapCreated: (controller) => _mapController = controller,
            ),
          ),
        ],
      ),
    );
  }
}
