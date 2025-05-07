import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_ml_kit/google_ml_kit.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../constants.dart';

class OCRScannerScreen extends StatefulWidget {
  @override
  _OCRScannerScreenState createState() => _OCRScannerScreenState();
}

class _OCRScannerScreenState extends State<OCRScannerScreen> {
  File? _selectedImage;
  String _scannedText = '';
  final TextRecognizer _textRecognizer = GoogleMlKit.vision.textRecognizer();
  final ImagePicker _picker = ImagePicker();

  // Part 3: Image Capture
  Future<void> _captureImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.camera);
    if (pickedFile == null) return;

    setState(() => _selectedImage = File(pickedFile.path));
    _processImage(); // Trigger OCR processing
  }

  // Part 4: OCR Processing
  Future<void> _processImage() async {
    if (_selectedImage == null) return;

    final inputImage = InputImage.fromFile(_selectedImage!);
    final RecognizedText recognizedText = 
        await _textRecognizer.processImage(inputImage);

    setState(() => _scannedText = recognizedText.text);
  }

  // Part 5: Save to Backend
  Future<void> _saveDetails() async {
    try {
      final response = await http.post(
        Uri.parse('$BASE_URL/process/ocr-scan'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'details': _scannedText,
          'expiresAt': DateTime.now()
              .add(Duration(hours: 12))
              .toIso8601String(), // 12-hour expiry
        }),
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response.statusCode == 200 
            ? 'Saved successfully!' 
            : 'Save failed'))
      );
    } catch (e) {
      print('Save error: $e');
    }
  }

  @override
  void dispose() {
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Scan Vehicle Details')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              // Camera Button
              ElevatedButton(
                onPressed: _captureImage,
                child: Text('Capture License Plate'),
              ),
              SizedBox(height: 20),
              
              // Display Image
              if (_selectedImage != null)
                Image.file(_selectedImage!, height: 200),
              
              SizedBox(height: 20),
              
              // OCR Results & Edit Field
              TextField(
                controller: TextEditingController(text: _scannedText),
                onChanged: (value) => _scannedText = value,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Edit Scanned Details',
                  border: OutlineInputBorder(),
                ),
              ),
              
              SizedBox(height: 20),
              
              // Save Button
              ElevatedButton(
                onPressed: _saveDetails,
                child: Text('Save Details'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
