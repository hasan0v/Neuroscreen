# NeuroScreen - Etkileşimli Beyin-Bilgisayar Arayüz Sistemi

## 📖 Genel Bakış

NeuroScreen, gerçek zamanlı EEG sinyal analizi ile modern web teknolojilerini birleştiren kapsamlı bir Beyin-Bilgisayar Arayüz (BCI) sistemidir. Sistem, beyin sinyali izleme için etkileşimli bir web arayüzü sağlar ve sağlık sektörü odaklı 4 kategorili odaklanma terapisi sunar.

## 🚀 Özellikler

### 🧠 EEG Sinyal İşleme
- Gerçek zamanlı EEG frekans spektrumu analizi
- Canlı FFT görselleştirme ile özelleştirilebilir frekans bantları
- Çoklu frekans bantı izleme (Alpha, Beta, SMR, High Beta)
- Gürültü filtreleme ile uyarlanabilir sinyal işleme
- Klinik seviyede beyin dalgası simülasyonu

### 🌐 Web Arayüzü
- 4 özelleştirilebilir sağlık kategorisi (Su, Klima, Tuvalet, SOS)
- Gerçek zamanlı EEG spektrumu akışı
- Odaklanma oturumları için ilerleme takibi
- Modern glassmorphism tasarım ile duyarlı arayüz
- Otomatik veri normalizasyonu (5 saniye hareketsizlik)
- Türkçe dil desteği

## 🏗️ Proje Yapısı

```
neuroscreen/
├── main.py                     # Flask web uygulama sunucusu
├── eeg_plot.py                 # EEG sinyal işleme ve görselleştirme
├── data.txt                    # Gerçek zamanlı veri depolama
├── wsgi.py                     # Üretim WSGI giriş noktası
├── config.py                   # Yapılandırma ayarları
├── requirements.txt            # Python bağımlılıkları
├── Dockerfile                  # Docker container yapılandırması
├── docker-compose.yml          # Docker Compose orchestration
├── nginx.conf                  # Nginx reverse proxy yapılandırması
├── deploy.sh                   # Linux/Mac deployment script
├── deploy.bat                  # Windows deployment script
├── .env.example                # Çevre değişkeni örneği
├── .gitignore                  # Git ignore kuralları
├── templates/                  # HTML şablonları
│   ├── index.html              # Ana dashboard
│   └── focus.html              # Odaklanma terapisi arayüzü
└── static/                     # Statik web varlıkları
    ├── css/
    │   └── style.css           # Stil dosyası
    ├── js/
    │   └── app.js              # Frontend JavaScript
    └── images/
        └── logo.png            # Uygulama logosu
```

## 🔧 Kurulum

### Ön Gereksinimler
- Python 3.8+
- Modern web tarayıcısı
- Git (isteğe bağlı)

### Hızlı Başlangıç

#### Windows için:
```cmd
# Projeyi klonlayın
git clone <repository-url>
cd neuroscreen

# Deployment script'ini çalıştırın
deploy.bat
```

#### Linux/Mac için:
```bash
# Projeyi klonlayın
git clone <repository-url>
cd neuroscreen

# Deployment script'ini çalıştırın
chmod +x deploy.sh
./deploy.sh
```

#### Manuel Kurulum:
```bash
# Sanal ortam oluşturun
python -m venv venv

# Sanal ortamı etkinleştirin
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# Uygulamayı başlatın
python main.py
```

## 🚀 Üretim Dağıtımı

### 1. Basit Üretim (Waitress/Gunicorn)

**Windows:**
```cmd
start_production.bat
```

**Linux/Mac:**
```bash
./start_production.sh
```

### 2. Docker ile Dağıtım

```bash
# Docker container oluşturun
docker build -t neuroscreen .

# Container'ı çalıştırın
docker run -d -p 5000:5000 neuroscreen
```

### 3. Docker Compose ile Tam Yığın

```bash
# Tüm servisleri başlatın (Nginx + NeuroScreen)
docker-compose up -d

# Logları görüntüleyin
docker-compose logs -f
```

### 4. Nginx Reverse Proxy

Nginx yapılandırması dahil edilmiştir:
- Statik dosya önbellekleme
- Gzip sıkıştırma
- Rate limiting
- SSL/TLS desteği (yapılandırma gerekli)
- Güvenlik başlıkları

## 📊 Sistem Bileşenleri

