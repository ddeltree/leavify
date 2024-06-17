export * from './changes.js';
export * from './getStore.js';

import * as ch from './changes.js';
import * as gs from './getStore.js';

const changes = {
  ...ch,
  ...gs,
};
export default changes;
