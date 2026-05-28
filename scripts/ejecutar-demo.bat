@echo off
echo Instalando dependencias...
npm install
if not exist .env.local copy .env.example .env.local
echo Iniciando sistema en http://localhost:3000
npm run dev
pause
