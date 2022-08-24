#!/bin/bash

VERSION_PATTERN='^[0-9]+\.[0-9]+\.[0-9]+(-[a-z]+(\.[0-9]+)?)?$'

print_help() {
  echo "release <version-tag>"
  echo "  version-tag   $VERSION_PATTERN"
}

if [ -z $(echo "$1" | egrep "$VERSION_PATTERN") ]; then
  print_help
  exit 1
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]; then
  echo "Please make sure you are on the master branch"
  exit 1
fi

if [[ "$(git update-index --refresh)" ]]; then
  echo "There are uncommited changes"
  exit 1
fi

git tag "$1"
git push --tags
