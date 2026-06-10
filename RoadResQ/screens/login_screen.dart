import 'package:flutter/material.dart';
import '../main.dart'; // Deep linkage to access DashboardScreen layout boundaries

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isProcessing = false;

  // Handles safe authentication loading indicators across third-party identity callbacks
  void _triggerMockAuthentication(String channelName) {
    setState(() => _isProcessing = true);
    
    // Simulates an authentication process before routing to the main dashboard
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connected via $channelName successfully!'),
          backgroundColor: const Color(0xFF013480),
          duration: const Duration(seconds: 1),
        ),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // White backdrop in the middle zone
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  
                  // Brand Logo Anchor
                  Image.asset(
                    'assets/images/logo.png',
                    height: 95,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.local_shipping, 
                      size: 85, 
                      color: Color(0xFF013480),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Welcome to the\nRoadResQ',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 32, 
                      fontWeight: FontWeight.bold, 
                      color: Colors.black,
                      height: 1.2,
                    ),
                  ),
                  
                  const SizedBox(height: 40),

                  // Core Email Button with custom color mix gradient
                  Container(
                    width: double.infinity,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF013480), Color(0xFF0282DD)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                    ),
                    child: ElevatedButton(
                      onPressed: () => _triggerMockAuthentication('Email System'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                      ),
                      child: const Text(
                        'Continue With Email', 
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Content Break Divider
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.black.withOpacity(0.1))),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text('Or', style: TextStyle(color: Colors.black38, fontSize: 14)),
                      ),
                      Expanded(child: Divider(color: Colors.black.withOpacity(0.1))),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Active Sign In With Google Feature Layer
                  OutlinedButton.icon(
                    onPressed: () => _triggerMockAuthentication('Google Platform OAuth'),
                    icon: Image.network(
                      'https://i.imgur.com/3Z6S9z0.png', 
                      height: 22,
                      errorBuilder: (_, __, ___) => const Icon(Icons.g_mobiledata, color: Colors.red),
                    ),
                    label: const Text(
                      'Sign in with Google', 
                      style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 56),
                      side: BorderSide(color: Colors.black.withOpacity(0.1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                      backgroundColor: Colors.white,
                      elevation: 0,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Active Sign In With Apple ID Feature Layer
                  ElevatedButton.icon(
                    onPressed: () => _triggerMockAuthentication('Apple Identity ID Link'),
                    icon: const Icon(Icons.apple, color: Colors.white, size: 22),
                    label: const Text(
                      'Sign in with Apple', 
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      minimumSize: const Size(double.infinity, 56),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                      elevation: 0,
                    ),
                  ),

                  const Spacer(),

                  // Bottom Route Change Option Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Have an account? ', style: TextStyle(color: Colors.black54)),
                      GestureDetector(
                        onTap: () {},
                        child: const Text(
                          'Login', 
                          style: TextStyle(color: Color(0xFF0282DD), fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
            if (_isProcessing)
              Container(
                color: Colors.white.withOpacity(0.7),
                child: const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF013480)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}