import 'package:flutter/material.dart';

class ExplainIssueScreen extends StatefulWidget {
  final Function(String) onContinue;
  final VoidCallback onBack;

  const ExplainIssueScreen({Key? key, required this.onContinue, required this.onBack}) : super(key: key);

  @override
  State<ExplainIssueScreen> createState() => _ExplainIssueScreenState();
}

class _ExplainIssueScreenState extends State<ExplainIssueScreen> {
  final _inputController = TextEditingController();

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
                        "Explain Issue",
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
                            width: constraints.maxWidth * (4 / 9),
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
                        child: const Text("Step 4/9", style: TextStyle(color: Colors.white, fontSize: 10, fontFamily: 'Inter')),
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
                      const Text(
                        "Describe your vehicle's condition",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Inter'),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        "Please provide specific details about the issue to aid our service teams.",
                        style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), fontFamily: 'Inter'),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
                        ),
                        child: TextField(
                          controller: _inputController,
                          maxLines: 6,
                          style: const TextStyle(color: Colors.black, fontSize: 14, fontFamily: 'Inter'),
                          decoration: const InputDecoration(
                            hintText: "e.g., Loud knocking noises from engine bay under load or sudden power loss...",
                            hintStyle: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
                            contentPadding: EdgeInsets.all(16),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
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
                valueListenable: _inputController,
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
                        onPressed: isFilled ? () => widget.onContinue(_inputController.text) : null,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                        child: const Text("Continue", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500, fontFamily: 'Inter')),
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