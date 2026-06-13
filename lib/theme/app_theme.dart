import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // ─── Backend Original Colors ───────────────────────────────────────────────
  static const Color primaryColor = Color(0xFF1F3A5F);
  static const Color secondaryColor = Color(0xFFAB47BC);
  static const Color backgroundColor = Color(0xFFF5F6F8);

  // ─── Frontend Colors (merged from frontend developer) ──────────────────────
  static const Color primaryBlue = Color(0xFF013480);
  static const Color secondaryBlue = Color(0xFF0282DD);
  static const Color darkBlueBg = Color(0xFF1E294B);
  static const Color accentOrange = Color(0xFFF27424);
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color textDark = Color(0xFF1E293B);
  static const Color textLight = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF767C8C);

  // ─── Gradients ─────────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF013480), Color(0xFF0282DD)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient orangeGradient = LinearGradient(
    colors: [Color(0xFF1E294B), Color(0xFFF27424)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient horizontalPrimaryGradient = LinearGradient(
    colors: [Color(0xFF013480), Color(0xFF0282DD)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // ─── Light Theme ──────────────────────────────────────────────────────────
  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: lightBg,

    colorScheme: ColorScheme.light(
      primary: primaryBlue,
      secondary: accentOrange,
      surface: lightBg,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: primaryBlue,
      elevation: 0,
      centerTitle: true,
      foregroundColor: Colors.white,
    ),

    textTheme: TextTheme(
      displayLarge: GoogleFonts.playfairDisplay(
        fontWeight: FontWeight.bold,
      ),
      titleLarge: GoogleFonts.playfairDisplay(
        fontSize: 44,
        fontWeight: FontWeight.bold,
      ),
      titleMedium: GoogleFonts.playfairDisplay(
        fontSize: 28,
        fontWeight: FontWeight.bold,
      ),
      bodyLarge: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
      labelMedium: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB), width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: secondaryBlue, width: 2),
      ),
    ),
  );

  // ─── Dark Theme ───────────────────────────────────────────────────────────
  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: const Color(0xFF0F0F11),
  );
}
