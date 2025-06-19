import EventEmitter from './modules/EventEmitter.js';
import AudioEngine from './modules/AudioEngine.js';
import ConcertAManager from './modules/ConcertAManager.js';
import { EVENTS, GUITAR_STRINGS, TUNER_MODES } from './utils/constants.js';
import { calculateStringFrequency, formatFrequency, formatCents, frequencyToCents } from './utils/helpers.js';

/**
 * Главный класс приложения Simple Tuner v2.1
 * Объединяет все модули и управляет общей логикой
 */
class SimpleTuner {
    constructor() {
        // Инициализация системы событий
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setDebugMode(false); // Включить для отладки
        
        // Инициализация модулей
        this.audioEngine = new AudioEngine(this.eventEmitter);
        this.concertAManager = new ConcertAManager(this.eventEmitter);
        
        // UI элементы
        this.elements = {};
        
        // Состояние приложения
        this.currentMode = TUNER_MODES.TUNER;
        this.selectedString = null;
        this.playingString = null;
        this.duration = 'inf';
        this.isRunning = false;
        this.animationFrameId = null;
        
        // Демо симуляция
        this.demoCounter = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.setupEventListeners();
    }

    /**
     * Инициализация DOM элементов
     * @private
     */
    initializeElements() {
        this.elements = {
            // Concert A контролы
            concertAValue: document.getElementById('concertAValue'),
            concertASlider: document.getElementById('concertASlider'),
            concertAInput: document.getElementById('concertAInput'),
            resetBtn: document.getElementById('resetConcertA'),
            
            // Режимы работы
            modeButtons: document.querySelectorAll('.mode-btn'),
            referenceMode: document.getElementById('referenceMode'),
            tunerMode: document.getElementById('tunerMode'),
            autoMode: document.getElementById('autoMode'),
            
            // Струны
            stringButtons: document.querySelectorAll('.string-btn'),
            
            // Контролы воспроизведения
            durationButtons: document.querySelectorAll('.duration-btn'),
            duration2s: document.getElementById('duration2s'),
            durationInf: document.getElementById('durationInf'),
            stopBtn: document.getElementById('stopBtn'),
            
            // Индикаторы
            meterNeedle: document.getElementById('meterNeedle'),
            centDisplay: document.getElementById('centDisplay'),
            frequencyDisplay: document.getElementById('frequencyDisplay'),
            
            // Статус
            statusMessage: document.getElementById('statusMessage'),
            levelBars: document.querySelectorAll('.level-bar'),
            levelValue: document.getElementById('levelValue')
        };
    }

