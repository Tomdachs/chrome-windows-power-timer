# Windows Power Timer for Chrome（日本語）

Chromeのツールバーから、Windowsの**スリープ**または**シャットダウン**を1分単位で予約するローカル拡張です。管理者権限、常駐サービス、アカウント、テレメトリ、ネットワーク通信は不要です。

## インストール

GitHub ReleaseのZIPを展開し、展開先でWindows PowerShellを開いて実行します。

```powershell
.\install.ps1 -OpenChromeExtensions
```

ChromeでデベロッパーモードをONにし、「パッケージ化されていない拡張機能を読み込む」から、インストーラーに表示された次のフォルダを選択します。

```text
%LOCALAPPDATA%\Tomdachs\WindowsPowerTimer\extension
```

WSLのソースツリーから使う場合:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass \
  -File "$(wslpath -w install.ps1)" -OpenChromeExtensions
```

## 安全性

Chromeを閉じたまま予定時刻を2分以上過ぎた場合、次回起動時に突然実行せず期限切れにします。シャットダウン前にはタイマー開始時の確認を表示します。作業中ファイルは事前に保存してください。
