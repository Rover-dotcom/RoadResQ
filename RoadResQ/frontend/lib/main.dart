import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

// 1. Operator Portal 
import 'package:road_resq/screens/operator_portal/operator_dashboard.dart'; 

// Workshop Portal 
import 'package:road_resq/screens/workshop_portal/Workshop_dashboard.dart';

// Login and Authentication Flow Screens
import 'screens/login/login_flow.dart';

// Centralized Home Screen with Service Selection Hub
import 'screens/home/home_screen.dart';

// Tow Service
import 'package:road_resq/screens/tow-service/tow_flow_wizard.dart';

// Heavy Transport Service
import 'screens/heavy-transport-service/heavy_transport_flow_coordinator.dart';

// Inquiry (industrial) Service
import 'screens/industrial-inquiry/industrial_inquiry_wizard.dart';

// Mechanical Repair Service
import 'screens/repair-service/repair_type_screen.dart';
import 'screens/repair-service/vehicle_details_repair_screen.dart';
import 'screens/repair-service/select_issue_screen.dart';
import 'screens/repair-service/explain_issue_screen.dart';
import 'screens/repair-service/select_garage_screen.dart';
import 'screens/repair-service/problem_information_screen.dart';
import 'screens/repair-service/summary_screen.dart';
import 'screens/repair-service/driver_assigned_screen.dart';
import 'screens/repair-service/repair_status_screen.dart';
import 'screens/repair-service/job_completed_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const RoadResQApp());
}

class RoadResQApp extends StatelessWidget {
  const RoadResQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RoadResQ Enterprise',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: Colors.white,
        primaryColor: const Color(0xFF013480),
        fontFamily: 'Inter',
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.bold),
          titleLarge: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.w600),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const ApplicationFlowOrchestrator(),
        '/workshop/dashboard': (context) => const WorkshopDashboard(),
        '/driver/dashboard': (context) => const OperatorDashboard(),
        '/customer/home': (context) => const ApplicationFlowOrchestrator(),
      },
    );
  }
}

class ApplicationFlowOrchestrator extends StatefulWidget {
  const ApplicationFlowOrchestrator({super.key});

  @override
  State<ApplicationFlowOrchestrator> createState() => _ApplicationFlowOrchestratorState();
}

class _ApplicationFlowOrchestratorState extends State<ApplicationFlowOrchestrator> {
  // FIXED: Lowercase initialization state matching state routing matrix targets perfectly
  String _currentRouteState = 'welcome';
  String _temporaryUserEmail = '';

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: _buildCurrentActiveScreen(),
    );
  }

  Widget _buildCurrentActiveScreen() {
    switch (_currentRouteState) {
      case 'welcome':
        return WelcomeScreen(
          key: const ValueKey('welcome_view'),
          onLoginWithEmail: () => setState(() => _currentRouteState = 'login'),
          onSignup: () => setState(() => _currentRouteState = 'signup'),
          onLoginWithGoogle: () => _handleOAuthSuccess("Google"),
          onLoginWithApple: () => _handleOAuthSuccess("Apple"),
        );

      case 'login':
        return LoginScreen(
          key: const ValueKey('login_view'),
          onBack: () => setState(() => _currentRouteState = 'welcome'),
          onNavigateToSignup: () => setState(() => _currentRouteState = 'signup'),
          onForgotPassword: () => setState(() => _currentRouteState = 'forgot_password'),
          onLoginSuccess: () {
            setState(() {
              _temporaryUserEmail = "user@roadresq.com"; 
              _currentRouteState = 'otp';
            });
          },
        );

      case 'signup':
        return SignupScreen(
          key: const ValueKey('signup_view'),
          onBack: () => setState(() => _currentRouteState = 'welcome'),
          onNavigateToLogin: () => setState(() => _currentRouteState = 'login'),
          onSignupSuccess: () {
            setState(() {
              _temporaryUserEmail = "newuser@roadresq.com";
              _currentRouteState = 'otp';
            });
          },
        );

      case 'otp':
        return VerificationCodeScreen(
          key: const ValueKey('otp_view'),
          email: _temporaryUserEmail,
          onBack: () => setState(() => _currentRouteState = 'login'),
          onResend: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Verification packet re-transmitted.')),
            );
          },
          onVerify: () {
            _showSuccessBanner('Identity verified successfully.');
            setState(() => _currentRouteState = 'home');
          },
        );

      case 'forgot_password':
        return ForgotPasswordScreen(
          key: const ValueKey('forgot_password_view'),
          onBack: () => setState(() => _currentRouteState = 'login'),
          onResetLinkSent: (identifier) {
            setState(() {
              _temporaryUserEmail = identifier;
              _currentRouteState = 'change_password';
            });
          },
        );

      case 'change_password':
        return ChangePasswordScreen(
          key: const ValueKey('change_password_view'),
          onBack: () => setState(() => _currentRouteState = 'forgot_password'),
          PasswordUpdatedSuccessfully: () {
            _showSuccessBanner('Password updated. Please log in with your new credentials.');
            setState(() => _currentRouteState = 'login');
          },
        );

      case 'home':
        return HomeScreen(
          key: const ValueKey('home_view'),
          userName: "Hamza",
          onLogout: () {
            _showSuccessBanner('Session closed securely.');
            setState(() => _currentRouteState = 'welcome');
          },
          onServiceSelect: (int serviceId) {
            if (serviceId == 1) {
              setState(() => _currentRouteState = 'tow_flow');
            } else if (serviceId == 2) {
              setState(() => _currentRouteState = 'repair_flow');
            } else if (serviceId == 3) {
              setState(() => _currentRouteState = 'heavy_transport_flow');
            } else if (serviceId == 4) {
              setState(() => _currentRouteState = 'industrial_inquiry_flow');
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Logistics Service Module #$serviceId initialized.'),
                  backgroundColor: const Color(0xFF013480),
                ),
              );
            }
          },
        );

      case 'tow_flow':
        return const Scaffold(
          key: ValueKey('tow_flow_view'),
          body: TowFlowWizard(),
        );

      case 'repair_flow':
        return RepairFlowWizard(
          key: const ValueKey('repair_flow_view'),
          onExitFlow: () => setState(() => _currentRouteState = 'home'),
        );

      case 'heavy_transport_flow':
        return HeavyTransportFlowCoordinator(
          key: const ValueKey('heavy_transport_view'),
          onExitFlow: () => setState(() => _currentRouteState = 'home'),
        );

      case 'industrial_inquiry_flow':
        return IndustrialInquiryWizard(
          key: const ValueKey('industrial_inquiry_wizard_view'),
          onExitFlow: () => setState(() => _currentRouteState = 'home'),
        );

      default:
        // FIXED: Fully populated with exact UI controller closures to prevent empty callbacks 
        return WelcomeScreen(
          key: const ValueKey('fallback_view'),
          onLoginWithEmail: () => setState(() => _currentRouteState = 'login'),
          onSignup: () => setState(() => _currentRouteState = 'signup'),
          onLoginWithGoogle: () => _handleOAuthSuccess("Google"),
          onLoginWithApple: () => _handleOAuthSuccess("Apple"),
        );
    }
  }

  void _handleOAuthSuccess(String provider) {
    _showSuccessBanner('Authenticated smoothly via $provider platform token.');
    setState(() => _currentRouteState = 'home');
  }

  void _showSuccessBanner(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontFamily: 'Inter')),
        backgroundColor: const Color(0xFF013480),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

