import { CONCERT_A, STRINGS_ARRAY } from './constants.js';

/**
 * Преобразование частоты в центы относительно эталонной частоты
 * @param {number} frequency - Измеренная частота в Hz
 * @param {number} reference - Эталонная частота в Hz
 * @returns {number} Отклонение в центах
 */
export function frequencyToCents(frequency, reference) {
    if (frequency <= 0 || reference <= 0) return 0;
    return 1200 * Math.log2(frequency / reference);
}

/**
 * Преобразование центов в частоту
 * @param {number} cents - Отклонение в центах
 * @param {number} reference - Эталонная частота в Hz
 * @returns {number} Частота в Hz
 */
export function centsToFrequency(cents, reference) {
    return reference * Math.pow(2, cents / 1200);
}

/**
 * Вычисление частоты струны на основе Concert A
 * @param {number} stringIndex - Индекс струны (0-5)
 * @param {number} concertA - Частота Concert A в Hz
 * @returns {number} Частота струны в Hz
 */
export function calculateStringFrequency(stringIndex, concertA = CONCERT_A.STANDARD) {
    if (stringIndex < 0 || stringIndex >= STRINGS_ARRAY.length) {
        throw new Error(`Invalid string index: ${stringIndex}`);
    }
    
    const stringInfo = STRINGS_ARRAY[stringIndex];
    const semitonesFromA4 = stringInfo.semitones;
    
    // A2 (5-я струна) = A4 / 2, остальные струны рассчитываются относительно A4
    const a4Frequency = concertA * 2; // A4 в два раза выше A2
    return a4Frequency * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Нахождение ближайшей струны по частоте
 * @param {number} frequency - Частота в Hz
 * @param {number} concertA - Частота Concert A в Hz
 * @param {number} maxDeviationCents - Максимальное отклонение в центах
 * @returns {Object|null} Объект с информацией о струне или null
 */
export function findNearestString(frequency, concertA = CONCERT_A.STANDARD, maxDeviationCents = 100) {
    let closestString = null;
    let minDeviation = Infinity;
    
    for (let i = 0; i < STRINGS_ARRAY.length; i++) {
        const targetFreq = calculateStringFrequency(i, concertA);
        const deviation = Math.abs(frequencyToCents(frequency, targetFreq));
        
        if (deviation < minDeviation) {
            minDeviation = deviation;
            closestString = {
                index: i,
                info: STRINGS_ARRAY[i],
                targetFrequency: targetFreq,
                deviation: frequencyToCents(frequency, targetFreq) // с знаком
            };
        }
    }
    
    // Возвращаем только если отклонение в пределах допустимого
    return (closestString && Math.abs(closestString.deviation) <= maxDeviationCents) 
        ? closestString 
        : null;
}

/**
 * Параболическая интерполяция для повышения точности FFT
 * @param {number} y1 - Значение слева от пика
 * @param {number} y2 - Значение пика
 * @param {number} y3 - Значение справа от пика
 * @returns {number} Поправка к позиции пика (-0.5 до +0.5)
 */
export function parabolicInterpolation(y1, y2, y3) {
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    if (Math.abs(a) < 1e-10) return 0; // Избегаем деления на ноль
    
    const correction = -b / (2 * a);
    
    // Ограничиваем коррекцию разумными пределами
    return Math.max(-0.5, Math.min(0.5, correction));
}

/**
 * Применение окна Ханна к массиву данных
 * @param {Float32Array} data - Входные данные
 * @returns {Float32Array} Данные с применённым окном
 */
export function applyHanningWindow(data) {
    const windowedData = new Float32Array(data.length);
    const N = data.length;
    
    for (let i = 0; i < N; i++) {
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        windowedData[i] = data[i] * window;
    }
    
    return windowedData;
}

/**
 * Преобразование уровня сигнала в dB
 * @param {number} amplitude - Амплитуда сигнала (0-1)
 * @returns {number} Уровень в dB
 */
export function amplitudeToDb(amplitude) {
    if (amplitude <= 0) return -Infinity;
    return 20 * Math.log10(amplitude);
}

/**
 * Валидация значения Concert A
 * @param {number} value - Значение для валидации
 * @returns {boolean} true если значение валидно
 */
export function validateConcertA(value) {
    return typeof value === 'number' && 
           value >= CONCERT_A.MIN && 
           value <= CONCERT_A.MAX && 
           !isNaN(value);
}

/**
 * Клампинг значения в заданных пределах
 * @param {number} value - Значение для клампинга
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Значение в пределах [min, max]
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Сглаживание массива значений (скользящее среднее)
 * @param {number[]} values - Массив значений
 * @param {number} windowSize - Размер окна сглаживания
 * @returns {number} Сглаженное значение
 */
export function smoothValues(values, windowSize = 5) {
    if (values.length === 0) return 0;
    
    const recentValues = values.slice(-windowSize);
    const sum = recentValues.reduce((acc, val) => acc + val, 0);
    return sum / recentValues.length;
}

/**
 * Проверка стабильности измерений
 * @param {number[]} values - Массив последних измерений
 * @param {number} tolerance - Допуск в центах
 * @param {number} requiredCount - Требуемое количество стабильных измерений
 * @returns {boolean} true если измерения стабильны
 */
export function isStable(values, tolerance = 1, requiredCount = 5) {
    if (values.length < requiredCount) return false;
    
    const recentValues = values.slice(-requiredCount);
    const average = smoothValues(recentValues);
    
    return recentValues.every(value => 
        Math.abs(value - average) <= tolerance
    );
}

/**
 * Форматирование частоты для отображения
 * @param {number} frequency - Частота в Hz
 * @param {number} precision - Количество знаков после запятой
 * @returns {string} Отформатированная строка
 */
export function formatFrequency(frequency, precision = 1) {
    if (frequency === null || frequency === undefined) return '-- Hz';
    return `${frequency.toFixed(precision)} Hz`;
}

/**
 * Форматирование отклонения в центах для отображения
 * @param {number} cents - Отклонение в центах
 * @param {number} precision - Количество знаков после запятой
 * @returns {string} Отформатированная строка
 */
export function formatCents(cents, precision = 1) {
    if (cents === null || cents === undefined) return '±0.0¢';
    const sign = cents > 0 ? '+' : '';
    return `${sign}${cents.toFixed(precision)}¢`;
}

/**
 * Дебаунс функции
 * @param {Function} func - Функция для дебаунса
 * @param {number} delay - Задержка в мс
 * @returns {Function} Дебаунсированная функция
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Троттлинг функции
 * @param {Function} func - Функция для троттлинга
 * @param {number} delay - Интервал в мс
 * @returns {Function} Троттлированная функция
 */
export function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

/**
 * Генерация уникального ID
 * @returns {string} Уникальный идентификатор
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}