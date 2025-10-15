#!/bin/bash
# Script to deploy to Vercel using CLI

echo "Preparing for deployment..."

# Make sure all dependencies are correct
npm install

# Optional: Replace index.html with our minimal version for testing
# cp minimal-index.html index.html

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel deploy --prod

echo "Deployment complete!"
