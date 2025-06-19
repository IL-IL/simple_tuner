# Структура проекта и архитектура

## 📂 Полная структура проекта

```
simple_tuner/
├── 📄 Документация
│   ├── index.html                  # Главная страница документации
│   ├── prototype.html              # UI прототип
│   ├── requirements.md             # Техническое задание
│   ├── development-plan.md         # Базовый план разработки
│   ├── development-plan-detailed.md # Главный файл детального плана
│   ├── dev-plan-structure.md       # Этот файл - структура проекта
│   ├── dev-plan-phases.md          # Детальные фазы разработки
│   ├── dev-plan-implementation.md  # Фазы реализации
│   ├── dev-plan-resources.md       # Ресурсы и команда
│   ├── dev-plan-risks.md           # Риски и контроль качества
│   ├── ui-mockups.md              # UI макеты
│   └── user-flows.md              # Пользовательские потоки
│
├── 🚀 Исходный код приложения
│   ├── src/
│   │   ├── index.html            # Основное приложение
│   │   ├── css/
│   │   │   ├── main.css          # Основные стили
│   │   │   ├── components.css    # Стили компонентов
│   │   │   ├── responsive.css    # Адаптивные стили
│   │   │   └── variables.css     # CSS переменные
│   │   ├── js/
│   │   │   ├── app.js           # Главный файл приложения
│   │   │   ├── modules/
│   │   │   │   ├── AudioEngine.js      # Аудио движок
│   │   │   │   ├── FrequencyAnalyzer.js # Анализатор частот
│   │   │   │   ├── ConcertAManager.js   # Управление Concert A
│   │   │   │   ├── TunerLogic.js       # Логика тюнера
│   │   │   │   ├── UIController.js     # Контроллер UI
│   │   │   │   ├── StorageManager.js   # Управление данными
│   │   │   │   └── EventEmitter.js     # Система событий
│   │   │   └── utils/
│   │   │       ├── constants.js    # Константы приложения
│   │   │       ├── helpers.js      # Вспомогательные функции
│   │   │       ├── validators.js   # Валидация данных
│   │   │       └── math.js         # Математические функции
│   │   ├── assets/
│   │   │   ├── icons/             # Иконки для PWA
│   │   │   │   ├── icon-192.png
│   │   │   │   ├── icon-512.png
│   │   │   │   └── favicon.ico
│   │   │   └── sounds/            # Звуковые файлы (если нужны)
│   │   ├── manifest.json          # PWA манифест
│   │   └── service-worker.js      # Service Worker для PWA
│
├── 🧪 Тестирование
│   ├── tests/
│   │   ├── unit/                 # Юнит тесты
│   │   │   ├── AudioEngine.test.js
│   │   │   ├── FrequencyAnalyzer.test.js
│   │   │   ├── ConcertAManager.test.js
│   │   │   ├── TunerLogic.test.js
│   │   │   └── helpers.test.js
│   │   ├── integration/          # Интеграционные тесты
│   │   │   ├── audio-pipeline.test.js
│   │   │   ├── ui-logic.test.js
│   │   │   └── storage.test.js
│   │   ├── e2e/                  # End-to-end тесты
│   │   │   ├── tuning-flow.test.js
│   │   │   ├── concert-a.test.js
│   │   │   └── mobile.test.js
│   │   ├── fixtures/             # Тестовые данные
│   │   │   ├── audio-samples/
│   │   │   └── mock-data.js
│   │   └── setup/               # Настройки тестов
│   │       ├── jest.config.js
│   │       └── test-utils.js
│
├── 📖 Документация разработчика
│   ├── docs/
│   │   ├── API.md               # API документация
│   │   ├── ARCHITECTURE.md      # Архитектура системы
│   │   ├── DEPLOYMENT.md        # Инструкции по развертыванию
│   │   ├── TESTING.md           # Руководство по тестированию
│   │   ├── AUDIO-ALGORITHMS.md  # Документация аудио алгоритмов
│   │   └── CONTRIBUTING.md      # Руководство для контрибьюторов
│
├── ⚙️ Конфигурация проекта
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml           # Continuous Integration
│   │       └── deploy.yml       # Автоматический деплой
│   ├── .gitignore
│   ├── package.json             # npm зависимости (если нужны)
│   ├── README.md                # Основная документация
│   └── CHANGELOG.md             # История изменений
```

