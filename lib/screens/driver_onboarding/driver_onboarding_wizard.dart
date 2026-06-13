import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:road_resq/models/driver_model.dart';
import 'package:road_resq/provider/driver_provider.dart';
import 'package:road_resq/screens/driver_onboarding/driver_home_screen.dart';

class DriverOnboardingWizard extends StatefulWidget {
  const DriverOnboardingWizard({super.key});

  @override
  State<DriverOnboardingWizard> createState() => _DriverOnboardingWizardState();
}

class _DriverOnboardingWizardState extends State<DriverOnboardingWizard> {
  int _currentStep = 0;

  // STEP 2: PERSONAL DATA FORM CONTROLLERS
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _dobController = TextEditingController();

  // STEP 3: VEHICLE DATA CONTROLLERS & OPTIONS
  String _selectedVehicleType = 'Flatbed Tow Truck';
  final _vehicleMakeModelController = TextEditingController();
  final _plateNumberController = TextEditingController();
  final _vehicleCapacityController = TextEditingController();
  final _vehicleHeightController = TextEditingController();

  // STEP 4: UPLOAD STATE BOOLEANS
  bool _idUploaded = false;
  bool _licenseUploaded = false;
  bool _istimaraUploaded = false;
  bool _routePermitUploaded = false;

  // STEP 5: SERVICE LOGISTICS & COVERAGE
  String _selectedRadius = '20 km';
  bool _towServiceEnabled = true;
  bool _heavyTransportEnabled = false;
  bool _mechanicEnabled = false;
  bool _industrialEnabled = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _idNumberController.dispose();
    _dobController.dispose();
    _vehicleMakeModelController.dispose();
    _plateNumberController.dispose();
    _vehicleCapacityController.dispose();
    _vehicleHeightController.dispose();
    super.dispose();
  }

  void _nextStep() {
    // At step 4 (going to step 5 = submission), create the driver profile
    if (_currentStep == 4) {
      _submitDriverProfile();
    }
    setState(() => _currentStep++);
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitDriverProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final driverProvider = Provider.of<DriverProvider>(context, listen: false);
    final driver = DriverModel(
      uid: user.uid,
      name: _fullNameController.text.trim(),
      email: user.email ?? '',
      phone: _phoneController.text.trim(),
      vehicleType: _selectedVehicleType,
      licenseNumber: _idNumberController.text.trim(),
      isOnline: false,
      isApproved: false,
      experience: '',
      createdAt: DateTime.now(),
    );

    await driverProvider.registerDriver(driver);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
        title: Text(
          _getAppBarTitle(),
          style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: _currentStep == 0 ? () => Navigator.pop(context) : _prevStep,
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            LinearProgressIndicator(
              value: (_currentStep + 1) / 7,
              backgroundColor: Colors.grey.shade200,
              color: const Color(0xFF2563EB),
              minHeight: 4,
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(20.0),
                child: _buildCurrentStepContent(),
              ),
            ),
            if (_currentStep < 5) _buildPersistentNavigationFooter(),
          ],
        ),
      ),
    );
  }

  String _getAppBarTitle() {
    switch (_currentStep) {
      case 0: return 'Become a Partner';
      case 1: return 'Personal Information';
      case 2: return 'Vehicle Configuration';
      case 3: return 'Document Verification';
      case 4: return 'Operational Area';
      case 5: return 'Application Processing';
      case 6: return 'Driver Accreditation';
      default: return 'Driver Application';
    }
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0: return _buildBenefitsStep();
      case 1: return _buildPersonalInfoStep();
      case 2: return _buildVehicleInfoStep();
      case 3: return _buildUploadDocumentsStep();
      case 4: return _buildServiceAreaStep();
      case 5: return _buildSubmittedReviewStep();
      case 6: return _buildWelcomeApprovalStep();
      default: return const SizedBox.shrink();
    }
  }

  // ==========================================
  // STEP 1: BENEFITS LANDING FRAME
  // ==========================================
  Widget _buildBenefitsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Drive and Earn with RoadResQ',
          style: TextStyle(fontFamily: 'Inter', fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        const SizedBox(height: 8),
        Text(
          'Join Qatar\'s premium digital breakdown and industrial logistics dispatch infrastructure.',
          style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: Colors.grey.shade600, height: 1.4),
        ),
        const SizedBox(height: 28),
        _buildBenefitRow('💰', 'Guaranteed High Tariffs', 'Maximize your revenue yield per logistics run, utilizing custom enterprise billing structures.'),
        _buildBenefitRow('⚡', 'Instant Automated Dispatch', 'Zero verbal friction. Structural breakdown notifications delivered instantly matching your geo-radius constraints.'),
        _buildBenefitRow('🛡️', 'Full Liability Protection', 'Complete operations coverage across Doha, Mesaieed industrial routes, and Sealine recovery sectors.'),
      ],
    );
  }

  Widget _buildBenefitRow(String emoji, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0), // Fixed the EdgeInsets bug here
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(subtitle, style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500, height: 1.4)),
              ],
            ),
          )
        ],
      ),
    );
  }

  // ==========================================
  // STEP 2: PERSONAL IDENTITY FIELDS
  // ==========================================
  Widget _buildPersonalInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepHeader('Identity Verification', 'Provide matching legal documents to authorize credential checks.'),
        _buildInputField('Legal Full Name', 'As written in your QID', _fullNameController),
        _buildInputField('Mobile Number', '+974 5500 0000', _phoneController, keyboardType: TextInputType.phone),
        _buildInputField('QID Identification Number', '29000000000', _idNumberController, keyboardType: TextInputType.number),
        _buildInputField('Date of Birth', 'DD/MM/YYYY', _dobController),
      ],
    );
  }

  // ==========================================
  // STEP 3: HEAVY VEHICLE UTILITY SETTINGS
  // ==========================================
  Widget _buildVehicleInfoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepHeader('Vehicle Specifications', 'Configure your mechanical layout parameters for optimized dynamic matching allocation.'),
        
        const Text('Select Fleet Category', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _selectedVehicleType,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
          ),
          items: ['Flatbed Tow Truck', 'Heavy Equipment Loader', 'Hydraulic Crane Flatbed', 'Mobile Mechanical Workshop']
              .map((type) => DropdownMenuItem(value: type, child: Text(type, style: const TextStyle(fontSize: 14))))
              .toList(),
          onChanged: (val) => setState(() => _selectedVehicleType = val!),
        ),
        const SizedBox(height: 18),
        
        _buildInputField('Vehicle Make & Model', 'e.g., Mercedes-Benz Actros', _vehicleMakeModelController),
        _buildInputField('Plate Number (Qatar)', 'e.g., 54321', _plateNumberController),
        _buildInputField('Maximum Load Capacity (Tons)', 'e.g., 10', _vehicleCapacityController, keyboardType: TextInputType.number),
        _buildInputField('Maximum Clearance Height (Meters)', 'e.g., 3.5', _vehicleHeightController, keyboardType: TextInputType.number),
      ],
    );
  }

  // ==========================================
  // STEP 4: CRITICAL LEGAL UPLOADS
  // ==========================================
  Widget _buildUploadDocumentsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepHeader('Document Management', 'Upload clear scans of front and back surfaces. Supports PDF, PNG, or JPEG formats.'),
        _buildUploadRow('Qatar ID (QID)', _idUploaded, (state) => setState(() => _idUploaded = state)),
        _buildUploadRow('Professional Driving License', _licenseUploaded, (state) => setState(() => _licenseUploaded = state)),
        _buildUploadRow('Vehicle Registration (Istimara)', _istimaraUploaded, (state) => setState(() => _istimaraUploaded = state)),
        _buildUploadRow('Industrial Route Permit', _routePermitUploaded, (state) => setState(() => _routePermitUploaded = state)),
      ],
    );
  }

  Widget _buildUploadRow(String label, bool isUploaded, Function(bool) onToggleSimulated) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(isUploaded ? Icons.check_circle : Icons.cloud_upload_outlined, 
               color: isUploaded ? Colors.green : const Color(0xFF1E40AF)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          TextButton(
            onPressed: () => onToggleSimulated(!isUploaded),
            child: Text(isUploaded ? 'Re-upload' : 'Attach Scan', 
                        style: TextStyle(color: isUploaded ? Colors.grey : const Color(0xFF2563EB), fontSize: 13)),
          )
        ],
      ),
    );
  }

  // ==========================================
  // STEP 5: OPERATIONS DISPATCH SETTINGS
  // ==========================================
  Widget _buildServiceAreaStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepHeader('Dispatch Logistics Zone', 'Define operational limits and service sectors for targeted tracking alerts.'),
        
        const Text('Operational Boundary Radius', style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: ['5 km', '10 km', '20 km', 'All Qatar Boundaries'].map((radius) {
            final isSelected = _selectedRadius == radius;
            return ChoiceChip(
              label: Text(radius),
              selected: isSelected,
              // Fixed the WidgetStateProperty selection color assignment here:
              selectedColor: const Color(0xFF1E40AF),
              labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
              onSelected: (selected) {
                if (selected) setState(() => _selectedRadius = radius);
              },
            );
          }).toList(),
        ),
        
        const SizedBox(height: 24),
        const Text('Available Dispatch Job Categories', style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        
        SwitchListTile(
          title: const Text('Tow Services (Cars, 4x4, Desert Recovery)', style: TextStyle(fontSize: 13)),
          value: _towServiceEnabled,
          activeTrackColor: const Color(0xFF1E40AF).withValues(alpha: 0.3),
          activeThumbColor: const Color(0xFF1E40AF),
          onChanged: (val) => setState(() => _towServiceEnabled = val),
        ),
        SwitchListTile(
          title: const Text('Heavy Machinery Transport (JCB, Excavators)', style: TextStyle(fontSize: 13)),
          value: _heavyTransportEnabled,
          activeTrackColor: const Color(0xFF1E40AF).withValues(alpha: 0.3),
          activeThumbColor: const Color(0xFF1E40AF),
          onChanged: (val) => setState(() => _heavyTransportEnabled = val),
        ),
        SwitchListTile(
          title: const Text('On-Site Mobile Mechanical Workshop', style: TextStyle(fontSize: 13)),
          value: _mechanicEnabled,
          activeTrackColor: const Color(0xFF1E40AF).withValues(alpha: 0.3),
          activeThumbColor: const Color(0xFF1E40AF),
          onChanged: (val) => setState(() => _mechanicEnabled = val),
        ),
        SwitchListTile(
          title: const Text('Industrial Components (Precast, Pallets)', style: TextStyle(fontSize: 13)),
          value: _industrialEnabled,
          activeTrackColor: const Color(0xFF1E40AF).withValues(alpha: 0.3),
          activeThumbColor: const Color(0xFF1E40AF),
          onChanged: (val) => setState(() => _industrialEnabled = val),
        ),
      ],
    );
  }

  // ==========================================
  // STEP 6: SCREEN FOR AUDIT SUBMISSION
  // ==========================================
  Widget _buildSubmittedReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        const Text('⌛', style: TextStyle(fontSize: 54)),
        const SizedBox(height: 16),
        const Text(
          'Application Submitted',
          style: TextStyle(fontFamily: 'Inter', fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Your compliance portfolio is currently inside our routing review framework pipeline.',
          textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500),
        ),
        const SizedBox(height: 32),
        _buildPipelineMilestoneCard('1', 'Document Background Auditing', 'Verification across ministries for asset check validation. Time horizon: 1–2 weeks.'),
        _buildPipelineMilestoneCard('2', 'SMS Activation Authorization', 'A notification token link will trigger live deployment configuration on validation success.'),
        _buildPipelineMilestoneCard('3', 'Operational Access', 'Go online instantly via your primary driver portal shell interface.'),
        const SizedBox(height: 40),
        
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111827), foregroundColor: Colors.white),
            onPressed: _nextStep,
            child: const Text('Simulate Immediate Admin Approval ⚡'),
          ),
        )
      ],
    );
  }

  Widget _buildPipelineMilestoneCard(String step, String title, String body) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(10)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(radius: 10, backgroundColor: const Color(0xFF1E40AF), child: Text(step, style: const TextStyle(fontSize: 10, color: Colors.white))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(body, style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Colors.grey.shade500, height: 1.3)),
              ],
            ),
          )
        ],
      ),
    );
  }

  // ==========================================
  // STEP 7: ACCREDITED DRIVER CONGRATULATIONS
  // ==========================================
  Widget _buildWelcomeApprovalStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        const Text('🎉', style: TextStyle(fontSize: 54)),
        const SizedBox(height: 16),
        const Text(
          'Welcome to RoadResQ Fleet',
          style: TextStyle(fontFamily: 'Inter', fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.withValues(alpha: 0.2))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🟢 Approved Framework Clearances:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.green)),
              const SizedBox(height: 8),
              Text('• Selected Fleet Node: $_selectedVehicleType', style: const TextStyle(fontSize: 13)),
              Text('• Configured Service Area Radius: $_selectedRadius around regional cluster Hubs', style: const TextStyle(fontSize: 13)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.withValues(alpha: 0.2))),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('⚠️ ', style: TextStyle(fontSize: 16)),
              Expanded(
                child: Text(
                  'Safety Notice: Keep tracking telemetry active. Speed boundaries inside Mesaieed industrial corridors must strictly follow Qatari transportation authority guidelines.',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF78350F), height: 1.4),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E40AF),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const DriverHomeScreen()),
                (route) => false,
              );
            },
            child: const Text('Go to Driver Home Portal', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold)),
          ),
        )
      ],
    );
  }

  // ==========================================
  // COMPONENT REUSABLES & WIDGET ATOMS
  // ==========================================
  Widget _buildStepHeader(String title, String description) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        const SizedBox(height: 4),
        Text(description, style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500, height: 1.4)),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildInputField(String label, String hint, TextEditingController controller, {TextInputType keyboardType = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersistentNavigationFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade200))),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1E40AF),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          onPressed: _nextStep,
          child: const Text('Continue', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}