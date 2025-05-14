#!/bin/bash

# E-commerce Telegram Mini App Setup Script

echo "Setting up E-commerce Telegram Mini App..."

# Create .env files from examples if they don't exist
if [ ! -f ./backend/.env ]; then
  echo "Creating backend/.env from example..."
  cp ./backend/.env.example ./backend/.env
  echo "Please update backend/.env with your actual values."
fi

if [ ! -f ./frontend/.env ]; then
  echo "Creating frontend/.env from example..."
  cp ./frontend/.env.example ./frontend/.env
  echo "Please update frontend/.env with your actual values."
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the .env files with your actual values"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. Start the frontend: cd frontend && npm start"
echo "4. Seed the database: cd backend && npm run seed"
echo ""
echo "For more information, see the README.md files."
