# Фазы реализации и интеграции (5-7)

## 🎨 Фаза 5: Пользовательский интерфейс (Неделя 6-9)

### 5.1 HTML структура (2-3 дня)
**Цель**: Создать семантичную разметку согласно прототипу

**Основные элементы интерфейса:**
- Header с названием и индикатором Concert A
- Селектор режимов (Эталон/Тюнер/Авто)
- Частотомер с аналоговой шкалой
- 6 кнопок струн с индикацией состояния
- Контролы управления (длительность, стоп)
- Настройки Concert A (слайдер + инпут)
- Статус бар с уровнем микрофона

**Критерии приемки HTML:**
- ✅ Семантичная разметка с правильными ARIA атрибутами
- ✅ Все интерактивные элементы доступны с клавиатуры
- ✅ Структура соответствует прототипу на 100%
- ✅ Готовность для стилизации и JavaScript

### 5.2 CSS стили (4-5 дней)
**Цель**: Реализовать современный дизайн с glassmorphism эффектами

**Дизайн система:**
- **Цветовая палитра**: Градиенты #667eea → #764ba2
- **Типографика**: System fonts (-apple-system, BlinkMacSystemFont)
- **Эффекты**: Glassmorphism (backdrop-filter: blur())
- **Анимации**: Плавные переходы 0.3s ease
- **Адаптивность**: Mobile-first подход

**Ключевые компоненты CSS:**
```css
/* Основной контейнер */
.tuner-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    /* Glassmorphism эффект */
}

/* Частотомер */
.frequency-meter {
    background: linear-gradient(90deg, 
        #f56565 0%, #ed8936 25%, 
        #48bb78 45%, #48bb78 55%, 
        #ed8936 75%, #f56565 100%);
}

/* Кнопки струн */
.string-btn {
    transition: all 0.3s ease;
    min-height: 44px; /* Для мобильных устройств */
}

.string-btn.playing {
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
```

**Адаптивные точки:**
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

**Критерии приемки CSS:**
- ✅ Соответствие дизайну прототипа на 95%
- ✅ Все элементы ≥44px для мобильных устройств
- ✅ Плавные анимации без снижения производительности
- ✅ Glassmorphism эффекты работают корректно

### 5.3 UIController модуль (3-4 дня)
**Цель**: Создать контроллер для управления интерфейсом

**Основные функции UIController:**
```javascript
class UIController {
    constructor(tunerLogic, concertAManager, eventEmitter) {
        this.tunerLogic = tunerLogic;
        this.concertAManager = concertAManager;
        this.eventEmitter = eventEmitter;
        this.elements = this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Кэширование DOM элементов для производительности
        return {
            meterNeedle: document.getElementById('meterNeedle'),
            centDisplay: document.getElementById('centDisplay'),
            frequencyDisplay: document.getElementById('frequencyDisplay'),
            stringButtons: document.querySelectorAll('.string-btn'),
            modeButtons: document.querySelectorAll('.mode-btn'),
            concertASlider: document.getElementById('concertASlider'),
            concertAInput: document.getElementById('concertAInput'),
            concertAValue: document.getElementById('concertAValue'),
            levelBars: document.querySelectorAll('.level-bar'),
            statusMessage: document.getElementById('statusMessage')
        };
    }

    updateFrequencyMeter(deviation) {
        // Обновление аналоговой шкалы
        // deviation в центах: -50¢ до +50¢
        const maxDeviation = 50;
        const normalizedDeviation = Math.max(-1, Math.min(1, deviation / maxDeviation));
        const rotation = normalizedDeviation * 45; // ±45 градусов
        
        this.elements.meterNeedle.style.transform = 
            `translateX(-50%) rotate(${rotation}deg)`;
            
        // Обновление числового значения
        this.elements.centDisplay.textContent = 
            `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}¢`;
            
        // Цветовая индикация
        this.updateTuningColors(deviation);
    }

    updateStringButtons(activeString, playingString = null) {
        // Обновление состояния кнопок струн
        this.elements.stringButtons.forEach((btn, index) => {
            btn.classList.remove('active', 'playing');
            
            if (index === playingString) {
                btn.classList.add('playing');
            } else if (index === activeString) {
                btn.classList.add('active');
            }
        });
    }

    updateConcertADisplay(value) {
        // Обновление индикатора Concert A
        this.elements.concertAValue.textContent = `A = ${value.toFixed(1)}Hz`;
        this.elements.concertASlider.value = value;
        this.elements.concertAInput.value = value.toFixed(1);
    }

    updateInputLevel(level) {
        // Обновление индикатора уровня микрофона
        // level в dB от -Infinity до 0
        const normalizedLevel = Math.max(0, Math.min(1, (level + 60) / 60));
        const activeBars = Math.floor(normalizedLevel * 8);
        
        this.elements.levelBars.forEach((bar, index) => {
            bar.classList.toggle('active', index < activeBars);
        });
        
        document.getElementById('levelValue').textContent = 
            level === -Infinity ? '-∞dB' : `${level.toFixed(0)}dB`;
    }

    showError(message) {
        // Отображение ошибок пользователю
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
        errorModal.setAttribute('aria-hidden', 'false');
    }
}
```

