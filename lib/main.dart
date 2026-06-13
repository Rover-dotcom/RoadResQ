import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:road_resq/firebase_options.dart';
import 'package:road_resq/provider/driver_provider.dart';
import 'package:road_resq/provider/garage_provider.dart';
import 'package:road_resq/provider/job_provider.dart';
import 'package:road_resq/provider/login_provider.dart';
import 'package:road_resq/provider/quote_provider.dart';
import 'package:road_resq/theme/app_theme.dart';

// ─── Login Flow Screens ──────────────────────────────────────────────────────
import 'package:road_resq/screens/login/welcome_screen.dart';
import 'package:road_resq/screens/login/login_screen.dart';
import 'package:road_resq/screens/login/verification_code_screen.dart';
import 'package:road_resq/screens/login/signup_screen.dart';
import 'package:road_resq/screens/login/forgot_password_screen.dart';
import 'package:road_resq/screens/login/change_password_screen.dart';

// ─── Home Screen ─────────────────────────────────────────────────────────────
import 'package:road_resq/screens/home/home_screen.dart';

// ─── Service Flow Screens ────────────────────────────────────────────────────
import 'package:road_resq/screens/tow-service/tow_flow_wizard.dart' as tow_svc;
import 'package:road_resq/screens/heavy-transport-service/heavy_transport_flow_coordinator.dart';
import 'package:road_resq/screens/industrial-inquiry/industrial_inquiry_wizard.dart';
import 'package:road_resq/screens/repair-service/repair_type_screen.dart';
import 'package:road_resq/screens/repair-service/vehicle_details_repair_screen.dart';
import 'package:road_resq/screens/repair-service/select_issue_screen.dart';
import 'package:road_resq/screens/repair-service/explain_issue_screen.dart';
import 'package:road_resq/screens/repair-service/select_garage_screen.dart';
import 'package:road_resq/screens/repair-service/problem_information_screen.dart';
import 'package:road_resq/screens/repair-service/summary_screen.dart';
import 'package:road_resq/screens/repair-service/driver_assigned_screen.dart';
import 'package:road_resq/screens/repair-service/repair_status_screen.dart';
import 'package:road_resq/screens/repair-service/job_completed_screen.dart';

// ─── Portals ─────────────────────────────────────────────────────────────────
import 'package:road_resq/screens/operator_portal/operator_dashboard.dart';
import 'package:road_resq/screens/workshop_portal/workshop_dashboard.dart';

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
    return MultiProvider(
      providers: [
        // Auth
        ChangeNotifierProvider(create: (_) => LoginProvider()),
        // Job state
        ChangeNotifierProvider(create: (_) => JobProvider()),
        // Driver state
        ChangeNotifierProvider(create: (_) => DriverProvider()),
        // Garage state
        ChangeNotifierProvider(create: (_) => GarageProvider()),
        // Quote state
        ChangeNotifierProvider(create: (_) => QuoteProvider()),
      ],
      child: MaterialApp(
        title: 'RoadResQ',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        // Auth-state routing: show app flow based on Firebase Auth state
        home: const AuthGate(),
        routes: {
          // Workshop Hub Portal
          '/workshop/dashboard': (context) => const WorkshopDashboard(),
          // Driver / Operator Hub Portal
          '/driver/dashboard': (context) => const OperatorDashboard(),
          // Customer Home — returns to main flow
          '/customer/home': (context) => const AuthGate(),
        },
      ),
    );
  }
}

/// AuthGate listens to Firebase Auth state and routes accordingly.
/// - Logged in  → ApplicationFlowOrchestrator (home state)
/// - Logged out → ApplicationFlowOrchestrator (welcome state)
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        // Waiting for Firebase to respond
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            backgroundColor: AppTheme.lightBg,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/imports/RoadResQ-logo.png',
                    width: 200,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.local_shipping,
                      size: 80,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                  ),
                ],
              ),
            ),
          );
        }

        // User is signed in → go to home
        if (snapshot.hasData && snapshot.data != null) {
          return const ApplicationFlowOrchestrator(startState: 'home');
        }

        // User is not signed in → go to welcome
        return const ApplicationFlowOrchestrator(startState: 'welcome');
      },
    );
  }
}

/// Master navigation controller — manages the app's state machine.
/// Combines the frontend developer's flow-based navigation with real
/// backend providers for authentication and data.
class ApplicationFlowOrchestrator extends StatefulWidget {
  final String startState;

  const ApplicationFlowOrchestrator({
    super.key,
    this.startState = 'welcome',
  });

  @override
  State<ApplicationFlowOrchestrator> createState() =>
      _ApplicationFlowOrchestratorState();
}

