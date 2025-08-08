// Optimized Audio System for Birthday Surprise Website
class AudioSystem {
  constructor() {
    this.musicStarted = false;
    this.backgroundMusic = null;
    this.celebrationMusic = null;
    this.audioContext = null;
    this.sounds = {};
    this.init();
  }

  init() {
    this.createAudioElements();
    this.setupInteractionListeners();
  }

  createAudioElements() {
    // Create Web Audio Context for sound effects
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Fallback: Use basic audio without Web Audio API
      this.audioContext = null;
    }

    // Background music
    this.backgroundMusic = this.createAudioElement('backgroundMusic', 'audio/background.mp3', 0.3, true);
    this.celebrationMusic = this.createAudioElement('celebrationMusic', 'audio/back-perayaan.mp3', 0.6, true);

    // Sound effects using Web Audio API
    this.sounds = {
      click: () => this.playTone(800, 0.1, 'square'),
      heart: () => this.playTone(660, 0.3, 'sine'),
      celebration: () => this.playChord([523, 659, 784], 0.5),
      success: () => this.playTone(880, 0.2, 'triangle'),
      wrong: () => this.playTone(200, 0.3, 'sawtooth')
    };
  }

  createAudioElement(id, src, volume, loop = false) {
    const audio = document.createElement('audio');
    audio.id = id;
    audio.loop = loop;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.innerHTML = `<source src="${src}" type="audio/mpeg">`;
    document.body.appendChild(audio);
    return audio;
  }

  playTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) return;
    
    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      // Envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      // Silent failure for audio issues
    }
  }

  playChord(frequencies, duration) {
    frequencies.forEach(freq => {
      setTimeout(() => this.playTone(freq, duration), Math.random() * 100);
    });
  }

  setupInteractionListeners() {
    const startMusic = () => this.startMusic();
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, startMusic, { once: true, passive: true });
    });
  }

  startMusic() {
    if (!this.musicStarted && this.backgroundMusic) {
      this.backgroundMusic.play().catch(() => {
        // Fallback: create soft tone
        this.playTone(220, 0.1, 'sine');
      });
      this.musicStarted = true;
    }
  }

  switchToCelebrationMusic() {
    if (this.backgroundMusic) this.backgroundMusic.pause();
    if (this.celebrationMusic) {
      this.celebrationMusic.play().catch(() => {
        // Silent failure
      });
    }
  }

  switchToBackgroundMusic() {
    if (this.celebrationMusic) this.celebrationMusic.pause();
    if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(() => {
        // Silent failure
      });
    }
  }

  playSound(soundName) {
    if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
      this.sounds[soundName]();
    }
  }

  stopMusic() {
    [this.backgroundMusic, this.celebrationMusic].forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    this.musicStarted = false;
  }

  // Utility methods
  playClickSound() { this.playSound('click'); }
  playHeartSound() { this.playSound('heart'); }
  playCelebrationSound() { this.playSound('celebration'); }
  playSuccessSound() { this.playSound('success'); }
  playWrongSound() { this.playSound('wrong'); }

  getButtonSoundType(button) {
    const text = button.textContent.toLowerCase();
    if (/[❤️💕💖💝💗💓💞💜🧡💛💚💙🤍🖤🤎💋]/.test(text)) return 'heart';
    if (/success|berhasil|benar|win|menang|selamat/.test(text)) return 'success';
    if (/celebrate|celebration|party|yay|hooray|wow/.test(text)) return 'celebration';
    return 'click';
  }
}

// Initialize global audio system
let audioSystem;
document.addEventListener('DOMContentLoaded', () => {
  audioSystem = new AudioSystem();
  
  // Auto-add sound effects to buttons
  setTimeout(() => {
    document.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        audioSystem.startMusic();
        const soundType = audioSystem.getButtonSoundType(button);
        audioSystem.playSound(soundType);
      });
    });
    
    // Add sound to interactive elements
    document.querySelectorAll('a, .clickable, .card, .memory-card').forEach(element => {
      element.addEventListener('click', () => {
        audioSystem.startMusic();
        audioSystem.playClickSound();
      });
    });
  }, 100);
});