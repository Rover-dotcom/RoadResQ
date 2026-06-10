import 'package:flutter/material.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  final List<Map<String, String>> _slides = [
    {
      'title': 'Instant Roadside Help',
      'desc': 'Get fast towing and roadside assistance from nearby professional drivers whenever your vehicle needs urgent help.',
    },
    {
      'title': 'Professional Repair Services',
      'desc': 'Connect with trusted mechanics and garages to quickly diagnose and repair vehicle issues safely and reliably.',
    },
    {
      'title': 'Heavy Transport Made Easy',
      'desc': 'Transport containers, machinery, and heavy equipment safely with experienced drivers and real-time job tracking.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextButton(
                  onPressed: () => Navigator.pushReplacement(
                    context, MaterialPageRoute(builder: (_) => const LoginScreen())
                  ),
                  style: TextButton.styleFrom(backgroundColor: const Color(0xFFF5F5F7)),
                  child: const Text('Skip', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
                ),
              ),
            ),
            Expanded(
              flex: 4,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40.0),
                  child: Image.asset(
                    'assets/images/onboarding_truck.png',
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.local_shipping, size: 120, color: Color(0xFF0056B3)),
                  ),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                height: 6,
                width: _currentIndex == index ? 24 : 6,
                decoration: BoxDecoration(
                  color: _currentIndex == index ? const Color(0xFF0056B3) : Colors.black12,
                  borderRadius: BorderRadius.circular(3),
                ),
              )),
            ),
            Expanded(
              flex: 3,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (val) => setState(() => _currentIndex = val),
                itemCount: _slides.length,
                itemBuilder: (context, i) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0, vertical: 20),
                    child: Column(
                      children: [
                        Text(
                          _slides[i]['title']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _slides[i]['desc']!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 14, color: Colors.black45, height: 1.5),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
              child: ElevatedButton(
                onPressed: () {
                  if (_currentIndex < _slides.length - 1) {
                    _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  } else {
                    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0056B3),
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  elevation: 0,
                ),
                child: Text(
                  _currentIndex == _slides.length - 1 ? 'Get Started' : 'Continue',
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}