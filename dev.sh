#!/bin/bash

# Start both frontend and backend in development mode

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "tmux is not installed. Please install it to run this script."
    echo "On macOS: brew install tmux"
    echo "On Ubuntu/Debian: sudo apt-get install tmux"
    exit 1
fi

# Start a new tmux session
tmux new-session -d -s telegram-mini-app

# Split the window horizontally
tmux split-window -h -t telegram-mini-app

# Start the backend in the left pane
tmux send-keys -t telegram-mini-app:0.0 "cd backend && npm run dev" C-m

# Start the frontend in the right pane
tmux send-keys -t telegram-mini-app:0.1 "cd frontend && npm start" C-m

# Attach to the session
tmux attach-session -t telegram-mini-app

# Note: To detach from the session, press Ctrl+B then D
# To kill the session, press Ctrl+B then :kill-session
