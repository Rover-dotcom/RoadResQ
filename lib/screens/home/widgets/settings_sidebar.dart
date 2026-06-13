import 'package:flutter/material.dart';
import '../../driver_onboarding/driver_onboarding_wizard.dart';
import '../../workshop_onboarding/workshop_wizard.dart';

enum SettingsView {
  main,
  language,
  appearance,
  locationPermissions,
  accountSettings,
  helpCenter,
}

class SettingsSidebar extends StatefulWidget {
  final String userName;
  final String userLocation;
  final VoidCallback onLogout;

  const SettingsSidebar({
    super.key,
    required this.userName,
    required this.userLocation,
    required this.onLogout,
  });

  @override
  State<SettingsSidebar> createState() => _SettingsSidebarState();
}

class _SettingsSidebarState extends State<SettingsSidebar> {
  // Navigation State
  SettingsView _currentView = SettingsView.main;

  // Configuration App States
  String _selectedLanguage = 'English';
  String _selectedTheme = 'System Default';
  bool _locationPermissionGranted = true;

  final String _currentUserEmail = 'hamza@roadresq.com'; 
  final String _termsPdfUrl = 'https://www.orimi.com/pdf-test.pdf';
  final String _privacyPdfUrl = 'https://www.orimi.com/pdf-test.pdf';

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(opacity: animation, child: child);
        },
        child: _buildCurrentView(),
      ),
    );
  }

  // ==========================================
  // ROUTER DISPATCHER
  // ==========================================
  Widget _buildCurrentView() {
    switch (_currentView) {
      case SettingsView.language:
        return _buildSubMenuPage('Language', _buildLanguageContent());
      case SettingsView.appearance:
        return _buildSubMenuPage('Appearance', _buildAppearanceContent());
      case SettingsView.locationPermissions:
        return _buildSubMenuPage('Location Permissions', _buildLocationContent());
      case SettingsView.accountSettings:
        return _buildSubMenuPage('Account Settings', _buildAccountContent());
      case SettingsView.helpCenter:
        return _buildSubMenuPage('Help Center', _buildHelpCenterContent());
      case SettingsView.main:
        return _buildMainSettingsList();
    }
  }

  // ==========================================
  // VIEW 1: MAIN SETTINGS MENU LIST
  // ==========================================
  Widget _buildMainSettingsList() {
    return Column(
      key: const ValueKey('MainView'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // --- SIDEBAR TOP BANNER HEADER ---
        Container(
          color: const Color(0xFF111827),
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 20,
            left: 20,
            right: 20,
            bottom: 20,
          ),
          child: const Text(
            'Settings Hub',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
        ),

        // --- USER PROFILE METRICS BAR ---
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6), width: 1)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFF3F4F6),
                ),
                child: const Icon(Icons.person_outline, color: Color(0xFF4B5563), size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.userName,
                      style: const TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$_currentUserEmail • ${widget.userLocation}',
                      style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF9CA3AF)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // --- SCROLLABLE MENUS SECTION LIST ---
        Expanded(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              // --- INTEGRATED MERCHANT GATEWAYS ---
              _buildSectionTitle('Merchant Controls'),

              // ── PERMANENTLY VISIBLE ADMIN PORTAL TILE ──────────────────────
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED), // Luxury Premium Gold Tint
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFFE4E6).withOpacity(0.5), width: 1),
                ),
                child: ListTile(
                  minLeadingWidth: 24,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: const Text('⚡', style: TextStyle(fontSize: 16)),
                  title: const Text(
                    'Enterprise Administration Suite',
                    style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFB45309)),
                  ),
                  subtitle: const Text(
                    'Manage systemic logs, finance, and driver validation',
                    style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Color(0xFFD97706)),
                  ),
                  trailing: const Icon(Icons.shield_outlined, size: 14, color: Color(0xFFD97706)),
                  onTap: () {
                    Navigator.pop(context); 
                    Navigator.pushNamed(context, '/admin/dashboard');
                  },
                ),
              ),
              const SizedBox(height: 4),

              ListTile(
                minLeadingWidth: 24,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
                leading: const Text('🏭', style: TextStyle(fontSize: 16)),
                title: const Text(
                  'Workshop Management Portal',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
                ),
                subtitle: const Text(
                  'Monitor active repair bays & logistics telemetry',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Color(0xFF9CA3AF)),
                ),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF9CA3AF)),
                onTap: () {
                  Navigator.pop(context); 
                  Navigator.pushNamed(context, '/workshop/dashboard');
                },
              ),

              ListTile(
                minLeadingWidth: 24,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
                leading: const Text('🚛', style: TextStyle(fontSize: 16)),
                title: const Text(
                  'Driver / Operator Portal',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827)),
                ),
                subtitle: const Text(
                  'Access active dispatches & active towing queue',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Color(0xFF9CA3AF)),
                ),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: Color(0xFF9CA3AF)),
                onTap: () {
                  Navigator.pop(context); 
                  Navigator.pushNamed(context, '/driver/dashboard');
                },
              ),
              
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Divider(height: 1, color: Color(0xFFE5E7EB)),
              ),

              _buildSectionTitle('Appearance & Location'),
              _buildNavigationItem('🌐', 'Language', _selectedLanguage, SettingsView.language),
              _buildNavigationItem('🎨', 'Appearance Theme', _selectedTheme, SettingsView.appearance),

              _buildSectionTitle('Alert Infrastructure'),
              _buildStaticSettingItem('🔔', 'Push Notifications', 'Real-time service dispatch alerts'),
              _buildStaticSettingItem('💬', 'SMS Alert Engine', 'Encrypted transactional system logs'),
              _buildStaticSettingItem('⚠️', 'Safety & Road Notifications', 'Regional zone and route monitoring updates'),

              _buildSectionTitle('Application Parameters'),
              _buildNavigationItem('📍', 'Location Permissions', _locationPermissionGranted ? 'Active Access' : 'Disabled', SettingsView.locationPermissions),
              _buildNavigationItem('⚙️', 'Account Workspace', 'Modify credentials', SettingsView.accountSettings),
              _buildNavigationItem('❓', 'Help & Documentation', 'Technical FAQ desk', SettingsView.helpCenter),
              
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Divider(height: 1, color: Color(0xFFF3F4F6)),
              ),

              // --- REGISTRATION / PARTNER INTERACTIVE TILES ---
              _buildSectionTitle('Partnership Portals'),
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                child: Column(
                  children: [
                    ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      tileColor: const Color(0xFFF9FAFB),
                      minLeadingWidth: 24,
                      leading: const Text('🚛', style: TextStyle(fontSize: 16)),
                      title: const Text('Become a Driver', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 11, color: Color(0xFF9CA3AF)),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const DriverOnboardingWizard()),
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                    ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      tileColor: const Color(0xFFF9FAFB),
                      minLeadingWidth: 24,
                      leading: const Text('🛠️', style: TextStyle(fontSize: 16)),
                      title: const Text('Register Workshop', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 11, color: Color(0xFF9CA3AF)),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const WorkshopOnboardingWizard()),
                        );
                      },
                    ),
                  ],
                ),
              ),

              _buildSectionTitle('Compliance & Legal Vault'),
              _buildDocumentItem('📋', 'Terms & Conditions Policies', 'Verify regional user agreements', _termsPdfUrl),
              _buildDocumentItem('🔐', 'Data Privacy Protocol', 'Review secure data compliance models', _privacyPdfUrl),
              
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Divider(height: 1, color: Color(0xFFF3F4F6)),
              ),

              // Logout Session Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: ListTile(
                  leading: const Padding(
                    padding: EdgeInsets.only(left: 4.0),
                    child: Text('🚪', style: TextStyle(fontSize: 16)),
                  ),
                  title: const Text(
                    'Terminate / Log Out Session', 
                    style: TextStyle(fontFamily: 'Inter', color: Colors.redAccent, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    widget.onLogout();
                  },
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        )
      ],
    );
  }

  // ==========================================
  // VIEW 2: SUB-MENU ROUTE CONTAINER WRAPPER
  // ==========================================
  Widget _buildSubMenuPage(String title, Widget content) {
    return Column(
      key: ValueKey(title),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          color: const Color(0xFF111827),
          padding: EdgeInsets.only(
            top: MediaQuery.of(context).padding.top + 16,
            left: 12,
            right: 16,
            bottom: 16,
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
                onPressed: () => setState(() => _currentView = SettingsView.main),
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(8),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.2),
              ),
            ],
          ),
        ),
        Expanded(child: content),
      ],
    );
  }

  Widget _buildLanguageContent() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        RadioListTile<String>(
          title: const Text('English', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'English',
          groupValue: _selectedLanguage,
          activeColor: const Color(0xFF111827),
          onChanged: _handleLanguageChange,
        ),
        RadioListTile<String>(
          title: const Text('Arabic (العربية)', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'Arabic (العربية)',
          groupValue: _selectedLanguage,
          activeColor: const Color(0xFF111827),
          onChanged: _handleLanguageChange,
        ),
        RadioListTile<String>(
          title: const Text('Spanish', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'Spanish',
          groupValue: _selectedLanguage,
          activeColor: const Color(0xFF111827),
          onChanged: _handleLanguageChange,
        ),
        RadioListTile<String>(
          title: const Text('French', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'French',
          groupValue: _selectedLanguage,
          activeColor: const Color(0xFF111827),
          onChanged: _handleLanguageChange,
        ),
      ],
    );
  }

  void _handleLanguageChange(String? val) {
    if (val != null) {
      setState(() {
        _selectedLanguage = val;
        _currentView = SettingsView.main;
      });
    }
  }

  Widget _buildAppearanceContent() {
    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        RadioListTile<String>(
          title: const Text('Light Profile View', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'Light Mode',
          groupValue: _selectedTheme,
          activeColor: const Color(0xFF111827),
          onChanged: _handleThemeChange,
        ),
        RadioListTile<String>(
          title: const Text('Dark Consolidated View', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'Dark Mode',
          groupValue: _selectedTheme,
          activeColor: const Color(0xFF111827),
          onChanged: _handleThemeChange,
        ),
        RadioListTile<String>(
          title: const Text('System Automated Sync', style: TextStyle(fontFamily: 'Inter', fontSize: 13)),
          value: 'System Default',
          groupValue: _selectedTheme,
          activeColor: const Color(0xFF111827),
          onChanged: _handleThemeChange,
        ),
      ],
    );
  }

  void _handleThemeChange(String? val) {
    if (val != null) {
      setState(() {
        _selectedTheme = val;
        _currentView = SettingsView.main;
      });
    }
  }

  Widget _buildLocationContent() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Secure operational live tracking maps utilize active background device telemetry to route near-proximity logistics resources safely across urban zones.',
            style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF6B7280), height: 1.5),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: SwitchListTile(
              title: const Text('Share Operational Telemetry', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
              value: _locationPermissionGranted,
              activeTrackColor: const Color(0xFF111827).withAlpha(51),
              activeThumbColor: const Color(0xFF111827),
              onChanged: (bool value) => setState(() => _locationPermissionGranted = value),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountContent() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _buildTextFieldForm('Merchant Full Name', widget.userName),
        const SizedBox(height: 18),
        _buildTextFieldForm('System Communication Email', _currentUserEmail),
        const SizedBox(height: 32),
        SizedBox(
          height: 46,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF111827), 
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              elevation: 0,
            ),
            onPressed: () => setState(() => _currentView = SettingsView.main),
            child: const Text('Commit Credentials Changes', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold)),
          ),
        )
      ],
    );
  }

  Widget _buildHelpCenterContent() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        ExpansionTile(
          shape: Border(),
          iconColor: Color(0xFF111827),
          title: Text('Average dispatch arrival timelines', style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          children: [
            Padding(
              padding: EdgeInsets.only(left: 16, right: 16, bottom: 16), 
              child: Text('Response logistics matrices scale dynamically based on zone distribution density. Average dispatch completions conclude within 15–30 standard runtime minutes.', style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF4B5563), height: 1.4))
            )
          ],
        ),
      ],
    );
  }

  // ==========================================
  // REUSABLE UI COMPONENT BUILDERS
  // ==========================================
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, top: 24, bottom: 8, right: 20),
      child: Text(
        title.toUpperCase(), 
        style: const TextStyle(fontFamily: 'Inter', fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF9CA3AF), letterSpacing: 0.6),
      ),
    );
  }

  Widget _buildNavigationItem(String emoji, String title, String value, SettingsView target) {
    return ListTile(
      minLeadingWidth: 24,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Text(emoji, style: const TextStyle(fontSize: 16)),
      title: Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF9CA3AF))),
          const SizedBox(width: 6),
          const Icon(Icons.arrow_forward_ios, size: 10, color: Color(0xFFE5E7EB)),
        ],
      ),
      onTap: () => setState(() => _currentView = target),
    );
  }

  Widget _buildStaticSettingItem(String emoji, String title, String subtitle) {
    return ListTile(
      minLeadingWidth: 24,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Text(emoji, style: const TextStyle(fontSize: 16)),
      title: Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
      subtitle: Text(subtitle, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF9CA3AF))),
      trailing: const Icon(Icons.arrow_forward_ios, size: 10, color: Color(0xFFE5E7EB)),
    );
  }

  Widget _buildDocumentItem(String emoji, String title, String subtitle, String docUrl) {
    return ListTile(
      minLeadingWidth: 24,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Text(emoji, style: const TextStyle(fontSize: 16)),
      title: Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF111827))),
      subtitle: Text(subtitle, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF9CA3AF))),
      trailing: const Icon(Icons.picture_as_pdf_outlined, size: 14, color: Color(0xFFE5E7EB)),
      onTap: () => _openPolicyDocument(docUrl),
    );
  }

  Widget _buildTextFieldForm(String label, String initialValue) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label, 
          style: const TextStyle(fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4B5563)),
        ),
        const SizedBox(height: 6),
        TextFormField(
          initialValue: initialValue,
          style: const TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF111827)),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF111827))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            filled: true,
            fillColor: const Color(0xFFF9FAFB), 
          ),
        ),
      ],
    );
  }
  
  void _openPolicyDocument(String docUrl) {}
}