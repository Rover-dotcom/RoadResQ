import 'package:flutter/material.dart';
import 'inquiry_state_model.dart';

// --- STEP 1: PICKUP SELECTION ---
class InquiryPickupScreen extends StatelessWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  const InquiryPickupScreen({super.key, required this.data, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Industrial Hub Node', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 6),
          const Text('Define the core extraction or loading terminal vector.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Center(child: Text('📍 Interactive Industrial Vector Map Integration', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500))),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            color: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
            child: ListTile(
              leading: const Icon(Icons.location_on, color: Color(0xFF013480)),
              title: const Text('Configured Origin Point', style: TextStyle(fontSize: 12, color: Colors.grey)),
              subtitle: Text(data.pickupLocation, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Lock Pickup Matrix', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 2: DROPOFF SELECTION ---
class InquiryDropoffScreen extends StatelessWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryDropoffScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Destination Terminal', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 6),
          const Text('Specify offloading or drop-off perimeter coordinates.', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 24),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: const Center(child: Text('🏁 Offload Target Boundary Mapping Grid', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500))),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            color: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.grey.shade200)),
            child: ListTile(
              leading: const Icon(Icons.flag, color: Color(0xFFD4AF37)),
              title: const Text('Target Drop-off Terminal', style: TextStyle(fontSize: 12, color: Colors.grey)),
              subtitle: Text(data.dropoffLocation, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Calculate Route Vectors', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 3: SEND INQUIRY FORM CORE DETAILS ---
class InquiryCoreDetailsScreen extends StatefulWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryCoreDetailsScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  State<InquiryCoreDetailsScreen> createState() => _InquiryCoreDetailsScreenState();
}

class _InquiryCoreDetailsScreenState extends State<InquiryCoreDetailsScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Manifest Specifications', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('Declare the specific classification of structural load metrics.', style: TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 24),
              TextFormField(
                initialValue: widget.data.itemType,
                decoration: InputDecoration(
                  labelText: 'Service / Item Type',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.category, color: Color(0xFF013480)),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Field execution required' : null,
                onChanged: (val) => widget.data.itemType = val,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: widget.data.requirementDescription,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: 'Describe Operational Requirements',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Description metrics required' : null,
                onChanged: (val) => widget.data.requirementDescription = val,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: widget.data.loadCapacity,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Load Capacity Assessment Metric (e.g. 50 Tons)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.fitness_center, color: Color(0xFF013480)),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Capacity estimation required' : null,
                onChanged: (val) => widget.data.loadCapacity = val,
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) widget.onContinue();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF013480),
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Compile Core Parameters', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// --- STEP 4: TECHNICAL SPECIFICATIONS SCREEN ---
class InquiryTechSpecsScreen extends StatefulWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryTechSpecsScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  State<InquiryTechSpecsScreen> createState() => _InquiryTechSpecsScreenState();
}

