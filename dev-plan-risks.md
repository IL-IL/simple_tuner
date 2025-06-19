# Риски, тестирование и контроль качества

## ⚠️ Анализ рисков и митигация

### Технические риски

#### ВЫСОКИЙ РИСК: Достижение точности ±0.5¢
**Проблема**: Параболическая интерполяция может быть недостаточна для достижения субточечной точности
**Вероятность**: 40% | **Влияние**: Критическое

**Митигация**:
- **Превентивная**: Прототипирование алгоритмов на раннем этапе (неделя 2-3)
- **Активная**: Комбинирование нескольких методов (интерполяция + автокорреляция)
- **Реактивная**: Fallback к ±1¢ если технически невозможно достичь ±0.5¢
- **Экспертная**: Консультации с DSP экспертами при первых признаках проблем

#### СРЕДНИЙ РИСК: Производительность FFT 8192
**Проблема**: Высокая нагрузка на слабые устройства, блокировка UI thread
**Вероятность**: 30% | **Влияние**: Высокое

**Митигация**:
- **Адаптивный размер буфера**: 4096 для слабых устройств, 8192 для мощных
- **Web Workers**: Перенос вычислений в background thread (если необходимо)
- **Throttling**: Ограничение частоты анализа на слабых устройствах
- **Profiling**: Раннее тестирование на целевых устройствах

#### СРЕДНИЙ РИСК: Web Audio API совместимость
**Проблема**: Различия в поведении браузеров, особенно Safari
**Вероятность**: 25% | **Влияние**: Среднее

**Митигация**:
- **Полифиллы**: Нормализация различий в Web Audio API
- **Feature detection**: Проверка поддержки функций перед использованием
- **User gesture**: Требование взаимодействия пользователя для инициализации аудио
- **Extensive testing**: Тестирование на всех целевых браузерах с первых недель

### UX/UI риски

#### СРЕДНИЙ РИСК: Сложность понимания Concert A Reference
**Проблема**: Обычные пользователи могут не понимать концепцию эталонной частоты
**Вероятность**: 35% | **Влияние**: Среднее

**Митигация**:
- **Контекстные подсказки**: Tooltips объясняющие назначение
- **Значение по умолчанию**: 440.0Hz как стандартное
- **Визуальная индикация**: Четкое отображение отклонений от стандарта
- **Progressive disclosure**: Скрытие расширенных настроек для новичков

---

## 🧪 Стратегия тестирования

### Пирамида тестирования

```
        /\
       /  \
      / E2E\ (10%)
     /______\
    /        \
   /Integration\ (20%)
  /_____________\
 /               \
/   Unit Tests    \ (70%)
\_________________ /
```

### Unit Testing (70% усилий)

**Критические модули для покрытия**:

#### FrequencyAnalyzer (критический)
```javascript
describe('FrequencyAnalyzer', () => {
    test('should detect 440Hz with ±0.5¢ accuracy', () => {
        const mockFFTData = generateMockFFT(440, 8192, 44100);
        const frequency = analyzer.analyzeFrequency(mockFFTData);
        
        const actualCents = frequencyToCents(frequency, 440);
        expect(Math.abs(actualCents)).toBeLessThan(0.5);
    });

    test('should handle harmonics correctly', () => {
        const mockFFTData = generateMockFFTWithHarmonics(220, [440, 660, 880]);
        const frequency = analyzer.analyzeFrequency(mockFFTData);
        
        expect(frequency).toBeCloseTo(220, 1); // основная частота
    });

    test('should return null for noise', () => {
        const noiseData = generateNoise(8192);
        const frequency = analyzer.analyzeFrequency(noiseData);
        expect(frequency).toBeNull();
    });
});
```

#### ConcertAManager (высокий приоритет)
```javascript
describe('ConcertAManager', () => {
    test('should calculate all string frequencies correctly', () => {
        const manager = new ConcertAManager();
        manager.setConcertA(440.0);

        const expectedFrequencies = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
        
        expectedFrequencies.forEach((expected, index) => {
            const actual = manager.calculateStringFrequency(index);
            expect(actual).toBeCloseTo(expected, 1);
        });
    });

    test('should validate input range', () => {
        const manager = new ConcertAManager();
        
        expect(() => manager.setConcertA(434.9)).toThrow();
        expect(() => manager.setConcertA(445.1)).toThrow();
        expect(() => manager.setConcertA(440.0)).not.toThrow();
    });
});
```

### Integration Testing (20% усилий)

