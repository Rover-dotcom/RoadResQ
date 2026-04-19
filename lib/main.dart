import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/firebase_options.dart';
import 'package:road_resq/provider/driver_provider.dart';
import 'package:road_resq/provider/job_provider.dart';
import 'package:road_resq/provider/login_provider.dart';
import 'package:road_resq/screens/home_screen.dart';
import 'package:road_resq/screens/login_screen/login_screen.dart';
import 'package:road_resq/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const RoadResQApp());
}

class RoadResQApp extends StatelessWidget {
  const RoadResQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Auth
        ChangeNotifierProvider(create: (_) => LoginProvider()),
        // Job state — Week 2 + 3
        ChangeNotifierProvider(create: (_) => JobProvider()),
        // Driver state — Week 3
        ChangeNotifierProvider(create: (_) => DriverProvider()),
      ],
      child: MaterialApp(
        title: 'RoadResQ',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        // Auth-state routing: show Home if already logged in, else Login
        home: const AuthGate(),
      ),
    );
  }
}

/// AuthGate listens to Firebase Auth state and routes accordingly.
/// - Logged in  → HomeScreen
/// - Logged out → LoginScreen
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        // Waiting for Firebase to respond
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // User is signed in
        if (snapshot.hasData && snapshot.data != null) {
          return const HomeScreen();
        }

        // User is not signed in
        return LoginScreen();
      },
    );
  }
}
