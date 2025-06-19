import { CONCERT_A, STRINGS_ARRAY, STORAGE_KEYS, EVENTS } from '../utils/constants.js';
import { validateConcertA, calculateStringFrequency } from '../utils/helpers.js';

/**
 * Модуль управления Concert A Reference
 * Обеспечивает настройку эталонной частоты в диапазоне 435-445Hz
 * с автоматическим пересчетом всех частот струн
 */
export default class ConcertAManager {
    constructor(eventEmitter, storageManager = null) {
        this.eventEmitter = eventEmitter;
        this.storageManager = storageManager;
        this.currentConcertA = CONCERT_A.STANDARD;
        
        // Кэш частот струн для производительности
        this.stringFrequenciesCache = new Map();
        
        this.loadFromStorage();
        this.updateStringFrequencies();
    }

    /**
     * Установка нового значения Concert A
     * @param {number} value - Частота в Hz (435.0-445.0)
     * @returns {boolean} true если значение установлено успешно
     */
    setConcertA(value) {
        if (!validateConcertA(value)) {
            console.warn(`Invalid Concert A value: ${value}. Must be between ${CONCERT_A.MIN} and ${CONCERT_A.MAX}`);
            this.eventEmitter.emit(EVENTS.ERROR_OCCURRED, {
                type: 'concert-a-validation',
                message: `Значение Concert A должно быть между ${CONCERT_A.MIN} и ${CONCERT_A.MAX} Hz`
            });
            return false;
        }

        const oldValue = this.currentConcertA;
        this.currentConcertA = Number(value.toFixed(1)); // Округляем до 0.1Hz
        
        // Обновляем кэш частот
        this.updateStringFrequencies();
        
        // Сохраняем в localStorage
        this.saveToStorage();
        
        // Уведомляем подписчиков об изменении
        this.eventEmitter.emit(EVENTS.CONCERT_A_CHANGED, {
            oldValue,
            newValue: this.currentConcertA,
            stringFrequencies: this.getStringFrequencies()
        });

        console.log(`Concert A changed: ${oldValue}Hz → ${this.currentConcertA}Hz`);
        return true;
    }

    /**
     * Получение текущего значения Concert A
     * @returns {number} Частота в Hz
     */
    getConcertA() {
        return this.currentConcertA;
    }

    /**
     * Вычисление частоты конкретной струны
     * @param {number} stringIndex - Индекс струны (0-5)
     * @returns {number} Частота струны в Hz
     */
    calculateStringFrequency(stringIndex) {
        if (stringIndex < 0 || stringIndex >= STRINGS_ARRAY.length) {
            throw new Error(`Invalid string index: ${stringIndex}`);
        }

        // Используем кэш если доступен
        if (this.stringFrequenciesCache.has(stringIndex)) {
            return this.stringFrequenciesCache.get(stringIndex);
        }

        const frequency = calculateStringFrequency(stringIndex, this.currentConcertA);
        this.stringFrequenciesCache.set(stringIndex, frequency);
        
        return frequency;
    }

    /**
     * Получение частот всех струн
     * @returns {Array<number>} Массив частот в Hz
     */
    getStringFrequencies() {
        return STRINGS_ARRAY.map((_, index) => this.calculateStringFrequency(index));
    }

    /**
     * Получение информации о струне с частотой
     * @param {number} stringIndex - Индекс струны
     * @returns {Object} Объект с информацией о струне
     */
    getStringInfo(stringIndex) {
        if (stringIndex < 0 || stringIndex >= STRINGS_ARRAY.length) {
            return null;
        }

        const stringData = STRINGS_ARRAY[stringIndex];
        return {
            ...stringData,
            frequency: this.calculateStringFrequency(stringIndex),
            concertA: this.currentConcertA
        };
    }

    /**
     * Сброс к стандартному значению 440.0Hz
     * @returns {boolean} true если сброс выполнен успешно
     */
    reset() {
        const success = this.setConcertA(CONCERT_A.STANDARD);
        
        if (success) {
            this.eventEmitter.emit(EVENTS.CONCERT_A_RESET, {
                value: CONCERT_A.STANDARD
            });
            console.log('Concert A reset to standard 440.0Hz');
        }
        
        return success;
    }

