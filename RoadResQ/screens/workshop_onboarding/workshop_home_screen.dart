import 'package:flutter/material.dart';

class WorkshopHomeScreen extends StatefulWidget {
  const WorkshopHomeScreen({super.key});

  @override
  State<WorkshopHomeScreen> createState() => _WorkshopHomeScreenState();
}

class _WorkshopHomeScreenState extends State<WorkshopHomeScreen> {
  bool _isAcceptingJobs = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Modern premium crisp background texture
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade200, height: 1),
        ),
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isAcceptingJobs ? Colors.green : Colors.grey,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _isAcceptingJobs ? 'GARAGE ACTIVE • RECEIVING REQUESTS' : 'GARAGE OFFLINE',
              style: TextStyle(
                fontFamily: 'Inter', 
                fontSize: 11, 
                fontWeight: FontWeight.bold, 
                color: _isAcceptingJobs ? Colors.green : Colors.grey.shade600,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
        actions: [
          Switch(
            value: _isAcceptingJobs,
            activeTrackColor: const Color(0xFF0282DD).withValues(alpha: 0.2),
            activeColor: const Color(0xFF0282DD),
            onChanged: (val) => setState(() => _isAcceptingJobs = val),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Workshop Console',
              style: TextStyle(fontFamily: 'Inter', fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            Text('Connected Facility Hub Server Node', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            
            const SizedBox(height: 24),
            
            // STATISTICAL METRIC DATA CARDS
            Row(
              children: [
                Expanded(child: _buildMetricBlock('Dispatched Invoiced', '0.00 QAR', Icons.analytics_outlined)),
                const SizedBox(width: 14),
                Expanded(child: _buildMetricBlock('Active Mechanics', '0 Active', Icons.engineering_outlined)),
              ],
            ),
            
            const SizedBox(height: 36),
            const Text(
              'Live Mechanical Allocation Board',
              style: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 12),
            
            Container(
              height: 260,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_isAcceptingJobs ? '⚡' : '💤', style: const TextStyle(fontSize: 40)),
                      const SizedBox(height: 12),
                      Text(
                        _isAcceptingJobs 
                          ? 'Listening for roadside diagnostics requests within territory limits...' 
                          : 'Set merchant switch status to active to place your garage back into the live regional dispatch loop.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade400, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
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
          Icon(iconData, color: const Color(0xFF0282DD), size: 22),
          const SizedBox(height: 14),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text(stateValue, style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}