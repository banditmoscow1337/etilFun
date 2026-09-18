/**
 * Nano UI reactive runtime.
 *
 * A deliberately small signal/effect implementation for DOM applications.
 * It has no dependency on the renderer, so it can also be used for plain
 * state and derived values.
 */

export function createRuntime() {
    let activeEffect = null;
    let batchDepth = 0;
    let pendingFlush = false;

    const effectQueue = new Set();

    const flush = () => {
        pendingFlush = false;
        const tasks = new Set(effectQueue);
        effectQueue.clear();
        tasks.forEach((effect) => effect.execute(true));
    };

    const schedule = (effect) => {
        if (effect.disposed) return;
        effectQueue.add(effect);
        if (batchDepth === 0 && !pendingFlush) {
            pendingFlush = true;
            queueMicrotask(flush);
        }
    };

    const cleanup = (effect) => {
        effect.dependencies.forEach((subscribers) => subscribers.delete(effect));
        effect.dependencies.clear();
    };

    function createSignal(initialValue, options = {}) {
        let value = initialValue;
        const subscribers = new Set();
        const equals = options.equals === false ? () => false : Object.is;

        const read = () => {
            if (activeEffect && !activeEffect.disposed) {
                subscribers.add(activeEffect);
                activeEffect.dependencies.add(subscribers);
            }
            return value;
        };

        const write = (nextValue) => {
            const next = typeof nextValue === "function" ? nextValue(value) : nextValue;
            if (equals(value, next)) return;
            value = next;
            subscribers.forEach(schedule);
        };

        return [read, write];
    }

    function createEffect(fn, targetNode = null) {
        const effect = {
            dependencies: new Set(),
            disposed: false,
            isExecuting: false,
            owner: targetNode,
            execute(isAsync = false) {
                if (effect.disposed) return;
                if (isAsync && targetNode && !targetNode.isConnected) return;
                if (effect.isExecuting) return;

                cleanup(effect);
                const previous = activeEffect;
                activeEffect = effect;
                effect.isExecuting = true;
                try {
                    fn();
                } finally {
                    effect.isExecuting = false;
                    activeEffect = previous;
                }
            },
            dispose() {
                if (effect.disposed) return;
                effect.disposed = true;
                cleanup(effect);
                effectQueue.delete(effect);
            }
        };

        effect.execute(false);
        return effect.dispose;
    }

    function createMemo(fn) {
        const [read, write] = createSignal();
        createEffect(() => write(fn()));
        return read;
    }

    function batch(fn) {
        batchDepth += 1;
        try {
            return fn();
        } finally {
            batchDepth -= 1;
            if (batchDepth === 0 && effectQueue.size > 0 && !pendingFlush) {
                pendingFlush = true;
                queueMicrotask(flush);
            }
        }
    }

    function untrack(fn) {
        const previous = activeEffect;
        activeEffect = null;
        try {
            return fn();
        } finally {
            activeEffect = previous;
        }
    }

    return { createSignal, createEffect, createMemo, batch, untrack };
}

export const {
    createSignal,
    createEffect,
    createMemo,
    batch,
    untrack
} = createRuntime();
