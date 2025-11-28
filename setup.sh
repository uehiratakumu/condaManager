#!/bin/bash

# Conda Environment Manager - セットアップスクリプト

echo "🔧 Conda Environment Manager のセットアップを開始します..."
echo ""

# バックエンドのセットアップ
echo "📦 バックエンドのセットアップ中..."
cd backend

# 仮想環境の作成
if [ ! -d ".venv" ]; then
    echo "  ⚙️  仮想環境を作成しています..."
    python3 -m venv .venv
else
    echo "  ✓ 仮想環境は既に存在します"
fi

# 仮想環境の有効化
echo "  ⚙️  仮想環境を有効化しています..."
source .venv/bin/activate

# 依存関係のインストール
echo "  ⚙️  依存関係をインストールしています..."
pip install -r requirements.txt

cd ..
echo "  ✅ バックエンドのセットアップ完了"
echo ""

# フロントエンドのセットアップ
echo "🎨 フロントエンドのセットアップ中..."
cd frontend

# 依存関係のインストール
echo "  ⚙️  依存関係をインストールしています..."
npm install

cd ..
echo "  ✅ フロントエンドのセットアップ完了"
echo ""

echo "✅ セットアップが完了しました！"
echo ""
echo "次のコマンドでアプリケーションを起動できます："
echo "  ./start.sh"
echo ""
