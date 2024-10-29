let computeForCreatingSubscription: (() => unknown) | null = null;
let effectForCreatingSubscription: (() => Promise<void> | void) | null = null;

export const signalsRegistrar: {
  mapSignalIdToSignal: Map<string, Signal<unknown>>;
  createSignal<T>(initialValue: T): Signal<T>;
  createComputedSignal<T>(computeFn: () => T): ComputedSignal<T>;
  getSignalById<T>(id: string): Signal<T>;
  batchContainer: Signal<unknown>[];
  batchGetSignalsByIds<T>(ids: string[]): Readonly<Signal<T>[]>;
} = {
  mapSignalIdToSignal: new Map(),
  batchContainer: [],
  batchGetSignalsByIds<T>(ids: string[]): Readonly<Signal<T>[]> {
    this.batchContainer.length = 0;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      const signal = this.mapSignalIdToSignal.get(id);

      if (!signal) {
        throw new Error(`Signal with id ${id} not found`);
      }

      this.batchContainer.push(signal);
    }

    return this.batchContainer as Readonly<Signal<T>[]>;
  },
  getSignalById<T>(id: string): Signal<T> {
    const signal = this.mapSignalIdToSignal.get(id);

    if (signal) {
      return signal as Signal<T>;
    }

    throw new Error(`Signal with id ${id} not found`);
  },
  createSignal<T>(initialValue: T): Signal<T> {
    const signal = new Signal(initialValue);
    this.mapSignalIdToSignal.set(signal.id, signal);

    return signal;
  },
  createComputedSignal<T>(computeFn: () => T): ComputedSignal<T> {
    const signal = new ComputedSignal(computeFn);
    this.mapSignalIdToSignal.set(signal.id, signal);

    return signal;
  },
};

export class Signal<T> {
  protected _value: T;
  private consumers: Set<() => void> = new Set();
  setterVersion = 0;
  private processingVersion = 0;
  private lastProcessedVersion = 0;
  id: string = `signal-${Math.random().toString(36).substring(2, 5)}`;
  constructor(initialValue: T) {
    this._value = initialValue;
  }

  forceEmit() {
    this.processingVersion = this.setterVersion;
    for (const consumer of this.consumers) {
      consumer();
    }
    this.processingVersion = 0;
    this.lastProcessedVersion = this.setterVersion;

    return this._value;
  }

  get value() {
    if (computeForCreatingSubscription !== null) {
      signalsForComputed.push(this);
    }

    if (
      effectForCreatingSubscription !== null &&
      !this.consumers.has(effectForCreatingSubscription)
    ) {
      effectsRegistrar.insertEffectToCon(this, this.consumers, effectForCreatingSubscription);

      return this._value;
    }

    if (
      this.lastProcessedVersion === this.setterVersion ||
      this.processingVersion === this.setterVersion ||
      effectsRegistrar.isProcessing
    ) {
      return this._value;
    }

    return this.forceEmit();
  }

  set value(newValue) {
    if (this._value !== newValue) {
      this._value = newValue;
      if (this.processingVersion === 0) {
        this.setterVersion++;

        queueMicrotask(() => {
          if (this.lastProcessedVersion !== this.setterVersion) {
            this.forceEmit();
          }
        });
      }
    }
  }
}

/**
 * @description Subscribes to the signals used in the compute function and returns the value of the compute function.
 */
const signalsForComputed: Signal<unknown>[] = [];
const subscribeToComputed = <T>(computeFn: () => T) => {
  signalsForComputed.length = 0;
  computeForCreatingSubscription = computeFn;
  const value = computeFn();
  computeForCreatingSubscription = null;

  return value;
};

export class ComputedSignal<T> extends Signal<T> {
  private computationFn: () => T;
  private signalsForComputed: Signal<unknown>[];
  private signalsForComputedLastValues: WeakMap<Signal<unknown>, unknown>;

  constructor(computeFn: () => T) {
    super(subscribeToComputed(computeFn));
    this.computationFn = computeFn;
    this.signalsForComputed = signalsForComputed;
    this.signalsForComputedLastValues = new WeakMap();

    for (const signal of this.signalsForComputed) {
      this.signalsForComputedLastValues.set(signal, signal.value);
    }
  }

  get value() {
    if (
      this.signalsForComputed.some(
        signal => signal.value !== this.signalsForComputedLastValues.get(signal)
      )
    ) {
      return this.computationFn();
    }

    return this._value;
  }
}

/**
 * @description Runs the callback, subscribes to the signals used in the callback and returns the last subscribed collector.
 */
export const effectsRegistrar: {
  mapSignalToDestroyCollectors: WeakMap<Signal<unknown>, Set<() => void>>;
  isProcessing: boolean;
  lastEffectCollector: (() => void) | null;
  insertEffectToCon(
    signal: Signal<unknown>,
    subscribers: Set<() => void>,
    callBack: () => void
  ): void;
  subscribeEffectToSignals(effect: () => Promise<void> | void): void;
} = {
  mapSignalToDestroyCollectors: new WeakMap<Signal<unknown>, Set<() => void>>(),
  isProcessing: false,
  lastEffectCollector: null,
  insertEffectToCon(
    signal: Signal<unknown>,
    subscribers: Set<() => void>,
    callBack: () => void
  ): void {
    subscribers.add(callBack);

    const lastEffectCollector = () => subscribers.delete(callBack);

    this.lastEffectCollector = lastEffectCollector;

    const destroyCollectors = this.mapSignalToDestroyCollectors.get(signal);

    if (destroyCollectors) {
      destroyCollectors.add(lastEffectCollector);

      return;
    }

    this.mapSignalToDestroyCollectors.set(signal, new Set([lastEffectCollector]));
  },
  subscribeEffectToSignals(effect: () => Promise<void> | void) {
    this.isProcessing = true;
    effectForCreatingSubscription = effect;
    effect();
    effectForCreatingSubscription = null;
    this.isProcessing = false;
  },
};
