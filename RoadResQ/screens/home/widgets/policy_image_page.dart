import 'package:flutter/material.dart';

class PolicyImagePage extends StatelessWidget {
  final String title;
  final String imageUrl;
  final bool isAsset; // Set to true if loading from local assets instead of internet URL

  const PolicyImagePage({
    super.key,
    required this.title,
    required this.imageUrl,
    this.isAsset = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E40AF), // Match RoadResQ Primary Brand Blue
        foregroundColor: Colors.white,
        title: Text(
          title,
          style: const TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Container(
        color: Colors.grey.shade100,
        width: double.infinity,
        height: double.infinity,
        // InteractiveViewer lets users natively pinch-to-zoom and drag around high-res images
        child: InteractiveViewer(
          maxScale: 5.0,
          minScale: 1.0,
          child: Center(
            child: isAsset
                ? Image.asset(
                    imageUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => _buildErrorWidget(),
                  )
                : Image.network(
                    imageUrl,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Center(child: CircularProgressIndicator(color: Color(0xFF1E40AF)));
                    },
                    errorBuilder: (context, error, stackTrace) => _buildErrorWidget(),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.broken_image_outlined, size: 48, color: Colors.grey),
        SizedBox(height: 12),
        Text(
          'Could not load policy document image.',
          style: TextStyle(fontFamily: 'Inter', fontSize: 14, color: Colors.grey),
        ),
      ],
    );
  }
}