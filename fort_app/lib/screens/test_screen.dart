import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants.dart';

class TestScreen extends StatelessWidget {
  Future<void> testBackendConnection() async {
    try {
      final response = await http.get(Uri.parse('$BASE_URL/auth/test'));
      if (response.statusCode == 200) {
        print('Backend connected successfully: ${response.body}');
      } else {
        print('Failed to connect to backend: ${response.statusCode}');
      }
    } catch (e) {
      print('Error connecting to backend: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Test Backend Connection')),
      body: Center(
        child: ElevatedButton(
          onPressed: testBackendConnection,
          child: Text('Test Backend'),
        ),
      ),
    );
  }
}
