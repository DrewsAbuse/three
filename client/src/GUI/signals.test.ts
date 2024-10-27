import {ComputedSignal, Signal, effectsRegistrar} from './signals.ts';

it('emit effects in getter - tree of 2 then tree of 3', () => {
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
    console.log(`🔍end effect1 #1:`, signal.value);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
    console.log(`🔍end effect2 #2:`, signal.value);
  });

  signal.value = 2;

  expect(signal.value).toBe(2); //emit effect1 and effect2
  expect(tree).toEqual({
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

  expect(effects).toEqual(expectedFor2);

  signal.value = 3;

  expect(signal.value).toBe(3);

  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '3',
      child: {
        text: '3',
      },
    },
  });
  expect(effects).toEqual([
    ...expectedFor2,
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 3},
  ]);
});

it('tree of 3', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });

    tree.child.text = signal.value.toString();
    console.log(`🔍end effect1 #1`, signal.value);
  });

  console.log(`🔍signal.value = 1.......`);
  signal.value = 1;
  console.log(`🔍signal.value = 1!!!!!`);

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
    console.log(`🔍end effect2 #2`, signal.value);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
    console.log(`🔍end effect3 #3`, signal.value);
  });

  signal.value = 3;

  expect(signal.value).toBe(3);
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
  //
  // expect(effects).toEqual([
  // {name: 'effect1', value: 0},
  // {name: 'effect2', value: 1},
  // {name: 'effect3', value: 2},
  // {name: 'effect1', value: 3},
  // {name: 'effect2', value: 3},
  // {name: 'effect3', value: 3},
  // ]);
  //
  //
});

it('tree of 3,4,4', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    console.log(`🔍start effect1 #1`);
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    tree.child.text = signal.value.toString();

    console.log(`⚙️ incrementing signal value...`);
    signal.value = signal.value + 1;
    console.log(`⚙️ incremented signal value!!!`);
    console.log(`🔍end effect1 #1`);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(() => {
    console.log(`🔍start effect2 #2:`);

    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();

    console.log(`🔍end effect2 #2:`);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    console.log(`🔍start effect3 #3`);

    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
    console.log(`🔍end effect3 #3:`);
  });

  signal.value = 3;

  expect(signal.value).toBe(4);
  expect(tree).toEqual({
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

  expect(effects).toEqual([
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect3', value: 4},
  ]);
});

it('tree of 3,4,5', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });
    console.log(`🔍effect1 #1:`, signal.value);
    tree.child.text = signal.value.toString();

    console.log(`⚙️ incrementing signal value...`);
    signal.value = signal.value + 1;
    console.log(`⚙️ incremented signal value!!!`);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });
    console.log(`🔍effect2 #2:`, signal.value);
    tree.child.child.text = signal.value.toString();

    console.log(`⚙️ incrementing signal value...`);
    signal.value = signal.value + 1;
    console.log(`⚙️ incremented signal value!!!`);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });
    console.log(`🔍effect3 #3:`, signal.value);
    tree.child.child.child.text = signal.value.toString();
  });

  signal.value = 3;

  expect(signal.value).toBe(5);
  expect(tree).toEqual({
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
  expect(effects).toEqual([
    {name: 'effect1', value: 0},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 3},
    {name: 'effect2', value: 4},
    {name: 'effect3', value: 5},
  ]);
});

it('emit in microtask after other microtask - tree of 2 then tree of 3', async () => {
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
    console.log(`🔍end effect1 #1:`, signal.value);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
    console.log(`🔍end effect2 #2:`, signal.value);
  });

  signal.value = 2;

  //Break syncronous, emit effects in microtask
  await Promise.resolve();
  // expect(signal.value).toBe(2); not needed get value for emitting effects

  expect(signal.value).toBe(2);

  expect(tree).toEqual({
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

  expect(effects).toEqual(expectedFor2);

  signal.value = 3;

  await wait(50).then(() => {
    expect(tree).toEqual({
      text: 'root',
      child: {
        text: '3',
        child: {
          text: '3',
        },
      },
    });
    expect(effects).toEqual([
      ...expectedFor2,
      {name: 'effect1', value: 3},
      {name: 'effect2', value: 3},
    ]);
  });
});

