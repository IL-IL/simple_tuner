// Константы для гитарных струн (полутона от A4)
export const GUITAR_STRINGS = {
    E4: { index: 0, name: 'E4', semitones: 19, displayName: '1-я (E4)' },
    B3: { index: 1, name: 'B3', semitones: 14, displayName: '2-я (B3)' },
    G3: { index: 2, name: 'G3', semitones: 10, displayName: '3-я (G3)' },
    D3: { index: 3, name: 'D3', semitones: 5, displayName: '4-я (D3)' },
    A2: { index: 4, name: 'A2', semitones: 0, displayName: '5-я (A2)' },
    E2: { index: 5, name: 'E2', semitones: -5, displayName: '6-я (E2)' }
};

// Массив струн для удобного доступа по индексу
export const STRINGS_ARRAY = [
    GUITAR_STRINGS.E4,
    GUITAR_STRINGS.B3,
    GUITAR_STRINGS.G3,
    GUITAR_STRINGS.D3,
    GUITAR_STRINGS.A2,
    GUITAR_STRINGS.E2
];

// Константы Concert A
export const CONCERT_A = {
    MIN: 435.0,
    MAX: 445.0,
    STANDARD: 440.0,
    STEP: 0.1
};

// Константы точности и производительности
export const ACCURACY_TARGET = 0.5; // центы
export const FFT_SIZE = 8192;
export const SAMPLE_RATE = 44100;
export const SMOOTHING_TIME_CONSTANT = 0.8;

// Константы диапазонов частот
export const FREQUENCY_RANGE = {
    MIN: 75,  // Hz - минимальная частота для анализа
    MAX: 370  // Hz - максимальная частота для анализа
};

// Константы уровней сигнала
export const SIGNAL_LEVELS = {
    MIN_INPUT_LEVEL: -40,  // dB - минимальный уровень для анализа
    MAX_INPUT_LEVEL: 0,    // dB - максимальный уровень без перегрузки
    SILENCE_THRESHOLD: -50 // dB - порог тишины
};

// Константы режимов работы
export const TUNER_MODES = {
    REFERENCE: 'reference',
    TUNER: 'tuner',
    AUTO: 'auto'
};

// Константы времени
export const TIMING = {
    RESPONSE_TIME_TARGET: 80,    // мс - целевое время отклика
    AUTO_SWITCH_DELAY: 500,      // мс - задержка автопереключения
    SILENCE_TIMEOUT: 10000,      // мс - таймаут возврата в режим ожидания
    STABILIZATION_COUNT: 5,      // количество измерений для стабилизации
    STABILIZATION_TOLERANCE: 1,  // центы - допуск для стабилизации
    ANALYSIS_INTERVAL: 50        // мс - интервал анализа (20 FPS)
};

// Константы UI
export const UI_CONFIG = {
    UPDATE_RATE: 20,           // FPS
    ANIMATION_DURATION: 300,   // мс
    METER_MAX_DEVIATION: 50,   // центы - максимальное отклонение на шкале
    LEVEL_BARS_COUNT: 8        // количество полосок уровня сигнала
};

// Конфигурация приложения
export const CONFIG = {
    audio: {
        fftSize: FFT_SIZE,
        smoothingTimeConstant: SMOOTHING_TIME_CONSTANT,
        minInputLevel: SIGNAL_LEVELS.MIN_INPUT_LEVEL,
        maxInputLevel: SIGNAL_LEVELS.MAX_INPUT_LEVEL,
        sampleRate: SAMPLE_RATE
    },
    tuner: {
        targetAccuracy: ACCURACY_TARGET,
        responseTime: TIMING.RESPONSE_TIME_TARGET,
        autoSwitchDelay: TIMING.AUTO_SWITCH_DELAY,
        silenceTimeout: TIMING.SILENCE_TIMEOUT,
        stabilizationCount: TIMING.STABILIZATION_COUNT,
        stabilizationTolerance: TIMING.STABILIZATION_TOLERANCE
    },
    ui: {
        updateRate: UI_CONFIG.UPDATE_RATE,
        animationDuration: UI_CONFIG.ANIMATION_DURATION,
        meterMaxDeviation: UI_CONFIG.METER_MAX_DEVIATION
    }
};

// Ключи для localStorage
export const STORAGE_KEYS = {
    CONCERT_A: 'simple-tuner-concert-a',
    USER_PREFERENCES: 'simple-tuner-preferences'
};

// События приложения
export const EVENTS = {
    // Audio события
    AUDIO_INITIALIZED: 'audio-initialized',
    MICROPHONE_STARTED: 'microphone-started',
    MICROPHONE_ERROR: 'microphone-error',
    
    // Frequency Analysis события
    FREQUENCY_DETECTED: 'frequency-detected',
    ANALYSIS_ERROR: 'analysis-error',
    
    // Concert A события
    CONCERT_A_CHANGED: 'concert-a-changed',
    CONCERT_A_RESET: 'concert-a-reset',
    
    // Tuner Logic события
    MODE_CHANGED: 'mode-changed',
    STRING_DETECTED: 'string-detected',
    STRING_SELECTED: 'string-selected',
    TUNING_STATUS_CHANGED: 'tuning-status-changed',
    
    // Tone Generation события
    TONE_STARTED: 'tone-started',
    TONE_STOPPED: 'tone-stopped',
    
    // UI события
    UI_UPDATE_REQUIRED: 'ui-update-required',
    
    // Error события
    ERROR_OCCURRED: 'error-occurred'
};

// Типы ошибок
export const ERROR_TYPES = {
    AUDIO_INIT: 'audio-init',
    MICROPHONE_ACCESS: 'microphone-access',
    FREQUENCY_ANALYSIS: 'frequency-analysis',
    CONCERT_A_VALIDATION: 'concert-a-validation',
    STORAGE_ERROR: 'storage-error',
    BROWSER_COMPATIBILITY: 'browser-compatibility'
};

// Состояния настройки
export const TUNING_STATUS = {
    SILENT: 'silent',
    ANALYZING: 'analyzing',
    TUNED: 'tuned',
    SHARP: 'sharp',
    FLAT: 'flat',
    OUT_OF_RANGE: 'out-of-range'
};