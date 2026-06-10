import 'package:flutter/material.dart';

enum JobProgressState {
  accepted,
  arrived,
  loaded,
  safetyCheck,
  enRoute,
  completed
}

class JobAcceptedScreen extends StatefulWidget {
  final Map<String, dynamic> jobDetails;
  const JobAcceptedScreen({super.key, required this.jobDetails});

  @override
  State<JobAcceptedScreen> createState() => _JobAcceptedScreenState();
}

class _JobAcceptedScreenState extends State<JobAcceptedScreen> {
  JobProgressState _currentState = JobProgressState.accepted;

  // Mandatory Safety Checklist state
  bool _hookSecured = false;
  bool _winchLocked = false;
  bool _lightsOn = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F11),
      appBar: AppBar(
        backgroundColor: const Color(0xFF16161A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
            ),
            const SizedBox(width: 8),
            const Text(
              "ACTIVE STATUS: DISPATCHED",
              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.8),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFF26262B), height: 1),
        ),
      ),
      body: Column(
        children: [
          // Dynamic Map Area if not completed or running checklist
          if (_currentState != JobProgressState.safetyCheck && _currentState != JobProgressState.completed)
            _buildInteractiveTrackingMap(),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _buildLifecycleStateView(),
            ),
          ),
          _buildActionControlPanel(),
        ],
      ),
    );
  }

  // Tracking visualization mapping module representation
  Widget _buildInteractiveTrackingMap() {
    return Container(
      height: 240,
      width: double.infinity,
      color: const Color(0xFF1C1C21),
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: Container(
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage('https://images.unsplash.com/photo-1524661135-423995f22d0b'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: 20,
            left: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              // ignore: deprecated_member_use
              decoration: BoxDecoration(color: Colors.black.withOpacity(0.8), borderRadius: BorderRadius.circular(4)),
              child: Text(
                "Routing Destination: ${widget.jobDetails['location']}",
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
          const Center(
            child: Icon(Icons.navigation_rounded, color: Colors.white, size: 40),
          )
        ],
      ),
    );
  }

  // Dynamic content renderer mapped to internal engine state
  Widget _buildLifecycleStateView() {
    switch (_currentState) {
      case JobProgressState.accepted:
      case JobProgressState.arrived:
      case JobProgressState.loaded:
      case JobProgressState.enRoute:
        return _buildStandardJobDetailsCard();
      case JobProgressState.safetyCheck:
        return _buildPreTripSafetyForm();
      case JobProgressState.completed:
        return _buildCompletionSummaryScreen();
    }
  }

  // Core Data Visualizer Layout
  Widget _buildStandardJobDetailsCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.jobDetails['id'], style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(widget.jobDetails['customer'], style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              ],
            ),
            // Communication Suite Channels
            Row(
              children: [
                _buildCommCircleButton(Icons.chat_bubble_outline_rounded, () {}),
                const SizedBox(width: 12),
                _buildCommCircleButton(Icons.phone_enabled_outlined, () {}),
              ],
            )
          ],
        ),
        const SizedBox(height: 24),
        const Divider(color: Color(0xFF26262B)),
        const SizedBox(height: 16),
        const Text("REPORTED ISSUE STATUS", style: TextStyle(color: Color(0xFF636366), fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Text(widget.jobDetails['issue'], style: const TextStyle(color: Colors.white, fontSize: 15)),
        const SizedBox(height: 20),
        const Text("PICKUP POINT ZONE", style: TextStyle(color: Color(0xFF636366), fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.location_on, color: Colors.white, size: 16),
            const SizedBox(width: 4),
            Text(widget.jobDetails['location'], style: const TextStyle(color: Color(0xFFB8B8C4), fontSize: 15)),
          ],
        ),
        const SizedBox(height: 24),
        _buildCurrentStatusAlertBanner(),
      ],
    );
  }

  Widget _buildCommCircleButton(IconData icon, VoidCallback onTap) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF16161A),
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFF26262B)),
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white, size: 20),
        onPressed: onTap,
      ),
    );
  }

  Widget _buildCurrentStatusAlertBanner() {
    String statusMsg = "";
    switch (_currentState) {
      case JobProgressState.accepted: statusMsg = "Proceed along navigation course to reach client."; break;
      case JobProgressState.arrived: statusMsg = "You are on site. Confirm safe connection setup with asset vehicle."; break;
      case JobProgressState.loaded: statusMsg = "Securing complete. Moving directly to safety compliance checklist."; break;
      case JobProgressState.enRoute: statusMsg = "En route safely to offloading yard depot."; break;
      default: break;
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF16161A), borderRadius: BorderRadius.circular(8)),
      child: Text(statusMsg, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 13)),
    );
  }

  // Pre-Trip Safety Compliance Form View
  Widget _buildPreTripSafetyForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.shield_outlined, color: Colors.white, size: 40),
        const SizedBox(height: 12),
        const Text("Mandatory Safety Verification", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        const Text("Verify structural alignment settings prior to initializing vehicle transport.", style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13)),
        const SizedBox(height: 24),
        _buildSafetyCheckbox("Towing Hook secured safely to structural chassis", _hookSecured, (val) => setState(() => _hookSecured = val!)),
        _buildSafetyCheckbox("Heavy Winch hydraulic locks fully closed", _winchLocked, (val) => setState(() => _winchLocked = val!)),
        _buildSafetyCheckbox("Hazard strobe beacon auxiliary lights active", _lightsOn, (val) => setState(() => _lightsOn = val!)),
      ],
    );
  }

  Widget _buildSafetyCheckbox(String title, bool currentVal, ValueChanged<bool?> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF16161A),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF26262B)),
      ),
      child: CheckboxListTile(
        title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 14)),
        value: currentVal,
        activeColor: Colors.white,
        checkColor: Colors.black,
        controlAffinity: ListTileControlAffinity.leading,
        onChanged: onChanged,
      ),
    );
  }

  // Job Completion Summary Screen
  Widget _buildCompletionSummaryScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(color: Color(0xFF16161A), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF10B981), size: 64),
          ),
          const SizedBox(height: 24),
          const Text("Job Logged & Finalized", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          // FIXED: Moved textAlign outside of the TextStyle constructor
          const Text(
            "Payload manifest ledger has been synchronized.", 
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF8E8E93)),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: const Color(0xFF16161A), borderRadius: BorderRadius.circular(12)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildFinalStat("Duration", "34 min"),
                Container(width: 1, height: 40, color: const Color(0xFF26262B)),
                _buildFinalStat("Payout", "QAR 280.00"),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildFinalStat(String label, String val) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF636366), fontSize: 12)),
        const SizedBox(height: 4),
        Text(val, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  // Persistent Action Control Panel Footer Panel
  Widget _buildActionControlPanel() {
    String actionLabel = "";
    VoidCallback? onActionPressed;
    bool isPrimaryEnabled = true;

    switch (_currentState) {
      case JobProgressState.accepted:
        actionLabel = "Mark: Arrived at Location";
        onActionPressed = () => setState(() => _currentState = JobProgressState.arrived);
        break;
      case JobProgressState.arrived:
        actionLabel = "Mark: Vehicle Loaded";
        onActionPressed = () => setState(() => _currentState = JobProgressState.loaded);
        break;
      case JobProgressState.loaded:
        actionLabel = "Proceed to Safety Run";
        onActionPressed = () => setState(() => _currentState = JobProgressState.safetyCheck);
        break;
      case JobProgressState.safetyCheck:
        actionLabel = "Start Job (Proceed)";
        isPrimaryEnabled = _hookSecured && _winchLocked && _lightsOn;
        onActionPressed = isPrimaryEnabled
            ? () => setState(() => _currentState = JobProgressState.enRoute)
            : null;
        break;
      case JobProgressState.enRoute:
        actionLabel = "Mark: Job Completed";
        onActionPressed = () => setState(() => _currentState = JobProgressState.completed);
        break;
      case JobProgressState.completed:
        actionLabel = "Return to Dashboard";
        onActionPressed = () => Navigator.of(context).pop();
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF16161A),
        border: Border(top: BorderSide(color: Color(0xFF26262B))),
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimaryEnabled ? Colors.white : const Color(0xFF26262B),
          foregroundColor: Colors.black,
          disabledBackgroundColor: const Color(0xFF1C1C21),
          disabledForegroundColor: const Color(0xFF44444F),
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          elevation: 0,
        ),
        onPressed: onActionPressed,
        child: Text(
          actionLabel,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.3),
        ),
      ),
    );
  }
}