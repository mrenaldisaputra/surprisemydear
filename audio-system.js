// Global Audio System untuk seluruh website
class AudioSystem {
  constructor() {
    this.musicStarted = false;
    this.backgroundMusic = null;
    this.sounds = {};
    this.init();
  }

  init() {
    // Create audio elements
    this.createAudioElements();
    
    // Set up event listeners for user interaction
    this.setupInteractionListeners();
  }

  createAudioElements() {
    // Create Web Audio Context for better sound generation
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log("Web Audio API not supported");
    }

    // Background Music - Use MP3 files
    this.backgroundMusic = document.createElement('audio');
    this.backgroundMusic.id = 'backgroundMusic';
    this.backgroundMusic.loop = true;
    this.backgroundMusic.preload = 'auto';
    this.backgroundMusic.volume = 0.3; // 30% volume
    
    // Default background music
    this.backgroundMusic.innerHTML = `
      <source src="audio/background.mp3" type="audio/mpeg">
    `;
    document.body.appendChild(this.backgroundMusic);

    // Special celebration music for prayers page
    this.celebrationMusic = document.createElement('audio');
    this.celebrationMusic.id = 'celebrationMusic';
    this.celebrationMusic.loop = true;
    this.celebrationMusic.preload = 'auto';
    this.celebrationMusic.volume = 0.6; // 60% volume
    
    this.celebrationMusic.innerHTML = `
      <source src="audio/back-perayaan.mp3" type="audio/mpeg">
    `;
    document.body.appendChild(this.celebrationMusic);

    // Create sound effects using Web Audio API
    this.sounds = {
      click: () => this.playTone(800, 0.1, 'square'),
      heart: () => this.playTone(660, 0.3, 'sine'),
      celebration: () => this.playChord([523, 659, 784], 0.5), // C major chord
      success: () => this.playTone(880, 0.2, 'triangle'),
      wrong: () => this.playTone(200, 0.3, 'sawtooth')
    };
  }

  createSoundEffect(name, sources) {
    const audio = document.createElement('audio');
    audio.id = name + 'Sound';
    audio.preload = 'auto';
    audio.innerHTML = sources;
    document.body.appendChild(audio);
    this.sounds[name] = audio;
  }

  // Create a simple tone using Web Audio API
  createTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) return '';
    
    const sampleRate = this.audioContext.sampleRate;
    const numSamples = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
          break;
      }
      
      // Apply envelope (fade in/out)
      const envelope = Math.min(t * 10, (duration - t) * 10, 1);
      channelData[i] = sample * envelope * 0.3;
    }
    
    // Convert to WAV data URI
    return this.bufferToWav(buffer);
  }

  // Play tone using Web Audio API
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
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  }

  // Play chord (multiple tones)
  playChord(frequencies, duration) {
    frequencies.forEach(freq => {
      setTimeout(() => this.playTone(freq, duration), Math.random() * 100);
    });
  }

  // Convert audio buffer to WAV data URI
  bufferToWav(buffer) {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  setupInteractionListeners() {
    // Start music on any user interaction
    document.addEventListener('click', () => this.startMusic());
    document.addEventListener('touch', () => this.startMusic());
    document.addEventListener('keydown', () => this.startMusic());
  }

  startMusic() {
    if (!this.musicStarted && this.backgroundMusic) {
      // Try to play background music, but don't make it essential
      this.backgroundMusic.volume = 0.3; // 30% volume
      this.backgroundMusic.play().catch(e => {
        console.log("Background music autoplay prevented - will start on next interaction");
        // Create a soft ambient tone instead
        this.playTone(220, 0.1, 'sine');
      });
      this.musicStarted = true;
    }
  }

  // Switch to celebration music for prayers modal
  switchToCelebrationMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
    if (this.celebrationMusic) {
      this.celebrationMusic.volume = 0.6; // 60% volume
      this.celebrationMusic.play().catch(e => {
        console.log("Celebration music failed to play:", e);
      });
    }
  }

  // Switch back to background music
  switchToBackgroundMusic() {
    if (this.celebrationMusic) {
      this.celebrationMusic.pause();
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = 0.3; // 30% volume
      this.backgroundMusic.play().catch(e => {
        console.log("Background music failed to resume:", e);
      });
    }
  }

  playSound(soundName, volume = 0.5) {
    if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
      // Use Web Audio API generated sounds
      this.sounds[soundName]();
    } else if (this.sounds[soundName]) {
      // Fallback to HTML5 audio if available
      const sound = this.sounds[soundName];
      sound.currentTime = 0;
      sound.volume = volume;
      sound.play().catch(e => console.log(`Audio play failed for ${soundName}`));
    }
  }

  stopMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
    if (this.celebrationMusic) {
      this.celebrationMusic.pause();
      this.celebrationMusic.currentTime = 0;
    }
    this.musicStarted = false;
  }

  setMusicVolume(volume) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = volume;
    }
  }

  // Utility functions for common interactions
  playClickSound() {
    this.playSound('click');
  }

  playHeartSound() {
    this.playSound('heart');
  }

  playCelebrationSound() {
    this.playSound('celebration');
  }

  playSuccessSound() {
    this.playSound('success');
  }

  playWrongSound() {
    this.playSound('wrong');
  }

  // Enhanced button sound detection
  getButtonSoundType(button) {
    const text = button.textContent.toLowerCase();
    const hasHeartEmoji = /[❤️💕💖💝💗💓💞💜🧡💛💚💙🤍🖤🤎💋]/.test(text);
    const hasSuccessWords = /success|berhasil|benar|win|menang|selamat/.test(text);
    const hasCelebrationWords = /celebrate|celebration|party|yay|hooray|wow/.test(text);
    
    if (hasHeartEmoji) return 'heart';
    if (hasSuccessWords) return 'success';
    if (hasCelebrationWords) return 'celebration';
    return 'click';
  }
}

// Initialize global audio system
let audioSystem;
document.addEventListener('DOMContentLoaded', function() {
  audioSystem = new AudioSystem();
  
  // Auto-add sound effects to all buttons with enhanced detection
  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        audioSystem.startMusic();
        const soundType = audioSystem.getButtonSoundType(button);
        audioSystem.playSound(soundType);
      });
    });
    
    // Add sound to interactive elements
    const interactiveElements = document.querySelectorAll('a, .clickable, .card, .memory-card');
    interactiveElements.forEach(element => {
      element.addEventListener('click', () => {
        audioSystem.startMusic();
        audioSystem.playClickSound();
      });
    });
    
    console.log('Audio system initialized with', buttons.length, 'buttons');
  }, 100);
});
