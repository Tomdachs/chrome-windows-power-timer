import { formatRemaining, splitMinutes, toTotalMinutes } from "./timer-utils.js";

const hoursInput = document.querySelector("#hours");
const minutesInput = document.querySelector("#minutes");
const startButton = document.querySelector("#start");
const cancelButton = document.querySelector("#cancel");
const running = document.querySelector("#running");
const countdown = document.querySelector("#countdown");
const runningAction = document.querySelector("#runningAction");
const message = document.querySelector("#message");
const hostStatus = document.querySelector("#hostStatus");
const hostText = document.querySelector("#hostText");

let activeState = null;
let ticker = null;

function selectedAction() {
  return document.querySelector('input[name="action"]:checked').value;
}

function setDuration(totalMinutes) {
  const value = splitMinutes(totalMinutes);
  hoursInput.value = value.hours;
  minutesInput.value = value.minutes;
}

function setMessage(text = "") {
  message.textContent = text;
}

function render() {
  const active = Boolean(activeState?.active);
  startButton.classList.toggle("hidden", active);
  cancelButton.classList.toggle("hidden", !active);
  running.classList.toggle("hidden", !active);
  hoursInput.disabled = active;
  minutesInput.disabled = active;
  document.querySelectorAll('input[name="action"]').forEach((input) => { input.disabled = active; });
  document.querySelectorAll(".presets button").forEach((button) => { button.disabled = active; });

  if (active) {
    countdown.textContent = formatRemaining(activeState.targetTime);
    runningAction.textContent = activeState.action === "shutdown" ? "シャットダウン予定" : "スリープ予定";
  }
}

async function refreshState() {
  const response = await chrome.runtime.sendMessage({ type: "status" });
  activeState = response?.state || null;
  if (activeState?.lastError) setMessage(activeState.lastError);
  render();
}

async function checkHost() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "ping-native" });
    if (!response?.ok) throw new Error(response?.error || "接続できません");
    hostStatus.className = "dot ok";
    hostText.textContent = `Windows host 接続済み${response.version ? ` (v${response.version})` : ""}`;
  } catch (error) {
    hostStatus.className = "dot error";
    hostText.textContent = "Windows host 未接続";
    setMessage("先に scripts/install-host.ps1 を実行してください。");
  }
}

for (const button of document.querySelectorAll(".presets button")) {
  button.addEventListener("click", () => setDuration(Number(button.dataset.minutes)));
}

startButton.addEventListener("click", async () => {
  setMessage();
  try {
    const totalMinutes = toTotalMinutes(Number(hoursInput.value), Number(minutesInput.value));
    const action = selectedAction();
    if (action === "shutdown" && !confirm(`${totalMinutes}分後にWindowsをシャットダウンします。開始しますか？`)) return;
    const response = await chrome.runtime.sendMessage({ type: "start", totalMinutes, action });
    if (!response?.ok) throw new Error(response?.error || "タイマーを開始できませんでした。");
    activeState = response.state;
    setMessage("タイマーを開始しました。");
    render();
  } catch (error) {
    setMessage(error.message || String(error));
  }
});

cancelButton.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "cancel" });
  if (!response?.ok) {
    setMessage(response?.error || "キャンセルできませんでした。");
    return;
  }
  activeState = response.state;
  setMessage("タイマーをキャンセルしました。");
  render();
});

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(async () => {
    if (activeState?.active) {
      countdown.textContent = formatRemaining(activeState.targetTime);
      if (Date.now() >= activeState.targetTime + 1000) await refreshState();
    }
  }, 500);
}

await Promise.all([refreshState(), checkHost()]);
startTicker();
