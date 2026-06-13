import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class VerificationCodeScreen extends StatefulWidget {
  final String email;
  final VoidCallback onVerify;
  final VoidCallback onBack;
  final VoidCallback onResend;

  const VerificationCodeScreen({
    super.key,
    required this.email,
    required this.onVerify,
    required this.onBack,
    required this.onResend,
  });

  @override
  State<VerificationCodeScreen> createState() => _VerificationCodeScreenState();
}

class _VerificationCodeScreenState extends State<VerificationCodeScreen> {
  final int _otpLength = 6;
  late List<TextEditingController> _controllers;
  late List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_otpLength, (index) => TextEditingController());
    _focusNodes = List.generate(_otpLength, (index) => FocusNode());
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  bool _isOtpComplete() {
    return _controllers.every((controller) => controller.text.isNotEmpty);
  }

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
                  // Back Button Layout
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: widget.onBack,
                      icon: const Icon(Icons.arrow_back_ios, size: 16, color: Color(0xFF767C8C)),
                      label: const Text('Back', style: TextStyle(color: Color(0xFF767C8C), fontSize: 14)),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Brand Header Asset
                  Image.asset('assets/imports/RoadResQ-logo.png', width: 320, fit: BoxFit.contain),
                  const SizedBox(height: 8),
                  
                  const Text(
                    'Verification Code',
                    style: TextStyle(fontFamily: 'Playfair Display', fontSize: 28, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    "We've sent a verification code to",
                    style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: Color(0xFF767C8C)),
                  ),
                  Text(
                    widget.email,
                    style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black),
                  ),
                  const SizedBox(height: 32),

                  // 6-Box OTP Array Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(_otpLength, (index) => _buildOtpBox(index)),
                  ),
                  const SizedBox(height: 32),

                  // Call to Resend Logic Action
                  const Text("Didn't receive the code?", style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: Color(0xFF767C8C))),
                  TextButton(
                    onPressed: widget.onResend,
                    child: const Text(
                      'Resend Code',
                      style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF013480)),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Main Activation Processing Handler
                  Container(
                    width: double.infinity,
                    height: 52,
                    decoration: BoxDecoration(
                      gradient: _isOtpComplete()
                          ? const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])
                          : null,
                      color: _isOtpComplete() ? null : Colors.grey[300],
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: ElevatedButton(
                      onPressed: _isOtpComplete() ? widget.onVerify : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                      ),
                      child: const Text('Verify Code', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500)),
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

  Widget _buildOtpBox(int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 48,
      height: 56,
      decoration: BoxDecoration(
  color: Colors.white,
  borderRadius: BorderRadius.circular(12),
  border: Border.all(
    color: _focusNodes[index].hasFocus ? const Color(0xFF0282DD) : Colors.grey[300]!,
    width: 2,
  ),
),
      child: TextField(
        controller: _controllers[index],
        focusNode: _focusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
        decoration: const InputDecoration(counterText: "", border: InputBorder.none),
        onChanged: (value) {
          if (value.isNotEmpty && index < _otpLength - 1) {
            _focusNodes[index + 1].requestFocus();
          }
          if (value.isEmpty && index > 0) {
            _focusNodes[index - 1].requestFocus();
          }
          setState(() {}); // Updates the validation state of the primary interaction CTA button
        },
      ),
    );
  }
}