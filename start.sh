#!/bin/bash

# Conda Environment Manager - 起動スクリプト

echo "🚀 Conda Environment Manager を起動しています..."
echo ""

# バックエンドの起動
echo "📦 バックエンドを起動中..."
cd backend
source .venv/bin/activate 2>/dev/null || source ../.venv/bin/activate 2>/dev/null
uvicorn main:app --reload &
BACKEND_PID=$!
cd ..

# 少し待機
sleep 2

# フロントエンドの起動
echo "🎨 フロントエンドを起動中..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 起動完了！"
echo ""
echo "📍 バックエンド: http://localhost:8000"
echo "📍 フロントエンド: http://localhost:5173"
echo ""
echo "⚠️  終了するには Ctrl+C を押してください"
echo ""

# 終了シグナルをキャッチ
trap "echo ''; echo '🛑 サーバーを停止しています...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# プロセスが終了するまで待機
wait
