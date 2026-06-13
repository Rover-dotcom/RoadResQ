import 'package:flutter/material.dart';

class WelcomeScreen extends StatelessWidget {
  final VoidCallback onLoginWithEmail;
  final VoidCallback onLoginWithApple;
  final VoidCallback onLoginWithGoogle;
  final VoidCallback onSignup;

  const WelcomeScreen({
    super.key,
    required this.onLoginWithEmail,
    required this.onLoginWithApple,
    required this.onLoginWithGoogle,
    required this.onSignup,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 380),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo and Slogan
                  const SizedBox(height: 32),
                  Image.asset(
  'assets/imports/RoadResQ-logo.png',
                    width: 320,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(Icons.car_crash_rounded, size: 80, color: Color(0xFF013480)),
                  ),
                  const SizedBox(height: 8),
                  Column(
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFF013480), Color(0xFF0282DD)],
                        ).createShader(bounds),
                        child: const Text(
                          'Stuck? We got you covered.',
                          style: TextStyle(
                            fontFamily: 'Playfair Display',
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontStyle: FontStyle.italic,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: 80,
                        height: 3,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF013480), Color(0xFF0282DD)],
                          ),
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Welcome Text
                  const Text(
                    'Welcome to RoadResQ',
                    style: TextStyle(
                      fontFamily: 'Playfair Display',
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Get help on the road, anytime, anywhere',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      color: Color(0xFF767C8C),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // OAuth / Email Buttons
                  _buildSocialButton(
                    label: 'Continue with Email',
                    onPressed: onLoginWithEmail,
                    iconPath: Icons.email_outlined,
                    isDark: false,
                  ),
                  const SizedBox(height: 14),
                  _buildSocialButton(
                    label: 'Continue with Google',
                    onPressed: onLoginWithGoogle,
                    iconPath: Icons.g_mobiledata_outlined,
                    isDark: false,
                  ),
                  const SizedBox(height: 14),
                  _buildSocialButton(
                    label: 'Continue with Apple',
                    onPressed: onLoginWithApple,
                    iconPath: Icons.apple,
                    isDark: true,
                  ),
                  const SizedBox(height: 32),

                  // Divider
                  Row(
                    children: [
                      Expanded(child: Divider(color: Colors.grey[300])),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text(
                          'OR',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            color: Color(0xFF767C8C),
                          ),
                        ),
                      ),
                      Expanded(child: Divider(color: Colors.grey[300])),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Create Account Button
                  Container(
                    width: double.infinity,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF013480), Color(0xFF0282DD)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: ElevatedButton(
                      onPressed: onSignup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: const Text(
                        'Create New Account',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Terms & Privacy
                  const Text(
                    'By continuing, you agree to our Terms of Service and Privacy Policy',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11,
                      color: Color(0xFF767C8C),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton({
    required String label,
    required VoidCallback onPressed,
    required IconData iconPath,
    required bool isDark,
  }) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        backgroundColor: isDark ? Colors.black : Colors.white,
        side: BorderSide(color: isDark ? Colors.black : const Color(0xFFE5E7EB), width: 2),
        minimumSize: const Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(iconPath, color: isDark ? Colors.white : const Color(0xFF013480), size: 24),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white : Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}