import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert'; // For JSON encoding/decoding
import '../constants.dart';
import 'package:firebase_auth/firebase_auth.dart';


class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _calculatorDisplay = '';
  final String _fakePasskey = '1234'; // Replace with user-defined fake passkey

  Future<void> _triggerEmergency() async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return;

   try {
    final token = await user.getIdToken(); // Get JWT token
    final payload = {
      'latitude': 19.0751,
      'longitude': 72.8785,
      'uid': user.uid, // Use real user ID
    };

    final response = await http.post(
      Uri.parse('$BASE_URL/emergency/trigger'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token', // Added token step 7
      },

      body: jsonEncode(payload),
    );

    // Handle response
    if (response.statusCode == 201) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Emergency triggered successfully! 🚨'),
          backgroundColor: Colors.green,
        )
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed: ${response.body}'),
          backgroundColor: Colors.red,
        )
      );
    }
    
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Connection error! Check backend'),
        backgroundColor: Colors.orange,
      )
    );
  }
}



  void _onCalculatorButtonPressed(String value) {
    setState(() {
      _calculatorDisplay += value;
    });

    if (_calculatorDisplay == _fakePasskey) {
      _triggerEmergency();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Enter Fake Passkey (Default is $_fakePasskey)',
            style: TextStyle(fontSize: 16),
          ),
          SizedBox(height: 10),
          Text(
            _calculatorDisplay,
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: GridView.builder(
              gridDelegate:
                  SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3),
              itemCount: 12,
              itemBuilder: (context, index) {
                String buttonText;
                if (index < 9)
                  buttonText = '${index + 1}';
                else if (index == 9)
                  buttonText = 'C';
                else if (index == 10)
                  buttonText = '0';
                else
                  buttonText = '<';

                return GestureDetector(
                  onTap: () {
                    if (buttonText == 'C') {
                      setState(() => _calculatorDisplay = '');
                    } else if (buttonText == '<') {
                      setState(() => _calculatorDisplay =
                          _calculatorDisplay.isNotEmpty
                              ? _calculatorDisplay.substring(0, _calculatorDisplay.length - 1)
                              : '');
                    } else {
                      _onCalculatorButtonPressed(buttonText);
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
                        style:
                            TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () async => await _triggerEmergency(),
            child: Text('Trigger Emergency'),
          ),
          SizedBox(height: 20),
          Text('Press Volume Keys to Trigger Emergency'),
        ],
      ),
    );
  }
}