/// Master Repair Navigation Controller
class RepairFlowWizard extends StatefulWidget {
  final VoidCallback onExitFlow;

  const RepairFlowWizard({super.key, required this.onExitFlow});

  @override
  State<RepairFlowWizard> createState() => _RepairFlowWizardState();
}

class _RepairFlowWizardState extends State<RepairFlowWizard> {
  int _currentStepIndex = 0;
  List<String> _selectedIssues = [];

  void _advance() => setState(() => _currentStepIndex++);
  
  void _regress() {
    if (_currentStepIndex == 0) {
      widget.onExitFlow();
    } else {
      setState(() {
        if (_currentStepIndex == 4 && !_selectedIssues.contains('other')) {
          _currentStepIndex = 2; 
        } else {
          _currentStepIndex--;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _regress();
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _buildWizardStep(),
      ),
    );
  }

  Widget _buildWizardStep() {
    switch (_currentStepIndex) {
      case 0:
        return RepairTypeScreen(
          key: const ValueKey('step_repair_type'),
          onBack: _regress,
          onContinue: (type) => _advance(),
        );
      case 1:
        return VehicleDetailsRepairScreen(
          key: const ValueKey('step_vehicle_details'),
          onBack: _regress,
          onContinue: (details) => _advance(),
        );
      case 2:
        return SelectIssueScreen(
          key: const ValueKey('step_select_issue'),
          onBack: _regress,
          onContinue: (issues) {
            _selectedIssues = issues;
            if (_selectedIssues.contains('other')) {
              _advance();
            } else {
              setState(() => _currentStepIndex = 4); 
            }
          },
        );
      case 3:
        return ExplainIssueScreen(
          key: const ValueKey('step_explain_issue'),
          onBack: _regress,
          onContinue: (explanation) => _advance(),
        );
      case 4:
        return SelectGarageScreen(
          key: const ValueKey('step_select_garage'),
          onBack: _regress,
          onContinue: (garage) => _advance(),
        );
      case 5:
        return ProblemInformationScreen(
          key: const ValueKey('step_problem_info'),
          onBack: _regress,
          onContinue: (timeline, photoPath) => _advance(),
        );
      case 6:
        return SummaryScreen(
          key: const ValueKey('step_summary'),
          onBack: _regress,
          onConfirm: _advance,
        );
      case 7:
        return DriverAssignedScreen(
          key: const ValueKey('step_driver_assigned'),
          onTrackProgress: _advance,
        );
      case 8:
        return RepairStatusScreen(
          key: const ValueKey('step_repair_status'),
          onJobCompletedMockTrigger: _advance,
        );
      case 9:
        return JobCompletedScreen(
          key: const ValueKey('step_job_completed'),
          onReturnHome: widget.onExitFlow,
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
