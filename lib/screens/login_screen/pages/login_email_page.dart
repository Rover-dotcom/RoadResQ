import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/provider/login_provider.dart';
import 'package:road_resq/screens/login_screen/pages/forgot_password_page.dart';
import 'package:road_resq/screens/login_screen/pages/register_page.dart';
import 'package:road_resq/screens/login_screen/widgets/common_widgets.dart';
import 'package:road_resq/utils/extensions.dart';

class LoginEmailPage extends StatefulWidget {
  const LoginEmailPage({super.key});

  @override
  State<LoginEmailPage> createState() => _LoginEmailPageState();
}

class _LoginEmailPageState extends State<LoginEmailPage> {
  bool _rememberMe = true;
  bool _showPassword = false;

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

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
                  color: const Color(0xFF767C8C),
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
                controller: _emailController,
                hint: 'Enter your Email',
                prefixIconPath: 'assets/icons/email_icon.png',
                keyboardType: TextInputType.emailAddress,
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
                controller: _passwordController,
                hint: 'Enter your Password',
                prefixIconPath: 'assets/icons/lock_icon.png',
                isPassword: true,
                showPassword: _showPassword,
                onToggleVisibility: () {
                  setState(() => _showPassword = !_showPassword);
                },
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
                        color: const Color(0xFF1F3A5F),
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // ─── Login Button ─────────────────────────────────────────────
              Consumer<LoginProvider>(
                builder: (context, provider, _) {
                  return CommonWidgets().buildElevatedButton(
                    backgroundColor: const Color(0xFF1F3A5F),
                    child:
                        provider.isEmailLoginLoading
                            ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                            : const Text(
                              'Login',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.white,
                              ),
                            ),
                    onPressed:
                        provider.isEmailLoginLoading
                            ? null
                            : () {
                              final email = _emailController.text.trim();
                              final password = _passwordController.text;
                              if (email.isEmpty || password.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Please enter email and password.',
                                    ),
                                  ),
                                );
                                return;
                              }
                              provider.handleEmailLogin(
                                context: context,
                                email: email,
                                password: password,
                              );
                            },
                  );
                },
              ),

              const Spacer(),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account? ",
                    style: context.textTheme.bodyMedium,
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const RegisterPage(),
                        ),
                      );
                    },
                    child: Text(
                      'Sign Up',
                      style: context.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFFFF7A00),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required String prefixIconPath,
    bool isPassword = false,
    bool showPassword = false,
    VoidCallback? onToggleVisibility,
    TextInputType keyboardType = TextInputType.text,
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
        controller: controller,
        obscureText: isPassword && !showPassword,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey),
          prefixIcon: Image.asset(prefixIconPath),
          suffixIcon:
              isPassword
                  ? IconButton(
                    icon: Icon(
                      showPassword
                          ? Icons.visibility
                          : Icons.visibility_outlined,
                      color: Colors.grey,
                    ),
                    onPressed: onToggleVisibility,
                  )
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
