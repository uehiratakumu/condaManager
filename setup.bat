@echo off
REM Conda Environment Manager - セットアップスクリプト (Windows)

echo 🔧 Conda Environment Manager のセットアップを開始します...
echo.

REM バックエンドのセットアップ
echo 📦 バックエンドのセットアップ中...
cd backend

REM 仮想環境の作成
if not exist ".venv" (
    echo   ⚙️  仮想環境を作成しています...
    python -m venv .venv
) else (
    echo   ✓ 仮想環境は既に存在します
)

REM 仮想環境の有効化
echo   ⚙️  仮想環境を有効化しています...
call .venv\Scripts\activate.bat

REM 依存関係のインストール
echo   ⚙️  依存関係をインストールしています...
pip install -r requirements.txt

cd ..
echo   ✅ バックエンドのセットアップ完了
echo.

REM フロントエンドのセットアップ
echo 🎨 フロントエンドのセットアップ中...
cd frontend

REM 依存関係のインストール
echo   ⚙️  依存関係をインストールしています...
call npm install

cd ..
echo   ✅ フロントエンドのセットアップ完了
echo.

echo ✅ セットアップが完了しました！
echo.
echo 次のコマンドでアプリケーションを起動できます：
echo   start.bat
echo.
pause
