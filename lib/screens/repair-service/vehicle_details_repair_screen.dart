import 'package:flutter/material.dart';
import 'repair_models.dart';

class VehicleDetailsRepairScreen extends StatefulWidget {
  final Function(VehicleRepairDetails) onContinue;
  final VoidCallback onBack;

  const VehicleDetailsRepairScreen({
    Key? key,
    required this.onContinue,
    required this.onBack,
  }) : super(key: key);

  @override
  State<VehicleDetailsRepairScreen> createState() => _VehicleDetailsRepairScreenState();
}

class _VehicleDetailsRepairScreenState extends State<VehicleDetailsRepairScreen> {
  final _manufacturerController = TextEditingController();
  final _modelController = TextEditingController();
  final _colorController = TextEditingController();
  final _plateController = TextEditingController();

  bool _isFormValid = false;

  @override
  void initState() {
    super.initState();
    _manufacturerController.addListener(_validateForm);
    _modelController.addListener(_validateForm);
    _colorController.addListener(_validateForm);
    _plateController.addListener(_validateForm);
  }

  void _validateForm() {
    setState(() {
      _isFormValid = _manufacturerController.text.isNotEmpty &&
          _modelController.text.isNotEmpty &&
          _colorController.text.isNotEmpty &&
          _plateController.text.isNotEmpty;
    });
  }

  void _handleContinue() {
    if (_isFormValid) {
      widget.onContinue(
        VehicleRepairDetails(
          manufacturer: _manufacturerController.text,
          model: _modelController.text,
          color: _colorController.text,
          plate: _plateController.text.toUpperCase(),
        ),
      );
    }
  }

  @override
  void dispose() {
    _manufacturerController.dispose();
    _modelController.dispose();
    _colorController.dispose();
    _plateController.dispose();
    super.dispose();
  }

  Widget _buildInputField({
    required String label,
    required String placeholder,
    required TextEditingController controller,
    bool uppercaseOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF6B7280),
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 12),
        Container(
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            textCapitalization: uppercaseOnly ? TextCapitalization.characters : TextCapitalization.sentences,
            style: const TextStyle(color: Colors.black, fontSize: 14, fontFamily: 'Inter'),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              border: InputBorder.none,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6F8),
      body: Stack(
        children: [
          Column(
            children: [
              // Header Segment
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
                        "Vehicle details",
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

              // Step Progressive Track - Step 2/9
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
                            return Container(
                              height: 6,
                              width: constraints.maxWidth * (2 / 9),
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
                          "Step 2/9",
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

              // Form Scrollable Dynamic Container
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 120.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Vehicle Specification",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        "Quick details to help dispatch teams deploy the right setup",
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280),
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      _buildInputField(
                        label: "Vehicle manufacturer",
                        placeholder: "e.g. Toyota, Nissan, Lexus",
                        controller: _manufacturerController,
                      ),
                      const SizedBox(height: 16),
                      
                      _buildInputField(
                        label: "Model & year",
                        placeholder: "e.g. Land Cruiser 2022",
                        controller: _modelController,
                      ),
                      const SizedBox(height: 16),

                      // Safe Two-Column Input Grid for Compact Devices
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildInputField(
                              label: "Color",
                              placeholder: "White",
                              controller: _colorController,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildInputField(
                              label: "Plate Number",
                              placeholder: "e.g. 554321",
                              controller: _plateController,
                              uppercaseOnly: true,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),

          // Action Button Layer
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              color: const Color(0xFFF5F6F8),
              child: Opacity(
                opacity: !_isFormValid ? 0.4 : 1.0,
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
                    onPressed: !_isFormValid ? null : _handleContinue,
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