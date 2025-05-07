import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_auth/firebase_auth.dart'; // Add Firebase Auth
import 'package:intl/intl.dart';

class EmergencyScreen extends StatefulWidget {
  final String eid;

  const EmergencyScreen({super.key, required this.eid}); // Remove userId parameter

  @override
  _EmergencyScreenState createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  final TextEditingController _messageController = TextEditingController();
  late DatabaseReference _chatRef;
  late Query _messagesQuery;
  final ScrollController _scrollController = ScrollController();
  late String _userId; // Add dynamic user ID

  @override
  void initState() {
    super.initState();
    _initializeFirebase();
    _loadUserId(); // Load user ID dynamically
  }

  Future<void> _loadUserId() async {
    final user = FirebaseAuth.instance.currentUser; // Get current user from Firebase Auth
    setState(() {
      _userId = user?.uid ?? ''; // Set user ID or empty string if not logged in
    });
  }

  void _initializeFirebase() {
    try {
      _chatRef = FirebaseDatabase.instance.ref();
      _messagesQuery = _chatRef
          .child('emergencies/${widget.eid}/chat')
          .orderByChild('timestamp');
      
      print("Firebase initialized successfully");
    } catch (e) {
      print("Firebase initialization error: $e");
    }
  }

  void _sendMessage() async {
    if (_messageController.text.isEmpty) return;

    try {
      final newMessageRef = _chatRef
          .child('emergencies/${widget.eid}/chat')
          .push();

      await newMessageRef.set({
        'sender': _userId, // Use dynamic user ID
        'message': _messageController.text.trim(),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });

      print("Message sent successfully");
      _messageController.clear();
      
      // Auto-scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    } catch (e) {
      print("Error sending message: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Emergency Chat')),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder(
              stream: _messagesQuery.onValue,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
                  return Center(child: Text('No messages yet.'));
                }

                final messages = Map<dynamic, dynamic>.from(
                    snapshot.data!.snapshot.value as Map);

                return ListView.builder(
                  controller: _scrollController,
                  reverse: false, // New messages at bottom
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final key = messages.keys.elementAt(index);
                    final message = messages[key];
                    final isMe = message['sender'] == _userId; // Compare with dynamic user ID

                    return ListTile(
                      title: Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          padding: EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isMe ? Colors.blue[100] : Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(message['message'].toString()),
                              Text(
                                DateFormat('HH:mm').format(
                                  DateTime.fromMillisecondsSinceEpoch(
                                    int.parse(message['timestamp'].toString()),
                                  ),
                                ),
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
