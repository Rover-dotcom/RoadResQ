import 'package:flutter/material.dart';

class SignupScreen extends StatelessWidget {
  final VoidCallback onNavigateToLogin;
  final VoidCallback onBack;
  final VoidCallback onSignupSuccess;

  const SignupScreen({
    super.key,
    required this.onNavigateToLogin,
    required this.onBack,
    required this.onSignupSuccess,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Align(
            alignment: Alignment.topCenter,
            child: Container(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: onBack,
                    icon: const Icon(Icons.arrow_back_ios, size: 16, color: Color(0xFF767C8C)),
                    label: const Text('Back', style: TextStyle(color: Color(0xFF767C8C))),
                  ),
                  const SizedBox(height: 24),

                  // Placeholder wrapper matching Frame19 form rendering layout logic
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      children: [
                        const Text('Registration Form Component', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: onSignupSuccess,
                          style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                          child: const Text('Complete Sign Up'),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Footer Transition trigger back to Authentication
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Already have an account?', style: TextStyle(color: Color(0xFF767C8C))),
                      TextButton(
                        onPressed: onNavigateToLogin,
                        child: const Text('Log In', style: TextStyle(color: Color(0xFF013480), fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}