#### Audio Pipeline Test
```javascript
describe('Audio Pipeline Integration', () => {
    test('should process synthetic audio signal end-to-end', async () => {
        // Создаем синтетический сигнал 440Hz
        const synthSignal = generateSineWave(440, 1.0, 44100);
        
        // Инжектируем в AudioEngine
        const audioEngine = new AudioEngine();
        await audioEngine.initialize();
        audioEngine.injectTestSignal(synthSignal);
        
        // Проверяем весь пайплайн
        const analyzer = new FrequencyAnalyzer(audioEngine);
        const detectedFreq = analyzer.analyzeFrequency();
        expect(detectedFreq).toBeCloseTo(440, 1);
        
        const concertA = new ConcertAManager();
        const logic = new TunerLogic(audioEngine, analyzer, concertA);
        const detectedString = logic.detectNearestString(detectedFreq);
        expect(detectedString).toBe(4); // A2 струна
    });

    test('should handle Concert A changes across modules', () => {
        // Тест propagation изменений Concert A
        const concertA = new ConcertAManager();
        const logic = new TunerLogic(null, null, concertA);
        
        // Изменяем Concert A и проверяем обновление эталонов
        concertA.setConcertA(442.0);
        
        const newA2Freq = logic.getTargetFrequency(4); // A2 струна
        expect(newA2Freq).toBeCloseTo(221.0, 1); // 442/2
    });
});
```

### E2E Testing (10% усилий)

#### Полные пользовательские сценарии
```javascript
describe('Complete Tuning Session E2E', () => {
    test('should tune all strings successfully', async () => {
        // Открываем приложение
        await page.goto('/');
        await page.waitForSelector('.tuner-container');
        
        // Проверяем инициализацию
        await page.waitForSelector('.status-message:has-text("Микрофон активен")');
        
        // Настраиваем каждую струну
        const strings = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];
        
        for (const stringName of strings) {
            // Кликаем на струну
            await page.click(`[data-string="${stringName}"]`);
            
            // Имитируем игру на струне (инжектируем аудио)
            await page.evaluate((string) => {
                window.testAudioInjector.playString(string);
            }, stringName);
            
            // Ждем определения настройки
            await page.waitForSelector('.cent-display:has-text("±")');
            
            // Проверяем что струна определена правильно
            const activeString = await page.textContent('.string-btn.active');
            expect(activeString).toBe(stringName);
        }
    });

    test('should work with different Concert A values', async () => {
        await page.goto('/');
        
        // Изменяем Concert A на 442Hz
        await page.fill('#concertAInput', '442.0');
        await page.press('#concertAInput', 'Enter');
        
        // Проверяем обновление индикатора
        const concertADisplay = await page.textContent('.concert-a-value');
        expect(concertADisplay).toBe('A = 442.0Hz');
        
        // Проверяем что эталонные частоты пересчитались
        await page.click('[data-string="A2"]');
        await page.evaluate(() => {
            window.testAudioInjector.playFrequency(221.0); // 442/2
        });
        
        await page.waitForSelector('.cent-display:has-text("±0")');
    });
});
```

---

## 🎯 Контроль качества и приемка

### Автоматические проверки (CI/CD)

#### Commit-level checks
```yaml
# .github/workflows/ci.yml
name: Continuous Integration
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests  
        run: npm run test:integration
        
      - name: Check code coverage
        run: npm run coverage
        env:
          COVERAGE_THRESHOLD: 80
      
      - name: Lint code
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run E2E tests
        run: |
          npm install
          npm run test:e2e
        env:
          BROWSER: chromium,firefox,webkit

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

#### Quality Gates
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/test-utils/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Критические модули требуют большего покрытия
    'src/modules/FrequencyAnalyzer.js': {
      branches: 90,
      functions: 95,
      lines: 90,
      statements: 90
    },
    'src/modules/ConcertAManager.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    }
  }
};
```

### Ручное тестирование

#### Тест-план для точности
**Цель**: Валидация точности ±0.5¢ на реальных устройствах

**Эталонные сигналы для тестирования**:
```javascript
const testFrequencies = [
    // Точные частоты струн при A=440Hz
    { name: 'E2', frequency: 82.41, expectedCents: 0 },
    { name: 'A2', frequency: 110.00, expectedCents: 0 },
    { name: 'D3', frequency: 146.83, expectedCents: 0 },
    { name: 'G3', frequency: 196.00, expectedCents: 0 },
    { name: 'B3', frequency: 246.94, expectedCents: 0 },
    { name: 'E4', frequency: 329.63, expectedCents: 0 },
    
    // Отклонения для тестирования точности
    { name: 'E2+5¢', frequency: 82.65, expectedCents: +5 },
    { name: 'A2-10¢', frequency: 109.36, expectedCents: -10 },
    { name: 'D3+25¢', frequency: 148.98, expectedCents: +25 },
    { name: 'G3-50¢', frequency: 192.62, expectedCents: -50 }
];
```