### 1. EEG Sinyal İşleme (`eeg_plot.py`)
- **Örnekleme Hızı**: 256 Hz
- **Frekans Bantları**: 
  - Alpha dalgaları: 8-13 Hz (rahatlatıcı odaklanma)
  - SMR: 12-15 Hz (sensorimotor ritim)
  - Beta dalgaları: 14-30 Hz (aktif odaklanma)
  - High Beta: 30+ Hz (yüksek uyarılma)
- **Sinyal Üretimi**: Klinik seviyede gerçekçi EEG simülasyonu
- **Görselleştirme**: Gerçek zamanlı dual-plot (zaman + frekans)

### 2. Web Arayüzü
- **Backend**: Flask REST API
- **Frontend**: Vanilla JavaScript + CSS3 Glassmorphism
- **Gerçek Zamanlı İletişim**: Server-Sent Events
- **Veri Depolama**: Dosya tabanlı JSON depolama

### 3. Sağlık Kategori Sistemi
- **Su**: Hidrasyon hatırlatıcısı (mavi tema)
- **Klima**: Hava koşulları kontrolü (açık mavi tema)
- **Tuvalet**: Mola hatırlatıcısı (sarı tema)
- **SOS**: Acil durum sinyali (kırmızı tema)

## 🔬 Teknik Detaylar

### EEG Sinyal Haritalama
```python
frequency_mapping = {
    "first": {"freq": 10, "name": "Alpha (Relaxed Focus)"},     # Su
    "second": {"freq": 18, "name": "SMR (Sensory Motor)"},     # Klima
    "third": {"freq": 24, "name": "Beta (Active Focus)"},      # Tuvalet
    "fifth": {"freq": 30, "name": "High Beta (Alert)"}         # SOS
}
```

### Otomatik Normalizasyon
- 5 saniye hareketsizlik sonrası otomatik sıfırlama
- Fare hareketi, klavye aktivitesi ve dokunma algılama
- Sessiz arka plan normalizasyonu

### Glassmorphism Tasarım
- Modern backdrop-filter efektleri
- Animasyonlu gradyan arka planlar
- Responsive 2x2 grid layout
- Gelişmiş hover efektleri

## 📱 API Uç Noktaları

| Uç Nokta | Metod | Açıklama |
|----------|-------|----------|
| `/` | GET | Ana dashboard |
| `/focus` | GET | Odaklanma terapisi arayüzü |
| `/eeg_stream` | GET | Gerçek zamanlı EEG akışı |
| `/get_data` | GET | Mevcut veriyi al |
| `/push_data` | POST | Veri değerlerini güncelle |
| `/reset_data` | GET | Veriyi varsayılana sıfırla |

### Veri Formatı
```json
{
    "first": 0,     // Su kategorisi aktivasyonu (0/1)
    "second": 0,    // Klima kategorisi aktivasyonu (0/1)
    "third": 0,     // Tuvalet kategorisi aktivasyonu (0/1)
    "fifth": 0      // SOS kategorisi aktivasyonu (0/1)
}
```

## 🎯 Odaklanma Eğitim Sistemi

### Etkileşim Yöntemleri
- **Fare Hover**: 5 saniye hover ile kategori aktivasyonu
- **İlerleme Görselleştirme**: Gerçek zamanlı ilerleme çubukları
- **Görsel Geri Bildirim**: Başarı/hata bildirimleri

### Otomatik Özellikler
- **Hareketsizlik Algılama**: 5 saniye sonra otomatik normalizasyon
- **Oturum Takibi**: Gerçek zamanlı oturum süresi
- **Sistem Durumu**: Canlı sistem durumu göstergesi

## 🔧 Yapılandırma

### Çevre Değişkenleri
```bash
# .env dosyası oluşturun (.env.example'dan kopyalayın)
cp .env.example .env

# Üretim için önemli ayarlar
SECRET_KEY=your-super-secret-key
FLASK_ENV=production
HOST=0.0.0.0
PORT=5000
```

### EEG Parametreleri
```python
fs = 256                    # Örnekleme frekansı (Hz)
window_size = 4             # Sinyal penceresi (saniye)
noise_level = 3             # Arka plan gürültüsü
transition_duration = 3.0   # Geçiş süresi (saniye)
```

### Güvenlik Ayarları
- CSRF koruması
- XSS koruması
- Content Security Policy
- Rate limiting (Nginx ile)
- HTTPS yönlendirmesi

