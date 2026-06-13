import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:road_resq/models/garage_model.dart';
import 'package:road_resq/provider/garage_provider.dart';

class WorkshopOnboardingWizard extends StatefulWidget {
  const WorkshopOnboardingWizard({super.key});

  @override
  State<WorkshopOnboardingWizard> createState() => _WorkshopOnboardingWizardState();
}

class _WorkshopOnboardingWizardState extends State<WorkshopOnboardingWizard> {
  int _currentStep = 0;

  // STEP 2: WORKSHOP REVENUE ENTITY DATA CONTROLLERS
  final _workshopNameController = TextEditingController();
  final _workshopPhoneController = TextEditingController();
  final _workshopLocationController = TextEditingController();
  final _workshopCrController = TextEditingController();

  // STEP 3: AUTHORIZED CONTACT PERSON DATA CONTROLLERS
  final _contactNameController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _contactIdController = TextEditingController();
  final _contactDobController = TextEditingController();

  // STEP 4: REGULATORY DOCUMENT ATTACHMENTS
  bool _qidUploaded = false;
  bool _licenseUploaded = false;
  bool _crUploaded = false;
  bool _facadePhotoUploaded = false;

  @override
  void dispose() {
    _workshopNameController.dispose();
    _workshopPhoneController.dispose();
    _workshopLocationController.dispose();
    _workshopCrController.dispose();
    _contactNameController.dispose();
    _contactPhoneController.dispose();
    _contactIdController.dispose();
    _contactDobController.dispose();
    super.dispose();
  }