## 🏗️ Архитектура приложения

### Модульная архитектура

```
┌─────────────────────────────────────────────┐
│                   App.js                    │
│            (Главный контроллер)             │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌─────────────┐ ┌──────────┐ ┌─────────────┐
│AudioEngine  │ │TunerLogic│ │UIController │
│             │ │          │ │             │
└─────┬───────┘ └────┬─────┘ └─────────────┘
      │              │
      ▼              ▼
┌─────────────┐ ┌──────────────┐
│Frequency    │ │ConcertA      │
│Analyzer     │ │Manager       │
└─────────────┘ └──────────────┘
      │              │
      ▼              ▼
┌─────────────┐ ┌──────────────┐
│EventEmitter │ │Storage       │
│             │ │Manager       │
└─────────────┘ └──────────────┘
```

### Поток данных

```
Микрофон → AudioEngine → FrequencyAnalyzer → TunerLogic → UIController → DOM
                                               ↑
                              ConcertAManager ─┘
                                    ↑
                          StorageManager ──────┘
```

## 🎯 Ключевые модули и их ответственность

### AudioEngine.js
**Назначение**: Управление Web Audio API
- Инициализация аудио контекста
- Захват микрофона
- Генерация эталонных тонов
- Мониторинг уровня сигнала

**Интерфейс**:
```javascript
class AudioEngine {
    async initialize()
    async startMicrophone()
    generateTone(frequency, duration)
    stopAll()
    getInputLevel()
}
```

### FrequencyAnalyzer.js
**Назначение**: Анализ частот с высокой точностью
- FFT анализ (8192 семплов)
- Параболическая интерполяция
- Фильтрация гармоник
- Стабилизация показаний

**Интерфейс**:
```javascript
class FrequencyAnalyzer {
    analyzeFrequency()
    getFrequencyAccuracy()
    stabilizeReading()
    setAnalysisParameters(fftSize, smoothing)
}
```

### ConcertAManager.js
**Назначение**: Управление эталонной частотой
- Валидация диапазона 435-445Hz
- Пересчет частот струн
- Сохранение настроек
- Уведомление об изменениях

**Интерфейс**:
```javascript
class ConcertAManager {
    setConcertA(value)
    getConcertA()
    calculateStringFrequency(stringIndex)
    reset()
    saveToStorage()
}
```

### TunerLogic.js
**Назначение**: Основная логика тюнера
- Определение ближайшей струны
- Расчет отклонений в центах
- Управление режимами работы
- Автоматическое переключение

**Интерфейс**:
```javascript
class TunerLogic {
    setMode(mode)
    detectNearestString(frequency)
    calculateCentDeviation(frequency, target)
    isInTune(deviation, tolerance)
}
```

### UIController.js
**Назначение**: Управление пользовательским интерфейсом
- Обновление визуальных индикаторов
- Обработка пользовательского ввода
- Синхронизация состояния UI
- Отображение ошибок

**Интерфейс**:
```javascript
class UIController {
    updateFrequencyMeter(deviation)
    updateStringButtons(activeString)
    updateConcertADisplay(value)
    showError(message)
    bindEvents()
}
```

## 📦 Система событий

Все модули взаимодействуют через централизованную систему событий:

```javascript
// EventEmitter.js - простая реализация шины событий
class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}
```

**Ключевые события**:
- `frequency-detected` - новая частота определена
- `concert-a-changed` - изменилась эталонная частота
- `mode-changed` - изменился режим работы
- `string-selected` - выбрана струна
- `tuning-status-changed` - изменился статус настройки
- `error-occurred` - произошла ошибка

