#!/bin/bash
set -e

echo "📦 Copiando node_modules para dist/js..."
# cp -r node_modules dist/js/node_modules
cp package.json dist/js

echo "🗜️ Criando index.zip..."
cd dist/js
npm install --omit=dev
zip -r ../index.zip .
cd ../..

echo "✅ dist/index.zip criado com sucesso!"
