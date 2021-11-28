#!/bin/bash

FILES=`find ./packages -name '*.ts' | grep -v '*node_modules*' | grep -v '*/lib/*'`

# https://stackoverflow.com/a/151690/4917752
for i in $FILES; do
  if ! grep -q Copyright $i
  then
    cat ./scripts/copyright-template.txt $i >$i.new && mv $i.new $i
  fi
done
