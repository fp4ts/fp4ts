#!/bin/bash

target="$(pwd)/dist/benchmarks"

echo 'Starting benchmarks'

if [ ! -d "$target" ]; then
  echo "$target not found." >& 1
  echo "Please make sure to compile the sources first. (yarn compile)" >& 1
  exit 1
fi

for file in `find "$target" -name '*.js'`; do
  echo "$file running..."
  node "$file"
done
