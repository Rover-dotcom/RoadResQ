import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/firebase_options.dart';
import 'package:road_resq/provider/login_provider.dart';
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
      providers: [ChangeNotifierProvider(create: (_) => LoginProvider())],
      child: MaterialApp(
        title: 'Flutter Demo',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,

        home: LoginScreen(),
      ),
    );
  }
}
