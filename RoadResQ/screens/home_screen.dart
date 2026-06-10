import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'tow_flow_wizard.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.fromLTRB(20, 60, 20, 24),
              decoration: BoxDecoration(gradient: AppTheme.primaryGradient, borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(24), bottomRight: Radius.circular(24))),
              child: Row(
                children: [
                  const CircleAvatar(radius: 24, backgroundColor: Colors.white, child: Icon(Icons.person, color: AppTheme.primaryBlue)),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome back 👋', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('Muhammad Sheraz', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                    child: const Row(children: [Icon(Icons.language, color: Colors.white, size: 16), SizedBox(width: 4), Text('En', style: TextStyle(color: Colors.white))]),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.notifications_none, color: Colors.white, size: 28),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Location Banner
                  Container(
                    width: double.infinity,
                    height: 90,
                    decoration: BoxDecoration(gradient: AppTheme.orangeGradient, borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.all(16),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Current location', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            SizedBox(height: 4),
                            Text('Main Bazaar, Khanewal', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        Icon(Icons.map_outlined, color: Colors.white, size: 40),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Grid Layout for services
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.3,
                    children: [
                      _buildServiceCard(context, 'Tow Service', Icons.local_shipping, () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const TowFlowWizard()));
                      }),
                      _buildServiceCard(context, 'Mechanical Repair', Icons.build, () {}),
                      _buildServiceCard(context, 'Heavy Transport', Icons.electric_rickshaw, () {}),
                      _buildServiceCard(context, 'Quote (industrial)', Icons.request_quote, () {}),
                    ],
                  ),
                  const SizedBox(height: 24),
                  
                  // Active Service Status
                  const Text('Active Service', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: const Row(
                      children: [
                        Icon(Icons.settings, color: Colors.grey),
                        SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Mechanical Repair', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('Apr 3, 2026', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                        Spacer(),
                        Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                      ],
                    ),
                  )
                ],
              ),
            )
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryBlue,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.explore), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Home'),
        ],
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            CircleAvatar(backgroundColor: AppTheme.lightBg, child: Icon(icon, color: AppTheme.primaryBlue)),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textDark)),
          ],
        ),
      ),
    );
  }
}