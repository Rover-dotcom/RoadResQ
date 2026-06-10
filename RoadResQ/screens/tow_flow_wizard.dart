import 'package:flutter/material.dart';

class TowFlowWizard extends StatefulWidget {
  const TowFlowWizard({super.key});

  @override
  State<TowFlowWizard> createState() => _TowFlowWizardState();
}

class _TowFlowWizardState extends State<TowFlowWizard> {
  int _currentStep = 1;
  String _selectedService = 'Flatbed Tow';

  void _nextStep() {
    if (_currentStep < 3) {
      setState(() => _currentStep++);
    } else {
      // Complete flow, return to previous view context safely
      Navigator.pop(context);
    }
  }

  void _prevStep() {
    if (_currentStep > 1) {
      setState(() => _currentStep--);
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Request Process Step $_currentStep of 3', style: const TextStyle(color: Colors.white, fontSize: 16)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: _prevStep,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF013480), Color(0xFF0282DD)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _currentStep == 1
                    ? _buildLocationStep()
                    : _currentStep == 2
                        ? _buildServiceOptionsStep()
                        : _buildSummaryStep(),
              ),
              const SizedBox(height: 20),
              
              // Direct execution step buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 1)
                    TextButton(
                      onPressed: _prevStep,
                      child: const Text('Back', style: TextStyle(color: Colors.black54, fontSize: 16)),
                    )
                  else
                    const SizedBox.shrink(),
                  ElevatedButton(
                    onPressed: _nextStep,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF013480),
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    ),
                    child: Text(
                      _currentStep == 3 ? 'Confirm Request' : 'Continue',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Confirm Pickup Zone', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
        const SizedBox(height: 12),
        Text('Detecting active GPS positioning within Qatari regions...', style: TextStyle(color: Colors.black.withOpacity(0.5))),
        const SizedBox(height: 24),
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.black.withOpacity(0.05)),
          ),
          child: const Center(
            child: Icon(Icons.map_outlined, size: 48, color: Color(0xFF0282DD)),
          ),
        ),
      ],
    );
  }

  Widget _buildServiceOptionsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Fleet Category', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
        const SizedBox(height: 16),
        _buildRadioOption('Flatbed Tow', 'Recommended for regular cars and SUVs'),
        _buildRadioOption('Heavy Equipment Flatbed', 'Designed for industrial machinery transports'),
        _buildRadioOption('Boom Truck Rescue', 'Best suited for complex off-road extractions'),
      ],
    );
  }

  Widget _buildRadioOption(String title, String subtitle) {
    return RadioListTile<String>(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
      subtitle: Text(subtitle, style: const TextStyle(color: Colors.black54)),
      value: title,
      groupValue: _selectedService,
      activeColor: const Color(0xFF013480),
      onChanged: (val) {
        if (val != null) setState(() => _selectedService = val);
      },
    );
  }

  Widget _buildSummaryStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Review Service Details', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
        const SizedBox(height: 24),
        _buildSummaryRow('Selected Type:', _selectedService),
        _buildSummaryRow('Target Destination:', 'Automated Route Dispatched'),
        _buildSummaryRow('Base Pricing:', 'Bidding Calculation Active'),
      ],
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54, fontSize: 15)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF013480), fontSize: 15)),
        ],
      ),
    );
  }
}