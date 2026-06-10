import 'package:flutter/material.dart';

enum WorkshopFlowState {
  idleRequests,
  verificationArrived,
  repairInProgress,
  inputIssuesOptional,
  readyForPickupSelection,
  towLocationMapping,
  findingDriver,
  driverAssigned,
  towInProgress,
  jobCompleted,
}

class WorkshopDashboard extends StatefulWidget {
  const WorkshopDashboard({super.key});

  @override
  State<WorkshopDashboard> createState() => _WorkshopDashboardState();
}

class _WorkshopDashboardState extends State<WorkshopDashboard> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  WorkshopFlowState _currentState = WorkshopFlowState.idleRequests;
  bool _isAcceptingJobs = false; 

  final TextEditingController _pinController = TextEditingController();
  final TextEditingController _plateController = TextEditingController();
  final TextEditingController _issuesController = TextEditingController();
  final TextEditingController _pickupLocationController = TextEditingController();
  final TextEditingController _dropoffLocationController = TextEditingController();
  
  bool _photoUploaded = false;

  @override
  void initState() {
    super.initState();
    _resetControllersText();
  }

  void _resetControllersText() {
    _pickupLocationController.text = "Industrial Area, Street 10, Doha";
    _dropoffLocationController.text = "Salwa Road Warehouse Complex, Doha";
  }

  @override
  void dispose() {
    _pinController.dispose();
    _plateController.dispose();
    _issuesController.dispose();
    _pickupLocationController.dispose();
    _dropoffLocationController.dispose();
    super.dispose();
  }

  void _transitionTo(WorkshopFlowState state) {
    setState(() {
      _currentState = state;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: const Color(0xFFF8FAFC),
        
        appBar: AppBar(
          backgroundColor: const Color(0xFF111827),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white, size: 22),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          title: Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.grey.shade800, width: 1.5),
                  image: const DecorationImage(
                    image: NetworkImage('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=100&auto=format&fit=crop'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Doha Elite Auto Services',
                      style: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.star, color: Color(0xFFFBBF24), size: 11),
                        SizedBox(width: 2),
                        Text('4.9', style: TextStyle(fontFamily: 'Inter', fontSize: 10, color: Color(0xFF9CA3AF), fontWeight: FontWeight.bold)),
                        SizedBox(width: 6),
                        Text('• 1,420 Jobs', style: TextStyle(fontFamily: 'Inter', fontSize: 10, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            Center(
              child: Row(
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isAcceptingJobs ? Colors.green : Colors.grey.shade500,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isAcceptingJobs ? 'ACTIVE' : 'OFFLINE',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: _isAcceptingJobs ? Colors.green : Colors.grey.shade400,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            Switch(
              value: _isAcceptingJobs,
              activeTrackColor: const Color(0xFF0282DD).withOpacity(0.2),
              activeColor: const Color(0xFF0282DD),
              onChanged: (val) {
                setState(() {
                  _isAcceptingJobs = val;
                  if (!_isAcceptingJobs) _currentState = WorkshopFlowState.idleRequests;
                });
              },
            ),
            const SizedBox(width: 8),
          ],
        ),

        drawer: Drawer(
          child: Container(
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const UserAccountsDrawerHeader(
                  decoration: BoxDecoration(color: Color(0xFF111827)),
                  currentAccountPicture: CircleAvatar(
                    backgroundImage: NetworkImage('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=100&auto=format&fit=crop'),
                  ),
                  accountName: Text('Doha Elite Auto Services', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold)),
                  accountEmail: Text('operations@dohaeliteauto.qa', style: TextStyle(fontFamily: 'Inter', color: Color(0xFF9CA3AF), fontSize: 12)),
                ),
                
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 6.0),
                  child: ListTile(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    tileColor: const Color(0xFFEEF2F6),
                    leading: const Text('📱', style: TextStyle(fontSize: 18)),
                    title: const Text(
                      'Return to Customer App',
                      style: TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E3A8A)),
                    ),
                    trailing: const Icon(Icons.swap_horizontal_circle_outlined, size: 18, color: Color(0xFF1E3A8A)),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.of(context).pushNamedAndRemoveUntil(
                        '/customer/home',
                        (route) => false,
                      );
                    },
                  ),
                ),
                
                const Divider(height: 20),

                Expanded(
                  child: ListView(
                    padding: EdgeInsets.zero,
                    children: [
                      _buildDrawerSectionTitle('SYSTEM ARCHITECTURE'),
                      _buildDrawerItem('🌐', 'App Language', 'English Only'),
                      _buildDrawerItem('🎨', 'Aesthetic Mode', 'Luxury Monochrome'),
                      _buildDrawerItem('⚙️', 'Workshop Node', 'V2 Node'),
                      _buildDrawerItem('📍', 'Telemetry Radius', '15km Buffer'),
                      _buildDrawerItem('🛡️', 'Security Handshake', 'Passkey Verified'),
                    ],
                  ),
                ),
                
                const Divider(height: 1),
                ListTile(
                  leading: const Text('🚪', style: TextStyle(fontSize: 16)),
                  title: const Text('Disconnect Session', style: TextStyle(fontFamily: 'Inter', color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13)),
                  onTap: () => Navigator.pop(context),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),

        body: SafeArea(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                color: const Color(0xFF1F2937),
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                child: Text(
                  'FLOW VECTOR STATE: ${_currentState.name.toUpperCase()}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontFamily: 'Inter', color: Color(0xFF9CA3AF), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_currentState == WorkshopFlowState.idleRequests) ...[
                        const Text(
                          'Workshop Console',
                          style: TextStyle(fontFamily: 'Inter', fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        Text('Manage incoming diagnostic pipelines', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                        const SizedBox(height: 24),
                        
                        Row(
                          children: [
                            Expanded(child: _buildMetricBlock('GROSS INVOICED', '48,930 QAR', Icons.analytics_outlined)),
                            const SizedBox(width: 14),
                            Expanded(child: _buildMetricBlock('BAY CAPACITY', '4 Operators', Icons.engineering_outlined)),
                          ],
                        ),
                        const SizedBox(height: 32),
                      ],

                      _resolveActiveFlowPanel(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _resolveActiveFlowPanel() {
    if (!_isAcceptingJobs && _currentState == WorkshopFlowState.idleRequests) {
      return _panelOfflineGateway();
    }

    switch (_currentState) {
      case WorkshopFlowState.idleRequests:
        return _panelIncomingRequest();
      case WorkshopFlowState.verificationArrived:
        return _panelVehicleVerification();
      case WorkshopFlowState.repairInProgress:
        return _panelRepairInProgress();
      case WorkshopFlowState.inputIssuesOptional:
        return _panelInputIssuesOptional();
      case WorkshopFlowState.readyForPickupSelection:
        return _panelReadyForPickupSelection();
      case WorkshopFlowState.towLocationMapping:
        return _panelTowLocationMapping();
      case WorkshopFlowState.findingDriver:
        return _panelFindingDriver();
      case WorkshopFlowState.driverAssigned:
        return _panelDriverAssigned();
      case WorkshopFlowState.towInProgress:
        return _panelTowInProgress();
      case WorkshopFlowState.jobCompleted:
        return _panelJobCompleted();
    }
  }

  Widget _panelOfflineGateway() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'ALLOCATION BOARD',
          style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 12),
        Container(
          height: 240,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: const Center(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('💤', style: TextStyle(fontSize: 36)),
                  SizedBox(height: 12),
                  Text(
                    'Workshop is currently offline. Toggle active mode to process inbound diagnostic tickets.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF94A3B8), height: 1.4),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _panelIncomingRequest() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'ALLOCATION BOARD',
          style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 12),
        _buildWorkflowCard(
          title: 'Inbound Repair Request',
          subtitle: 'New breakdown incident routed from client app',
          icon: '🚨',
          children: [
            _buildMetaRow('Vehicle Identity', 'Land Cruiser V8 (White)'),
            _buildMetaRow('Reported Fault', 'Engine radiator thermal rupture overheating'),
            _buildMetaRow('Client Location', 'West Bay Zone, Doha'),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () {},
                    child: const Text('Decline Ticket', style: TextStyle(fontFamily: 'Inter', color: Colors.redAccent, fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF111827),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      elevation: 0,
                    ),
                    onPressed: () => _transitionTo(WorkshopFlowState.verificationArrived),
                    child: const Text('Accept & Bind Intake', style: TextStyle(fontFamily: 'Inter', color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            )
          ],
        ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            'Listening for remote roadside telemetry packets...',
            style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Colors.grey.shade400, fontWeight: FontWeight.w500),
          ),
        ),
      ],
    );
  }

  Widget _panelVehicleVerification() {
    return _buildWorkflowCard(
      title: 'Vehicle Intake Verification',
      subtitle: 'Validate secure pin verification details from the customer vehicle onboarding portal',
      icon: '🔐',
      children: [
        _buildTextField('Breakdown Safety Pin', '8402', _pinController, TextInputType.number),
        const SizedBox(height: 16),
        _buildTextField('Chassis / Registration Plate ID', '554322 QA', _plateController, TextInputType.text),
        const SizedBox(height: 20),
        const Text('Intake Walkaround Photo Status', style: TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => setState(() => _photoUploaded = true),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: _photoUploaded ? const Color(0xFF10B981) : const Color(0xFFD1D5DB), 
                style: BorderStyle.solid,
                width: _photoUploaded ? 1.5 : 1.0,
              ),
            ),
            child: Column(
              children: [
                Icon(_photoUploaded ? Icons.check_circle : Icons.camera_enhance_outlined, color: _photoUploaded ? const Color(0xFF10B981) : const Color(0xFF4B5563), size: 26),
                const SizedBox(height: 8),
                Text(
                  _photoUploaded ? 'Vehicle Photo Securely Logged' : 'Upload Vehicle Condition Photo',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.bold, color: _photoUploaded ? const Color(0xFF10B981) : const Color(0xFF111827)),
                )
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        _buildActionStackButton('Verify Identity & Open Bay', () {
          if (_pinController.text.isEmpty || _plateController.text.isEmpty || !_photoUploaded) return;
          _transitionTo(WorkshopFlowState.repairInProgress);
        })
      ],
    );
  }

  Widget _panelRepairInProgress() {
    return _buildWorkflowCard(
      title: 'Mechanical Repair Live',
      subtitle: 'Bay allocation locked; service staff executing vehicle repair pipeline',
      icon: '🛠️',
      children: [
        const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 24.0),
            child: SizedBox(
              width: 48,
              height: 48,
              child: CircularProgressIndicator(strokeWidth: 3.5, color: Color(0xFF111827)),
            ),
          ),
        ),
        _buildMetaRow('Assigned Workshop Bay', 'Senior Technologist Unit 4'),
        _buildMetaRow('Active Job Telemetry', 'Disassembling component infrastructure engines'),
        const SizedBox(height: 24),
        _buildActionStackButton('Advance to Issue Logging', () => _transitionTo(WorkshopFlowState.inputIssuesOptional)),
      ],
    );
  }

  Widget _panelInputIssuesOptional() {
    return _buildWorkflowCard(
      title: 'Additional Diagnostics (Optional)',
      subtitle: 'Document discovered faults directly onto client invoicing log metrics',
      icon: '📋',
      children: [
        _buildTextField('Discovered System Fault Remarks', '...', _issuesController, TextInputType.multiline, maxLines: 4),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF111827)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => _transitionTo(WorkshopFlowState.readyForPickupSelection),
                child: const Text('Skip & Notify', style: TextStyle(fontFamily: 'Inter', color: Color(0xFF111827), fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF111827),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                onPressed: () => _transitionTo(WorkshopFlowState.readyForPickupSelection),
                child: const Text('Commit to Matrix Ledger', style: TextStyle(fontFamily: 'Inter', color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        )
      ],
    );
  }

  Widget _panelReadyForPickupSelection() {
    return _buildWorkflowCard(
      title: 'Vehicle Release Options',
      subtitle: 'Repairs finished completely. Decide transition method back to owner custody',
      icon: '🏁',
      children: [
        const SizedBox(height: 8),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            elevation: 0,
          ),
          icon: const Icon(Icons.notification_important_outlined, color: Colors.white, size: 18),
          label: const Text('Signal Customer Ready for Self-Pickup', style: TextStyle(fontFamily: 'Inter', color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          onPressed: () => _transitionTo(WorkshopFlowState.jobCompleted),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 16.0),
          child: Row(
            children: [
              Expanded(child: Divider()),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 12.0),
                child: Text('OR REDIRECT TO HEAVY TRANSPORT', style: TextStyle(fontFamily: 'Inter', fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF9CA3AF))),
              ),
              Expanded(child: Divider()),
            ],
          ),
        ),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF111827),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            elevation: 0,
          ),
          icon: const Icon(Icons.local_shipping_outlined, color: Colors.white, size: 18),
          label: const Text('Request Rig Tow to Owner Destination', style: TextStyle(fontFamily: 'Inter', color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          onPressed: () => _transitionTo(WorkshopFlowState.towLocationMapping),
        ),
      ],
    );
  }

  Widget _panelTowLocationMapping() {
    return _buildWorkflowCard(
      title: 'Tow Destination Coordinates',
      subtitle: 'Coordinate localized delivery parameters with heavy breakdown transport fleet',
      icon: '📍',
      children: [
        _buildTextField('Pickup Source (Current Workshop)', '', _pickupLocationController, TextInputType.text),
        const SizedBox(height: 16),
        _buildTextField('Drop-off Target Destination', '', _dropoffLocationController, TextInputType.text),
        const SizedBox(height: 24),
        _buildActionStackButton('Initiate Fleet Dispatch', () => _transitionTo(WorkshopFlowState.findingDriver))
      ],
    );
  }

  Widget _panelFindingDriver() {
    return _buildWorkflowCard(
      title: 'Querying Available Haulers',
      subtitle: 'Broadcasting localized payload request parameters across Doha zones',
      icon: '🛰️',
      children: [
        const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 24.0),
            child: LinearProgressIndicator(color: Color(0xFF111827), backgroundColor: Color(0xFFE5E7EB)),
          ),
        ),
        const Text(
          'Pinging nearest open flatbeds and rigid tow recovery vehicles...',
          textAlign: TextAlign.center,
          style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF4B5563), height: 1.4),
        ),
        const SizedBox(height: 24),
        _buildActionStackButton('Simulate Driver Assignment Match', () => _transitionTo(WorkshopFlowState.driverAssigned))
      ],
    );
  }

  Widget _panelDriverAssigned() {
    return _buildWorkflowCard(
      title: 'Rig Hauler Dispatched',
      subtitle: 'Logistics transport contract locked with regional driver operator',
      icon: '🚛',
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(8)),
          child: const Row(
            children: [
              CircleAvatar(backgroundColor: Color(0xFF111827), child: Icon(Icons.person, color: Colors.white)),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Captain Ahmed Al-Mansoori', style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.bold, fontSize: 13)),
                    SizedBox(height: 4),
                    Text('Heavy Rigid Tow Rig • Plate #89324 QA', style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Color(0xFF4B5563))),
                  ],
                ),
              )
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildActionStackButton('Release Vehicle Keys to Hauler', () => _transitionTo(WorkshopFlowState.towInProgress))
      ],
    );
  }

  Widget _panelTowInProgress() {
    return _buildWorkflowCard(
      title: 'Tow Delivery In Progress',
      subtitle: 'Real-time vehicle tracking pipeline actively running',
      icon: '🛣️',
      children: [
        const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 16.0),
            child: CircularProgressIndicator(color: Colors.blueAccent),
          ),
        ),
        _buildMetaRow('Current Fleet Transit Phase', 'Passing Lusail Highway Corridor Intersections'),
        _buildMetaRow('Target Arrival Window Matrix', 'ETA approximately 14 Run Minutes'),
        const SizedBox(height: 24),
        _buildActionStackButton('Verify Destination Handshake', () => _transitionTo(WorkshopFlowState.jobCompleted))
      ],
    );
  }

  Widget _panelJobCompleted() {
    return _buildWorkflowCard(
      title: 'Operational Pipeline Cleared',
      subtitle: 'Transaction finalized seamlessly across BBP Enterprise modules',
      icon: '✅',
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(8)),
          child: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF2E7D32)),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Digital asset handshakes validated completely. Vehicle securely processed back to customer custody.',
                  style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF1B5E20), fontWeight: FontWeight.w500, height: 1.4),
                ),
              )
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildActionStackButton('Reset Console Ledger', () {
          _pinController.clear();
          _plateController.clear();
          _issuesController.clear();
          setState(() {
            _photoUploaded = false;
          });
          _transitionTo(WorkshopFlowState.idleRequests);
        })
      ],
    );
  }

  Widget _buildMetricBlock(String title, String stateValue, IconData iconData) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(iconData, color: const Color(0xFF0282DD), size: 20),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade400, fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(stateValue, style: const TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }

  Widget _buildWorkflowCard({
    required String title,
    required String subtitle,
    required String icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 12, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(icon, style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF111827), letterSpacing: -0.2)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF6B7280), height: 1.3)),
                  ],
                ),
              )
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16.0),
            child: Divider(height: 1, color: Color(0xFFF3F4F6)),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(String label, String hint, TextEditingController ctrl, TextInputType type, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          keyboardType: type,
          maxLines: maxLines,
          style: const TextStyle(fontFamily: 'Inter', fontSize: 13, color: Color(0xFF111827)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Colors.grey.shade400),
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF111827))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildMetaRow(String contextLabel, String terminalValue) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$contextLabel: ', style: const TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
          Expanded(child: Text(terminalValue, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF111827)))),
        ],
      ),
    );
  }

  Widget _buildActionStackButton(String coreTitle, VoidCallback actionTrigger) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF111827),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          elevation: 0,
        ),
        onPressed: actionTrigger,
        child: Text(coreTitle, style: const TextStyle(fontFamily: 'Inter', color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildDrawerSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 16, bottom: 8, right: 16),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontFamily: 'Inter', fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF9CA3AF), letterSpacing: 0.8),
      ),
    );
  }

  Widget _buildDrawerItem(String icon, String label, String trailingMeta) {
    return ListTile(
      minLeadingWidth: 20,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      leading: Text(icon, style: const TextStyle(fontSize: 14)),
      title: Text(label, style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF111827), fontWeight: FontWeight.w500)),
      trailing: Text(trailingMeta, style: TextStyle(fontFamily: 'Inter', fontSize: 11, color: Colors.grey.shade400)),
    );
  }
}