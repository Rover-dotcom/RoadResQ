import 'package:flutter/material.dart';
import 'package:road_resq/screens/tow-service/tow_flow_models.dart';

class ScheduleTimeScreen extends StatefulWidget {
  final VoidCallback onBack;
  final Function(ScheduleType, String?) onContinue;

  const ScheduleTimeScreen({Key? key, required this.onBack, required this.onContinue}) : super(key: key);

  @override
  State<ScheduleTimeScreen> createState() => _ScheduleTimeScreenState();
}

class _ScheduleTimeScreenState extends State<ScheduleTimeScreen> {
  ScheduleType? _type;
  DateTime? _date;
  TimeOfDay? _time;

  bool get _canContinue => _type == ScheduleType.now || (_type == ScheduleType.later && _date != null && _time != null);

  String _formatDateTime() {
    if (_date == null || _time == null) return '';
    return '${_date!.toIso8601String().split('T')[0]} ${_time!.format(context)}';
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Column(
          children: [
            Container(
              height: 128,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFF013480), Color(0xFF0282DD)]),
              ),
              padding: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                      onPressed: widget.onBack,
                      style: IconButton.styleFrom(backgroundColor: Colors.white10),
                    ),
                    const Text('Schedule Time', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w500)),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('When do you need service?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                    const SizedBox(height: 16),
                    
                    // Mode Select Layout Segment
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _type = ScheduleType.now),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(
                                color: _type == ScheduleType.now ? const Color(0xFF013480) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: _type == ScheduleType.now ? Colors.transparent : Colors.grey.shade200),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.flash_on, color: _type == ScheduleType.now ? Colors.white : Colors.grey),
                                  const SizedBox(height: 8),
                                  Text('Immediate Help', style: TextStyle(color: _type == ScheduleType.now ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _type = ScheduleType.later),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(
                                color: _type == ScheduleType.later ? const Color(0xFF013480) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: _type == ScheduleType.later ? Colors.transparent : Colors.grey.shade200),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.calendar_month, color: _type == ScheduleType.later ? Colors.white : Colors.grey),
                                  const SizedBox(height: 8),
                                  Text('Schedule Later', style: TextStyle(color: _type == ScheduleType.later ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Smooth Accordion Animation Transition Wrapper
                    AnimatedSize(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOut,
                      child: _type == ScheduleType.later
                          ? Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.grey.shade100),
                              ),
                              child: Column(
                                children: [
                                  ListTile(
                                    title: Text(_date == null ? 'Select Target Date' : _date!.toIso8601String().split('T')[0]),
                                    trailing: const Icon(Icons.date_range),
                                    onTap: () async {
                                      DateTime? picked = await showDatePicker(
                                        context: context,
                                        initialDate: DateTime.now(),
                                        firstDate: DateTime.now(),
                                        lastDate: DateTime.now().add(const Duration(days: 30)),
                                      );
                                      if (picked != null) setState(() => _date = picked);
                                    },
                                  ),
                                  const Divider(),
                                  ListTile(
                                    title: Text(_time == null ? 'Select Target Time' : _time!.format(context)),
                                    trailing: const Icon(Icons.access_time),
                                    onTap: () async {
                                      TimeOfDay? picked = await showTimePicker(
                                        context: context,
                                        initialTime: TimeOfDay.now(),
                                      );
                                      if (picked != null) setState(() => _time = picked);
                                    },
                                  ),
                                ],
                              ),
                            )
                          : const SizedBox.shrink(),
                    )
                  ],
                ),
              ),
            )
          ],
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(20),
            color: const Color(0xFFF5F6F8),
            child: ElevatedButton(
              onPressed: _canContinue ? () => widget.onContinue(_type!, _type == ScheduleType.later ? _formatDateTime() : null) : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                backgroundColor: const Color(0xFF013480),
                disabledBackgroundColor: const Color(0xFF013480).withOpacity(0.4),
                foregroundColor: Colors.white,
              ),
              child: const Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        )
      ],
    );
  }
}