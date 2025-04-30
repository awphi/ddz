export class EventBus<T extends Record<string, (...args: any[]) => void>> {
  private listeners: { [K in keyof T]?: T[K][] } = Object.create(null);

  on<K extends keyof T>(event: K, callback: T[K]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  off<K extends keyof T>(event: K, callback: T[K]) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter(
        (cb) => cb !== callback
      );
    }
  }

  once<K extends keyof T>(event: K, callback: T[K]) {
    const wrappedCallback = ((...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    }) as T[K];

    this.on(event, wrappedCallback);
  }

  fire<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    if (this.listeners[event]) {
      for (const callback of this.listeners[event]!) {
        callback(...args);
      }
    }
  }
}
