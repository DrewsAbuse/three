import assert from 'node:assert';
import {test} from 'node:test';
import {ComputedSignal, Signal, effectsRegistrar} from './signals.ts';

test('emit effects in getter - tree of 2 then tree of 3', () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    tree.child.text = signal.value.toString();
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });
    tree.child.child.text = signal.value.toString();
  });

  signal.value = 2;

  // Check the current signal value
  assert.strictEqual(signal.value, 2);

  // Check if the tree structure matches expected values
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '2',
      child: {
        text: '2',
      },
    },
  });

  const expectedFor2 = [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect1', value: 2},
    {name: 'effect2', value: 2},
  ];

  // Validate effects for the signal value of 2
  assert.deepStrictEqual(effects, expectedFor2);

  signal.value = 3;

  // Check if signal value has updated correctly
  assert.strictEqual(signal.value, 3);

  // Validate updated tree structure
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
      },
    },
  });

  // Validate effects log for the signal value of 3
  assert.deepStrictEqual(effects, [
    ...expectedFor2,
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
  ]);
});

test('tree of 3', () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Subscribe the first effect to signal changes
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });

    tree.child.text = signal.value.toString();
  });

  signal.value = 1;

  // Subscribe the second effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
  });

  signal.value = 2;

  // Subscribe the third effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  // Validate final signal value
  assert.strictEqual(signal.value, 3);

  // Validate tree structure after all updates
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
        child: {
          text: '3',
        },
      },
    },
  });

  // Validate effects log
  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
    {name: 'effect3', value: 3},
  ]);
});

test('tree of 3,4,4', () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Subscribe the first effect to signal changes
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    tree.child.text = signal.value.toString();

    signal.value += 1;
  });

  signal.value = 1;

  // Subscribe the second effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
  });

  signal.value = 2;

  // Subscribe the third effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  // Check that the signal value has been incremented as expected
  assert.strictEqual(signal.value, 4);

  // Validate the tree structure after all updates
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '4',
        child: {
          text: '4',
        },
      },
    },
  });

  // Validate effects log
  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect3', value: 4},
  ]);
});

test('tree of 3,4,5', () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Subscribe the first effect to signal changes
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });

    tree.child.text = signal.value.toString();

    signal.value += 1;
  });

  signal.value = 1;

  // Subscribe the second effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();

    signal.value += 1;
  });

  signal.value = 2;

  // Subscribe the third effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  // Validate final signal value
  assert.strictEqual(signal.value, 5);

  // Validate the tree structure after all updates
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '4',
        child: {
          text: '5',
        },
      },
    },
  });

  // Validate effects log
  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect3', value: 5},
  ]);
});

test('emit in microtask after other microtask - tree of 2 then tree of 3', async () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
      },
    },
  };

  // Subscribe the first effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    tree.child.text = signal.value.toString();
  });

  signal.value = 1;

  // Subscribe the second effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });
    tree.child.child.text = signal.value.toString();
  });

  signal.value = 2;

  // Break synchronous flow and emit effects in a microtask
  await Promise.resolve();

  // Check intermediate state after setting `signal.value` to 2
  assert.strictEqual(signal.value, 2);
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '2',
      child: {
        text: '2',
      },
    },
  });

  const expectedFor2 = [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect1', value: 2},
    {name: 'effect2', value: 2},
  ];

  // Verify effects log after the first set of changes
  assert.deepStrictEqual(effects, expectedFor2);

  // Update signal to trigger further effects
  signal.value = 3;

  // Wait briefly to allow for asynchronous effects to propagate
  await new Promise(resolve => setTimeout(resolve, 50));

  // Verify final state of tree and effects
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
      },
    },
  });

  assert.deepStrictEqual(effects, [
    ...expectedFor2,
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
  ]);
});

test('emit in microtask after macrotask - tree of 3', async () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Register the first effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    tree.child.text = signal.value.toString();
  });

  signal.value = 1;

  // Register the second effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });
    tree.child.child.text = signal.value.toString();
  });

  signal.value = 2;

  // Register the third effect
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });
    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  // Use a Promise-based timeout to simulate the macrotask delay
  await new Promise(resolve => setTimeout(resolve, 0));

  // Validate the final tree structure after the effects have propagated
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
        child: {
          text: '3',
        },
      },
    },
  });

  // Validate the effects log after all updates
  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
    {name: 'effect3', value: 3},
  ]);
});

test('computed tree of 3', () => {
  const signal1 = new Signal(1);
  const signal2 = new Signal(1);
  const computed = new ComputedSignal(() => signal1.value + signal2.value);

  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
    },
  };

  // Subscribe an effect to the computed value
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: computed.value,
    });
    tree.child.text = computed.value.toString();
  });

  // Change signal1's value to trigger computed update
  signal1.value = 2;

  // Assertions to verify computed value and effect propagation
  assert.strictEqual(computed.value, 3);
  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '3',
    },
  });

  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 2},
    {name: 'effect1', value: 3},
  ]);
});

