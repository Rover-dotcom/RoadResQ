import 'package:flutter/material.dart';
import 'package:road_resq/screens/tow-service/tow_flow_models.dart';

class VehicleDetailsScreen extends StatefulWidget {
  final VoidCallback onBack;
  final ValueChanged<VehicleDetailsData> onContinue;

  const VehicleDetailsScreen({Key? key, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  State<VehicleDetailsScreen> createState() => _VehicleDetailsScreenState();
}

class _VehicleDetailsScreenState extends State<VehicleDetailsScreen> {
  final _manufacturerCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _problemCtrl = TextEditingController();

  bool get _isValid =>
      _manufacturerCtrl.text.trim().isNotEmpty &&
      _modelCtrl.text.trim().isNotEmpty &&
      _colorCtrl.text.trim().isNotEmpty &&
      _plateCtrl.text.trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    // Re-verify fields during modification states
    _manufacturerCtrl.addListener(() => setState(() {}));
    _modelCtrl.addListener(() => setState(() {}));
    _colorCtrl.addListener(() => setState(() {}));
    _plateCtrl.addListener(() => setState(() {}));
  }

  Widget _buildTextField({required String label, required String hint, required TextEditingController controller, bool uppercase = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: TextField(
            controller: controller,
            textCapitalization: uppercase ? TextCapitalization.characters : TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              border: InputBorder.none,
            ),
            style: const TextStyle(fontSize: 14, color: Colors.black),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Column(
          children: [
            Container(
              height: 128,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF013480), Color(0xFF0282DD)],
                ),
              ),
              padding: const EdgeInsets.only(bottom: 12, left: 20, right: 20),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                      onPressed: widget.onBack,
                      style: IconButton.styleFrom(backgroundColor: Colors.white10),
                    ),
                    const Text('Vehicle Details', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500)),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tell us about your vehicle', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black)),
                    const Text('Quick details — we\'ll send help right away', style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                    const SizedBox(height: 24),
                    
                    _buildTextField(label: 'Vehicle Manufacturer', hint: 'e.g. Toyota, Honda', controller: _manufacturerCtrl),
                    const SizedBox(height: 16),
                    _buildTextField(label: 'Model & Year', hint: 'e.g. Land Cruiser 2022', controller: _modelCtrl),
                    const SizedBox(height: 16),
                    
                    Row(
                      children: [
                        Expanded(child: _buildTextField(label: 'Color', hint: 'White', controller: _colorCtrl)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildTextField(label: 'Plate Number', hint: 'e.g. 123456', controller: _plateCtrl, uppercase: true)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    
                    // Image Picker Dummy Box Container
                    const Text('Add load photo (Optional)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Colors.black)),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      height: 85,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F1FA),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF0274CC), style: BorderStyle.solid, width: 1),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.camera_alt, color: Color(0xFF0282DD)),
                          SizedBox(height: 4),
                          Text('Take picture or upload photo', style: TextStyle(color: Color(0xFF013480), fontSize: 13)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    
                    // Problem Entry
                    const Text('Describe Issue', style: TextStyle(color: Color(0xFF6B7280), fontSize: 13)),
                    const SizedBox(height: 6),
                    Container(
                      height: 110,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: TextField(
                        controller: _problemCtrl,
                        maxLines: null,
                        decoration: const InputDecoration(
                          hintText: 'What seems to be wrong? (e.g. flat tire, breakdown...)',
                          border: InputBorder.none,
                        ),
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            )
          ],
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFFF5F6F8),
            child: ElevatedButton(
              onPressed: _isValid
                  ? () {
                      final data = VehicleDetailsData(
                        manufacturer: _manufacturerCtrl.text,
                        model: _modelCtrl.text,
                        color: _colorCtrl.text,
                        plateNumber: _plateCtrl.text,
                        problemDescription: _problemCtrl.text,
                      );
                      widget.onContinue(data);
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                backgroundColor: const Color(0xFF013480),
                disabledBackgroundColor: const Color(0xFF013480).withOpacity(0.4),
                foregroundColor: Colors.white,
              ),
              child: const Text('Send request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
            ),
          ),
        )
      ],
    );
  }

  @override
  void dispose() {
    _manufacturerCtrl.dispose();
    _modelCtrl.dispose();
    _colorCtrl.dispose();
    _plateCtrl.dispose();
    _problemCtrl.dispose();
    super.dispose();
  }
}