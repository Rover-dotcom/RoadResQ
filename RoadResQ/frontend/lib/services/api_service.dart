import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const baseUrl = "http://localhost:5000/api";

  static Future createJob(Map data) async {
    final res = await http.post(
      Uri.parse("$baseUrl/jobs"),
      body: jsonEncode(data),
      headers: {"Content-Type": "application/json"},
    );

    return jsonDecode(res.body);
  }
}