  void _nextStep() {
    // At step 3 (going to step 4 = submitted review), create the garage profile
    if (_currentStep == 3) {
      _submitGarageProfile();
    }
    setState(() => _currentStep++);
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitGarageProfile() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final garageProvider = Provider.of<GarageProvider>(context, listen: false);
    final garage = GarageModel(
      id: '', // Will be set by Firestore
      name: _workshopNameController.text.trim(),
      location: _workshopLocationController.text.trim(),
      ownerUid: user.uid,
      phone: _workshopPhoneController.text.trim(),
      isVerified: false,
      createdAt: DateTime.now(),
    );

    await garageProvider.registerGarage(garage);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827), // Sleek charcoal finish for commercial profiles
        foregroundColor: Colors.white,
        title: Text(
          _getAppBarTitle(),
          style: const TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold),
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
              value: (_currentStep + 1) / 6,
              backgroundColor: Colors.grey.shade100,
              color: const Color(0xFF0282DD),
              minHeight: 4,
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(24.0),
                child: _buildStepRouterContent(),
              ),
            ),
            if (_currentStep < 4) _buildActionControlFooter(),
          ],
        ),
      ),
    );
  }

  String _getAppBarTitle() {
    switch (_currentStep) {
      case 0: return 'Register Mechanical Workshop';
      case 1: return 'Workshop Profile';
      case 2: return 'Authorized Signatory';
      case 3: return 'Compliance Vault';
      case 4: return 'Audit Under Review';
      case 5: return 'Corporate Welcome Setup';
      default: return 'Workshop Onboarding';
    }
  }

  Widget _buildStepRouterContent() {
    switch (_currentStep) {
      case 0: return _buildBenefitsStep();
      case 1: return _buildWorkshopProfileStep();
      case 2: return _buildContactPersonStep();
      case 3: return _buildUploadDocumentsStep();
      case 4: return _buildSubmittedReviewStep();
      case 5: return _buildWelcomeApprovalStep();
      default: return const SizedBox.shrink();
    }
  }

  // ==========================================
  // STEP 1: CORPORATE BENEFITS VIEW
  // ==========================================
  Widget _buildBenefitsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Scale Your Service Volume',
          style: TextStyle(fontFamily: 'Inter', fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        const SizedBox(height: 6),
        Text(
          'Link your service bay telemetry directly to incoming consumer breakdown flows across Qatar.',
          style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: Colors.grey.shade600, height: 1.4),
        ),
        const SizedBox(height: 32),
        _buildBenefitFeatureCard('🏢', 'Steady Commercial Lead Pipeline', 'Receive targeted notifications for on-site repairs, brake assistance, and technical vehicle recoveries directly within your geographic jurisdiction.'),
        _buildBenefitFeatureCard('📈', 'Automated Enterprise Billing', 'Process invoice cycles smoothly through our centralized business platform infrastructure.'),
        _buildBenefitFeatureCard('📍', 'Targeted Location Matching', 'Route jobs that match your specialized equipment setup and garage proximity limits perfectly.'),
      ],
    );
  }

  Widget _buildBenefitFeatureCard(String icon, String headline, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(headline, style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500, height: 1.4)),
              ],
            ),
          )
        ],
      ),
    );
  }

  // ==========================================
  // STEP 2: BUSINESS ENTITY REGISTRATION
  // ==========================================
  Widget _buildWorkshopProfileStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepSectionHeader('Workshop Business Credentials', 'Provide company details as stated on your municipal establishment card.'),
        _buildInputField('Mechanical Workshop Name', 'e.g., Al Rayyan Performance Garage', _workshopNameController),
        _buildInputField('Workshop Contact Number', '+974 4400 0000', _workshopPhoneController, keyboardType: TextInputType.phone),
        _buildInputField('Workshop Location (Street/Zone)', 'e.g., Zone 57, Industrial Area Street 24', _workshopLocationController),
        _buildInputField('Commercial Registration (CR) Number', 'e.g., 102435', _workshopCrController, keyboardType: TextInputType.number),
      ],
    );
  }

  // ==========================================
  // STEP 3: AUTHORIZED REPRESENTATIVE DETAILS
  // ==========================================
  Widget _buildContactPersonStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepSectionHeader('Contact Person Information', 'Provide personal info for the authorized operations manager or business owner.'),
        _buildInputField('Full Legal Name', 'As written in QID passport data', _contactNameController),
        _buildInputField('Personal Mobile Number', '+974 3300 0000', _contactPhoneController, keyboardType: TextInputType.phone),
        _buildInputField('QID Identification Number', '29500000000', _contactIdController, keyboardType: TextInputType.number),
        _buildInputField('Date of Birth', 'DD/MM/YYYY', _contactDobController),
      ],
    );
  }

  // ==========================================
  // STEP 4: DOCUMENT UPLOADS
  // ==========================================
  Widget _buildUploadDocumentsStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepSectionHeader('Regulatory Filing Verification', 'Attach clear document scans or image files to complete our legal audit process.'),
        _buildFilePickerRow('Manager Qatar ID (Front & Back)', _qidUploaded, (state) => setState(() => _qidUploaded = state)),
        _buildFilePickerRow('Municipal Workshop License', _licenseUploaded, (state) => setState(() => _licenseUploaded = state)),
        _buildFilePickerRow('Valid Commercial Registration (CR)', _crUploaded, (state) => setState(() => _crUploaded = state)),
        _buildFilePickerRow('Workshop Front Facade Address Picture', _facadePhotoUploaded, (state) => setState(() => _facadePhotoUploaded = state)),
      ],
    );
  }

  Widget _buildFilePickerRow(String label, bool isUploaded, Function(bool) onToggleState) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(isUploaded ? Icons.verified_user : Icons.cloud_done_outlined, 
               color: isUploaded ? Colors.green : const Color(0xFF0282DD)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500)),
          ),
          TextButton(
            onPressed: () => onToggleState(!isUploaded),
            child: Text(isUploaded ? 'Replace' : 'Upload File', 
                        style: TextStyle(color: isUploaded ? Colors.grey : const Color(0xFF0282DD), fontSize: 13)),
          )
        ],
      ),
    );
  }

  // ==========================================
  // STEP 5: APPLICATION SUBMITTED AUDIT
  // ==========================================
  Widget _buildSubmittedReviewStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 24),
        const Text('⚙️', style: TextStyle(fontSize: 60)),
        const SizedBox(height: 16),
        const Text(
          'Application Under Review',
          style: TextStyle(fontFamily: 'Inter', fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        const SizedBox(height: 8),
        Text(
          'Our team is verifying your establishment records against ministry data sources.',
          textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500, height: 1.4),
        ),
        const SizedBox(height: 36),
        _buildTimelineTile('1', 'Corporate Asset Verification', 'Review of your municipal workshop license and CR data structure. Processing window: 1–2 weeks.'),
        _buildTimelineTile('2', 'SMS Merchant Token Dispatch', 'Once approved, an encrypted merchant token will be texted to your contact number to activate the account.'),
        _buildTimelineTile('3', 'Live Dispatch Integration', 'Turn on your tracking status to begin receiving commercial mechanical requests nearby.'),
        const SizedBox(height: 40),
        
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF111827), foregroundColor: Colors.white),
            onPressed: _nextStep,
            child: const Text('Simulate Admin Verification Clearances ⚡', style: TextStyle(fontSize: 12)),
          ),
        )
      ],
    );
  }

  Widget _buildTimelineTile(String index, String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(radius: 11, backgroundColor: const Color(0xFF111827), child: Text(index, style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold))),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
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
  // STEP 6: ACCOUNT APPROVED WELCOME
  // ==========================================
  Widget _buildWelcomeApprovalStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 20),
        const Text('🛠️', style: TextStyle(fontSize: 54)),
        const SizedBox(height: 16),
        const Text(
          'Workshop Accredited Successfully',
          textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'Inter', fontSize: 21, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.withValues(alpha: 0.15))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('🟢 Approved Commercial Services:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.green)),
              const SizedBox(height: 8),
              Text('• Merchant Entity: ${_workshopNameController.text.isEmpty ? "Registered Partner Garage" : _workshopNameController.text}', style: const TextStyle(fontSize: 13)),
              const Text('• Dispatch Allocations: Mobile roadside assistance, mechanical diagnostics, emergency battery support', style: TextStyle(fontSize: 13, height: 1.3)),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.amber.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.withValues(alpha: 0.2))),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('⚠️ ', style: TextStyle(fontSize: 14)),
              Expanded(
                child: Text(
                  'Regulatory Safety Compliance: All mechanic dispatches must use certified, high-visibility equipment. Field service pricing must strictly align with preset municipal tariff limits.',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF78350F), height: 1.4),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 44),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF111827),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              // 1. Perform database state commit here if needed (Supabase / local context state)
              
              // 2. Safely swap structural routing framework cleanly over to the named dashboard instance
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/workshop/dashboard',
                (Route<dynamic> route) => false, // Flush out historic form registration memory stack maps
              );
              
              // 3. Inform operator UI setup initialized successfully
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Facility authentication verified. Initializing Live Terminal Node...'),
                  backgroundColor: Color(0xFF111827),
                ),
              );
            },
            child: const Text('Go to Workshop Home Portal', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        )
      ],
    );
  }

  // ==========================================
  // HELPER REUSABLE WIDGET GENERATORS
  // ==========================================
  Widget _buildStepSectionHeader(String title, String description) {
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
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionControlFooter() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.shade100))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentStep > 0)
            TextButton(
              onPressed: _prevStep,
              child: const Text('Back', style: TextStyle(color: Color(0xFF0282DD))),
            ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0282DD), foregroundColor: Colors.white),
            onPressed: _nextStep,
            child: Text(_currentStep == 4 ? 'Simulate Approval' : 'Next', style: const TextStyle(fontSize: 13)),
          )
        ],
      ),
    );  }
}