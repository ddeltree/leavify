#!/bin/bash

if ! [ -d node_modules/leavify ]; then
  npm link;
  npm link leavify;
fi
vitest