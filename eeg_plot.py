import numpy as np
from flask import Flask, Response
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import ast
import time


# Helper function to generate EEG and FFT data
def simulate_eeg_and_fft():
    fs = 256
    mapping = {
        "first": {"freq": 10, "name": "Alpha (Relaxed Focus)", "base_amp": 25, "focus_amp": 45},
        "second": {"freq": 18, "name": "SMR (Sensory Motor)", "base_amp": 15, "focus_amp": 35},
        "third": {"freq": 24, "name": "Beta (Active Focus)", "base_amp": 12, "focus_amp": 30},
        "fifth": {"freq": 30, "name": "High Beta (Alert)", "base_amp": 8, "focus_amp": 40}
    }
    background_frequencies = {
        "delta": {"freq": 2, "amp": 35},
        "theta": {"freq": 6, "amp": 20},
        "alpha": {"freq": 10, "amp": 25},
        "beta": {"freq": 20, "amp": 15},
        "gamma": {"freq": 40, "amp": 8}
    }
    transition_duration = 3.0
    t = np.arange(0, 4, 1/fs)
    try:
        with open("data.txt", "r") as f:
            txt = f.read().strip()
            data = ast.literal_eval(txt)
    except Exception:
        data = {"first": 0, "second": 0, "third": 0, "fifth": 0}
    eeg = np.zeros_like(t)
    for bg_name, bg_info in background_frequencies.items():
        freq_variation = np.random.uniform(-0.5, 0.5)
        amplitude_variation = np.random.uniform(0.8, 1.2)
        eeg += bg_info["amp"] * amplitude_variation * np.sin(2 * np.pi * (bg_info["freq"] + freq_variation) * t)
    freqs = np.fft.fftfreq(len(t), 1/fs)
    freqs[0] = 1
    noise_spectrum = 1 / np.abs(freqs)
    noise_spectrum[0] = noise_spectrum[1]
    noise = np.fft.ifft(noise_spectrum * np.random.randn(len(freqs))).real
    eeg += noise * 8
    current_time = time.time()
    wait_until = current_time - transition_duration
    for key, button_info in mapping.items():
        if data.get(key, 0) == 1:
            transition_progress = min(1.0, (current_time - wait_until) / 2.0)
            base_freq = button_info["freq"]
            freq_modulation = 0.5 * np.sin(2 * np.pi * 0.1 * current_time)
            actual_freq = base_freq + freq_modulation
            base_amp = button_info["base_amp"]
            focus_amp = button_info["focus_amp"]
            current_amp = base_amp + (focus_amp - base_amp) * transition_progress
            fundamental = current_amp * np.sin(2 * np.pi * actual_freq * t)
            second_harmonic = (current_amp * 0.3) * np.sin(2 * np.pi * actual_freq * 2 * t)
            third_harmonic = (current_amp * 0.1) * np.sin(2 * np.pi * actual_freq * 3 * t)
            eeg += fundamental + second_harmonic + third_harmonic
            if base_freq > 12:
                alpha_suppression = -8 * transition_progress * np.sin(2 * np.pi * 10 * t)
                eeg += alpha_suppression
    if np.random.random() < 0.05:
        artifact_type = np.random.choice(['blink', 'muscle', 'movement'])
        if artifact_type == 'blink':
            blink_time = np.random.uniform(0.5, 3.5)
            blink_duration = 0.2
            blink_mask = np.exp(-((t - blink_time) / (blink_duration/4))**2)
            eeg += 60 * blink_mask * np.random.uniform(0.5, 1.5)
        elif artifact_type == 'muscle':
            muscle_freq = np.random.uniform(50, 80)
            muscle_duration = np.random.uniform(0.3, 1.0)
            muscle_start = np.random.uniform(0, 4 - muscle_duration)
            muscle_mask = ((t >= muscle_start) & (t <= muscle_start + muscle_duration)).astype(float)
            eeg += 25 * muscle_mask * np.sin(2 * np.pi * muscle_freq * t) * np.random.uniform(0.5, 1.5)
    eeg += np.random.normal(0, 3, len(t))
    fft_vals = np.fft.rfft(eeg)
    fft_freqs = np.fft.rfftfreq(len(eeg), 1/fs)
    low_cutoff = 1.0
    high_cutoff = 50.0
    freq_mask = (fft_freqs >= low_cutoff) & (fft_freqs <= high_cutoff)
    fft_vals_filtered = fft_vals * freq_mask
    power_spectrum = np.abs(fft_vals_filtered) ** 2
    def smooth_spectrum(spectrum, window_size=3):
        smoothed = np.copy(spectrum)
        for i in range(window_size, len(spectrum) - window_size):
            smoothed[i] = np.mean(spectrum[i-window_size:i+window_size+1])
        return smoothed
    power_spectrum_smooth = smooth_spectrum(power_spectrum)
    return {
        "t": t,
        "eeg": eeg,
        "fft_freqs": fft_freqs,
        "power_spectrum_smooth": power_spectrum_smooth,
        "freq_mask": freq_mask,
        "mapping": mapping,
        "data": data,
        "current_time": current_time
    }

