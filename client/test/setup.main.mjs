import {register} from 'node:module';
import 'fake-indexeddb/auto';

// ⚠️ Ensure only 1 instance of JSDom is instantiated; multiples will lead to many 🤬
import jsdom from 'global-jsdom';

register('ts-node/esm', import.meta.url);
process.env.NODE_OPTIONS = `--experimental-specifier-resolution=node`;

jsdom(undefined, {
  url: 'https://test.example.com', // ⚠️ Failing to specify this will likely lead to many 🤬
});
// Example of how to decorate a global.
// JSDOM's `history` does not handle navigation; the following handles most cases.
const pushState = globalThis.history.pushState.bind(globalThis.history);

// eslint-disable-next-line camelcase -- 🤷‍♂️
globalThis.history.pushState = function mock_pushState(data, unused, url) {
  pushState(data, unused, url);
  globalThis.location.assign(url);
};

import dispose from 'disposablestack/Symbol.dispose';

Symbol.dispose ??= dispose;
