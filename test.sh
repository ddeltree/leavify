#!/bin/bash

# TYPES
if [[ " $@ " =~ " --types " ]]; then
  if [ ! -d dist ]; then
    mkdir dist;
  fi
  touch dist/index.d.ts;
  tsd --files __tests__/types/**/*.test-d.ts;
# BUILD PACKAGE THEN TEST
elif [[ " $@ " =~ " --package " ]]; then
  npm run build
  if ! [ -d node_modules/leavify ]; then
    npm link;
    npm link leavify;
  fi
  args=( "$@" )
  for (( i=0; i<"${#args[@]}"; i++ )); do
    if [[ "${args[i]}" == "--package" ]]; then
      unset "args[i]"
      break
    fi
  done
  vitest "${args[@]}" --dir __tests__/integration;
# TEST WITHOUT BUILDING
else
  vitest "$@" --exclude __tests__/integration;
fi