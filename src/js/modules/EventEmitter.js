/**
 * Простая реализация системы событий для модульной архитектуры
 * Обеспечивает loose coupling между модулями приложения
 */
export default class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 10;
        this.debugMode = false;
    }

    /**
     * Подписка на событие
     * @param {string} event - Название события
     * @param {Function} callback - Функция-обработчик
     * @param {Object} options - Опции подписки
     * @returns {Function} Функция для отписки
     */
    on(event, callback, options = {}) {
        if (typeof event !== 'string' || typeof callback !== 'function') {
            throw new Error('Event name must be string and callback must be function');
        }

        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listeners = this.events.get(event);
        
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event: ${event}`);
        }

        const listener = {
            callback,
            once: options.once || false,
            context: options.context || null,
            id: this._generateListenerId()
        };

        listeners.push(listener);

        if (this.debugMode) {
            console.log(`EventEmitter: Added listener for '${event}' (total: ${listeners.length})`);
        }

        return () => this.off(event, callback);
    }

    /**
     * Подписка на событие с автоматической отпиской после первого срабатывания
     */
    once(event, callback, context = null) {
        return this.on(event, callback, { once: true, context });
    }

    /**
     * Отписка от события
     */
    off(event, callback) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        const index = listeners.findIndex(listener => listener.callback === callback);

        if (index !== -1) {
            listeners.splice(index, 1);
            
            if (this.debugMode) {
                console.log(`EventEmitter: Removed listener for '${event}' (remaining: ${listeners.length})`);
            }

            if (listeners.length === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Эмиссия события
     */
    emit(event, data = null, options = {}) {
        if (!this.events.has(event)) {
            if (this.debugMode) {
                console.log(`EventEmitter: No listeners for '${event}'`);
            }
            return false;
        }

        const listeners = this.events.get(event);
        const listenersToRemove = [];

        if (this.debugMode) {
            console.log(`EventEmitter: Emitting '${event}' to ${listeners.length} listeners`, data);
        }

        const listenersCopy = [...listeners];

        for (const listener of listenersCopy) {
            try {
                if (options.async) {
                    setTimeout(() => {
                        this._executeListener(listener, data, event);
                    }, 0);
                } else {
                    this._executeListener(listener, data, event);
                }

                if (listener.once) {
                    listenersToRemove.push(listener);
                }
            } catch (error) {
                console.error(`EventEmitter: Error in listener for '${event}':`, error);
            }
        }

        listenersToRemove.forEach(listener => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        });

        if (listeners.length === 0) {
            this.events.delete(event);
        }

        return true;
    }

    /**
     * Проверка наличия слушателей для события
     */
    hasListeners(event) {
        return this.events.has(event) && this.events.get(event).length > 0;
    }

    /**
     * Получение количества слушателей для события
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    /**
     * Установка максимального количества слушателей
     */
    setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new Error('Max listeners must be a positive number');
        }
        this.maxListeners = n;
    }

    /**
     * Включение/выключение debug режима
     */
    setDebugMode(enabled) {
        this.debugMode = Boolean(enabled);
    }

    /**
     * Выполнение слушателя с обработкой контекста
     * @private
     */
    _executeListener(listener, data, event) {
        const { callback, context } = listener;
        
        if (context) {
            callback.call(context, data, event);
        } else {
            callback(data, event);
        }
    }

    /**
     * Генерация уникального ID для слушателя
     * @private
     */
    _generateListenerId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Очистка всех ресурсов
     */
    destroy() {
        this.events.clear();
        this.debugMode = false;
        this.maxListeners = 0;
    }
}