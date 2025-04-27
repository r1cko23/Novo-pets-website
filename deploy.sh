#!/bin/bash

echo "Building project..."
npm run build || { echo "Build failed"; exit 1; }

echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete!" 