class _InquiryTechSpecsScreenState extends State<InquiryTechSpecsScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Technical Specifications Matrix', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              TextFormField(
                initialValue: widget.data.itemSpecification,
                decoration: InputDecoration(labelText: 'Describe Structural Item Blueprint', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                validator: (val) => val!.isEmpty ? 'Specification data mandatory' : null,
                onChanged: (val) => widget.data.itemSpecification = val,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      initialValue: widget.data.dimensions,
                      decoration: InputDecoration(labelText: 'Dimensions (LxWxH m)', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                      validator: (val) => val!.isEmpty ? 'Required' : null,
                      onChanged: (val) => widget.data.dimensions = val,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      initialValue: widget.data.quantity,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: 'Quantity Pool', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                      validator: (val) => val!.isEmpty ? 'Required' : null,
                      onChanged: (val) => widget.data.quantity = val,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SwitchListTile.adaptive(
                title: const Text('Classified as Fragile / High Vulnerability Cargo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                activeColor: const Color(0xFF013480),
                value: widget.data.isFragile,
                onChanged: (val) => setState(() => widget.data.isFragile = val),
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: widget.data.accessRestrictions,
                decoration: InputDecoration(labelText: 'Site Access Restrictions / Security Clearance Constraints', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                onChanged: (val) => widget.data.accessRestrictions = val,
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.add_a_photo, size: 28, color: Color(0xFF013480)),
                    SizedBox(height: 8),
                    Text('Attach Structural Component / Manifest Blueprint Asset', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) widget.onContinue();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF013480),
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Verify Technical Specifications', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// --- STEP 5: CONTACT & CORPORATE SCHEDULING SCREEN ---
class InquiryContactScreen extends StatefulWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryContactScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  State<InquiryContactScreen> createState() => _InquiryContactScreenState();
}

class _InquiryContactScreenState extends State<InquiryContactScreen> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Corporate Verification Nodes', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              TextFormField(
                initialValue: widget.data.corporateName,
                decoration: InputDecoration(labelText: 'Company Name / Authorized Signatory Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                validator: (val) => val!.isEmpty ? 'Corporate profile verification metric required' : null,
                onChanged: (val) => widget.data.corporateName = val,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: widget.data.contactPhone,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: 'Contact Channel Phone Vector', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                validator: (val) => val!.isEmpty ? 'Required field execution' : null,
                onChanged: (val) => widget.data.contactPhone = val,
              ),
              const SizedBox(height: 16),
              TextFormField(
                initialValue: widget.data.contactEmail,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: 'Corporate Routing Email Address', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                validator: (val) => val!.isEmpty ? 'Required field execution' : null,
                onChanged: (val) => widget.data.contactEmail = val,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: widget.data.preferredCallTime,
                items: ["Morning (08:00 - 12:00)", "Afternoon (12:00 - 16:00)", "Evening (16:00 - 20:00)"]
                    .map((label) => DropdownMenuItem(value: label, child: Text(label)))
                    .toList(),
                onChanged: (val) => setState(() => widget.data.preferredCallTime = val!),
                decoration: InputDecoration(labelText: 'Optimal Synchronization Windows', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) widget.onContinue();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF013480),
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Lock Communications Link', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// --- STEP 6: SCHEDULING TIME MATRIX ---
class InquiryScheduleScreen extends StatefulWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryScheduleScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  State<InquiryScheduleScreen> createState() => _InquiryScheduleScreenState();
}

class _InquiryScheduleScreenState extends State<InquiryScheduleScreen> {
  @override
  Widget build(BuildContext context) {
    bool isInstant = widget.data.urgencyProtocol == "now";
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Deployment Urgency Level', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => widget.data.urgencyProtocol = "now"),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isInstant ? Colors.white : const Color(0xFFF1F3F5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isInstant ? const Color(0xFF013480) : Colors.transparent, width: 2),
                    ),
                    child: const Column(
                      children: [
                        Text('⚡', style: TextStyle(fontSize: 28)),
                        SizedBox(height: 6),
                        Text('Instant Dispatch', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => widget.data.urgencyProtocol = "schedule"),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: !isInstant ? Colors.white : const Color(0xFFF1F3F5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: !isInstant ? const Color(0xFF013480) : Colors.transparent, width: 2),
                    ),
                    child: const Column(
                      children: [
                        Text('📅', style: TextStyle(fontSize: 28)),
                        SizedBox(height: 6),
                        Text('Schedule Protocol', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          if (!isInstant) ...[
            const Text('Selected Advanced Window Horizon', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            ListTile(
              tileColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              leading: const Icon(Icons.calendar_month, color: Color(0xFF013480)),
              title: const Text('June 18, 2026 @ 09:30 AM', style: TextStyle(fontWeight: FontWeight.bold)),
              trailing: TextButton(onPressed: () {}, child: const Text('Modify Grid', style: TextStyle(color: Color(0xFFD4AF37)))),
            )
          ] else ...[
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 32.0),
                child: Text('🚀 Assets will lock deployment coordinates instantly upon authorization matching.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              ),
            )
          ],
          const Spacer(),
          ElevatedButton(
            onPressed: widget.onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Lock Timeline Horizon', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 7: VEHICLE SELECTION SCREEN ---
class InquiryVehicleSelectionScreen extends StatefulWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryVehicleSelectionScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  State<InquiryVehicleSelectionScreen> createState() => _InquiryVehicleSelectionScreenState();
}

class _InquiryVehicleSelectionScreenState extends State<InquiryVehicleSelectionScreen> {
  final List<String> fleets = ["Boom Truck", "Dump Truck", "Heavy Lowbed Rig", "Multi-Axle Trailer"];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Asset Class Specification', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          SwitchListTile.adaptive(
            title: const Text('Automatic Logistics Engine Selection', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            subtitle: const Text('System cross-analyzes load factors automatically to allocate vectors.'),
            value: widget.data.autoVehicleRecommendation,
            activeColor: const Color(0xFF013480),
            onChanged: (val) => setState(() => widget.data.autoVehicleRecommendation = val),
          ),
          const Divider(),
          const SizedBox(height: 12),
          if (!widget.data.autoVehicleRecommendation) ...[
            const Text('Manual Class Overrides (Optional)', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                itemCount: fleets.length,
                itemBuilder: (context, index) {
                  final asset = fleets[index];
                  final isTarget = widget.data.selectedVehicleClass == asset;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isTarget ? const Color(0xFF013480) : Colors.grey.shade200, width: 2),
                    ),
                    child: ListTile(
                      title: Text(asset, style: const TextStyle(fontWeight: FontWeight.bold)),
                      trailing: isTarget ? const Icon(Icons.check_circle, color: Color(0xFF013480)) : null,
                      onTap: () => setState(() => widget.data.selectedVehicleClass = asset),
                    ),
                  );
                },
              ),
            ),
          ] else ...[
            const Expanded(child: Center(child: Text('🤖 AI Routing Engine Optimization Engine Enabled', style: TextStyle(color: Colors.grey))))
          ],
          ElevatedButton(
            onPressed: widget.onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Compile Layout Pipeline', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 8: COMPREHENSIVE REVIEW SCREEN ---
class InquiryReviewScreen extends StatelessWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryReviewScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  Widget _buildSummaryNode(String heading, String evaluation) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 3, child: Text(heading, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500))),
          Expanded(flex: 4, child: Text(evaluation, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87, fontSize: 13))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Review Industrial Inquiry Manifest', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                _buildSummaryNode("Pickup Matrix Hub", data.pickupLocation),
                _buildSummaryNode("Dropoff Perimeters", data.dropoffLocation),
                _buildSummaryNode("Item Classification", data.itemType),
                _buildSummaryNode("Operational Payload", data.loadCapacity),
                _buildSummaryNode("Specifications Matrix", data.itemSpecification),
                _buildSummaryNode("Dimensions Scale", data.dimensions),
                _buildSummaryNode("Quantity Footprint", data.quantity),
                _buildSummaryNode("Fragile Status Flag", data.isFragile ? "CRITICAL VALUE LOCK" : "STANDARD ROUTING"),
                _buildSummaryNode("Corporate Structure", data.corporateName),
                _buildSummaryNode("Communications Anchor", data.contactPhone),
                _buildSummaryNode("Urgency Execution", data.urgencyProtocol.toUpperCase()),
                _buildSummaryNode("Logistics Allocation Method", data.autoVehicleRecommendation ? "Automated Optimization" : data.selectedVehicleClass),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Submit Verified Inquiry Request', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 9: PRICE ESTIMATE & ACCORDING HOLD SCREEN ---
class InquiryPriceAcceptanceScreen extends StatelessWidget {
  final InquiryStateModel data;
  final VoidCallback onContinue;
  final VoidCallback onBack;
  const InquiryPriceAcceptanceScreen({super.key, required this.data, required this.onContinue, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),
          const Icon(Icons.monetization_on, size: 72, color: Color(0xFFD4AF37)),
          const SizedBox(height: 16),
          const Text('Commercial Tariff Computation', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Calculated architectural cost base framework metrics for heavy logistics operations.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          Text(
            '${data.calculatedBaseTariff.toStringAsFixed(2)} QAR',
            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Color(0xFF013480), letterSpacing: -1),
          ),
          const Text('Guaranteed Industrial Holding Bracket Pricing', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const Spacer(),
          ElevatedButton(
            onPressed: onContinue,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF013480),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Accept Rates & Authorize Escrow Hold', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

// --- STEP 10: SCANNING/MATCHING DRIVER PROCESS ---
class InquiryDriverAssignmentScreen extends StatefulWidget {
  final VoidCallback onDriverAssigned;
  const InquiryDriverAssignmentScreen({super.key, required this.onDriverAssigned});

  @override
  State<InquiryDriverAssignmentScreen> createState() => _InquiryDriverAssignmentScreenState();
}

class _InquiryDriverAssignmentScreenState extends State<InquiryDriverAssignmentScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 4), widget.onDriverAssigned);
  }

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 60,
            height: 60,
            child: CircularProgressIndicator(strokeWidth: 4, valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF013480))),
          ),
          const SizedBox(height: 32),
          Text('Querying Operations Grid Matrix', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          SizedBox(height: 6),
          Text('Re-routing active regional transport operators to lock asset vectors...', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}

// --- STEP 11: TELEMETRY JOB PROGRESS & COMPLETION HUB ---
class InquiryJobProgressScreen extends StatelessWidget {
  final VoidCallback onJobCompleted;
  const InquiryJobProgressScreen({super.key, required this.onJobCompleted});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFF013480).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                child: const Text('TRANSIT RUNNING ACTIVE', style: TextStyle(color: Color(0xFF013480), fontWeight: FontWeight.bold, fontSize: 11)),
              ),
              const Text('ETA: 28 Mins', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Inquiry Dispatch Tracking', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Card(
            color: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
            child: const ListTile(
              leading: CircleAvatar(backgroundColor: Color(0xFFF1F3F5), child: Text('🏗️')),
              title: Text('Heavy Operator Team #4', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Vehicle Class Anchor: Multi-Axle Lowbed Rig'),
            ),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: onJobCompleted,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF22C55E),
              minimumSize: const Size(double.infinity, 54),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Finalize Operational Manifest Delivery', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}