    /**
     * Проверка, является ли текущее значение стандартным
     * @returns {boolean} true если значение равно 440.0Hz
     */
    isStandard() {
        return Math.abs(this.currentConcertA - CONCERT_A.STANDARD) < 0.05;
    }

    /**
     * Получение отклонения от стандартного значения
     * @returns {number} Отклонение в Hz (положительное или отрицательное)
     */
    getDeviationFromStandard() {
        return this.currentConcertA - CONCERT_A.STANDARD;
    }

    /**
     * Сохранение в localStorage
     * @private
     */
    saveToStorage() {
        try {
            if (this.storageManager) {
                this.storageManager.save(STORAGE_KEYS.CONCERT_A, this.currentConcertA);
            } else {
                localStorage.setItem(STORAGE_KEYS.CONCERT_A, this.currentConcertA.toString());
            }
        } catch (error) {
            console.warn('Failed to save Concert A to storage:', error);
            this.eventEmitter.emit(EVENTS.ERROR_OCCURRED, {
                type: 'storage-error',
                message: 'Не удалось сохранить настройки Concert A'
            });
        }
    }

    /**
     * Загрузка из localStorage
     * @private
     */
    loadFromStorage() {
        try {
            let savedValue;
            
            if (this.storageManager) {
                savedValue = this.storageManager.load(STORAGE_KEYS.CONCERT_A);
            } else {
                const saved = localStorage.getItem(STORAGE_KEYS.CONCERT_A);
                savedValue = saved ? parseFloat(saved) : null;
            }

            if (savedValue !== null && validateConcertA(savedValue)) {
                this.currentConcertA = savedValue;
                console.log(`Concert A loaded from storage: ${savedValue}Hz`);
            } else {
                this.currentConcertA = CONCERT_A.STANDARD;
                console.log('Using default Concert A: 440.0Hz');
            }
        } catch (error) {
            console.warn('Failed to load Concert A from storage:', error);
            this.currentConcertA = CONCERT_A.STANDARD;
        }
    }

    /**
     * Обновление кэша частот струн
     * @private
     */
    updateStringFrequencies() {
        this.stringFrequenciesCache.clear();
        
        // Предварительно вычисляем частоты всех струн
        for (let i = 0; i < STRINGS_ARRAY.length; i++) {
            this.calculateStringFrequency(i);
        }
    }

    /**
     * Валидация и нормализация входного значения
     * @param {any} value - Значение для валидации
     * @returns {number|null} Нормализованное значение или null если невалидно
     */
    static validateAndNormalize(value) {
        const numValue = Number(value);
        
        if (isNaN(numValue)) return null;
        if (numValue < CONCERT_A.MIN || numValue > CONCERT_A.MAX) return null;
        
        // Округляем до 0.1Hz
        return Math.round(numValue * 10) / 10;
    }

    /**
     * Получение всех допустимых значений Concert A
     * @returns {Array<number>} Массив значений с шагом 0.1Hz
     */
    static getAllowedValues() {
        const values = [];
        for (let value = CONCERT_A.MIN; value <= CONCERT_A.MAX; value += CONCERT_A.STEP) {
            values.push(Math.round(value * 10) / 10);
        }
        return values;
    }

    /**
     * Получение ближайшего допустимого значения
     * @param {number} value - Входное значение
     * @returns {number} Ближайшее допустимое значение
     */
    static getNearestAllowedValue(value) {
        const numValue = Number(value);
        
        if (isNaN(numValue)) return CONCERT_A.STANDARD;
        
        // Клампируем в допустимый диапазон
        const clamped = Math.max(CONCERT_A.MIN, Math.min(CONCERT_A.MAX, numValue));
        
        // Округляем до ближайшего шага 0.1Hz
        return Math.round(clamped * 10) / 10;
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        this.stringFrequenciesCache.clear();
        this.eventEmitter = null;
        this.storageManager = null;
    }

    /**
     * Получение статистики использования
     * @returns {Object} Объект со статистикой
     */
    getStats() {
        return {
            currentValue: this.currentConcertA,
            isStandard: this.isStandard(),
            deviationFromStandard: this.getDeviationFromStandard(),
            cacheSize: this.stringFrequenciesCache.size,
            stringFrequencies: this.getStringFrequencies()
        };
    }
}