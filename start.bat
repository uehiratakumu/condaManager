@echo off
REM Conda Environment Manager - 起動スクリプト (Windows)

echo 🚀 Conda Environment Manager を起動しています...
echo.

REM バックエンドの起動
echo 📦 バックエンドを起動中...
cd backend
call .venv\Scripts\activate.bat
start /B uvicorn main:app --reload
cd ..

REM 少し待機
timeout /t 2 /nobreak >nul

REM フロントエンドの起動
echo 🎨 フロントエンドを起動中...
cd frontend
start /B npm run dev
cd ..

echo.
echo ✅ 起動完了！
echo.
echo 📍 バックエンド: http://localhost:8000
echo 📍 フロントエンド: http://localhost:5173
echo.
echo ⚠️  終了するには Ctrl+C を押してください
echo.

REM プロセスが終了するまで待機
pause
