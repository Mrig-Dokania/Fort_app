import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../constants.dart';
import 'dart:convert'; // For jsonEncode/jsonDecode
import 'package:firebase_auth/firebase_auth.dart'; // Import Firebase Auth

class ContactsScreen extends StatefulWidget {
  const ContactsScreen({super.key}); // Remove userId parameter

  @override
  _ContactsScreenState createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  final TextEditingController _contactController = TextEditingController();
  List<String> _contacts = [];
  late String _userId; // Dynamic user ID
  late String _jwtToken; // JWT token

  @override
  void initState() {
    super.initState();
    _initializeUserData().then((_) => _fetchContacts());
  }

  Future<void> _initializeUserData() async {
   final user = FirebaseAuth.instance.currentUser;
   if (user == null) return;

   setState(() {
    _userId = user.uid; // Get user ID
   });

   
    _jwtToken = await user.getIdToken() ?? ''; // Get JWT token properly
   
  }


  Future<void> _fetchContacts() async {
    try {
      final response = await http.get(
        Uri.parse('$BASE_URL/contacts'),
        headers: {'Authorization': 'Bearer $_jwtToken'}, // Add JWT token
      );
      if (response.statusCode == 200) {
        setState(() {
          _contacts = List<String>.from(jsonDecode(response.body));
        });
      }
    } catch (e) {
      print("Error fetching contacts: $e");
    }
  }

  Future<void> _addContact() async {
    if (_contactController.text.isEmpty) return;
    try {
      final response = await http.post(
        Uri.parse('$BASE_URL/contacts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_jwtToken', // Add JWT token
        },
        body: jsonEncode({
          'userId': _userId, // Use dynamic user ID
          'contact': _contactController.text,
        }),
      );
      if (response.statusCode == 200) {
        _contactController.clear();
        _fetchContacts(); // Refresh list
      }
    } catch (e) {
      print("Error adding contact: $e");
    }
  }

  Future<void> _removeContact(String contact) async {
    try {
      final response = await http.delete(
        Uri.parse('$BASE_URL/contacts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_jwtToken', // Add JWT token
        },
        body: jsonEncode({
          'userId': _userId, // Use dynamic user ID
          'contact': contact,
        }),
      );
      if (response.statusCode == 200) {
        _fetchContacts(); // Refresh list
      }
    } catch (e) {
      print("Error removing contact: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Trusted Contacts')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _contactController,
                    decoration:
                        InputDecoration(labelText: 'Add Contact (Email/Phone)'),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.add),
                  onPressed: _addContact,
                ),
              ],
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _contacts.length,
                itemBuilder: (context, index) => ListTile(
                  title: Text(_contacts[index]),
                  trailing: IconButton(
                    icon: Icon(Icons.delete),
                    onPressed: () => _removeContact(_contacts[index]),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