**Критерии приемки UIController:**
- ✅ Все визуальные элементы обновляются корректно
- ✅ Анимации работают плавно (60 FPS)
- ✅ Обработка пользовательского ввода функционирует
- ✅ Отображение ошибок работает надежно

---

## 🧪 Фаза 6: Интеграция и тестирование (Неделя 8-11)

### 6.1 Интеграция модулей (3-4 дня)
**Цель**: Объединить все модули в единую систему

**Главный файл приложения (app.js):**
```javascript
// src/js/app.js
import EventEmitter from './modules/EventEmitter.js';
import AudioEngine from './modules/AudioEngine.js';
import FrequencyAnalyzer from './modules/FrequencyAnalyzer.js';
import ConcertAManager from './modules/ConcertAManager.js';
import TunerLogic from './modules/TunerLogic.js';
import UIController from './modules/UIController.js';
import StorageManager from './modules/StorageManager.js';

class SimpleTuner {
    constructor() {
        this.eventEmitter = new EventEmitter();
        this.storageManager = new StorageManager();
        
        // Инициализация модулей
        this.audioEngine = new AudioEngine(this.eventEmitter);
        this.frequencyAnalyzer = new FrequencyAnalyzer(this.audioEngine, this.eventEmitter);
        this.concertAManager = new ConcertAManager(this.eventEmitter, this.storageManager);
        this.tunerLogic = new TunerLogic(
            this.audioEngine, 
            this.frequencyAnalyzer, 
            this.concertAManager,
            this.eventEmitter
        );
        this.uiController = new UIController(
            this.tunerLogic, 
            this.concertAManager, 
            this.eventEmitter
        );
        
        this.isRunning = false;
        this.animationFrameId = null;
    }

    async initialize() {
        try {
            // Инициализация аудио движка
            await this.audioEngine.initialize();
            
            // Восстановление настроек Concert A
            this.concertAManager.loadFromStorage();
            
            // Запуск микрофона
            await this.audioEngine.startMicrophone();
            
            // Привязка событий
            this.bindEvents();
            
            // Запуск главного цикла
            this.startAnalysisLoop();
            
            console.log('Simple Tuner инициализирован успешно');
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.uiController.showError('Не удалось инициализировать приложение');
        }
    }

    bindEvents() {
        // Подписка на события модулей
        this.eventEmitter.on('frequency-detected', (data) => {
            this.handleFrequencyDetected(data);
        });
        
        this.eventEmitter.on('concert-a-changed', (value) => {
            this.uiController.updateConcertADisplay(value);
        });
        
        this.eventEmitter.on('mode-changed', (mode) => {
            this.handleModeChanged(mode);
        });
        
        this.eventEmitter.on('error-occurred', (error) => {
            this.uiController.showError(error.message);
        });
    }

    startAnalysisLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        const analyze = () => {
            if (!this.isRunning) return;
            
            // Анализ частоты
            const frequency = this.frequencyAnalyzer.analyzeFrequency();
            if (frequency) {
                this.eventEmitter.emit('frequency-detected', { frequency });
            }
            
            // Обновление уровня входного сигнала
            const inputLevel = this.audioEngine.getInputLevel();
            this.uiController.updateInputLevel(inputLevel);
            
            // Планирование следующего кадра (20 FPS)
            this.animationFrameId = setTimeout(() => {
                requestAnimationFrame(analyze);
            }, 50);
        };
        
        requestAnimationFrame(analyze);
    }

    handleFrequencyDetected(data) {
        // Передача частоты в логику тюнера
        this.tunerLogic.handleFrequencyDetected(data.frequency);
    }

    handleModeChanged(mode) {
        // Обработка изменения режима
        console.log(`Режим изменен на: ${mode}`);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            clearTimeout(this.animationFrameId);
        }
        this.audioEngine.stopAll();
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', async () => {
    const tuner = new SimpleTuner();
    
    // Обработка закрытия страницы
    window.addEventListener('beforeunload', () => {
        tuner.stop();
    });
    
    // Инициализация приложения
    await tuner.initialize();
});
```