test('computed tree of 1,1,4', () => {
  const signal1 = new Signal(1);
  const signal2 = new Signal(1);
  const signal3 = new Signal(1);

  const computedSignal = new ComputedSignal(() => signal1.value + signal2.value + signal3.value);

  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Subscribe to signal1
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal1.value,
    });

    tree.child.text = signal1.value.toString();
  });

  // Subscribe to signal2
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });

    tree.child.child.text = signal2.value.toString();
  });

  // Subscribe to computedSignal
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });

    tree.child.child.child.text = computedSignal.value.toString();
  });

  // Update signal3's value
  signal3.value = 2;

  // Assertions
  assert.strictEqual(signal1.value, 1);
  assert.strictEqual(signal2.value, 1);
  assert.strictEqual(computedSignal.value, 4);

  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '1',
      child: {
        text: '1',
        child: {
          text: '4',
        },
      },
    },
  });

  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 1},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 3},
    {name: 'effect3', value: 4},
  ]);
});

test('computed tree of 2,2,4', () => {
  const signal1 = new Signal(1);
  const signal2 = new Signal(1);

  const computedSignal = new ComputedSignal(() => signal1.value + signal2.value);

  const effects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  // Register effect1 for signal1
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal1.value,
    });

    tree.child.text = signal1.value.toString();
  });

  // Register effect2 for signal2
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });

    tree.child.child.text = signal2.value.toString();
  });

  // Register effect3 for computedSignal
  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });

    tree.child.child.child.text = computedSignal.value.toString();
  });

  // Update signals and verify only unique value changes trigger effects
  signal1.value = 2;
  signal2.value = 2;

  // These should be ignored as the values are the same
  signal1.value = 2;
  signal2.value = 2;

  // Assertions
  assert.strictEqual(signal1.value, 2);
  assert.strictEqual(signal2.value, 2);
  assert.strictEqual(computedSignal.value, 4);

  assert.deepStrictEqual(tree, {
    text: 'root',
    child: {
      text: '2',
      child: {
        text: '2',
        child: {
          text: '4',
        },
      },
    },
  });

  assert.deepStrictEqual(effects, [
    {name: 'effect1', value: 1},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 2},
    {name: 'effect2', value: 2},
    {name: 'effect3', value: 4},
    {name: 'effect3', value: 4},
  ]);
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

it.skip('async macrotask in effect tree of 3,3,3', async () => {
  const signal = new Signal(0);
  const effects: {name: string; value: number}[] = [];
  const effectsAsync: {name: string; value: number}[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect1', value: signal.value});

    tree.child.text = signal.value.toString();

    setTimeout(() => {
      effectsAsync.push({name: 'effect1', value: signal.value});

      signal.value += 1;
    }, 0);
  });

  signal.value = 1; //not triggering effect1

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect2', value: signal.value});

    tree.child.child.text = signal.value.toString();

    setTimeout(() => {
      effectsAsync.push({name: 'effect2', value: signal.value});

      signal.value += 1;
    }, 0);
  });

  signal.value = 2; //not triggering effect1 and effect2

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect3', value: signal.value});

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  expect(signal.value).toBe(3);

  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '0',
      child: {
        text: '1',
        child: {
          text: '2',
        },
      },
    },
  });
  expect(effects).toEqual([
    {
      name: 'effect1',
      value: 0,
    },
    {
      name: 'effect2',
      value: 1,
    },
    {
      name: 'effect3',
      value: 2,
    },
  ]);
  expect(effectsAsync).toEqual([]); // Empty because the effects are triggered in the next macrotask

  await wait(0);

  // expect(signal.value).toBe(5);

  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '7',
      child: {
        text: '7',
        child: {
          text: '7',
        },
      },
    },
  });
  expect(effectsAsync).toEqual([
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect1', value: 5},
    {name: 'effect2', value: 6},
  ]);

  await wait(0);

  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '9',
      child: {
        text: '9',
        child: {
          text: '9',
        },
      },
    },
  });
  expect(effectsAsync).toEqual([
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect1', value: 5},
    {name: 'effect2', value: 6},
  ]);
});

