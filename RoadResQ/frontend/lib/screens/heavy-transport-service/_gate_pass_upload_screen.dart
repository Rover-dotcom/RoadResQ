import 'package:flutter/material.dart';

class GatePassUploadScreen extends StatefulWidget {
  final VoidCallback onContinue;
  final VoidCallback onBack;

  const GatePassUploadScreen({super.key, required this.onContinue, required this.onBack});

  @override
  State<GatePassUploadScreen> createState() => _GatePassUploadScreenState();
}

class _GatePassUploadScreenState extends State<GatePassUploadScreen> {
  bool uploaded = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Security Gate Clearances', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Attach matching site deployment credentials.', style: TextStyle(fontSize: 14, color: Colors.grey)),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: () => setState(() => uploaded = true),
            child: CustomPaint(
              painter: DashedBorderPainter(
                color: uploaded ? Colors.green : Colors.grey.shade400,
                radius: 24,
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
                decoration: BoxDecoration(
                  color: uploaded ? Colors.green.withOpacity(0.05) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Text(uploaded ? '✅' : '📄', style: const TextStyle(fontSize: 36)),
                    const SizedBox(height: 12),
                    Text(
                      uploaded ? 'Security Clearances Processed' : 'Upload Gate Pass PDF/Image',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    const Text('Maximum processing bracket allocation 25MB', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: uploaded ? widget.onContinue : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
            ),
            child: const Text('Compile Logistics Suite', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// Custom Painter to cleanly handle premium dashed/dotted border frames natively in Flutter
class DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashWidth;
  final double dashSpace;
  final double radius;

  DashedBorderPainter({
    required this.color,
    this.strokeWidth = 2,
    this.dashWidth = 6,
    this.dashSpace = 4,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final RRect rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(radius),
    );
    
    final Path path = Path()..addRRect(rrect);
    final Path dashPath = Path();

    for (var metric in path.computeMetrics()) {
      double distance = 0.0;
      while (distance < metric.length) {
        dashPath.addPath(
          metric.extractPath(distance, distance + dashWidth),
          Offset.zero,
        );
        distance += dashWidth + dashSpace;
      }
    }
    canvas.drawPath(dashPath, paint);
  }

  @override
  bool shouldRepaint(covariant DashedBorderPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}