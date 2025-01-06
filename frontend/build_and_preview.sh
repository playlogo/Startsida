#!/bin/bash

# Kill the previous instance if it exists
pkill -f "bun run preview"

# Build the project
bun run build

# Run the new instance in the background
bun run preview &