it.skip('async microtask in effect tree of 3,3,3', async () => {
  const signal = new Signal(0);
  const effects: {name: string; value: number}[] = [];
  const effectsAsync: {name: string; value: number}[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect1', value: signal.value});

    tree.child.text = signal.value.toString();

    Promise.resolve().then(() => {
      effectsAsync.push({name: 'effect1', value: signal.value});

      signal.value += 1;
    });
  });

  signal.value = 1; //not triggering effect1

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect2', value: signal.value});

    tree.child.child.text = signal.value.toString();

    Promise.resolve().then(() => {
      effectsAsync.push({name: 'effect2', value: signal.value});

      signal.value += 1;
    });
  });

  signal.value = 2; //not triggering effect1 and effect2

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect3', value: signal.value});

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3; //triggering effect1, effect2 and effect3

  await wait(50);

  expect(signal.value).toBe(7);
  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
        child: {
          text: '3',
        },
      },
    },
  });
  expect(effects).toEqual([
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
    {name: 'effect3', value: 3},
  ]);
  expect(effectsAsync).toEqual([
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect1', value: 5},
    {name: 'effect2', value: 6},
  ]);
});

it.skip('async microtask emit macrotask in effect tree of 3,3,3', async () => {
  const signal = new Signal(0);
  const effects: {
    name: string;
    value: number;
  }[] = [];
  const effectsAsync: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });

    tree.child.text = signal.value.toString();

    await wait(0).then(() => {
      effectsAsync.push({
        name: 'effect1',
        value: signal.value,
      });

      signal.value += 1;
    });
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();

    await wait(0).then(() => {
      effectsAsync.push({
        name: 'effect2',
        value: signal.value,
      });

      signal.value += 1;
    });
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  await wait(50);

  expect(signal.value).toBe(7);
  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
        child: {
          text: '3',
        },
      },
    },
  });
  expect(effects).toEqual([
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
    {name: 'effect3', value: 3},
  ]);

  expect(effectsAsync).toEqual([
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect1', value: 5},
    {name: 'effect2', value: 6},
  ]);
});

it.skip('async fetch data in effect tree of data:3,data:3,data:3', async () => {
  const fetchData = (value: number) =>
    new Promise<string>(resolve => {
      setTimeout(() => {
        resolve(`data:${value}`);
      }, 0);
    });

  const signal = new Signal(0);
  const effects: {
    name: string;
    text: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      text: signal.value,
    });

    tree.child.text = await fetchData(signal.value);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      text: signal.value,
    });

    tree.child.child.text = await fetchData(signal.value);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect3',
      text: signal.value,
    });

    tree.child.child.child.text = await fetchData(signal.value);
  });

  signal.value = 3;

  await wait(50);

  expect(signal.value).toBe(3);
  expect(tree).toEqual({
    child: {child: {child: {text: 'data:3'}, text: 'data:3'}, text: 'data:3'},
    text: 'root',
  });
  expect(effects).toEqual([
    {name: 'effect1', text: 0},
    {name: 'effect2', text: 1},
    {name: 'effect3', text: 2},
    {name: 'effect1', text: 3},
    {name: 'effect2', text: 3},
    {name: 'effect3', text: 3},
  ]);
});

it.skip('async fetch mutated signal in effect tree of 9,11,3', async () => {
  const effectFetch: {
    name: string;
    value: number;
  }[] = [];

  const asyncIncrement = (signal: Signal<number>) =>
    new Promise<Signal<number>>(resolve => {
      setTimeout(() => {
        effectFetch.push({name: 'asyncIncrement', value: signal.value});
        signal.value += 2;

        resolve(signal);
      }, 0);
    });

  const signal = new Signal(0);
  const effects: {
    name: string;
    text: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);
    effectFetch.push({name: 'effect1', value: fetchedSignal.value});
    tree.child.text = fetchedSignal.value.toString();
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);

    effectFetch.push({name: 'effect2', value: fetchedSignal.value});

    tree.child.child.text = fetchedSignal.value.toString();
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      text: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  await wait(5);

  expect(tree).toEqual({child: {child: {child: {text: '3'}, text: '11'}, text: '9'}, text: 'root'});
  expect(effects).toEqual([
    {name: 'effect1', text: 0},
    {name: 'effect2', text: 1},
    {name: 'effect3', text: 2},
    {name: 'effect1', text: 3},
    {name: 'effect2', text: 3},
    {name: 'effect3', text: 3},
  ]);
  expect(effectFetch).toEqual([
    {name: 'asyncIncrement', value: 3},
    {name: 'effect1', value: 5},
    {name: 'asyncIncrement', value: 5},
    {name: 'effect2', value: 7},
    {name: 'asyncIncrement', value: 7},
    {name: 'effect1', value: 9},
    {name: 'asyncIncrement', value: 9},
    {name: 'effect2', value: 11},
  ]);
});