**Критерии приемки интеграции:**
- ✅ Все модули успешно взаимодействуют
- ✅ Система событий работает стабильно
- ✅ Главный цикл функционирует с заданной частотой (20 FPS)
- ✅ Обработка ошибок покрывает критические сценарии

### 6.2 Система тестирования (4-5 дней)
**Цель**: Обеспечить качество и надежность приложения

**Юнит тесты (tests/unit/):**
```javascript
// tests/unit/FrequencyAnalyzer.test.js
import FrequencyAnalyzer from '../../src/js/modules/FrequencyAnalyzer.js';

describe('FrequencyAnalyzer', () => {
    let analyzer;
    let mockAudioEngine;

    beforeEach(() => {
        mockAudioEngine = {
            getAnalyser: jest.fn()
        };
        analyzer = new FrequencyAnalyzer(mockAudioEngine);
    });

    test('should detect 440Hz with ±0.5¢ accuracy', () => {
        // Мок данных для 440Hz
        const mockAnalyser = {
            getFloatFrequencyData: jest.fn((array) => {
                // Симуляция пика на 440Hz
                const bin440 = Math.floor(440 * 8192 / 44100);
                array[bin440] = -20; // -20dB на частоте 440Hz
            })
        };
        
        mockAudioEngine.getAnalyser.mockReturnValue(mockAnalyser);
        
        const frequency = analyzer.analyzeFrequency();
        expect(frequency).toBeCloseTo(440, 1);
    });

    test('should filter harmonics correctly', () => {
        // Тест фильтрации гармоник
    });

    test('should return null for invalid input', () => {
        mockAudioEngine.getAnalyser.mockReturnValue(null);
        const frequency = analyzer.analyzeFrequency();
        expect(frequency).toBeNull();
    });
});

// tests/unit/ConcertAManager.test.js
import ConcertAManager from '../../src/js/modules/ConcertAManager.js';

describe('ConcertAManager', () => {
    let manager;
    let mockEventEmitter;
    let mockStorageManager;

    beforeEach(() => {
        mockEventEmitter = { emit: jest.fn() };
        mockStorageManager = { 
            save: jest.fn(), 
            load: jest.fn().mockReturnValue(440.0) 
        };
        manager = new ConcertAManager(mockEventEmitter, mockStorageManager);
    });

    test('should calculate string frequencies correctly', () => {
        manager.setConcertA(440.0);
        
        // E4 (1-я струна) = A4 * 2^(19/12) ≈ 329.63Hz
        const e4Frequency = manager.calculateStringFrequency(0);
        expect(e4Frequency).toBeCloseTo(329.63, 1);
        
        // A2 (5-я струна) = A4 * 2^(-12/12) = A4 / 2 = 220Hz  
        const a2Frequency = manager.calculateStringFrequency(4);
        expect(a2Frequency).toBeCloseTo(220.0, 1);
    });

    test('should validate input range', () => {
        expect(() => manager.setConcertA(434.9)).toThrow();
        expect(() => manager.setConcertA(445.1)).toThrow();
        expect(() => manager.setConcertA(440.0)).not.toThrow();
    });

    test('should emit events when concert A changes', () => {
        manager.setConcertA(442.0);
        expect(mockEventEmitter.emit).toHaveBeenCalledWith('concert-a-changed', 442.0);
    });
});
```