# Function to generate time-domain EEG image
def generate_eeg_time_image():
    result = simulate_eeg_and_fft()
    t = result["t"]
    eeg = result["eeg"]
    mapping = result["mapping"]
    data = result["data"]
    current_time = result["current_time"]
    fs = 256
    fig, ax1 = plt.subplots(figsize=(18, 6))
    time_window = t[-int(2*fs):]
    eeg_window = eeg[-int(2*fs):]
    ax1.plot(time_window, eeg_window, color='#2563eb', linewidth=2.5, alpha=0.9)
    ax1.set_title('EEG Zaman Siqnalı (Son 2 saniyə)', fontsize=18, fontweight='bold')
    ax1.set_xlabel('Vaxt (saniyə)', fontsize=14)
    ax1.set_ylabel('Amplitud (μV)', fontsize=14)
    ax1.set_ylim(-100, 100)
    ax1.grid(True, alpha=0.3, linewidth=1.2)
    ax1.set_facecolor('#f8fafc')
    ax1.tick_params(labelsize=12)
    active_states = [key for key, val in data.items() if val == 1]
    if active_states:
        state_name = mapping[active_states[0]]["name"]
        ax1.text(0.02, 0.95, f'Aktiv Hal: {state_name}', transform=ax1.transAxes,
                bbox=dict(boxstyle="round,pad=0.5", facecolor='lightgreen', alpha=0.8),
                fontsize=14, fontweight='bold')
    plt.tight_layout(pad=2.0)
    img_bytes = io.BytesIO()
    fig.savefig(img_bytes, format='png', dpi=120, bbox_inches='tight',
               facecolor='white', edgecolor='none')
    plt.close(fig)
    img_bytes.seek(0)
    return img_bytes.read()

# Function to generate frequency-domain EEG image
def generate_eeg_freq_image():
    result = simulate_eeg_and_fft()
    fft_freqs = result["fft_freqs"]
    power_spectrum_smooth = result["power_spectrum_smooth"]
    freq_mask = result["freq_mask"]
    mapping = result["mapping"]
    data = result["data"]
    current_time = result["current_time"]
    fig, ax2 = plt.subplots(figsize=(18, 6))
    ax2.plot(fft_freqs[freq_mask], power_spectrum_smooth[freq_mask],
            color='#10b981', linewidth=3, alpha=0.9)
    ax2.fill_between(fft_freqs[freq_mask], power_spectrum_smooth[freq_mask],
                    alpha=0.4, color='#10b981')
    for key, button_info in mapping.items():
        if data.get(key, 0) == 1:
            freq = button_info["freq"]
            freq_range = (fft_freqs >= freq-2) & (fft_freqs <= freq+2)
            ax2.fill_between(fft_freqs[freq_range], power_spectrum_smooth[freq_range],
                           alpha=0.7, color='red', label=f'{button_info["name"]}', linewidth=2)
    ax2.set_title('EEG Güc Spektrumu', fontsize=18, fontweight='bold')
    ax2.set_xlabel('Tezlik (Hz)', fontsize=14)
    ax2.set_ylabel('Güc (μV²/Hz)', fontsize=14)
    ax2.set_xlim(1, 50)
    ax2.set_ylim(0, np.max(power_spectrum_smooth[freq_mask]) * 1.1)
    ax2.grid(True, alpha=0.3, linewidth=1.2)
    ax2.set_facecolor('#f8fafc')
    ax2.tick_params(labelsize=12)
    band_labels = [
        (2, "δ"), (6, "θ"), (10, "α"), (20, "β"), (35, "γ")
    ]
    for freq, label in band_labels:
        ax2.axvline(x=freq, color='gray', linestyle='--', alpha=0.6, linewidth=1.5)
        ax2.text(freq, ax2.get_ylim()[1]*0.9, label, ha='center',
                fontsize=16, fontweight='bold', color='gray')
    plt.tight_layout(pad=2.0)
    img_bytes = io.BytesIO()
    fig.savefig(img_bytes, format='png', dpi=120, bbox_inches='tight',
               facecolor='white', edgecolor='none')
    plt.close(fig)
    img_bytes.seek(0)
    return img_bytes.read()