it.skip('async fetch mutated signal in effect tree of 9,11,7', async () => {
  const effectFetch: {
    name: string;
    value: number;
  }[] = [];

  const asyncIncrement = (signal: Signal<number>) =>
    new Promise<Signal<number>>(resolve => {
      setTimeout(() => {
        effectFetch.push({name: 'asyncIncrement', value: signal.value});
        signal.value += 2;

        resolve(signal);
      }, 0);
    });

  const signal = new Signal(0);
  const effects: {
    name: string;
    text: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);
    effectFetch.push({name: 'effect1', value: fetchedSignal.value});
    tree.child.text = fetchedSignal.value.toString();
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);

    effectFetch.push({name: 'effect2', value: fetchedSignal.value});

    tree.child.child.text = fetchedSignal.value.toString();
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    await wait(0);

    effects.push({
      name: 'effect3',
      text: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  await wait(5);

  expect(signal.value).toBe(11);
  expect(tree).toEqual({
    child: {child: {child: {text: '7'}, text: '11'}, text: '9'},
    text: 'root',
  });
  expect(effects).toEqual([
    {name: 'effect1', text: 0},
    {name: 'effect2', text: 1},
    {name: 'effect1', text: 3},
    {name: 'effect2', text: 3},
    {name: 'effect3', text: 7},
  ]);
  expect(effectFetch).toEqual([
    {name: 'asyncIncrement', value: 3},
    {name: 'effect1', value: 5},
    {name: 'asyncIncrement', value: 5},
    {name: 'effect2', value: 7},
    {name: 'asyncIncrement', value: 7},
    {name: 'effect1', value: 9},
    {name: 'asyncIncrement', value: 9},
    {name: 'effect2', value: 11},
  ]);
});

it.skip('async fetch mutated signal in effect tree of 9,11,11', async () => {
  const effectFetch: {
    name: string;
    value: number;
  }[] = [];

  const asyncIncrement = (signal: Signal<number>) =>
    new Promise<Signal<number>>(resolve => {
      setTimeout(() => {
        effectFetch.push({name: 'asyncIncrement', value: signal.value});
        signal.value += 2;

        resolve(signal);
      }, 0);
    });

  const signal = new Signal(0);
  const effects: {
    name: string;
    text: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);
    effectFetch.push({name: 'effect1', value: fetchedSignal.value});
    tree.child.text = fetchedSignal.value.toString();
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      text: signal.value,
    });

    const fetchedSignal = await asyncIncrement(signal);

    effectFetch.push({name: 'effect2', value: fetchedSignal.value});

    tree.child.child.text = fetchedSignal.value.toString();
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    await wait(5);

    effects.push({
      name: 'effect3',
      text: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  await wait(5);

  expect(signal.value).toBe(11);
  expect(tree).toEqual({
    child: {child: {child: {text: '11'}, text: '11'}, text: '9'},
    text: 'root',
  });
  expect(effects).toEqual([
    {name: 'effect1', text: 0},
    {name: 'effect2', text: 1},
    {name: 'effect1', text: 3},
    {name: 'effect2', text: 3},
    {name: 'effect3', text: 11},
  ]);
  expect(effectFetch).toEqual([
    {name: 'asyncIncrement', value: 3},
    {name: 'effect1', value: 5},
    {name: 'asyncIncrement', value: 5},
    {name: 'effect2', value: 7},
    {name: 'asyncIncrement', value: 7},
    {name: 'effect1', value: 9},
    {name: 'asyncIncrement', value: 9},
    {name: 'effect2', value: 11},
  ]);
});

it.skip('async effect computed tree of 2,2,4', async () => {
  const signal1 = new Signal(1);
  const signal2 = new Signal(1);

  const computedSignal = new ComputedSignal(() => signal1.value + signal2.value);

  const effects: {
    name: string;
    value: number;
  }[] = [];
  const asyncEffects: {
    name: string;
    value: number;
  }[] = [];
  const tree = {
    text: 'root',
    child: {
      text: 'child',
      child: {
        text: 'child',
        child: {
          text: 'child',
        },
      },
    },
  };

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect1',
      value: signal1.value,
    });

    tree.child.text = signal1.value.toString();

    await wait(0).then(() => {
      asyncEffects.push({
        name: 'effect1',
        value: signal1.value,
      });

      signal1.value += 2;
    });
  });

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });

    tree.child.child.text = signal2.value.toString();

    await wait(0).then(() => {
      asyncEffects.push({
        name: 'effect2',
        value: signal2.value,
      });

      signal2.value += 2;
    });
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });

    tree.child.child.child.text = computedSignal.value.toString();
  });

  signal1.value = 2;
  signal2.value = 2;

  await wait(0);

  expect(signal1.value).toBe(4);
  expect(signal2.value).toBe(4);
  expect(tree).toEqual({child: {child: {child: {text: '4'}, text: '2'}, text: '2'}, text: 'root'});
  expect(effects).toEqual([
    {name: 'effect1', value: 1},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 2},
    {name: 'effect3', value: 4},
    {name: 'effect2', value: 2},
    {name: 'effect3', value: 4},
  ]);
  expect(asyncEffects).toEqual([
    {name: 'effect1', value: 2},
    {
      name: 'effect2',
      value: 2,
    },
  ]);
});

//
