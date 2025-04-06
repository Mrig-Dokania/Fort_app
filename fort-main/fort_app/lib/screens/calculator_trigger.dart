import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants.dart';

class CalculatorTrigger extends StatefulWidget {
  @override
  _CalculatorTriggerState createState() => _CalculatorTriggerState();
}

class _CalculatorTriggerState extends State<CalculatorTrigger> {
  String _display = '';
  final String _fakePasskey = '1234'; // Replace with user-defined fake passkey

  void _onButtonPressed(String value) {
    setState(() {
      _display += value;
    });

    // Check if the fake passkey matches
    if (_display == _fakePasskey) {
      _triggerEmergency();
    }
  }

  Future<void> _triggerEmergency() async {
    try {
      final response = await http.post(Uri.parse('$BASE_URL/emergency/trigger'), body: {
        'latitude': '19.0751', // Replace with actual location data later
        'longitude': '72.8785',
      });

      if (response.statusCode == 201) {
        print('Emergency triggered successfully!');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Emergency triggered successfully!')),
        );
      } else {
        print('Failed to trigger emergency: ${response.body}');
      }
    } catch (e) {
      print('Error triggering emergency: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Calculator Trigger')),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            _display,
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          GridView.builder(
            shrinkWrap: true,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3),
            itemCount: 12,
            itemBuilder: (context, index) {
              String buttonText;
              if (index < 9) buttonText = '${index + 1}';
              else if (index == 9) buttonText = 'C';
              else if (index == 10) buttonText = '0';
              else buttonText = '<';

              return GestureDetector(
                onTap: () {
                  if (buttonText == 'C') {
                    setState(() => _display = '');
                  } else if (buttonText == '<') {
                    setState(() => _display = _display.isNotEmpty ? _display.substring(0, _display.length - 1) : '');
                  } else {
                    _onButtonPressed(buttonText);
                  }
                },
                child: Container(
                  margin: EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      buttonText,
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
