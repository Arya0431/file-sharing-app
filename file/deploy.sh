#!/bin/bash

echo "Starting deployment process..."

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Install and build client
echo "Installing client dependencies..."
cd client
npm install

echo "Building React app..."
npm run build

cd ..

echo "Deployment preparation complete!"
echo "Make sure to set NODE_ENV=production in your Render environment variables." 