## 🔍 Sorun Giderme

### Yaygın Sorunlar

1. **EEG akışı yüklenmiyor:**
   - Flask sunucusunun çalıştığını doğrulayın
   - Tarayıcı konsolunda hataları kontrol edin
   - data.txt dosyasının var olduğunu ve okunabilir olduğunu kontrol edin

2. **Bağımlılık hataları:**
   - Python versiyonunu kontrol edin (3.8+)
   - Sanal ortamın etkin olduğunu doğrulayın
   - requirements.txt'yi yeniden yükleyin

3. **Port kullanımda hatası:**
   - Farklı port kullanın: `python main.py --port 8000`
   - Mevcut Python işlemlerini durdurun

4. **Static dosyalar yüklenmiyor:**
   - Static klasör yapısını kontrol edin
   - Nginx yapılandırmasını doğrulayın
   - Dosya izinlerini kontrol edin

### Log Dosyaları
```bash
# Uygulama logları
tail -f logs/neuroscreen.log

# Nginx logları (Docker ile)
docker-compose logs nginx

# Container logları
docker logs <container-name>
```

## 🚀 Performans Optimizasyonu

### Üretim Ayarları
- **Gunicorn Workers**: 4 worker (varsayılan)
- **Timeout**: 120 saniye
- **Static File Caching**: 1 saat
- **Gzip Compression**: Etkin
- **Rate Limiting**: API için 10 req/s

### Monitoring
- Health check endpoints
- Application metrics
- Resource usage monitoring
- Error tracking

## 🔮 Gelecek Geliştirmeler

- [ ] Gerçek EEG donanım entegrasyonu (OpenBCI, NeuroSky)
- [ ] Makine öğrenmesi tabanlı sinyal sınıflandırması
- [ ] Çoklu kullanıcı oturum yönetimi
- [ ] Gelişmiş görselleştirme seçenekleri
- [ ] Mobil uygulama desteği
- [ ] Bulut veri senkronizasyonu
- [ ] Ses komut entegrasyonu
- [ ] Biometrik kimlik doğrulama

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Branch'inizi push edin
5. Pull Request oluşturun

## 📄 Lisans

Bu proje açık kaynaklıdır ve [MIT Lisansı](LICENSE) altında mevcuttur.

## 🆘 Destek

Destek ve sorular için:
- Repository'de issue oluşturun
- Sorun giderme bölümünü kontrol edin
- Teknik dokümantasyonu inceleyin

## 🙏 Teşekkürler

- Flask ekibi web framework için
- NumPy ve Matplotlib bilimsel hesaplama için
- Modern web teknolojileri topluluğu
- Açık kaynak katkıcıları

---

**Not**: Bu sistem araştırma ve eğitim amaçlarına yöneliktir. Tıbbi uygulamalar için sağlık uzmanları ile görüşün ve ilgili düzenlemelere uygunluğu sağlayın.

## 📊 System Components

### 1. EEG Signal Processing (`eeg_plot.py`)
- **Sampling Rate**: 256 Hz
- **Frequency Bands**: 
  - Alpha waves: 14 Hz
  - Beta waves: 21-33 Hz range
- **Signal Generation**: Synthetic EEG with configurable amplitude and noise
- **Visualization**: Real-time FFT spectrum (0-40 Hz range)

### 2. Eye Tracking System (`eye tracker/`)
- **Face Detection**: MediaPipe Face Mesh with 468 landmarks
- **Iris Tracking**: Precise iris center calculation
- **Calibration**: Multi-point polynomial regression (order 2)
- **Filtering**: Kalman filter for smooth tracking
- **Accuracy**: Sub-pixel precision with noise reduction

### 3. Web Interface
- **Backend**: Flask REST API
- **Frontend**: Vanilla JavaScript with CSS3
- **Real-time Communication**: Server-Sent Events for EEG streaming
- **Data Storage**: File-based JSON storage

## 🚀 Usage

### Starting the Web Application

1. **Launch the Flask server:**
   ```bash
   python main.py
   ```
   The server will start on `http://localhost:5000`

2. **Access the dashboard:**
   - Navigate to `http://localhost:5000` for EEG monitoring
   - Navigate to `http://localhost:5000/focus` for focus training

### Eye Tracking Application

1. **Run the eye tracker:**
   ```bash
   cd "eye tracker"
   python main.py
   ```

