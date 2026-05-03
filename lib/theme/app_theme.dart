import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF1F3A5F);
  static const Color secondaryColor = Color(0xFFAB47BC);
  static const Color backgroundColor = Color(0xFFF5F6F8);

  static ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: primaryColor,

    scaffoldBackgroundColor: backgroundColor,

    colorScheme: ColorScheme.light(
      primary: primaryColor,
      secondary: secondaryColor,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: primaryColor,
      elevation: 0,
      centerTitle: true,
    ),

    textTheme: TextTheme(
      titleLarge: GoogleFonts.playfairDisplay(
        fontSize: 44,
        fontWeight: FontWeight.bold,
      ),
       titleMedium: GoogleFonts.playfairDisplay(
        fontSize: 28,
        fontWeight: FontWeight.bold,
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
        backgroundColor: primaryColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    ),
  );

  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: primaryColor,
  );
}
