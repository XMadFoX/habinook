#!/usr/bin/env bash
echo $(head -n1 $1) | pnpm commitlint --color
