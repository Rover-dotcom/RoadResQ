import 'package:flutter/material.dart';
import 'package:road_resq/screens/login_screen/pages/forgot_password_page.dart';
import 'package:road_resq/screens/login_screen/widgets/common_widgets.dart';
import 'package:road_resq/utils/extensions.dart';

class LoginEmailPage extends StatefulWidget {
  const LoginEmailPage({super.key});

  @override
  State<LoginEmailPage> createState() => _LoginEmailPageState();
}

class _LoginEmailPageState extends State<LoginEmailPage> {
  bool _rememberMe = true;

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
              Center(child: Image.asset('assets/logo/road_resq_logo.png')),

              const SizedBox(height: 60),

              Text(
                'Welcome Back to RoadResQ',
                style: context.textTheme.titleMedium,
              ),

              const SizedBox(height: 8),

              Text(
                'Enter valid email & password to continue.',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  color: Color(0xFF767C8C),
                ),
              ),
              const SizedBox(height: 35),

              Text(
                'Email',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 10),

              _buildTextField(
                hint: 'Enter your Email',
                prefixIconPath: "assets/icons/email_icon.png",
              ),
              const SizedBox(height: 25),

              Text(
                'Password',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 10),

              _buildTextField(
                hint: 'Enter your Password',
                prefixIconPath: "assets/icons/lock_icon.png",
                isPassword: true,
              ),

              const SizedBox(height: 15),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      SizedBox(
                        height: 24,
                        width: 24,
                        child: Checkbox(
                          value: _rememberMe,
                          activeColor: const Color(0xFF263454),
                          onChanged: (value) {
                            setState(() => _rememberMe = value!);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Remember me',
                        style: context.textTheme.labelMedium?.copyWith(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ForgotPasswordPage(),
                        ),
                      );
                    },
                    child: Text(
                      'Forgot Password?',
                      style: context.textTheme.labelMedium?.copyWith(
                        color: Color(0xFF1F3A5F),
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 40),

              CommonWidgets().buildElevatedButton(
                backgroundColor: Color(0xFF1F3A5F),
                child: Text(
                  "Login",
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
                onPressed: () {},
              ),
              Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: context.textTheme.bodyMedium,
                  ),
                  GestureDetector(
                    onTap: () {},
                    child: Text(
                      "Sign Up",
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: Color(0xFFFF7A00),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Custom Text Field Builder
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
