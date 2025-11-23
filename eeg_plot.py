import numpy as np
import time

# Helper function to generate EEG and FFT data
def simulate_eeg_and_fft(data=None):
    fs = 256
    mapping = {
        "first": {"freq": 10, "name": "Alpha (Relaxed Focus)", "base_amp": 25, "focus_amp": 120},
        "second": {"freq": 18, "name": "SMR (Sensory Motor)", "base_amp": 15, "focus_amp": 90},
        "third": {"freq": 24, "name": "Beta (Active Focus)", "base_amp": 12, "focus_amp": 80},
        "fifth": {"freq": 30, "name": "High Beta (Alert)", "base_amp": 8, "focus_amp": 80}
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
    
    if data is None:
        data = {"first": 0, "second": 0, "third": 0, "fifth": 0}

    # Check if system is active (any button pressed)
    is_active = any(v == 1 for v in data.values())
    
    eeg = np.zeros_like(t)
    
    if is_active:
        # Generate full EEG simulation only when active
        for bg_name, bg_info in background_frequencies.items():
            freq_variation = np.random.uniform(-0.5, 0.5)
            amplitude_variation = np.random.uniform(0.8, 1.2)
            # Add phase shift for more natural look
            phase_shift = np.random.uniform(0, 2*np.pi)
            eeg += bg_info["amp"] * amplitude_variation * np.sin(2 * np.pi * (bg_info["freq"] + freq_variation) * t + phase_shift)
        
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
    else:
        # Idle state - Straight line (very low noise to simulate "on" but disconnected/idle)
        eeg += np.random.normal(0, 0.1, len(t))

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
    
    # Return data for JSON serialization
    # We only need the last 2 seconds for the time graph (approx 512 points)
    # And the frequency spectrum
    
    time_window_indices = slice(-int(2*fs), None)
    
    # Identify active state info for highlighting
    active_key = next((k for k, v in data.items() if v == 1), None)
    highlight_info = None
    if active_key:
        info = mapping[active_key]
        highlight_info = {"freq": info["freq"], "name": info["name"]}

    return {
        "time_labels": t[time_window_indices].tolist(),
        "eeg_values": eeg[time_window_indices].tolist(),
        "freq_labels": fft_freqs[freq_mask].tolist(),
        "power_values": power_spectrum_smooth[freq_mask].tolist(),
        "active_state": highlight_info["name"] if highlight_info else None,
        "highlight": highlight_info
    }

