#!/bin/bash
set -e

echo "📦 Copiando node_modules para dist/js..."
cp -r node_modules dist/js/node_modules

echo "🗜️ Criando index.zip..."
cd dist/js
zip -r ../index.zip .
cd ../..

echo "✅ dist/index.zip criado com sucesso!"
