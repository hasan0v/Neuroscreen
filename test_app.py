#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
NeuroScreen Test Suite

This module contains unit tests for the NeuroScreen application.
Run with: python -m pytest tests/ -v
"""

import sys
import os
import json
import tempfile
import unittest
from unittest.mock import patch, MagicMock

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app
from config import TestingConfig

class NeuroScreenTestCase(unittest.TestCase):
    """Base test case for NeuroScreen application"""
    
    def setUp(self):
        """Set up test fixtures before each test method"""
        app.config.from_object(TestingConfig)
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create temporary data file
        self.temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt')
        self.temp_file.write("{'first': 0, 'second': 0, 'third': 0, 'fifth': 0}")
        self.temp_file.close()
        app.config['DATA_FILE'] = self.temp_file.name
    
    def tearDown(self):
        """Clean up after each test method"""
        self.app_context.pop()
        if os.path.exists(self.temp_file.name):
            os.unlink(self.temp_file.name)

class TestRoutes(NeuroScreenTestCase):
    """Test Flask routes"""
    
    def test_home_route(self):
        """Test the home route returns 200 and contains expected content"""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'NeuroScreen', response.data)
        self.assertIn(b'EEG', response.data)
    
    def test_focus_route(self):
        """Test the focus route returns 200 and contains expected content"""
        response = self.app.get('/focus')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'NeuroScreen', response.data)
        self.assertIn(b'Odaklanma', response.data)
    
    def test_get_data_route(self):
        """Test the get_data route returns current data"""
        response = self.app.get('/get_data')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'text/plain')
    
    def test_reset_data_route(self):
        """Test the reset_data route resets data to defaults"""
        response = self.app.get('/reset_data')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertIn('data', data)
    
    def test_push_data_route_valid(self):
        """Test push_data with valid JSON"""
        test_data = {"first": 1, "second": 0, "third": 0, "fifth": 0}
        response = self.app.post('/push_data', 
                                json=test_data,
                                content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data_received'], test_data)
    
    def test_push_data_route_invalid(self):
        """Test push_data with invalid JSON"""
        response = self.app.post('/push_data', data='invalid json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)

class TestEEGStream(NeuroScreenTestCase):
    """Test EEG streaming functionality"""
    
    def test_eeg_stream_route(self):
        """Test the EEG stream route returns proper content type"""
        response = self.app.get('/eeg_stream')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'multipart/x-mixed-replace')

class TestDataHandling(unittest.TestCase):
    """Test data file handling"""
    
    def test_data_file_operations(self):
        """Test reading and writing data file"""
        test_data = {"first": 1, "second": 0, "third": 1, "fifth": 0}
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
            f.write(str(test_data))
            temp_path = f.name
        
        try:
            # Read file
            with open(temp_path, 'r') as f:
                content = f.read()
                self.assertIn('first', content)
                self.assertIn('1', content)
        finally:
            os.unlink(temp_path)

class TestConfiguration(unittest.TestCase):
    """Test configuration settings"""
    
    def test_testing_config(self):
        """Test testing configuration is properly set"""
        app.config.from_object(TestingConfig)
        self.assertTrue(app.config['TESTING'])
        self.assertFalse(app.config['DEBUG'])
        self.assertEqual(app.config['ENV'], 'testing')

class TestSecurityHeaders(NeuroScreenTestCase):
    """Test security headers in production mode"""
    
    def test_security_headers_not_in_development(self):
        """Test that security headers are not added in development"""
        response = self.app.get('/')
        # In testing mode, security headers should not be present
        self.assertNotIn('X-Content-Type-Options', response.headers)

if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)