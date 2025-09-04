#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
NeuroScreen Configuration Module

This module contains configuration settings for different environments
(development, testing, production).
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-in-production'
    DATA_FILE = os.path.join(BASE_DIR, 'data.txt')
    
    # Static file settings
    STATIC_FOLDER = 'static'
    TEMPLATE_FOLDER = 'templates'
    
    # EEG Settings
    EEG_SAMPLING_RATE = 256
    EEG_WINDOW_SIZE = 4
    EEG_UPDATE_INTERVAL = 0.5
    
    # Application settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file upload
    JSON_SORT_KEYS = False
    
    # CORS settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False
    ENV = 'development'
    HOST = '127.0.0.1'
    PORT = 5000

class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    ENV = 'production'
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 5000))
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'change-this-in-production'

class TestingConfig(Config):
    """Testing environment configuration"""
    DEBUG = False
    TESTING = True
    ENV = 'testing'
    DATA_FILE = os.path.join(BASE_DIR, 'test_data.txt')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}