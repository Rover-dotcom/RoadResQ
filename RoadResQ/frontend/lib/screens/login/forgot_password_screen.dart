import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Function(String emailOrPhone) onResetLinkSent;

  const ForgotPasswordScreen({
    super.key,
    required this.onBack,
    required this.onResetLinkSent,
  });

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _identifierController = TextEditingController();
  bool _isValid = false;

  @override
  void dispose() {
    _identifierController.dispose();
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

                  const Text(
                    'Forgot Password?',
                    style: TextStyle(fontFamily: 'Playfair Display', fontSize: 26, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "No worries! Enter your registered details below and we'll send you instructions to reset your password.",
                    style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF767C8C), height: 1.4),
                  ),
                  const SizedBox(height: 32),

                  const Text(
                    'Phone/Email Address',
                    style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C)),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _identifierController,
                    keyboardType: TextInputType.emailAddress,
                    onChanged: (val) => setState(() => _isValid = val.trim().isNotEmpty),
                    decoration: InputDecoration(
                      hintText: 'Enter email or phone number',
                      prefixIcon: const Icon(Icons.mail_outline_rounded, color: Color(0xFF013480)),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF0282DD), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  Container(
                    width: double.infinity,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: _isValid 
                          ? const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])
                          : null,
                      color: _isValid ? null : Colors.grey[300],
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: ElevatedButton(
                      onPressed: _isValid 
                          ? () => widget.onResetLinkSent(_identifierController.text.trim())
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: const Text(
                        'Send Reset Link',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
                      ),
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
}