import 'package:flutter/material.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:intl/intl.dart';

class ChatScreen extends StatefulWidget {
  final String eid;
  final String userId;

  const ChatScreen({super.key, required this.eid, required this.userId});

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final DatabaseReference _chatRef = FirebaseDatabase.instance.ref();
  late Query _messagesQuery;

  @override
  void initState() {
    super.initState();
    _messagesQuery = _chatRef
        .child('emergencies/${widget.eid}/chat')
        .orderByChild('timestamp');
  }

  void _sendMessage() {
    if (_messageController.text.isEmpty) return;

    final newMessageRef = _chatRef
        .child('emergencies/${widget.eid}/chat')
        .push();

    newMessageRef.set({
      'sender': widget.userId,
      'message': _messageController.text,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

    _messageController.clear();
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
                if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
                  return Center(child: CircularProgressIndicator());
                }

                final messages = Map<dynamic, dynamic>.from(
                    snapshot.data!.snapshot.value as Map? ?? {});
                
                return ListView.builder(
                  reverse: true,
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final key = messages.keys.elementAt(messages.length - 1 - index);
                    final message = messages[key];
                    final isMe = message['sender'] == widget.userId;

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
                              Text(message['message']),
                              Text(
                                DateFormat('HH:mm').format(
                                  DateTime.fromMillisecondsSinceEpoch(message['timestamp'] as int),
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
