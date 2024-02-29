#!/bin/bash

# Avoiding Dubious Ownership in Dev Containers for setup commands that use git
git config --global --add safe.directory /home/inventree

# create venv
python3 -m venv /home/inventree/dev/venv --system-site-packages --upgrade-deps
. /home/inventree/dev/venv/bin/activate

# setup InvenTree server
invoke update -s
invoke setup-dev
invoke frontend-install

# remove existing gitconfig created by "Avoiding Dubious Ownership" step
# so that it gets copied from host to the container to have your global
# git config in container
rm -f /home/vscode/.gitconfig
