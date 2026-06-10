import 'package:flutter/material.dart';
import 'inquiry_state_model.dart';
import 'inquiry_sub_screens.dart';

class IndustrialInquiryWizard extends StatefulWidget {
  final VoidCallback onExitFlow;

  const IndustrialInquiryWizard({super.key, required this.onExitFlow});

  @override
  State<IndustrialInquiryWizard> createState() => _IndustrialInquiryWizardState();
}

class _IndustrialInquiryWizardState extends State<IndustrialInquiryWizard> {
  final PageController _pageController = PageController();
  final InquiryStateModel _flowData = InquiryStateModel();
  int _currentStepIndex = 0;
  final int _totalSteps = 11;

  void _advance() {
    if (_currentStepIndex < _totalSteps - 1) {
      setState(() => _currentStepIndex++);
      _pageController.animateToPage(
        _currentStepIndex,
        duration: const Duration(milliseconds: 500),
        // FIX: Replaced invalid curve with an ultra-smooth premium layout transition
        curve: Curves.easeInOutCubic, 
      );
    }
  }

  void _regress() {
    if (_currentStepIndex == 0) {
      widget.onExitFlow();
    } else {
      setState(() => _currentStepIndex--);
      _pageController.animateToPage(
        _currentStepIndex,
        duration: const Duration(milliseconds: 500),
        // FIX: Replaced invalid curve with an ultra-smooth premium layout transition
        curve: Curves.easeInOutCubic,
      );
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(90),
        child: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF013480),
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                        onPressed: _regress,
                      ),
                      Text(
                        'Industrial Inquiry Matrix (${_currentStepIndex + 1}/$_totalSteps)',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.3),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70, size: 20),
                        onPressed: widget.onExitFlow,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: (_currentStepIndex + 1) / _totalSteps,
                      backgroundColor: Colors.white.withValues(alpha: 0.15),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD4AF37)), // Gold Accent Progress
                      minHeight: 4,
                    ),
                  ),
                )
              ],
            ),
          ),
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          InquiryPickupScreen(data: _flowData, onContinue: _advance),
          InquiryDropoffScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryCoreDetailsScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryTechSpecsScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryContactScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryScheduleScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryVehicleSelectionScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryReviewScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryPriceAcceptanceScreen(data: _flowData, onContinue: _advance, onBack: _regress),
          InquiryDriverAssignmentScreen(onDriverAssigned: _advance),
          InquiryJobProgressScreen(onJobCompleted: widget.onExitFlow),
        ],
      ),
    );
  }
}