    /**
     * Привязка обработчиков событий DOM
     * @private
     */
    bindEvents() {
        // Concert A контролы
        this.elements.concertASlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.concertAManager.setConcertA(value);
        });

        this.elements.concertAInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                this.concertAManager.setConcertA(value);
            }
        });

        this.elements.resetBtn.addEventListener('click', () => {
            this.concertAManager.reset();
        });

        // Режимы работы
        this.elements.referenceMode.addEventListener('click', () => {
            this.setMode(TUNER_MODES.REFERENCE);
        });

        this.elements.tunerMode.addEventListener('click', () => {
            this.setMode(TUNER_MODES.TUNER);
        });

        this.elements.autoMode.addEventListener('click', () => {
            this.setMode(TUNER_MODES.AUTO);
        });

        // Кнопки струн
        this.elements.stringButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.selectString(index);
                if (this.currentMode === TUNER_MODES.REFERENCE) {
                    this.playStringTone(index);
                }
            });
        });

        // Контролы длительности
        this.elements.duration2s.addEventListener('click', () => {
            this.setDuration('2');
        });

        this.elements.durationInf.addEventListener('click', () => {
            this.setDuration('inf');
        });

        // Кнопка остановки
        this.elements.stopBtn.addEventListener('click', () => {
            this.audioEngine.stopTone();
        });
    }

    /**
     * Настройка слушателей системы событий
     * @private
     */
    setupEventListeners() {
        // Audio Engine события
        this.eventEmitter.on(EVENTS.AUDIO_INITIALIZED, (data) => {
            console.log('Audio system initialized:', data);
            this.elements.statusMessage.textContent = 'Готов к работе';
        });

        this.eventEmitter.on(EVENTS.MICROPHONE_STARTED, (data) => {
            console.log('Microphone started:', data);
            this.elements.statusMessage.textContent = 'Микрофон активен';
        });

        // Concert A события
        this.eventEmitter.on(EVENTS.CONCERT_A_CHANGED, (data) => {
            this.updateConcertADisplay();
            
            // Обновляем частоту выбранной струны
            if (this.selectedString !== null) {
                this.updateSelectedStringFrequency();
            }
        });

        // Tone события
        this.eventEmitter.on(EVENTS.TONE_STARTED, (data) => {
            this.updatePlayingState();
        });

        this.eventEmitter.on(EVENTS.TONE_STOPPED, () => {
            this.updatePlayingState();
        });

        // Ошибки
        this.eventEmitter.on(EVENTS.ERROR_OCCURRED, (error) => {
            console.error('Application error:', error);
            this.elements.statusMessage.textContent = error.message || 'Произошла ошибка';
        });
    }

    /**
     * Инициализация приложения
     */
    async initialize() {
        try {
            console.log('Initializing Simple Tuner v2.1...');
            
            // Инициализация аудио (требует user gesture)
            this.setupInitialAudioGesture();
            
            // Установка начальных значений UI
            this.updateConcertADisplay();
            this.setMode(TUNER_MODES.TUNER);
            this.setDuration('inf');
            
            // Выбираем первую струну по умолчанию
            this.selectString(4); // A2 (5-я струна)
            
            this.elements.statusMessage.textContent = 'Кликните для активации аудио';
            
            console.log('Simple Tuner v2.1 initialized successfully');
            console.log('Features:', {
                concertARange: '435-445Hz',
                accuracy: '±0.5¢ (demo simulation)',
                modes: ['Reference', 'Tuner', 'Auto'],
                strings: GUITAR_STRINGS.length
            });
            
        } catch (error) {
            console.error('Failed to initialize Simple Tuner:', error);
            this.elements.statusMessage.textContent = 'Ошибка инициализации';
        }
    }

    /**
     * Настройка инициализации аудио по user gesture
     * @private
     */
    setupInitialAudioGesture() {
        const initAudio = async () => {
            if (!this.audioEngine.isInitialized) {
                const success = await this.audioEngine.initialize();
                if (success) {
                    // Автоматически запускаем микрофон для режима тюнера
                    await this.audioEngine.startMicrophone();
                    this.startAnalysisLoop();
                }
            }
        };

        // Инициализация при первом клике
        document.addEventListener('click', initAudio, { once: true });
        
        // Альтернативные события для активации
        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
    }

    /**
     * Установка режима работы
     * @param {string} mode - Режим из TUNER_MODES
     */
    setMode(mode) {
        this.currentMode = mode;
        
        // Обновляем UI кнопок режимов
        this.elements.modeButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        switch (mode) {
            case TUNER_MODES.REFERENCE:
                this.elements.referenceMode.classList.add('active');
                this.elements.statusMessage.textContent = 'Режим эталона: нажмите на струну';
                break;
            case TUNER_MODES.TUNER:
                this.elements.tunerMode.classList.add('active');
                this.elements.statusMessage.textContent = 'Режим тюнера: играйте на струне';
                this.simulateTunerMode();
                break;
            case TUNER_MODES.AUTO:
                this.elements.autoMode.classList.add('active');
                this.elements.statusMessage.textContent = 'Авто режим: ожидание звука...';
                this.simulateAutoMode();
                break;
        }

        console.log(`Mode changed to: ${mode}`);
    }

    /**
     * Выбор струны
     * @param {number} index - Индекс струны (0-5)
     */
    selectString(index) {
        if (index < 0 || index >= GUITAR_STRINGS.length) return;
        
        this.selectedString = index;
        
        // Обновляем UI кнопок струн
        this.elements.stringButtons.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });

        // Показываем эталонную частоту
        this.updateSelectedStringFrequency();
        
        console.log(`String selected: ${GUITAR_STRINGS[index].name} (${index})`);
    }

    /**
     * Установка длительности воспроизведения
     * @param {string} duration - '2' или 'inf'
     */
    setDuration(duration) {
        this.duration = duration;
        
        this.elements.durationButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        if (duration === '2') {
            this.elements.duration2s.classList.add('active');
        } else {
            this.elements.durationInf.classList.add('active');
        }
    }

    /**
     * Воспроизведение тона струны
     * @param {number} index - Индекс струны
     */
    playStringTone(index) {
        const frequency = calculateStringFrequency(index, this.concertAManager.getConcertA());
        const duration = this.duration === 'inf' ? null : parseInt(this.duration);
        
        this.playingString = index;
        this.audioEngine.generateTone(frequency, duration);
        
        console.log(`Playing tone: ${GUITAR_STRINGS[index].name} - ${frequency.toFixed(1)}Hz`);
        
        // Автоматически убираем состояние воспроизведения через duration
        if (duration) {
            setTimeout(() => {
                this.playingString = null;
                this.updatePlayingState();
            }, duration * 1000);
        }
    }

    /**
     * Обновление отображения Concert A
     * @private
     */
    updateConcertADisplay() {
        const value = this.concertAManager.getConcertA();
        this.elements.concertAValue.textContent = `A = ${value.toFixed(1)}Hz`;
        this.elements.concertASlider.value = value;
        this.elements.concertAInput.value = value.toFixed(1);
    }

    /**
     * Обновление частоты выбранной струны
     * @private
     */
    updateSelectedStringFrequency() {
        if (this.selectedString !== null) {
            const frequency = calculateStringFrequency(
                this.selectedString, 
                this.concertAManager.getConcertA()
            );
            this.elements.frequencyDisplay.textContent = formatFrequency(frequency);
        }
    }

    /**
     * Обновление состояния воспроизведения
     * @private
     */
    updatePlayingState() {
        this.elements.stringButtons.forEach((btn, index) => {
            btn.classList.remove('playing');
            if (index === this.playingString && this.audioEngine.isGeneratingTone) {
                btn.classList.add('playing');
            }
        });
    }

    /**
     * Демо симуляция режима тюнера
     * @private
     */
    simulateTunerMode() {
        if (this.currentMode !== TUNER_MODES.TUNER) return;
        
        const simulate = () => {
            if (this.currentMode !== TUNER_MODES.TUNER) return;
            
            // Симулируем анализ частоты
            const cents = Math.sin(this.demoCounter * 0.05) * 25 + Math.random() * 5 - 2.5;
            this.updateFrequencyMeter(cents);
            
            this.demoCounter++;
            setTimeout(simulate, 100);
        };
        
        setTimeout(simulate, 500);
    }

    /**
     * Демо симуляция авто режима
     * @private
     */
    simulateAutoMode() {
        if (this.currentMode !== TUNER_MODES.AUTO) return;
        
        // Симулируем автоматическое определение струны через 2 секунды
        setTimeout(() => {
            if (this.currentMode === TUNER_MODES.AUTO) {
                const randomString = Math.floor(Math.random() * GUITAR_STRINGS.length);
                this.selectString(randomString);
                this.elements.statusMessage.textContent = 
                    `Обнаружена струна: ${GUITAR_STRINGS[randomString].displayName}`;
                
                // Симулируем анализ для обнаруженной струны
                setTimeout(() => {
                    this.simulateTunerMode();
                }, 1000);
            }
        }, 2000);
    }

    /**
     * Обновление индикатора частотомера
     * @param {number} cents - Отклонение в центах
     * @private
     */
    updateFrequencyMeter(cents) {
        const maxDeviation = 50;
        const normalizedDeviation = Math.max(-1, Math.min(1, cents / maxDeviation));
        const rotation = normalizedDeviation * 45; // ±45 градусов
        
        this.elements.meterNeedle.style.transform = 
            `translateX(-50%) rotate(${rotation}deg)`;
        
        this.elements.centDisplay.textContent = formatCents(cents);
        
        // Цветовая индикация
        if (Math.abs(cents) < 5) {
            this.elements.centDisplay.style.color = 'var(--color-tuned)';
        } else if (Math.abs(cents) < 25) {
            this.elements.centDisplay.style.color = 'var(--color-flat)';
        } else {
            this.elements.centDisplay.style.color = 'var(--color-sharp)';
        }
    }

    /**
     * Главный цикл анализа (для демо симуляции)
     * @private
     */
    startAnalysisLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        const analyze = () => {
            if (!this.isRunning) return;
            
            // Симулируем уровень микрофона
            const level = Math.random() * 8;
            this.updateInputLevel(level);
            
            // Планируем следующий кадр (20 FPS)
            this.animationFrameId = setTimeout(() => {
                requestAnimationFrame(analyze);
            }, 50);
        };
        
        requestAnimationFrame(analyze);
    }

    /**
     * Обновление индикатора уровня микрофона
     * @param {number} level - Уровень 0-8
     * @private
     */
    updateInputLevel(level) {
        this.elements.levelBars.forEach((bar, index) => {
            bar.classList.toggle('active', index < level);
        });
        
        const dbValue = level > 0 ? Math.round(-60 + level * 7.5) : -Infinity;
        this.elements.levelValue.textContent = 
            dbValue === -Infinity ? '-∞dB' : `${dbValue}dB`;
    }

    /**
     * Остановка приложения и очистка ресурсов
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationFrameId) {
            clearTimeout(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.audioEngine.stopAll();
        this.eventEmitter.destroy();
        
        console.log('Simple Tuner stopped');
    }

    /**
     * Получение статистики приложения
     * @returns {Object} Объект со статистикой
     */
    getStats() {
        return {
            mode: this.currentMode,
            selectedString: this.selectedString,
            concertA: this.concertAManager.getConcertA(),
            audioEngine: this.audioEngine.getStatus(),
            isRunning: this.isRunning
        };
    }
}

