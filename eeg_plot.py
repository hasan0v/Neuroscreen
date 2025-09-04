import numpy as np
from flask import Flask, Response
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import ast
import time

def generate_fft_frames():
    fs = 256  # Sampling rate (Hz)
    
    # Realistic EEG frequency mapping with different cognitive states
    mapping = {
        "first": {"freq": 10, "name": "Alpha (Relaxed Focus)", "base_amp": 25, "focus_amp": 45},      # Alpha waves for hydration/relaxation
        "second": {"freq": 18, "name": "SMR (Sensory Motor)", "base_amp": 15, "focus_amp": 35},       # SMR for climate control
        "third": {"freq": 24, "name": "Beta (Active Focus)", "base_amp": 12, "focus_amp": 30},        # Beta for toilet needs
        "fifth": {"freq": 30, "name": "High Beta (Alert)", "base_amp": 8, "focus_amp": 40}            # High beta for SOS/emergency
    }
    
    # Realistic background EEG frequencies
    background_frequencies = {
        "delta": {"freq": 2, "amp": 35},      # Deep sleep/unconscious
        "theta": {"freq": 6, "amp": 20},      # Light sleep/meditation
        "alpha": {"freq": 10, "amp": 25},     # Relaxed awareness
        "beta": {"freq": 20, "amp": 15},      # Normal waking consciousness
        "gamma": {"freq": 40, "amp": 8}       # High-level cognitive processing
    }

    last_data = None
    wait_until = 0
    transition_duration = 3.0  # 3 seconds for realistic transition

    while True:
        t = np.arange(0, 4, 1/fs)  # 4-second window for better resolution

        # Read data.txt file
        try:
            with open("data.txt", "r") as f:
                txt = f.read().strip()
                data = ast.literal_eval(txt)
        except Exception:
            data = {"first": 0, "second": 0, "third": 0, "fifth": 0}

        # Handle state transitions realistically
        if data != last_data:
            last_data = data
            wait_until = time.time() + transition_duration

        # Generate realistic baseline EEG
        eeg = np.zeros_like(t)
        
        # Add background brain activity (always present)
        for bg_name, bg_info in background_frequencies.items():
            freq_variation = np.random.uniform(-0.5, 0.5)  # Natural frequency variation
            amplitude_variation = np.random.uniform(0.8, 1.2)  # Natural amplitude variation
            eeg += bg_info["amp"] * amplitude_variation * np.sin(2 * np.pi * (bg_info["freq"] + freq_variation) * t)

        # Add 1/f noise (characteristic of real EEG)
        freqs = np.fft.fftfreq(len(t), 1/fs)
        freqs[0] = 1  # Avoid division by zero
        noise_spectrum = 1 / np.abs(freqs)
        noise_spectrum[0] = noise_spectrum[1]  # Fix DC component
        noise = np.fft.ifft(noise_spectrum * np.random.randn(len(freqs))).real
        eeg += noise * 8  # Scale the 1/f noise

        # Add focused activity if transition period has passed
        current_time = time.time()
        if current_time >= wait_until:
            for key, button_info in mapping.items():
                if data.get(key, 0) == 1:
                    # Calculate transition progress (0 to 1)
                    transition_progress = min(1.0, (current_time - wait_until) / 2.0)
                    
                    # Realistic frequency modulation during focus
                    base_freq = button_info["freq"]
                    freq_modulation = 0.5 * np.sin(2 * np.pi * 0.1 * current_time)  # 0.1 Hz modulation
                    actual_freq = base_freq + freq_modulation
                    
                    # Amplitude increases gradually during focus
                    base_amp = button_info["base_amp"]
                    focus_amp = button_info["focus_amp"]
                    current_amp = base_amp + (focus_amp - base_amp) * transition_progress
                    
                    # Add harmonics for realistic brain wave patterns
                    fundamental = current_amp * np.sin(2 * np.pi * actual_freq * t)
                    second_harmonic = (current_amp * 0.3) * np.sin(2 * np.pi * actual_freq * 2 * t)
                    third_harmonic = (current_amp * 0.1) * np.sin(2 * np.pi * actual_freq * 3 * t)
                    
                    eeg += fundamental + second_harmonic + third_harmonic
                    
                    # Add focus-related alpha suppression (realistic effect)
                    if base_freq > 12:  # For beta and higher frequencies
                        alpha_suppression = -8 * transition_progress * np.sin(2 * np.pi * 10 * t)
                        eeg += alpha_suppression

        # Add realistic artifacts occasionally
        if np.random.random() < 0.05:  # 5% chance per frame
            artifact_type = np.random.choice(['blink', 'muscle', 'movement'])
            if artifact_type == 'blink':
                # Eye blink artifact (low frequency, high amplitude)
                blink_time = np.random.uniform(0.5, 3.5)
                blink_duration = 0.2
                blink_mask = np.exp(-((t - blink_time) / (blink_duration/4))**2)
                eeg += 60 * blink_mask * np.random.uniform(0.5, 1.5)
            elif artifact_type == 'muscle':
                # Muscle artifact (high frequency)
                muscle_freq = np.random.uniform(50, 80)
                muscle_duration = np.random.uniform(0.3, 1.0)
                muscle_start = np.random.uniform(0, 4 - muscle_duration)
                muscle_mask = ((t >= muscle_start) & (t <= muscle_start + muscle_duration)).astype(float)
                eeg += 25 * muscle_mask * np.sin(2 * np.pi * muscle_freq * t) * np.random.uniform(0.5, 1.5)

        # Add realistic noise
        eeg += np.random.normal(0, 3, len(t))  # Reduced noise for cleaner signal

        # Compute FFT
        fft_vals = np.fft.rfft(eeg)
        fft_freqs = np.fft.rfftfreq(len(eeg), 1/fs)
        
        # Apply realistic filtering (bandpass 1-50 Hz)
        low_cutoff = 1.0
        high_cutoff = 50.0
        freq_mask = (fft_freqs >= low_cutoff) & (fft_freqs <= high_cutoff)
        fft_vals_filtered = fft_vals * freq_mask

        # Calculate power spectral density
        power_spectrum = np.abs(fft_vals_filtered) ** 2
        
        # Simple smoothing function (moving average)
        def smooth_spectrum(spectrum, window_size=3):
            smoothed = np.copy(spectrum)
            for i in range(window_size, len(spectrum) - window_size):
                smoothed[i] = np.mean(spectrum[i-window_size:i+window_size+1])
            return smoothed
        
        power_spectrum_smooth = smooth_spectrum(power_spectrum)

        # Create the plot
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 8))
        
        # Plot 1: Time domain signal (last 2 seconds)
        time_window = t[-int(2*fs):]  # Last 2 seconds
        eeg_window = eeg[-int(2*fs):]
        ax1.plot(time_window, eeg_window, color='#2563eb', linewidth=1.5, alpha=0.8)
        ax1.set_title('EEG Zaman Siqnalı (Son 2 saniyə)', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Vaxt (saniyə)')
        ax1.set_ylabel('Amplitud (μV)')
        ax1.set_ylim(-100, 100)
        ax1.grid(True, alpha=0.3)
        ax1.set_facecolor('#f8fafc')
        
        # Add annotations for active states
        active_states = [key for key, val in data.items() if val == 1]
        if active_states and current_time >= wait_until:
            state_name = mapping[active_states[0]]["name"]
            ax1.text(0.02, 0.95, f'Aktiv Hal: {state_name}', transform=ax1.transAxes, 
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgreen', alpha=0.7),
                    fontsize=10, fontweight='bold')

        # Plot 2: Frequency spectrum
        ax2.plot(fft_freqs[freq_mask], power_spectrum_smooth[freq_mask], 
                color='#10b981', linewidth=2, alpha=0.9)
        ax2.fill_between(fft_freqs[freq_mask], power_spectrum_smooth[freq_mask], 
                        alpha=0.3, color='#10b981')
        
        # Highlight active frequency bands
        for key, button_info in mapping.items():
            if data.get(key, 0) == 1 and current_time >= wait_until:
                freq = button_info["freq"]
                freq_range = (fft_freqs >= freq-2) & (fft_freqs <= freq+2)
                ax2.fill_between(fft_freqs[freq_range], power_spectrum_smooth[freq_range], 
                               alpha=0.6, color='red', label=f'{button_info["name"]}')
        
        ax2.set_title('EEG Güc Spektrumu', fontsize=14, fontweight='bold')
        ax2.set_xlabel('Tezlik (Hz)')
        ax2.set_ylabel('Güc (μV²/Hz)')
        ax2.set_xlim(1, 50)
        ax2.set_ylim(0, np.max(power_spectrum_smooth[freq_mask]) * 1.1)
        ax2.grid(True, alpha=0.3)
        ax2.set_facecolor('#f8fafc')
        
        # Add frequency band labels
        band_labels = [
            (2, "δ"), (6, "θ"), (10, "α"), (20, "β"), (35, "γ")
        ]
        for freq, label in band_labels:
            ax2.axvline(x=freq, color='gray', linestyle='--', alpha=0.5)
            ax2.text(freq, ax2.get_ylim()[1]*0.9, label, ha='center', 
                    fontsize=12, fontweight='bold', color='gray')

        plt.tight_layout()
        
        # Save plot
        img_bytes = io.BytesIO()
        fig.savefig(img_bytes, format='png', dpi=100, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        plt.close(fig)
        img_bytes.seek(0)

        time.sleep(0.5)  # 2 FPS for realistic update rate
        
        # Stream frame
        frame = img_bytes.read()
        yield (b'--frame\r\n'
               b'Content-Type: image/png\r\n\r\n' + frame + b'\r\n')

