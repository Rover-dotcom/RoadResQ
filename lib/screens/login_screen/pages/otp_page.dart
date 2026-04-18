import 'dart:async';

import 'package:flutter/material.dart';
import 'package:pinput/pinput.dart';
import 'package:road_resq/screens/login_screen/pages/change_password_page.dart';
import 'package:road_resq/screens/login_screen/widgets/common_widgets.dart';
import 'package:road_resq/utils/extensions.dart';

class OtpPage extends StatefulWidget {
  const OtpPage({super.key});

  @override
  State<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends State<OtpPage> {
  Timer? _timer;
  int _startSeconds = 180;

  void startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_startSeconds == 0) {
        setState(() => timer.cancel());
      } else {
        setState(() => _startSeconds--);
      }
    });
  }

  @override
  void initState() {
    super.initState();
    startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get formattedTime {
    int minutes = _startSeconds ~/ 60;
    int seconds = _startSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  final defaultPinTheme = PinTheme(
    width: 56,
    height: 56,
    textStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
    ),
  );

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

              Text('OTP Verification', style: context.textTheme.titleMedium),

              const SizedBox(height: 8),

              Text(
                'We just sent you a 4-digit code check your email.',
                style: context.textTheme.labelMedium?.copyWith(
                  fontSize: 15,
                  color: Color(0xFF767C8C),
                ),
              ),
              const SizedBox(height: 35),

              Pinput(
                length: 6,
                defaultPinTheme: defaultPinTheme,
                focusedPinTheme: defaultPinTheme.copyDecorationWith(
                  border: Border.all(
                    color: const Color(0xFF22315F),
                  ), // Dark blue focus
                  borderRadius: BorderRadius.circular(8),
                ),
                onCompleted: (pin) => print(pin),
              ),
              SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    formattedTime,
                    style: context.textTheme.labelMedium?.copyWith(),
                  ),
                  Text(
                    "Resend Code",
                    style: context.textTheme.labelMedium?.copyWith(
                      color: Color(0xFF1F3A5F),
                    ),
                  ),
                ],
              ),

              Spacer(),

              CommonWidgets().buildElevatedButton(
                backgroundColor: Color(0xFF1F3A5F),
                child: Text(
                  "Continue",
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
                onPressed: () {
                     Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ChangePasswordPage(),
                        ),
                      );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