class _ApplicationFlowOrchestratorState
    extends State<ApplicationFlowOrchestrator> {
  late String _currentRouteState;
  String _temporaryUserEmail = '';

  @override
  void initState() {
    super.initState();
    _currentRouteState = widget.startState;
  }

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
    final loginProvider = Provider.of<LoginProvider>(context, listen: false);
    final user = FirebaseAuth.instance.currentUser;
    final userName = user?.displayName ?? loginProvider.currentUser?.name ?? 'User';

    switch (_currentRouteState) {
      case 'welcome':
        return WelcomeScreen(
          key: const ValueKey('welcome_view'),
          onLoginWithEmail: () =>
              setState(() => _currentRouteState = 'login'),
          onSignup: () => setState(() => _currentRouteState = 'signup'),
          onLoginWithGoogle: () => _handleGoogleLogin(),
          onLoginWithApple: () => _handleOAuthSuccess("Apple"),
        );

      case 'login':
        return LoginScreen(
          key: const ValueKey('login_view'),
          onBack: () => setState(() => _currentRouteState = 'welcome'),
          onNavigateToSignup: () =>
              setState(() => _currentRouteState = 'signup'),
          onForgotPassword: () =>
              setState(() => _currentRouteState = 'forgot_password'),
          onLoginSuccess: () {
            // The real Firebase Auth is handled by AuthGate —
            // but the login screen's own callback handles navigation.
            // For the merged version, we trigger real login here.
            setState(() {
              _currentRouteState = 'home';
            });
          },
        );

      case 'signup':
        return SignupScreen(
          key: const ValueKey('signup_view'),
          onBack: () => setState(() => _currentRouteState = 'welcome'),
          onNavigateToLogin: () =>
              setState(() => _currentRouteState = 'login'),
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
              const SnackBar(
                  content: Text('Verification code re-sent.')),
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
          onBack: () =>
              setState(() => _currentRouteState = 'forgot_password'),
          PasswordUpdatedSuccessfully: () {
            _showSuccessBanner(
                'Password updated. Please log in with your new credentials.');
            setState(() => _currentRouteState = 'login');
          },
        );

      case 'home':
        return HomeScreen(
          key: const ValueKey('home_view'),
          userName: userName,
          onLogout: () async {
            await loginProvider.signOut(context);
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
                  content: Text(
                      'Service Module #$serviceId initialized.'),
                  backgroundColor: AppTheme.primaryBlue,
                ),
              );
            }
          },
        );

      case 'tow_flow':
        return tow_svc.TowFlowWizard(
          key: const ValueKey('tow_flow_view'),
          onExitFlow: () => setState(() => _currentRouteState = 'home'),
        );

      case 'repair_flow':
        return RepairFlowWizard(
          key: const ValueKey('repair_flow_view'),
          onExitFlow: () =>
              setState(() => _currentRouteState = 'home'),
        );

      case 'heavy_transport_flow':
        return HeavyTransportFlowCoordinator(
          key: const ValueKey('heavy_transport_view'),
          onExitFlow: () =>
              setState(() => _currentRouteState = 'home'),
        );

      case 'industrial_inquiry_flow':
        return IndustrialInquiryWizard(
          key: const ValueKey('industrial_inquiry_wizard_view'),
          onExitFlow: () =>
              setState(() => _currentRouteState = 'home'),
        );

      default:
        return WelcomeScreen(
          key: const ValueKey('fallback_view'),
          onLoginWithEmail: () {},
          onLoginWithApple: () {},
          onLoginWithGoogle: () {},
          onSignup: () {},
        );
    }
  }

  /// Handle Google login using the real LoginProvider
  void _handleGoogleLogin() async {
    final loginProvider =
        Provider.of<LoginProvider>(context, listen: false);
    await loginProvider.handleGoogleLogin(context);
    // AuthGate will handle the routing after successful auth
  }

  void _handleOAuthSuccess(String provider) {
    _showSuccessBanner('Authenticated via $provider.');
    setState(() => _currentRouteState = 'home');
  }

  void _showSuccessBanner(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(fontFamily: 'Inter')),
        backgroundColor: AppTheme.primaryBlue,
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
          onConfirm: () async {
            // Create real job in Firestore
            final userId = FirebaseAuth.instance.currentUser?.uid ?? '';
            final jobProvider = Provider.of<JobProvider>(context, listen: false);
            final garageProvider = Provider.of<GarageProvider>(context, listen: false);
            await jobProvider.createJob(
              userId: userId,
              serviceType: 'repair',
              vehicleType: 'Vehicle',
              pickup: 'Customer Location',
              drop: garageProvider.selectedGarage?.location ?? 'Garage',
              garageId: garageProvider.selectedGarage?.id,
              description: 'Repair service request',
            );
            _advance();
          },
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
