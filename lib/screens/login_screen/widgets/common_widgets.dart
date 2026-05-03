import 'package:flutter/material.dart';

class CommonWidgets {

   Widget buildElevatedButton({
    required Color backgroundColor,
    required Widget child,
    required void Function()? onPressed,
  }) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        padding: const EdgeInsets.all(15),
        minimumSize: Size(double.infinity, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      onPressed: onPressed,
      child: child,
    );
  }
}