# Windows Power Timer

Chromeから **1分単位** で時間を指定し、指定時刻にWindowsを **スリープ** または **シャットダウン** するローカル拡張です。

## 構成

- `extension/`: Manifest V3 Chrome拡張。`chrome.alarms` でタイマーを保持します。
- `host/`: Windows側のNative Messaging host。受け付ける操作を限定しています。
- `scripts/install-host.ps1`: hostをWindowsへコンパイル・配置し、HKCUへ登録します。管理者権限は不要です。

拡張IDはmanifestの公開鍵で `lfcapfodknbfpomfifbkfekikbflmjck` に固定し、Native Messagingの`allowed_origins`もこのIDだけを許可します。

## インストール

WSLのこのリポジトリで実行します。

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass \
  -File "$(wslpath -w scripts/install-host.ps1)" -OpenChromeExtensions
```

Windows側の `%LOCALAPPDATA%\Tomdachs\WindowsPowerTimer` にhostと拡張ファイルが配置されます。Chromeで次を1回だけ行います。

1. `chrome://extensions` で「デベロッパー モード」をON。
2. 「パッケージ化されていない拡張機能を読み込む」を押す。
3. `%LOCALAPPDATA%\Tomdachs\WindowsPowerTimer\extension` を選ぶ。
4. `Windows Power Timer` をツールバーへ固定する。

更新後は `install-host.ps1` を再実行し、`chrome://extensions` の拡張カードで再読み込みします。

## 使い方

HOURS / MINUTESを整数で入力します。最小1分、最大7日です。`5m / 15m / 30m / 1h` のプリセットもあります。動作を「スリープ」または「シャットダウン」から選んで開始します。シャットダウン選択時は誤操作防止の確認を表示します。

タイマーはChromeの拡張アラームで管理するため、**実行時までChromeが起動している必要があります**。Chromeが停止したまま予定時刻を2分以上過ぎた場合は、安全のため遅延実行せず期限切れとして扱います。

## 確認

```bash
./scripts/check.sh
```

Nodeのロジックテスト、manifest JSON、Windows PowerShellによるNative hostのコンパイル、`ping`フレーム確認を行います。テストではスリープ/シャットダウンを実行しません。

インストール状態だけ確認:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w scripts/install-host.ps1)" -Check
```

アンインストール:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w scripts/install-host.ps1)" -Uninstall
```
