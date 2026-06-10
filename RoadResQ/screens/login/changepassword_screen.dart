import 'package:flutter/material.dart';

class ChangePasswordScreen extends StatefulWidget {
  final VoidCallback onBack;
  final VoidCallback PasswordUpdatedSuccessfully;

  const ChangePasswordScreen({
    super.key,
    required this.onBack,
    required this.PasswordUpdatedSuccessfully,
  });

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureNew = true;
  bool _obscureConfirm = true;

  bool _isButtonEnabled() {
    final newPass = _newPasswordController.text;
    final confirmPass = _confirmPasswordController.text;
    return newPass.isNotEmpty && confirmPass.isNotEmpty && (newPass == confirmPass) && newPass.length >= 6;
  }

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
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
                  const SizedBox(height: 24),

                  const Text(
                    'Create New Password',
                    style: TextStyle(fontFamily: 'Playfair Display', fontSize: 26, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "Your new password must be unique and different from previously applied configurations to maintain profile runtime integrity.",
                    style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF767C8C), height: 1.4),
                  ),
                  const SizedBox(height: 32),

                  const Text(
                    'New Password',
                    style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C)),
                  ),
                  const SizedBox(height: 12),
                  _buildSecureInputField(
                    controller: _newPasswordController,
                    hint: 'Minimum 6 alphanumeric characters',
                    obscureText: _obscureNew,
                    onToggleVisibility: () => setState(() => _obscureNew = !_obscureNew),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    'Confirm New Password',
                    style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF767C8C)),
                  ),
                  const SizedBox(height: 12),
                  _buildSecureInputField(
                    controller: _confirmPasswordController,
                    hint: 'Re-enter identical password string',
                    obscureText: _obscureConfirm,
                    onToggleVisibility: () => setState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  const SizedBox(height: 32),

                  Container(
                    width: double.infinity,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: _isButtonEnabled()
                          ? const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])
                          : null,
                      color: _isButtonEnabled() ? null : Colors.grey[300],
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: ElevatedButton(
                      onPressed: _isButtonEnabled() ? widget.PasswordUpdatedSuccessfully : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: const Text(
                        'Reset Password',
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

  Widget _buildSecureInputField({
    required TextEditingController controller,
    required String hint,
    required bool obscureText,
    required VoidCallback onToggleVisibility,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF013480)),
        suffixIcon: IconButton(
          icon: Icon(obscureText ? Icons.visibility_outlined : Icons.visibility_off_outlined),
          color: const Color(0xFF767C8C),
          onPressed: onToggleVisibility,
        ),
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
    );
  }
}