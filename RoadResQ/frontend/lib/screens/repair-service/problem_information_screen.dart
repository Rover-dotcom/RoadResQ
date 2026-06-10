import 'package:flutter/material.dart';

class ProblemInformationScreen extends StatefulWidget {
  final Function(String timeline, String? photoPath) onContinue;
  final VoidCallback onBack;

  const ProblemInformationScreen({Key? key, required this.onContinue, required this.onBack}) : super(key: key);

  @override
  State<ProblemInformationScreen> createState() => _ProblemInformationScreenState();
}

class _ProblemInformationScreenState extends State<ProblemInformationScreen> {
  final _timelineController = TextEditingController();
  String? _mockSelectedPhoto;

  void _simulatePhotoPicker() {
    setState(() => _mockSelectedPhoto = "/mock_storage/DCIM/roadresq_upload.jpg");
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            children: [
              Container(
                height: 128,
                width: double.infinity,
                decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)])),
                child: Stack(
                  children: [
                    Positioned(
                      left: 20,
                      top: 68,
                      child: GestureDetector(
                        onTap: widget.onBack,
                        child: Container(
                          height: 40,
                          width: 40,
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.12), shape: BoxShape.circle),
                          child: const Icon(Icons.chevron_left, color: Colors.white),
                        ),
                      ),
                    ),
                    const Positioned(
                      left: 0,
                      right: 0,
                      top: 78,
                      child: Text(
                        "Problem Context",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 17.0),
                child: Column(
                  children: [
                    Container(
                      height: 6,
                      width: double.infinity,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(100)),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: LayoutBuilder(
                          builder: (context, constraints) => Container(
                            height: 6,
                            width: constraints.maxWidth * (6 / 9),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text("Step 6/9", style: TextStyle(color: Colors.white, fontSize: 10, fontFamily: 'Inter')),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Issue Timeline & Visuals", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter')),
                      const SizedBox(height: 16),
                      const Text("Since when has this been happening?", style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                      const SizedBox(height: 10),
                      Container(
                        height: 52,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 3))],
                        ),
                        child: TextField(
                          controller: _timelineController,
                          style: const TextStyle(color: Colors.black, fontSize: 14),
                          decoration: const InputDecoration(
                            hintText: "e.g., Today morning, 2 days ago, suddenly on highway",
                            hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text("Add Photo Asset (Optional)", style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontFamily: 'Inter')),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: _simulatePhotoPicker,
                        child: Container(
                          height: 140,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB), width: 2),
                          ),
                          child: _mockSelectedPhoto != null
                              ? Stack(
                                  children: [
                                    Container(
                                      color: Colors.black12,
                                      child: const Center(child: Icon(Icons.directions_car, size: 48, color:const Color(0xFF555555))),
                                    ),
                                    Positioned(
                                      right: 12,
                                      top: 12,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(4)),
                                        child: const Text("Uploaded", style: TextStyle(color: Colors.white, fontSize: 11)),
                                      ),
                                    )
                                  ],
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Icon(Icons.add_a_photo_outlined, size: 32, color: Color(0xFF0282DD)),
                                    SizedBox(height: 8),
                                    Text("Capture picture or select from gallery", style: TextStyle(color: Color(0xFF6B7280), fontSize: 13, fontFamily: 'Inter')),
                                  ],
                                ),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFFF5F6F8),
              child: ValueListenableBuilder<TextEditingValue>(
                valueListenable: _timelineController,
                builder: (context, value, child) {
                  final isFilled = value.text.trim().isNotEmpty;
                  return Opacity(
                    opacity: isFilled ? 1.0 : 0.4,
                    child: Container(
                      height: 52,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(100),
                        gradient: const LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
                      ),
                      child: ElevatedButton(
                        onPressed: isFilled ? () => widget.onContinue(_timelineController.text, _mockSelectedPhoto) : null,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                        child: const Text("Review Booking", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500, fontFamily: 'Inter')),
                      ),
                    ),
                  );
                },
              ),
            ),
          )
        ],
      ),
    );
  }
}