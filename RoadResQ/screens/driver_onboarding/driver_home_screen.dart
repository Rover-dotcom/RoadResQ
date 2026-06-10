import 'package:flutter/material.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isOnline = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Deep luxury dark slate background
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isOnline ? Colors.green : Colors.amber, // Fixed: Swapped emerald for green
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _isOnline ? 'ONLINE • RECEIVING JOBS' : 'OFFLINE',
              style: TextStyle(
                fontFamily: 'Inter', 
                fontSize: 12, 
                fontWeight: FontWeight.bold, 
                color: _isOnline ? Colors.green : Colors.amber, // Fixed: Swapped emerald for green
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          Switch(
            value: _isOnline,
            activeTrackColor: Colors.green.withValues(alpha: 0.3), // Fixed: Swapped emerald for green
            activeColor: Colors.green, // Fixed: Swapped emerald for green
            inactiveThumbColor: Colors.grey,
            onChanged: (val) => setState(() => _isOnline = val),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Welcome Back, Captain',
              style: TextStyle(fontFamily: 'Inter', fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text('Operational Fleet Module Node: Active', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
            
            const SizedBox(height: 24),
            
            // METRICS GRID SECTION
            Row(
              children: [
                Expanded(child: _buildMetricCard('Total Earnings', '0.00 QAR', Icons.payments_outlined)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Completed Jobs', '0', Icons.local_shipping_outlined)),
              ],
            ),
            
            const SizedBox(height: 32),
            const Text(
              'Live Dispatch Operations Queue',
              style: TextStyle(fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            
            // LIVE TELEMETRY APP QUEUE STATE INDICATOR
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isOnline ? '📡' : '💤',
                      style: const TextStyle(fontSize: 44),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      _isOnline ? 'Scanning for active telemetry requests around radius...' : 'Switch toggle status tracking to online to start receiving regional logs.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontFamily: 'Inter', fontSize: 13, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String data, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF38BDF8), size: 20),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade400)),
          const SizedBox(height: 2),
          Text(data, style: const TextStyle(fontFamily: 'Inter', fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }
}