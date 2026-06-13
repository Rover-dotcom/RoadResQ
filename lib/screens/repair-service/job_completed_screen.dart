import 'package:flutter/material.dart';

class JobCompletedScreen extends StatelessWidget {
  final VoidCallback onReturnHome;

  // Uses modern super.key to eliminate the lint warning
  const JobCompletedScreen({
    super.key,
    required this.onReturnHome,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            // Changed from MainAxisAlignment.between to spaceBetween
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              
              // Success visual state block
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF0F4FA),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      size: 80,
                      color: Color(0xFF013480),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Service Completed',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontSize: 28,
                          color: const Color(0xFF1A1A1A),
                        ),
                  ),
                  const SizedBox(height: 12),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.0),
                    child: Text(
                      'Your vehicle repair workflow has concluded successfully. The garage has updated your job log to finalized.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 15,
                        color: Colors.grey,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
              
              const Spacer(),
              
              // Action anchor
              ElevatedButton(
                onPressed: onReturnHome,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF013480),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Return to Dashboard',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}