import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'firebase_options.dart'; 
import 'screens/home_screen.dart';
import 'screens/emergency_screen.dart';
import 'screens/maps_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/guide_screen.dart';
import 'screens/ocr_scanner.dart';
import 'screens/auth_screen.dart';
import 'screens/route_safety_screen.dart'; 


// Initialize Firebase first, then run the app
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: firebaseOptions, // Using updated ) manual config
  );
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fort App',
      theme: ThemeData(primaryColor: Colors.blue),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          // Show auth screen if user isn't logged in
          if (snapshot.data == null) return AuthScreen();
          return MainNavigation();
        },
      ),
    );
  }
}


class MainNavigation extends StatefulWidget {
  @override
  _MainNavigationState createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  // Create simpler version of EmergencyScreen without Firebase for navigation bar
  final List<Widget> _screens = [
   HomeScreen(),
   EmergencyScreen(eid: 'emergency123'), // Passing a sample emergency ID kyuki it needs eid parameter
   MapsScreen(),
   ProfileScreen(),
  ]; 


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Fort App'),
      ),
      
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Colors.blue),
              child: Text(
                'Menu',
                style: TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
            ListTile(
              leading: Icon(Icons.home),
              title: Text('Home'),
              onTap: () {
                setState(() => _currentIndex = 0);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.warning),
              title: Text('Emergency'),
              onTap: () {
                setState(() => _currentIndex = 1);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.map),
              title: Text('Maps'),
              onTap: () {
                setState(() => _currentIndex = 2);
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.person),
              title: Text('Profile'),
              onTap: () {
                setState(() => _currentIndex = 3);
                Navigator.pop(context);
              },
            ),
            Divider(),
            ListTile(
              leading: Icon(Icons.document_scanner),
              title: Text('OCR Scanner'),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => OCRScannerScreen()),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.article),
              title: Text('Guide'),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => GuideScreen()),
                );
              },
            ),
            // Add this to your drawer ListView children
            ListTile(
             leading: Icon(Icons.directions),
             title: Text('Route Safety'),
             onTap: () {
               Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => RouteSafetyScreen()),
                );
             },
            ),

          ],
        ),
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.warning), label: 'Emergency'),
          BottomNavigationBarItem(icon: Icon(Icons.map), label: 'Maps'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
      ),
    );
  }
}
