#!/bin/bash

# Link to the binary
ln -sf /opt/starter/starter /usr/local/bin/starter

# Launcher icon
desktop-file-install /opt/starter/starter.desktop