it('emit in microtask after macrotask - tree of 3', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal.value,
    });

    tree.child.text = signal.value.toString();
    console.log(`🔍end effect1 #1`, signal.value);
  });

  console.log(`🔍signal.value = 1.......`);
  signal.value = 1;
  console.log(`🔍signal.value = 1!!!!!`);

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });

    tree.child.child.text = signal.value.toString();
    console.log(`🔍end effect2 #2`, signal.value);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });

    tree.child.child.child.text = signal.value.toString();
    console.log(`🔍end effect3 #3`, signal.value);
  });

  signal.value = 3;

  setTimeout(() => {
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
  }, 0);

  //
  // expect(effects).toEqual([
  // {name: 'effect1', value: 0},
  // {name: 'effect2', value: 1},
  // {name: 'effect3', value: 2},
  // {name: 'effect1', value: 3},
  // {name: 'effect2', value: 3},
  // {name: 'effect3', value: 3},
  // ]);
  //
  //
});

it('computed tree of 3', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: computed.value,
    });
    tree.child.text = computed.value.toString();

    console.log(`🔍end effect1 #1:`, computed.value);
  });

  signal1.value = 2;

  expect(computed.value).toBe(3);
  expect(tree).toEqual({
    text: 'root',
    child: {
      text: '3',
    },
  });
  expect(effects).toEqual([
    {name: 'effect1', value: 2},
    {name: 'effect1', value: 3},
  ]);
});

it('computed tree of 1,1,4', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal1.value,
    });
    console.log(`🔍effect1 #1:`, signal1.value);
    tree.child.text = signal1.value.toString();
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });
    console.log(`🔍effect2 #2:`, signal2.value);
    tree.child.child.text = signal2.value.toString();
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });
    console.log(`🔍effect3 #3:`, computedSignal.value);
    tree.child.child.child.text = computedSignal.value.toString();
  });

  signal3.value = 2;

  expect(signal1.value).toBe(1);
  expect(signal2.value).toBe(1);
  expect(computedSignal.value).toBe(4);
  expect(tree).toEqual({child: {child: {child: {text: '4'}, text: '1'}, text: '1'}, text: 'root'});
  expect(effects).toEqual([
    {name: 'effect1', value: 1},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 3},
    {name: 'effect3', value: 4},
  ]);
});

it('computed tree of 2,2,4', () => {
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

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect1',
      value: signal1.value,
    });
    console.log(`🔍effect1 #1:`, signal1.value);
    tree.child.text = signal1.value.toString();
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });
    console.log(`🔍effect2 #2:`, signal2.value);
    tree.child.child.text = signal2.value.toString();
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });
    console.log(`🔍effect3 #3:`, computedSignal.value);
    tree.child.child.child.text = computedSignal.value.toString();
  });

  signal1.value = 2;
  signal2.value = 2;

  signal1.value = 2; //must be ignored because it's the same value
  signal2.value = 2; //must be ignored because it's the same value

  expect(signal1.value).toBe(2);
  expect(signal2.value).toBe(2);
  expect(computedSignal.value).toBe(4);
  expect(tree).toEqual({child: {child: {child: {text: '4'}, text: '2'}, text: '2'}, text: 'root'});
  expect(effects).toEqual([
    {name: 'effect1', value: 1},
    {name: 'effect2', value: 1},
    {name: 'effect3', value: 2},
    {name: 'effect1', value: 2},
    {name: 'effect2', value: 2},
    {name: 'effect3', value: 4},
    {name: 'effect3', value: 4},
  ]);
});