## 🗄️ Структура данных

### Константы (constants.js)
```javascript
export const GUITAR_STRINGS = {
    E4: { index: 0, name: 'E4', semitones: 19 },
    B3: { index: 1, name: 'B3', semitones: 14 },
    G3: { index: 2, name: 'G3', semitones: 10 },
    D3: { index: 3, name: 'D3', semitones: 5 },
    A2: { index: 4, name: 'A2', semitones: 0 },
    E2: { index: 5, name: 'E2', semitones: -5 }
};

export const CONCERT_A = {
    MIN: 435.0,
    MAX: 445.0,
    STANDARD: 440.0,
    STEP: 0.1
};

export const ACCURACY_TARGET = 0.5; // центы
export const FFT_SIZE = 8192;
export const SAMPLE_RATE = 44100;
```

### Конфигурация приложения
```javascript
export const CONFIG = {
    audio: {
        fftSize: 8192,
        smoothingTimeConstant: 0.8,
        minInputLevel: -40, // dB
        maxInputLevel: 0    // dB
    },
    tuner: {
        targetAccuracy: 0.5,  // центы
        responseTime: 80,     // мс
        autoSwitchDelay: 500, // мс
        silenceTimeout: 10000 // мс
    },
    ui: {
        updateRate: 20,       // FPS
        animationDuration: 300 // мс
    }
};
```

## 🔧 Технические требования

### Минимальные требования браузеров
- **Chrome**: 80+ (Web Audio API, ES6+)
- **Safari**: 13+ (iOS Safari поддержка)  
- **Firefox**: 75+ (AudioWorklet)
- **Edge**: 80+ (Chromium-based)

### API зависимости
- **Web Audio API** - аудио обработка
- **MediaDevices API** - доступ к микрофону
- **Web Workers** - вычисления в фоне (опционально)
- **Local Storage** - сохранение настроек
- **Service Workers** - PWA функциональность

### Производительность
- **Время отклика**: < 80мс
- **Частота обновления**: 15-25 FPS
- **Размер приложения**: < 1.2MB
- **Время загрузки**: < 3 секунд
- **Потребление памяти**: < 50MB

## 🎨 Дизайн система

### CSS архитектура (BEM)
```css
/* Блоки */
.tuner-container
.frequency-meter  
.string-buttons
.concert-a-controls

/* Элементы */
.tuner-container__header
.frequency-meter__scale
.frequency-meter__needle
.string-buttons__button

/* Модификаторы */
.string-buttons__button--active
.string-buttons__button--playing
.frequency-meter--tuned
```

### CSS переменные (variables.css)
```css
:root {
    /* Цвета */
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --glass-bg: rgba(255, 255, 255, 0.95);
    --glass-blur: blur(10px);
    
    /* Размеры */
    --border-radius: 20px;
    --button-size: 44px;
    --animation-duration: 0.3s;
    
    /* Типографика */
    --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-title: 2.5rem;
    --font-size-body: 1rem;
}
```

## 📱 PWA конфигурация

### Манифест (manifest.json)
```json
{
    "name": "Simple Tuner",
    "short_name": "Tuner",
    "description": "Веб-приложение для настройки гитары с высокой точностью",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "background_color": "#667eea",
    "theme_color": "#667eea",
    "categories": ["music", "utilities"],
    "icons": [
        {
            "src": "/assets/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/assets/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

### Service Worker стратегия
- **Cache First** - статические ресурсы (CSS, JS, иконки)
- **Network First** - HTML страницы
- **Stale While Revalidate** - API данные (если будут)

---

Эта структура обеспечивает:
- **Модульность** - каждый компонент независим
- **Масштабируемость** - легко добавлять новые функции
- **Тестируемость** - четкое разделение ответственности
- **Поддерживаемость** - понятная архитектура