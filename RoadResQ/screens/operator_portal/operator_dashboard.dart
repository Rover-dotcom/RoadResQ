import 'package:flutter/material.dart';
import 'job_accepted.dart'; // Make sure this path matches your file structure

class OperatorDashboard extends StatefulWidget {
  const OperatorDashboard({super.key});

  @override
  State<OperatorDashboard> createState() => _OperatorDashboardState();
}

class _OperatorDashboardState extends State<OperatorDashboard> {
  bool _isOnline = true;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Mock incoming requests data
  final List<Map<String, dynamic>> _incomingRequests = [
    {
      "id": "JOB-9821",
      "customer": "Ahmed Al-Thani",
      "issue": "Flat Tire - Flatbed Required",
      "location": "West Bay, Doha",
      "distance": "2.4 km"
    },
    {
      "id": "JOB-4412",
      "customer": "Sarah Connor",
      "issue": "Engine Overheat - Hook & Chain",
      "location": "Mesaieed Industrial City",
      "distance": "12.8 km"
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFF0F0F11),
      drawer: _buildSettingsDrawer(context),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  children: [
                    _buildLiveMapSection(),
                    _buildMetricsGrid(),
                    _buildIncomingRequestsSection(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            _buildOfflineToggle(),
          ],
        ),
      ),
    );
  }

  // Premium Header Layout
  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF16161A),
        border: Border(bottom: BorderSide(color: Color(0xFF26262B), width: 1)),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _scaffoldKey.currentState?.openDrawer(),
            child: Stack(
              alignment: Alignment.bottomRight,
              children: [
                const CircleAvatar(
                  radius: 24,
                  backgroundColor: Color(0xFF33333A),
                  backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb'), 
                ),
                Container(
                  height: 12,
                  width: 12,
                  decoration: BoxDecoration(
                    color: _isOnline ? const Color(0xFF10B981) : Colors.grey,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF16161A), width: 2),
                  ),
                )
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Hamza",
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
                const SizedBox(height: 2),
                Row(
                  children: const [
                    Icon(Icons.local_shipping_outlined, color: Color(0xFFB8B8C4), size: 14),
                    SizedBox(width: 4),
                    Text(
                      "Heavy Tow Truck (Plate 7741)",
                      style: TextStyle(color: Color(0xFF8E8E93), fontSize: 12),
                    ),
                  ],
                )
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: Colors.white),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          )
        ],
      ),
    );
  }

  // Settings & Navigation Sidebar Drawer
  Widget _buildSettingsDrawer(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFF16161A),
        child: Column(
          children: [
            const UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: Color(0xFF0F0F11)),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Color(0xFF26262B),
                child: Icon(Icons.person, color: Colors.white),
              ),
              accountName: Text("Hamza", style: TextStyle(fontWeight: FontWeight.bold)),
              accountEmail: Text("operator@bbp.qa", style: TextStyle(color: Color(0xFF8E8E93))),
            ),
            ListTile(
              leading: const Icon(Icons.swap_horizontal_circle_outlined, color: Color(0xFF10B981)),
              title: const Text("Return to Customer App", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              subtitle: const Text("Switch views instantly", style: TextStyle(color: Color(0xFF8E8E93), fontSize: 11)),
              onTap: () {
                // 1. Close the navigation drawer side pane safely first
                Navigator.of(context).pop(); 
                
                // 2. Show user feedback notice
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text("Routing session back to Customer App view..."), 
                    backgroundColor: Color(0xFF013480),
                  ),
                );

                // 3. FIXED: Purge driver route tree from memory & reset stack seamlessly back to customer orchestrator
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/customer/home', 
                  (route) => false,
                );
              },
            ),
            const Divider(color: Color(0xFF26262B)),
            _buildDrawerItem(Icons.history_rounded, "Job Archive & Logs", () {}),
            _buildDrawerItem(Icons.account_balance_wallet_outlined, "Payout Methods", () {}),
            _buildDrawerItem(Icons.verified_user_outlined, "Compliance & Permits", () {}),
            _buildDrawerItem(Icons.settings_outlined, "App Settings", () {}),
            const Spacer(),
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text("BBP Logistics v2.4.0", style: TextStyle(color: Color(0xFF44444F), fontSize: 12)),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFF8E8E93)),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 14)),
      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF44444F), size: 18),
      onTap: onTap,
    );
  }

  // Simulated Map Viewbox
  Widget _buildLiveMapSection() {
    return Container(
      height: 200,
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C21),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF26262B)),
      ),
      alignment: Alignment.center,
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.15,
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 8),
                itemCount: 64,
                itemBuilder: (context, index) => Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white10, width: 0.5),
                  ),
                ),
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.fmd_good, color: Colors.white, size: 36),
                const SizedBox(height: 8),
                Text(
                  "Tracking Live in Doha Skyline Zone",
                  style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, letterSpacing: 0.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Dashboard Summary Matrix Blocks
  Widget _buildMetricsGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(child: _buildMetricTile("Jobs Finished", "14", Icons.task_alt, Colors.white)),
          const SizedBox(width: 12),
          Expanded(child: _buildMetricTile("Rating Status", "4.95 ★", Icons.star_outline_rounded, Colors.white)),
          const SizedBox(width: 12),
          Expanded(child: _buildMetricTile("Gross Earned", "QAR 3,450", Icons.payments_outlined, const Color(0xFF10B981))),
        ],
      ),
    );
  }

  Widget _buildMetricTile(String title, String value, IconData icon, Color valColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16161A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF26262B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF8E8E93), size: 20),
          const SizedBox(height: 16),
          Text(value, style: TextStyle(color: valColor, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Color(0xFF636366), fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  // Page View Layout for processing multiple incoming dispatch logs
  Widget _buildIncomingRequestsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16, top: 24, bottom: 12),
          child: Text(
            "DISPATCH QUEUE (${_incomingRequests.length})",
            style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
        ),
        if (_incomingRequests.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32.0),
              child: Text("Scanning for nearby dispatch calls...", style: TextStyle(color: Color(0xFF44444F))),
            ),
          )
        else
          SizedBox(
            height: 210,
            child: PageView.builder(
              itemCount: _incomingRequests.length,
              controller: PageController(viewportFraction: 0.92),
              itemBuilder: (context, index) {
                final job = _incomingRequests[index];
                return _buildJobOfferCard(context, job, index);
              },
            ),
          )
      ],
    );
  }

  Widget _buildJobOfferCard(BuildContext context, Map<String, dynamic> job, int index) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C21),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF3A3A42), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(job["id"], style: const TextStyle(color: Color(0xFF8E8E93), fontWeight: FontWeight.bold, fontSize: 13)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFF26262B), borderRadius: BorderRadius.circular(4)),
                child: Text(job["distance"], style: const TextStyle(color: Colors.white, fontSize: 11)),
              )
            ],
          ),
          const SizedBox(height: 12),
          Text(job["customer"], style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(job["issue"], style: const TextStyle(color: Color(0xFFB8B8C4), fontSize: 13)),
          Row(
            children: [
              const Icon(Icons.fmd_good, color: Color(0xFF636366), size: 14),
              const SizedBox(width: 4),
              Text(job["location"], style: const TextStyle(color: Color(0xFF636366), fontSize: 12)),
            ],
          ),
          const Spacer(),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF3A3A42)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    setState(() {
                      _incomingRequests.removeAt(index);
                    });
                  },
                  child: const Text("Decline", style: TextStyle(color: Color(0xFFE54B4B), fontSize: 14)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => JobAcceptedScreen(jobDetails: job)),
                    );
                  },
                  child: const Text("Accept Job", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  // Go Offline Base Command Panel Toggle
  Widget _buildOfflineToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: const BoxDecoration(
        color: Color(0xFF16161A),
        border: Border(top: BorderSide(color: Color(0xFF26262B))),
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: _isOnline ? const Color(0xFF26262B) : const Color(0xFF10B981),
          minimumSize: const Size(double.infinity, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        onPressed: () {
          setState(() {
            _isOnline = !_isOnline;
          });
        },
        child: Text(
          _isOnline ? "Go Offline Mode" : "Go Active Online",
          style: TextStyle(
            color: _isOnline ? const Color(0xFFE54B4B) : Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}