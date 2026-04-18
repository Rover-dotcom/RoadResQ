import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/provider/login_provider.dart';
import 'package:road_resq/screens/login_screen/pages/login_email_page.dart';
import 'package:road_resq/screens/login_screen/widgets/common_widgets.dart';
import 'package:road_resq/utils/extensions.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final widget = CommonWidgets();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),

                Image.asset("assets/logo/road_resq_logo.png"),

                const SizedBox(height: 30),

                Text(
                  "Welcome to the",
                  style: Theme.of(context).textTheme.titleLarge,
                ),

                const SizedBox(height: 8),

                Text(
                  "RoadResQ",
                  style: context.textTheme.titleLarge?.copyWith(
                    color: Color(0xFF1F3A5F),
                  ),
                ),

                const SizedBox(height: 30),

                widget.buildElevatedButton(
                  backgroundColor: Color(0xFF1F3A5F),
                  child: Text(
                    "Continue With Email",
                    style: TextStyle(fontSize: 16, color: Colors.white),
                  ),
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LoginEmailPage(),
                      ),
                    );
                  },
                ),

                const SizedBox(height: 25),

                _buildCustomDivider(context),

                const SizedBox(height: 25),

                Consumer<LoginProvider>(
                  builder: (context, provider, _) {
                    return widget.buildElevatedButton(
                      backgroundColor: Colors.white,
                      onPressed:
                          provider.isGoogleLoginLoading
                              ? null
                              : () => provider.handleGoogleLogin(context),
                      child:
                          provider.isGoogleLoginLoading
                              ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                              : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Image.asset("assets/logo/google_logo.png"),
                                  SizedBox(width: 10),
                                  Text(
                                    "Sign in with Google",
                                    style: TextStyle(fontSize: 16),
                                  ),
                                ],
                              ),
                    );
                  },
                ),
                const SizedBox(height: 15),

                widget.buildElevatedButton(
                  backgroundColor: Colors.black,
                  onPressed: () {},
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.apple, color: Colors.white),
                      SizedBox(width: 10),
                      Text(
                        "Sign in with Apple",
                        style: TextStyle(fontSize: 16, color: Colors.white),
                      ),
                    ],
                  ),
                ),

                Spacer(),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Have an account? ",
                      style: context.textTheme.bodyMedium,
                    ),
                    GestureDetector(
                      onTap: () {},
                      child: Text(
                        "Login",
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
      ),
    );
  }

  Widget _buildCustomDivider(BuildContext context) {
    final Color lineColor = Colors.blue.shade300;

    return Row(
      children: [
        Expanded(
          child: Container(
            height: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [lineColor.withValues(alpha: 0), lineColor],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Text("Or", style: context.textTheme.bodyMedium),
        ),

        Expanded(
          child: Container(
            height: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [lineColor.withValues(alpha: 0), lineColor],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
