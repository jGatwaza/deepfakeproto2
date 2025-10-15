#!/bin/bash
# This script helps prepare your app for Vercel deployment

echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Build completed successfully!"