2. **Calibration Process:**
   - Press `c` to start calibration
   - Follow the calibration points (look at each point for 0.8 seconds)
   - System will automatically complete calibration

3. **Controls:**
   - `c`: Start calibration
   - `v`: Toggle camera view
   - `r`: Reset system
   - `q`: Quit application

## 🔬 Technical Details

### EEG Signal Mapping
```python
frequency_mapping = {
    "first": 21,    # Focus Zone 1
    "second": 24,   # Focus Zone 2  
    "third": 27,    # Focus Zone 3
    "fourth": 30,   # Focus Zone 4
    "fifth": 33,    # Focus Zone 5
    "sixth": 14     # Relaxation Zone
}
```

### Eye Tracking Features
- **Landmark Extraction**: 468 facial landmarks
- **Iris Points**: 4-point iris detection per eye
- **Normalization**: Eye-relative coordinate system
- **Bilateral Processing**: Combined left and right eye data

### Calibration Algorithm
```python
# Polynomial feature expansion for improved accuracy
def poly_features(fx, fy, order=2):
    if order == 2:
        return [1, fx, fy, fx*fx, fy*fy, fx*fy]
    return [1, fx, fy]
```

## 📱 API Endpoints

### Flask Web API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main dashboard |
| `/focus` | GET | Focus training interface |
| `/eeg_stream` | GET | Real-time EEG stream |
| `/get_data` | GET | Retrieve current data |
| `/push_data` | POST | Update data values |
| `/reset_data` | GET | Reset data to defaults |

### Data Format
```json
{
    "first": 0,     // Zone 1 activation (0/1)
    "second": 0,    // Zone 2 activation (0/1)
    "third": 0,     // Zone 3 activation (0/1)
    "fourth": 0,    // Zone 4 activation (0/1)
    "fifth": 0,     // Zone 5 activation (0/1)
    "sixth": 0      // Zone 6 activation (0/1)
}
```

## 🎯 Focus Training System

### Zone Configuration
The system divides the screen into 6 interactive zones:
1. **Water** (Yellow) - Hydration reminder
2. **Food** (Red) - Nutrition reminder  
3. **Medicine** (Yellow) - Medication reminder
4. **Images** (Blue) - Visual content
5. **Toilet** (Pink) - Break reminder
6. **Other** (Green) - Miscellaneous actions

### Interaction Methods
- **Mouse Hover**: 5-second hover triggers zone activation
- **Eye Gaze**: 5-second sustained gaze triggers activation
- **Progress Visualization**: Real-time progress bars

## 🔧 Configuration

### Screen Resolution Setup
```python
# Automatic detection
SCREEN_W = root.winfo_screenwidth()
SCREEN_H = root.winfo_screenheight()

# Manual configuration (if needed)
SCREEN_W, SCREEN_H = 1920, 1080
```

### EEG Parameters
```python
fs = 256  # Sampling frequency (Hz)
window_size = 10  # Signal window (seconds)
noise_level = 5   # Background noise amplitude
```

### Eye Tracking Sensitivity
```python
min_detection_confidence = 0.5
min_tracking_confidence = 0.5
kalman_process_noise = 0.03
```

## 🔍 Troubleshooting

### Common Issues

1. **Camera not detected:**
   - Check camera permissions
   - Try different camera indices (0, 1, 2...)
   - Ensure no other application is using the camera

2. **EEG stream not loading:**
   - Verify Flask server is running
   - Check browser console for errors
   - Ensure data.txt file exists and is readable

3. **Calibration failure:**
   - Ensure good lighting conditions
   - Keep face centered and stable
   - Maintain consistent distance from camera

4. **Poor tracking accuracy:**
   - Recalibrate the system
   - Check camera focus and resolution
   - Ensure minimal head movement

## 🔮 Future Enhancements

- [ ] Real EEG hardware integration (OpenBCI, NeuroSky)
- [ ] Machine learning-based signal classification
- [ ] Multi-user session management
- [ ] Advanced visualization options
- [ ] Mobile application support
- [ ] Cloud data synchronization
- [ ] Voice command integration
- [ ] Biometric authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the technical documentation

## 🙏 Acknowledgments

- MediaPipe team for facial landmark detection
- OpenCV community for computer vision tools
- Flask team for the web framework
- NumPy and Matplotlib for scientific computing

---

**Note**: This system is designed for research and educational purposes. For medical applications, please consult with healthcare professionals and ensure compliance with relevant regulations.