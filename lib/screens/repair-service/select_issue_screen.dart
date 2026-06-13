import 'package:flutter/material.dart';

class IssueItem {
  final String id;
  final String label;
  final String icon;

  IssueItem({required this.id, required this.label, required this.icon});
}

class SelectIssueScreen extends StatefulWidget {
  final Function(List<String>) onContinue;
  final VoidCallback onBack;

  const SelectIssueScreen({
    Key? key,
    required this.onContinue,
    required this.onBack,
  }) : super(key: key);

  @override
  State<SelectIssueScreen> createState() => _SelectIssueScreenState();
}

class _SelectIssueScreenState extends State<SelectIssueScreen> {
  final List<String> _selectedIssues = [];

  final List<IssueItem> _issues = [
    IssueItem(id: "engine", label: "Engine problem", icon: "⚙️"),
    IssueItem(id: "brake", label: "Brake issue", icon: "🛑"),
    IssueItem(id: "transmission", label: "Transmission", icon: "🔧"),
    IssueItem(id: "electrical", label: "Electrical system", icon: "⚡"),
    IssueItem(id: "ac", label: "AC not working", icon: "❄️"),
    IssueItem(id: "battery", label: "Battery / Starting", icon: "🔋"),
    IssueItem(id: "suspension", label: "Suspension", icon: "🚗"),
    IssueItem(id: "other", label: "Other issue", icon: "📝"),
  ];

  void _toggleIssue(String issueId) {
    setState(() {
      if (_selectedIssues.contains(issueId)) {
        _selectedIssues.remove(issueId);
      } else {
        _selectedIssues.add(issueId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            children: [
              // Header with Custom Gradient Look
              Container(
                height: 128,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF013480), Color(0xFF0282DD)],
                  ),
                ),
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
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.chevron_left, color: Colors.white, size: 24),
                        ),
                      ),
                    ),
                    const Positioned(
                      left: 0,
                      right: 0,
                      top: 78,
                      child: Text(
                        "Select issue",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Progress Bar Indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 17.0),
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          height: 6,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                          ),
                        ),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            // Calculates exact proportional step matching step 3/9 (approx 33.3%)
                            return Container(
                              height: 6,
                              width: constraints.maxWidth * (3 / 9),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF013480), Color(0xFF0282DD)],
                                ),
                                borderRadius: BorderRadius.circular(100),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF013480), Color(0xFF0282DD)],
                          ),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text(
                          "Step 3/9",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Form Description
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      SizedBox(height: 10),
                      Text(
                        "What's the problem?",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                          fontFamily: 'Inter',
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        "Select all that apply",
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280),
                          fontFamily: 'Inter',
                        ),
                      ),
                      SizedBox(height: 20),
                    ],
                  ),
                ),
              ),

              // Interactive Scrollable List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 100.0),
                  itemCount: _issues.length,
                  itemBuilder: (context, index) {
                    final issue = _issues[index];
                    final isSelected = _selectedIssues.contains(issue.id);

                    return GestureDetector(
                      onTap: () => _toggleIssue(issue.id),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF013480) : const Color(0xFFE5E7EB),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected 
                                  ? const Color(0xFF013480).withOpacity(0.1) 
                                  : Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              height: 24,
                              width: 24,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF013480) : const Color(0xFFD1D5DB),
                                  width: 2,
                                ),
                                gradient: isSelected
                                    ? const LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [Color(0xFF013480), Color(0xFF0282DD)],
                                      )
                                    : null,
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                issue.label,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.black,
                                  fontFamily: 'Inter',
                                ),
                              ),
                            ),
                            Text(
                              issue.icon,
                              style: const TextStyle(fontSize: 20),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),

          // Bottom Fixed Button Layer
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFFF5F6F8),
              child: Opacity(
                opacity: _selectedIssues.isEmpty ? 0.4 : 1.0,
                child: Container(
                  height: 52,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF013480), Color(0xFF0282DD)],
                    ),
                  ),
                  child: ElevatedButton(
                    onPressed: _selectedIssues.isEmpty 
                        ? null 
                        : () => widget.onContinue(_selectedIssues),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    child: const Text(
                      "Continue",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}