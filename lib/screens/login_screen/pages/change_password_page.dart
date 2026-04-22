import 'package:flutter/material.dart';
import 'package:road_resq/screens/login_screen/pages/login_email_page.dart';
import 'package:road_resq/screens/login_screen/pages/otp_page.dart';
import 'package:road_resq/screens/login_screen/widgets/common_widgets.dart';
import 'package:road_resq/utils/extensions.dart';

class ChangePasswordPage extends StatelessWidget {
  const ChangePasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(50),
                ),
                child: IconButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: Icon(Icons.arrow_back),
                ),
              ),
              const SizedBox(height: 15),

              Text(
                'Change your Password',
                style: context.textTheme.titleMedium,
              ),

              const SizedBox(height: 8),

              Text(
                'Your new password must be different from previous used password.',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  color: Color(0xFF767C8C),
                ),
              ),
              const SizedBox(height: 35),

              Text(
                'Enter Your New Password',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF767C8C),
                ),
              ),
              const SizedBox(height: 10),
              _buildTextField(
                hint: 'Enter your Email',
                prefixIconPath: "assets/icons/lock_icon.png",
              ),

              const SizedBox(height: 25),

              Text(
                'Confirm Password',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF767C8C),
                ),
              ),
              const SizedBox(height: 10),
              _buildTextField(
                hint: 'Enter your Email',
                prefixIconPath: "assets/icons/lock_icon.png",
              ),

              Spacer(),

              CommonWidgets().buildElevatedButton(
                backgroundColor: Color(0xFF1F3A5F),
                child: Text(
                  "Continue",
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => LoginEmailPage()),
                    (Route<dynamic> route) => false,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String hint,
    required String prefixIconPath,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: TextField(
        obscureText: isPassword,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey),
          prefixIcon: Image.asset(prefixIconPath),
          suffixIcon:
              isPassword
                  ? const Icon(Icons.visibility_outlined, color: Colors.grey)
                  : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }
}
