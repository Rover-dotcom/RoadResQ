import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onNavigateToSignup;
  final VoidCallback onBack;
  final VoidCallback onForgotPassword;
  final VoidCallback onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.onNavigateToSignup,
    required this.onBack,
    required this.onForgotPassword,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _obscurePassword = true;
  final _authController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _authController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

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
                    onPressed: widget.onBack,
                    icon: const Icon(Icons.arrow_back_ios, size: 16, color: Color(0xFF767C8C)),
                    label: const Text('Back', style: TextStyle(color: Color(0xFF767C8C), fontSize: 14)),
                  ),
                  const SizedBox(height: 24),
                  
                  Center(
                    child: Image.asset(
                      'assets/imports/RoadResQ-logo.png', 
                      width: 320, 
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 32),

                  const Text('Welcome Back', style: TextStyle(fontFamily: 'Playfair Display', fontSize: 26, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  const Text('Login to continue to RoadResQ', style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF767C8C))),
                  const SizedBox(height: 24),

                  const Text('Phone/Email', style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C))),
                  const SizedBox(height: 12),
                  _buildInputField(controller: _authController, hint: 'Enter your phone or email', prefixIcon: Icons.email_outlined),
                  
                  const SizedBox(height: 16),
                  const Text('Password', style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C))),
                  const SizedBox(height: 12),
                  _buildInputField(
                    controller: _passwordController,
                    hint: 'Enter your password',
                    prefixIcon: Icons.lock_outline,
                    obscureText: _obscurePassword,
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),

                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: widget.onForgotPassword,
                      child: const Text('Forgot Password?', style: TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF013480))),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Container(
                    width: double.infinity,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: ElevatedButton(
                      onPressed: widget.onLoginSuccess,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                      child: const Text('Log In', style: TextStyle(color: Colors.white, fontSize: 15)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account?", style: TextStyle(color: Color(0xFF767C8C))),
                      TextButton(
                        onPressed: widget.onNavigateToSignup,
                        child: const Text('Sign Up', style: TextStyle(color: Color(0xFF013480), fontWeight: FontWeight.bold)),
                      )
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hint,
    required IconData prefixIcon,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(prefixIcon, color: const Color(0xFF013480)),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF0282DD), width: 2)),
      ),
    );
  }
}