**Интеграционные тесты (tests/integration/):**
```javascript
// tests/integration/audio-pipeline.test.js
describe('Audio Pipeline Integration', () => {
    test('should process audio from microphone to UI', async () => {
        // Тест полного пайплайна:
        // Микрофон → AudioEngine → FrequencyAnalyzer → TunerLogic → UIController
    });
    
    test('should handle concert A changes across modules', () => {
        // Тест propagation изменений Concert A через все модули
    });
});
```

**E2E тесты (tests/e2e/):**
```javascript
// tests/e2e/tuning-flow.test.js
describe('Tuning Flow E2E', () => {
    test('should complete full tuning session', () => {
        // Полный сценарий настройки гитары
    });
    
    test('should work on mobile devices', () => {
        // Тест на мобильных устройствах
    });
});
```

**Критерии качества тестирования:**
- ✅ Покрытие кода > 80%
- ✅ Все критические пути протестированы
- ✅ E2E тесты покрывают основные пользовательские сценарии
- ✅ Тесты проходят в CI/CD pipeline

### 6.3 Производительность и оптимизация (2-3 дня)
**Цель**: Обеспечить соответствие требованиям производительности

**Задачи оптимизации:**
- [ ] Профилирование кода с помощью Chrome DevTools
- [ ] Оптимизация FFT алгоритмов
- [ ] Минимизация reflow и repaint в UI
- [ ] Кэширование вычислений
- [ ] Адаптивная настройка для слабых устройств

**Метрики производительности:**
- [ ] Время отклика анализа: < 80мс
- [ ] Частота обновления UI: 15-25 FPS стабильно
- [ ] Потребление памяти: < 50MB
- [ ] Время инициализации: < 3 секунд

**Критерии приемки:**
- ✅ Все метрики производительности выполнены
- ✅ Стабильная работа на слабых устройствах
- ✅ Отсутствие утечек памяти при длительном использовании

---

## 🚀 Фаза 7: Оптимизация и деплой (Неделя 11-12)

### 7.1 PWA функциональность (2-3 дня)
**Цель**: Полноценное Progressive Web App

**Service Worker (service-worker.js):**
```javascript
const CACHE_NAME = 'simple-tuner-v2.1';
const urlsToCache = [
    '/',
    '/src/index.html',
    '/src/css/main.css',
    '/src/css/variables.css',
    '/src/css/components.css',
    '/src/css/responsive.css',
    '/src/js/app.js',
    '/src/js/modules/AudioEngine.js',
    '/src/js/modules/FrequencyAnalyzer.js',
    '/src/js/modules/ConcertAManager.js',
    '/src/js/modules/TunerLogic.js',
    '/src/js/modules/UIController.js',
    '/src/assets/icons/icon-192.png',
    '/src/assets/icons/icon-512.png'
];

// Cache First стратегия для статических ресурсов
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Очистка старых кэшей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```

**Критерии PWA:**
- ✅ Проходит все аудиты Lighthouse PWA
- ✅ Работает в офлайн режиме
- ✅ Устанавливается как нативное приложение
- ✅ Иконки и splash screen настроены

### 7.2 Финальная оптимизация (1-2 дня)
**Цель**: Подготовка к продакшену

**Задачи:**
- [ ] Минификация всех CSS и JavaScript файлов
- [ ] Оптимизация изображений (WebP, правильные размеры)
- [ ] Gzip/Brotli сжатие ресурсов
- [ ] Проверка размера приложения < 1.2MB

**Итоговые проверки:**
- [ ] Lighthouse аудит: Performance > 90, PWA = 100
- [ ] Все браузеры: Chrome 80+, Safari 13+, Firefox 75+, Edge 80+
- [ ] Мобильные устройства: iOS Safari, Chrome Mobile
- [ ] Кроссплатформенное тестирование

### 7.3 Документация и деплой (1 день)
**Цель**: Завершить проект и подготовить к использованию

**Обновление документации:**
- [ ] README.md с инструкциями по использованию
- [ ] API документация всех модулей
- [ ] CHANGELOG.md с описанием всех изменений
- [ ] Руководство по развертыванию

**Критерии готовности к деплою:**
- ✅ Все тесты проходят
- ✅ Производительность соответствует требованиям
- ✅ PWA функциональность работает
- ✅ Документация актуальна
- ✅ Код готов к продакшену

---

Эти три фазы завершают разработку Simple Tuner v2.1 с полной функциональностью, высокой точностью ±0.5¢ и современным пользовательским интерфейсом.