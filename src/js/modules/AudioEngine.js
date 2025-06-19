import { CONFIG, EVENTS, ERROR_TYPES } from '../utils/constants.js';
import { amplitudeToDb } from '../utils/helpers.js';

/**
 * Модуль управления Web Audio API
 * Обеспечивает захват микрофона, генерацию эталонных тонов и анализ аудио
 */
export default class AudioEngine {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // Web Audio API компоненты
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.oscillator = null;
        this.gainNode = null;
        this.microphoneSource = null;
        
        // Состояние
        this.isInitialized = false;
        this.isMicrophoneActive = false;
        this.isGeneratingTone = false;
        
        // Буферы для анализа
        this.fftSize = CONFIG.audio.fftSize;
        this.dataArray = null;
        this.frequencyData = null;
        
        // Настройки
        this.sampleRate = CONFIG.audio.sampleRate;
        this.smoothingTimeConstant = CONFIG.audio.smoothingTimeConstant;
    }

    /**
     * Инициализация Web Audio API
     * @returns {Promise<boolean>} true если инициализация успешна
     */
    async initialize() {
        if (this.isInitialized) {
            console.log('AudioEngine already initialized');
            return true;
        }

        try {
            // Создаем AudioContext
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API not supported');
            }

            this.audioContext = new AudioContextClass();
            
            // Для Safari - возможно потребуется resume после user gesture
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Создаем основные узлы
            this.setupAudioNodes();
            
            this.isInitialized = true;
            this.sampleRate = this.audioContext.sampleRate;
            
            console.log(`AudioEngine initialized: ${this.sampleRate}Hz, FFT size: ${this.fftSize}`);
            
            this.eventEmitter.emit(EVENTS.AUDIO_INITIALIZED, {
                sampleRate: this.sampleRate,
                fftSize: this.fftSize
            });
            
            return true;
            
        } catch (error) {
            console.error('Failed to initialize AudioEngine:', error);
            
            this.eventEmitter.emit(EVENTS.ERROR_OCCURRED, {
                type: ERROR_TYPES.AUDIO_INIT,
                message: 'Не удалось инициализировать аудио систему',
                details: error.message
            });
            
            return false;
        }
    }

    /**
     * Настройка основных аудио узлов
     * @private
     */
    setupAudioNodes() {
        // Главный gain node для контроля громкости
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.1; // Низкая громкость по умолчанию
        this.gainNode.connect(this.audioContext.destination);

        // Анализатор для FFT
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = this.fftSize;
        this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;
        this.analyser.minDecibels = -90;
        this.analyser.maxDecibels = -10;

        // Создаем буферы
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
        
        console.log(`Audio nodes setup: FFT bins: ${this.analyser.frequencyBinCount}`);
    }

    /**
     * Запуск захвата микрофона
     * @returns {Promise<boolean>} true если микрофон захвачен успешно
     */
    async startMicrophone() {
        if (!this.isInitialized) {
            console.error('AudioEngine not initialized');
            return false;
        }

        if (this.isMicrophoneActive) {
            console.log('Microphone already active');
            return true;
        }

        try {
            // Запрашиваем доступ к микрофону
            const constraints = {
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: this.sampleRate,
                    channelCount: 1
                }
            };

            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Подключаем микрофон к анализатору
            this.microphoneSource = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.microphoneSource.connect(this.analyser);
            
            this.isMicrophoneActive = true;
            
            console.log('Microphone started successfully');
            
            this.eventEmitter.emit(EVENTS.MICROPHONE_STARTED, {
                sampleRate: this.sampleRate,
                channelCount: this.mediaStream.getAudioTracks()[0].getSettings().channelCount
            });
            
            return true;
            
        } catch (error) {
            console.error('Failed to start microphone:', error);
            
            let errorMessage = 'Не удалось получить доступ к микрофону';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Микрофон не найден. Проверьте подключение микрофона.';
            }
            
            this.eventEmitter.emit(EVENTS.ERROR_OCCURRED, {
                type: ERROR_TYPES.MICROPHONE_ACCESS,
                message: errorMessage,
                details: error.message
            });
            
            return false;
        }
    }

    /**
     * Генерация эталонного тона
     * @param {number} frequency - Частота в Hz
     * @param {number|null} duration - Длительность в секундах (null = бесконечно)
     * @returns {boolean} true если тон начал воспроизводиться
     */
    generateTone(frequency, duration = null) {
        if (!this.isInitialized) {
            console.error('AudioEngine not initialized');
            return false;
        }

        // Останавливаем предыдущий тон
        this.stopTone();

        try {
            // Создаем осциллятор
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = 'sine';
            this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Подключаем к выходу через gain node
            this.oscillator.connect(this.gainNode);
            
            // Плавное включение для избежания щелчков
            const fadeTime = 0.01; // 10мс
            this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + fadeTime);
            
            // Запускаем
            this.oscillator.start();
            this.isGeneratingTone = true;
            
            // Автоматическая остановка через duration
            if (duration && duration > 0) {
                setTimeout(() => {
                    this.stopTone();
                }, duration * 1000);
            }
            
            console.log(`Tone started: ${frequency}Hz, duration: ${duration || 'infinite'}`);
            
            this.eventEmitter.emit(EVENTS.TONE_STARTED, {
                frequency,
                duration,
                timestamp: this.audioContext.currentTime
            });
            
            return true;
            
        } catch (error) {
            console.error('Failed to generate tone:', error);
            return false;
        }
    }

    /**
     * Остановка воспроизведения тона
     */
    stopTone() {
        if (this.oscillator && this.isGeneratingTone) {
            try {
                // Плавное выключение
                const fadeTime = 0.01; // 10мс
                this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
                
                // Останавливаем осциллятор после fade out
                setTimeout(() => {
                    if (this.oscillator) {
                        this.oscillator.stop();
                        this.oscillator.disconnect();
                        this.oscillator = null;
                    }
                }, fadeTime * 1000 + 10);
                
                this.isGeneratingTone = false;
                
                this.eventEmitter.emit(EVENTS.TONE_STOPPED, {
                    timestamp: this.audioContext.currentTime
                });
                
            } catch (error) {
                console.warn('Error stopping oscillator:', error);
                this.oscillator = null;
                this.isGeneratingTone = false;
            }
        }
    }

    /**
     * Получение уровня входного сигнала
     * @returns {number} Уровень в dB (-Infinity до 0)
     */
    getInputLevel() {
        if (!this.analyser || !this.isMicrophoneActive) {
            return -Infinity;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Вычисляем RMS уровень
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = this.dataArray[i] / 255;
            sum += normalized * normalized;
        }
        
        const rms = Math.sqrt(sum / this.dataArray.length);
        return amplitudeToDb(rms);
    }

    /**
     * Получение анализатора для внешнего использования
     * @returns {AnalyserNode|null} Узел анализатора или null
     */
    getAnalyser() {
        return this.analyser;
    }

    /**
     * Получение информации о состоянии
     * @returns {Object} Объект с информацией о состоянии
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isMicrophoneActive: this.isMicrophoneActive,
            isGeneratingTone: this.isGeneratingTone,
            sampleRate: this.sampleRate,
            fftSize: this.fftSize,
            audioContextState: this.audioContext ? this.audioContext.state : 'not-created'
        };
    }

    /**
     * Остановка всех аудио процессов и очистка ресурсов
     */
    stopAll() {
        this.stopTone();
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.microphoneSource) {
            this.microphoneSource.disconnect();
            this.microphoneSource = null;
        }

        this.isMicrophoneActive = false;
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.dataArray = null;
        this.frequencyData = null;
        this.isInitialized = false;
        
        console.log('AudioEngine stopped and cleaned up');
    }

    /**
     * Проверка поддержки Web Audio API
     * @static
     * @returns {boolean} true если Web Audio API поддерживается
     */
    static isSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
}