/**
 * Глобальная инициализация и запуск приложения
 */
async function initializeApp() {
    try {
        // Создаем экземпляр приложения
        const tuner = new SimpleTuner();
        
        // Делаем доступным глобально для отладки
        window.simpleTuner = tuner;
        
        // Инициализируем
        await tuner.initialize();
        
        // Обработчик закрытия страницы
        window.addEventListener('beforeunload', () => {
            tuner.stop();
        });
        
        // Обработчик ошибок
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            tuner.eventEmitter.emit('error-occurred', {
                type: 'global-error',
                message: 'Произошла неожиданная ошибка'
            });
        });
        
        console.log('🎵 Simple Tuner v2.1 запущен успешно!');
        console.log('📋 Функции демо версии:');
        console.log('   • Concert A Reference (435-445Hz)');
        console.log('   • Эталонные тоны (режим "Эталон")');
        console.log('   • Симуляция анализа (режим "Тюнер")');
        console.log('   • Автоматическое определение струн (режим "Авто")');
        console.log('   • Адаптивный дизайн');
        console.log('   • Modular архитектура согласно плану');
        console.log('🔧 Для отладки используйте: window.simpleTuner.getStats()');
        
    } catch (error) {
        console.error('Ошибка запуска Simple Tuner:', error);
        document.getElementById('statusMessage').textContent = 'Критическая ошибка запуска';
    }
}

// Запуск приложения при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM уже загружен
    initializeApp();
}