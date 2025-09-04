# NeuroScreen Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Real EEG hardware integration support
- Machine learning signal classification
- Multi-user session management
- Advanced visualization options
- Mobile application support
- Cloud data synchronization

## [2.0.0] - 2025-09-04

### Added
- Complete Turkish language support
- Production-ready deployment files
- Docker and Docker Compose support
- Nginx reverse proxy configuration
- Comprehensive test suite
- Security headers and CSRF protection
- Rate limiting and performance optimization
- Health check endpoints
- Environment variable configuration
- Automated deployment scripts (Windows and Linux)
- WSGI production entry point
- Glassmorphism design system
- Auto-normalization system (5-second inactivity)
- Logo integration with custom branding
- 2x2 grid layout for health categories
- Enhanced visual feedback system

### Changed
- Interface completely redesigned for health sector
- Reduced from 6 to 4 health categories
- Updated category names and icons
- Improved button sizing and responsiveness
- Enhanced EEG simulation with clinical accuracy
- Optimized frontend JavaScript performance
- Updated README with comprehensive documentation

### Removed
- Eye tracking module (temporarily disabled)
- Meditation category
- Physical activity category
- System refresh notifications

### Fixed
- EEG visualization performance improvements
- Memory leak in real-time streaming
- Cross-browser compatibility issues
- Mobile responsive design bugs

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Basic Flask web application
- EEG signal processing and visualization
- Eye tracking system with MediaPipe
- 6-zone interactive interface
- Real-time data streaming
- Kalman filtering for eye tracking
- Calibration system
- Basic web interface

### Features
- Real-time EEG frequency spectrum analysis
- Live FFT visualization
- Multi-frequency band monitoring
- Eye tracking with gaze prediction
- Interactive dashboard
- Progress tracking for focus sessions

---

## Version History Summary

- **v2.0.0**: Major redesign for health sector with Turkish language support and production deployment
- **v1.0.0**: Initial release with basic BCI functionality and eye tracking

## Migration Guide

### From v1.0.0 to v2.0.0

1. **Language**: All text is now in Turkish. Update any custom translations.
2. **Categories**: Reduced from 6 to 4 categories. Update any category references.
3. **Deployment**: Use new deployment scripts for production setup.
4. **Configuration**: Update environment variables using .env.example template.
5. **Docker**: Use provided Docker files for containerized deployment.