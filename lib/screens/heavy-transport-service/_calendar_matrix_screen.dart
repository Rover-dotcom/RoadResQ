import 'package:flutter/material.dart';

class CalendarMatrixScreen extends StatefulWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const CalendarMatrixScreen({super.key, required this.onContinue, required this.onBack});

  @override
  State<CalendarMatrixScreen> createState() => _CalendarMatrixScreenState();
}

class _CalendarMatrixScreenState extends State<CalendarMatrixScreen> {
  String selectedDate = '07';
  final List<String> dates = ["07", "08", "09", "10", "11"];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Logistics Calendar Matrix', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Allocate localized shift arrival frames.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          SizedBox(
            height: 90,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: dates.length,
              itemBuilder: (context, index) {
                final d = dates[index];
                final isSelected = selectedDate == d;
                return GestureDetector(
                  onTap: () => setState(() => selectedDate = d),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.all(14),
                    width: 75,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isSelected ? const Color(0xFF013480) : Colors.grey.shade200, width: 2),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('JUN', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(d, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: widget.onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Lock Window Horizon', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}