//Skip async shiiiit

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
    console.log(`🔍effect1 #1:`, signal.value);
    tree.child.text = signal.value.toString();

    setTimeout(() => {
      effectsAsync.push({name: 'effect1', value: signal.value});
      console.log(`⚙️ effect1 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect1 incremented signal value!!!`);
    }, 0);
  });

  signal.value = 1; //not triggering effect1

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect2', value: signal.value});
    console.log(`🔍effect2 #2:`, signal.value);
    tree.child.child.text = signal.value.toString();

    setTimeout(() => {
      effectsAsync.push({name: 'effect2', value: signal.value});
      console.log(`⚙️ effect2 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect2 incremented signal value!!!`);
    }, 0);
  });

  signal.value = 2; //not triggering effect1 and effect2

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect3', value: signal.value});
    console.log(`🔍effect3 #3:`, signal.value);
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
    console.log(`🔍effect1 #1:`, signal.value);
    tree.child.text = signal.value.toString();

    Promise.resolve().then(() => {
      effectsAsync.push({name: 'effect1', value: signal.value});
      console.log(`⚙️ effect1 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect1 incremented signal value!!!`);
    });
  });

  signal.value = 1; //not triggering effect1

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect2', value: signal.value});
    console.log(`🔍effect2 #2:`, signal.value);
    tree.child.child.text = signal.value.toString();

    Promise.resolve().then(() => {
      effectsAsync.push({name: 'effect2', value: signal.value});
      console.log(`⚙️ effect2 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect2 incremented signal value!!!`);
    });
  });

  signal.value = 2; //not triggering effect1 and effect2

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({name: 'effect3', value: signal.value});
    console.log(`🔍effect3 #3:`, signal.value);
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
    console.log(`🔍effect1 #1:`, signal.value);
    tree.child.text = signal.value.toString();

    await wait(0).then(() => {
      effectsAsync.push({
        name: 'effect1',
        value: signal.value,
      });
      console.log(`⚙️ effect1 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect1 incremented signal value!!!`);
    });
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      value: signal.value,
    });
    console.log(`🔍effect2 #2:`, signal.value);
    tree.child.child.text = signal.value.toString();

    await wait(0).then(() => {
      effectsAsync.push({
        name: 'effect2',
        value: signal.value,
      });
      console.log(`⚙️ effect2 incrementing signal value...`);
      signal.value = signal.value + 1;
      console.log(`⚙️ effect2 incremented signal value!!!`);
    });
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: signal.value,
    });
    console.log(`🔍effect3 #3:`, signal.value);
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
    console.log(`🔍effect1 #1:`, signal.value);
    tree.child.text = await fetchData(signal.value);
  });

  signal.value = 1;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      text: signal.value,
    });
    console.log(`🔍effect2 #2:`, signal.value);
    tree.child.child.text = await fetchData(signal.value);
  });

  signal.value = 2;

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect3',
      text: signal.value,
    });
    console.log(`🔍effect3 #3:`, signal.value);
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
        signal.value = signal.value + 2;

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
    console.log(`🔍effect1 #1:`, signal.value);
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
    console.log(`🔍effect2 #2:`, signal.value);

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
    console.log(`🔍effect3 #3:`, signal.value);

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
        signal.value = signal.value + 2;

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
    console.log(`🔍effect1 #1:`, signal.value);
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
    console.log(`🔍effect2 #2:`, signal.value);

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
    console.log(`🔍effect3 #3:`, signal.value);
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
        signal.value = signal.value + 2;

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
    console.log(`🔍effect1 #1:`, signal.value);
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
    console.log(`🔍effect2 #2:`, signal.value);

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
    console.log(`🔍effect3 #3:`, signal.value);
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
    console.log(`🔍effect1 #1:`, signal1.value);
    tree.child.text = signal1.value.toString();

    await wait(0).then(() => {
      asyncEffects.push({
        name: 'effect1',
        value: signal1.value,
      });
      console.log(`⚙️ asyncEffect1 incrementing signal value...`);
      signal1.value = signal1.value + 2;
      console.log(`⚙️ asyncEffect1 incremented signal value!!!`);
    });
  });

  effectsRegistrar.subscribeEffectToSignals(async () => {
    effects.push({
      name: 'effect2',
      value: signal2.value,
    });
    console.log(`🔍effect2 #2:`, signal2.value);
    tree.child.child.text = signal2.value.toString();

    await wait(0).then(() => {
      asyncEffects.push({
        name: 'effect2',
        value: signal2.value,
      });
      console.log(`⚙️ asyncEffect2 incrementing signal value...`);
      signal2.value = signal2.value + 2;
      console.log(`⚙️ asyncEffect2 incremented signal value!!!`);
    });
  });

  effectsRegistrar.subscribeEffectToSignals(() => {
    effects.push({
      name: 'effect3',
      value: computedSignal.value,
    });
    console.log(`🔍effect3 #3:`, computedSignal.value);
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