**Процедура тестирования**:
1. Генерация эталонных сигналов с помощью внешнего тон-генератора
2. Воспроизведение через качественные мониторы/наушники
3. Запись показаний Simple Tuner
4. Расчет отклонений от ожидаемых значений
5. Статистический анализ точности

**Критерии приемки**:
- 95% измерений должны быть в пределах ±0.5¢
- Максимальное отклонение не должно превышать ±1¢
- Стабильность показаний (разброс < 0.2¢ за 10 измерений)

#### Тест-план для Concert A
**Сценарии тестирования**:

1. **Изменение через слайдер**:
   - Перемещение слайдера должно мгновенно обновлять индикатор
   - Все эталонные частоты должны пересчитываться в реальном времени
   - Значения должны сохраняться при перезагрузке

2. **Ввод через текстовое поле**:
   - Валидация диапазона 435.0-445.0Hz
   - Автоматическая синхронизация со слайдером
   - Корректная обработка некорректного ввода

3. **Функция сброса**:
   - Возврат к 440.0Hz одним кликом
   - Обновление всех связанных элементов UI
   - Сохранение сброшенного значения

#### Кроссплатформенное тестирование

**Матрица совместимости**:
| Браузер | Desktop | Mobile | Планшет | Статус |
|---------|---------|--------|---------|--------|
| Chrome 80+ | ✅ | ✅ | ✅ | Приоритет 1 |
| Safari 13+ | ✅ | ✅ | ✅ | Приоритет 1 |
| Firefox 75+ | ✅ | ✅ | ✅ | Приоритет 2 |
| Edge 80+ | ✅ | ❌ | ❌ | Приоритет 2 |

**Тестовые устройства**:
- **Desktop**: Windows 10, macOS Big Sur, Ubuntu 20.04
- **Mobile**: iPhone 12, Samsung Galaxy S21, Google Pixel 5
- **Планшет**: iPad Air, Samsung Galaxy Tab

### Performance тестирование

#### Метрики производительности
```javascript
// Performance monitoring в продакшене
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }
    
    measureAnalysisTime() {
        const start = performance.now();
        // ... frequency analysis code ...
        const end = performance.now();
        
        this.recordMetric('analysis_time', end - start);
        
        // Предупреждение если превышает лимит
        if (end - start > 80) {
            console.warn(`Analysis time exceeded: ${end - start}ms`);
        }
    }
    
    measureUIUpdateTime() {
        const start = performance.now();
        // ... UI update code ...
        const end = performance.now();
        
        this.recordMetric('ui_update_time', end - start);
    }
    
    recordMetric(name, value) {
        if (!this.metrics[name]) {
            this.metrics[name] = [];
        }
        this.metrics[name].push(value);
        
        // Сохраняем только последние 100 измерений
        if (this.metrics[name].length > 100) {
            this.metrics[name].shift();
        }
    }
    
    getAverageMetric(name) {
        const values = this.metrics[name] || [];
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
}
```

#### Lighthouse аудиты
**Целевые показатели**:
- **Performance**: > 90
- **Accessibility**: > 95  
- **Best Practices**: > 90
- **SEO**: > 80
- **PWA**: 100

**Критические метрики**:
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

### Документация тестирования

#### Отчеты о тестировании
**Еженедельные отчеты должны включать**:
1. Статус выполнения тест-плана (% завершения)
2. Найденные баги с приоритизацией
3. Метрики производительности
4. Результаты кроссплатформенного тестирования
5. Рекомендации по улучшению

#### Bug tracking
**Шаблон для багов**:
```markdown
## Описание
Краткое описание проблемы

## Шаги воспроизведения
1. Шаг 1
2. Шаг 2
3. Шаг 3

## Ожидаемый результат
Что должно происходить

## Фактический результат
Что происходит на самом деле

## Окружение
- Браузер: Chrome 91
- ОС: Windows 10
- Устройство: Desktop
- Concert A: 440.0Hz

## Приоритет
- 🔴 Critical: Блокирует основную функциональность
- 🟡 High: Влияет на UX
- 🟢 Medium: Косметические проблемы

## Прикрепленные файлы
- Скриншоты
- Аудио записи (для аудио багов)
- Логи консоли
```

---

Эта стратегия тестирования и контроля качества обеспечивает высокую надежность Simple Tuner v2.1 и соответствие всем техническим требованиям, включая критическую точность ±0.5¢.