import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/provider/login_provider.dart';

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

  Future<void> _handleReset() async {
    final email = _identifierController.text.trim();
    if (email.isEmpty) return;

    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    final success = await loginProvider.sendPasswordReset(
      context: context,
      email: email,
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset link sent! Check your email.'),
          backgroundColor: Color(0xFF013480),
        ),
      );
      widget.onResetLinkSent(email);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LoginProvider>(
      builder: (context, loginProvider, _) {
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
                      // Back Navigator Button
                      TextButton.icon(
                        onPressed: widget.onBack,
                        icon: const Icon(Icons.arrow_back_ios, size: 16, color: Color(0xFF767C8C)),
                        label: const Text('Back', style: TextStyle(color: Color(0xFF767C8C), fontSize: 14)),
                      ),
                      const SizedBox(height: 24),
                      
                      // Brand Logo Asset
                      Center(
                        child: Image.asset('assets/imports/RoadResQ-logo.png', width: 320, fit: BoxFit.contain),
                      ),
                      const SizedBox(height: 32),

                      // Header Typography
                      const Text(
                        'Forgot Password?',
                        style: TextStyle(fontFamily: 'Playfair Display', fontSize: 26, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        "No worries! Enter your registered email below and we'll send you instructions to reset your password.",
                        style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF767C8C), height: 1.4),
                      ),
                      const SizedBox(height: 32),

                      // Error message
                      if (loginProvider.errorMessage != null)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, color: Colors.red.shade700, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  loginProvider.errorMessage!,
                                  style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.red.shade700),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Input Interface
                      const Text(
                        'Email Address',
                        style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C)),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _identifierController,
                        keyboardType: TextInputType.emailAddress,
                        onChanged: (val) => setState(() => _isValid = val.trim().isNotEmpty),
                        decoration: InputDecoration(
                          hintText: 'Enter your email address',
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

                      // Send Reset Link Button
                      Container(
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: (_isValid && !loginProvider.isResetLoading)
                              ? const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])
                              : null,
                          color: (_isValid && !loginProvider.isResetLoading) ? null : Colors.grey[300],
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: ElevatedButton(
                          onPressed: (_isValid && !loginProvider.isResetLoading) ? _handleReset : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                          ),
                          child: loginProvider.isResetLoading
                              ? const SizedBox(
                                  width: 22, height: 22,
                                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                                )
                              : const Text(
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
      },
    );
  }
}