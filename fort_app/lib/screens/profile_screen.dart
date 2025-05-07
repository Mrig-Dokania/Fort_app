import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants.dart';
import 'dart:convert'; // For jsonEncode/jsonDecode
import 'contacts_screen.dart'; // Importing contacts screen
import 'package:firebase_auth/firebase_auth.dart'; // Add Firebase Auth

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key}); // Remove userId parameter

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _realPasskeyController = TextEditingController();
  final TextEditingController _fakePasskeyController = TextEditingController();

  late String _userId; // Add dynamic user ID

  @override
  void initState() {
    super.initState();
    _loadUserId().then((_) => _fetchProfile());
  }

  Future<void> _loadUserId() async {
    final user = FirebaseAuth.instance.currentUser; // Get current user from Firebase Auth
    setState(() {
      _userId = user?.uid ?? ''; // Set user ID or empty string if not logged in
    });
  }

  Future<void> _fetchProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      final token = await user.getIdToken();
      final response = await http.get(
        Uri.parse('$BASE_URL/auth/profile'), 
        headers: {'Authorization': 'Bearer $token'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          _nameController.text = data['name'];
          _ageController.text = data['age'].toString();
          _heightController.text = data['height'].toString();
          _realPasskeyController.text = data['passkeys']['real'];
          _fakePasskeyController.text = data['passkeys']['fake'];
        });
      }
    } catch (e) {
      print("Error fetching profile: $e");
    }
  }

  Future<void> _saveProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final token = await user.getIdToken();
      final response = await http.post(
        Uri.parse('$BASE_URL/auth/profile'),
        headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer $token',
       },
        body: jsonEncode({
          'userId': _userId, // Use dynamic user ID
          'name': _nameController.text,
          'age': int.parse(_ageController.text),
          'height': double.parse(_heightController.text),
          'passkeys': {
            'real': _realPasskeyController.text,
            'fake': _fakePasskeyController.text,
          }
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Profile saved!')),
        );
      }
    } catch (e) {
      print("Error saving profile: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: 'Name'),
            ),
            TextField(
              controller: _ageController,
              decoration: InputDecoration(labelText: 'Age'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: _heightController,
              decoration: InputDecoration(labelText: 'Height (cm)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              controller: _realPasskeyController,
              decoration: InputDecoration(labelText: 'Real Passkey'),
              obscureText: true,
            ),
            TextField(
              controller: _fakePasskeyController,
              decoration: InputDecoration(labelText: 'Fake Passkey'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saveProfile,
              child: Text('Save Profile'),
            ),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ContactsScreen()),
              ),
              child: Text('Manage Trusted Contacts →'),
            ),
          ],
        ),
      ),
    );
  }
}
