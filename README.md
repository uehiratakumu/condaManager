# 🐍 Conda Environment Manager

Conda環境を閲覧、管理、分析するためのWebアプリケーションです。FastAPI（バックエンド）とReact/Vite（フロントエンド）で構築されています。

## ✨ 機能

### 環境管理
- **環境の閲覧**: ローカルのConda環境一覧を、Pythonバージョン、ディスク使用量、最終更新日とともに表示
- **グリッド/テーブル表示**: 環境リストをカード形式またはテーブル形式で切り替え可能
- **ソート機能**: 名前、Pythonバージョン、サイズ、更新日時で昇順/降順ソート
- **作成と複製**: 新しい環境の作成や、既存環境の複製が簡単に可能
- **重複チェック**: 環境作成・インポート・クローン時に同名環境の存在を自動検出
- **インポート**: `environment.yml` または `requirements.txt` から環境を作成
- **エクスポート**: 環境設定をYAMLファイルとしてエクスポート
- **削除**: 不要な環境を削除（確認ダイアログ付き）

### パッケージ管理
- **パッケージ一覧**: 各環境のインストール済みパッケージを表示
- **検索機能**: パッケージ名で絞り込み検索
- **ソート機能**: パッケージ名やビルド情報でソート可能
- **個別インストール**: パッケージ名を指定してインストール（バージョン指定も可能）
- **重複警告**: 既存パッケージの再インストール時に現在のバージョンを表示し、安全な確認UIを提供
- **ファイルからインストール**: `requirements.txt` から既存環境にパッケージを追加
- **アンインストール**: 不要なパッケージを削除（確認ダイアログ付き）
- **自動更新**: パッケージ操作後、リストが自動的に更新

## 📋 前提条件

- **Conda**: `conda` コマンドがシステムPATHに通っている必要があります
- **Node.js**: フロントエンドに必要です（v16以上推奨）
- **Python**: バックエンドに必要です（v3.8以上推奨）

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/uehiratakumu/condaManager.git
cd condaManager
```

### 2. バックエンドのセットアップ

バックエンドはFastAPIで動作し、Condaとの対話を処理します。

#### macOS/Linux の場合:

```bash
cd backend

# 仮想環境の作成（推奨）
python -m venv .venv

# 仮想環境の有効化
source .venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn main:app --reload
```

#### Windows (PowerShell) の場合:

```powershell
cd backend

# 仮想環境の作成（推奨）
python -m venv .venv

# 仮想環境の有効化
.venv\Scripts\Activate.ps1

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn main:app --reload
```

#### Windows (Command Prompt) の場合:

```cmd
cd backend

# 仮想環境の作成（推奨）
python -m venv .venv

# 仮想環境の有効化
.venv\Scripts\activate.bat

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn main:app --reload
```

バックエンドは `http://localhost:8000` で起動します。

**注意:** 
- 仮想環境を使用することで、システムのPython環境を汚染せずに依存関係を管理できます
- Windowsで PowerShell の実行ポリシーエラーが出る場合は、管理者権限で `Set-ExecutionPolicy RemoteSigned` を実行してください

### 3. フロントエンドのセットアップ

フロントエンドはViteで構築されたReactアプリケーションです。

新しいターミナルウィンドウを開いて実行してください：

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## 📖 使い方

### 基本操作

1. ブラウザで `http://localhost:5173` を開きます
2. Conda環境の一覧が表示されます

### 環境の作成

1. ヘッダーの「+ Create Environment」をクリック
2. 2つのタブから選択：
   - **Create Manually**: 環境名とPythonバージョンを指定
     - オプション: `requirements.txt` ファイルをアップロードして初期パッケージをインストール
   - **Import from File**: `environment.yml` または `requirements.txt` をアップロード
     - YAMLファイルの場合、環境名を上書き指定可能
3. 「Create」または「Import」をクリック

### パッケージ管理

1. 環境カードまたはテーブル行の「Packages」ボタンをクリック
2. インストール済みパッケージの一覧が表示されます

**検索とソート:**
- 検索ボックスでパッケージ名を絞り込み
- テーブルヘッダーの「Name」や「Build」をクリックしてソート（再クリックで昇順/降順切り替え）

**個別インストール:**
- 「▶ Install New Packages」をクリックして展開
- パッケージ名を入力（例: `numpy` または `numpy==2.3.5`）
- 「Install」をクリック
- **重複警告**: 既にインストール済みの場合、現在のバージョンが表示され、Cancelボタンが強調されます

**ファイルからインストール:**
- 「▶ Install New Packages」セクションで「Select requirements.txt」をクリック
- ファイルを選択して「Install from File」ボタンをクリック
- `requirements.txt` に対応

**アンインストール:**
- パッケージ行の「Uninstall」ボタンをクリック
- 確認ダイアログで「Uninstall」を選択

### その他の操作

- **複製**: 環境カードの「Clone」をクリックして複製
- **エクスポート**: 「Export」をクリックして `environment.yml` ファイルをダウンロード
- **削除**: 「Delete」をクリック（base環境は削除不可）
- **更新**: ヘッダーの「Refresh」ボタンで環境リストを再読み込み

## 🔧 トラブルシューティング

### バックエンド関連

**接続エラーが表示される**
- バックエンドサーバーがポート8000で実行されているか確認
- `http://localhost:8000/docs` にアクセスしてAPI仕様を確認

**Condaが見つからない**
- `conda` がシステムPATHに含まれているか確認
- シェルの初期化が必要な場合: `conda init <shell_name>`
- ターミナルを再起動して再試行
- **Windows**: Anaconda Prompt または PowerShell を使用してください

**仮想環境の有効化に失敗する (Windows)**
- PowerShellで実行ポリシーエラーが出る場合:
  ```powershell
  Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- それでも失敗する場合は Command Prompt を使用してください

**パッケージインストールが失敗する**
- パッケージ名が正しいか確認
- Conda/PyPIで利用可能なパッケージか確認
- エラーメッセージを確認して対処

### フロントエンド関連

**画面が表示されない**
- フロントエンドサーバーがポート5173で実行されているか確認
- ブラウザのコンソールでエラーを確認

**操作が反映されない**
- ページをリロード（F5）
- ブラウザのキャッシュをクリア
- 両方のサーバー（バックエンド・フロントエンド）が起動しているか確認

**ファイルアップロードが失敗する**
- ファイル形式が `.yml`, `.yaml`, `.txt` のいずれかか確認
- ファイルの内容が正しい形式か確認
- ファイルサイズが大きすぎないか確認

### パフォーマンス

**環境一覧の読み込みが遅い**
- 環境数が多い場合、Pythonバージョンの取得に時間がかかります
- 初回読み込み後はキャッシュされます

**パッケージリストの表示が遅い**
- パッケージ数が多い環境では読み込みに時間がかかる場合があります

## 🛠️ 技術スタック

### バックエンド
- **FastAPI**: 高速なPython Webフレームワーク
- **Uvicorn**: ASGIサーバー
- **Python subprocess**: Condaコマンドの実行

### フロントエンド
- **React**: UIライブラリ
- **Vite**: 高速なビルドツール
- **CSS**: カスタムスタイリング（ダークテーマ、グラスモーフィズム）

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
