#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
NeuroScreen - Interactive Brain-Computer Interface System
Production WSGI Entry Point

This module provides the WSGI application entry point for production deployment
using servers like Gunicorn, uWSGI, or mod_wsgi.
"""

import os
import sys
from main import app

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Configuration for production
app.config['DEBUG'] = False
app.config['TESTING'] = False
app.config['ENV'] = 'production'

# Security headers middleware
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Error handlers for production
@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    return app.response_class(
        response='{"error": "Sayfa bulunamadı"}',
        status=404,
        mimetype='application/json'
    )

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return app.response_class(
        response='{"error": "Sunucu hatası"}',
        status=500,
        mimetype='application/json'
    )

# WSGI application callable
application = app

if __name__ == "__main__":
    # For direct execution (development only)
    app.run(host='0.0.0.0', port=5000, debug=False)