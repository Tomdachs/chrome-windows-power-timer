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

function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

function localizeDocument() {
  document.documentElement.lang = chrome.i18n.getUILanguage().toLowerCase().startsWith("ja") ? "ja" : "en";
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  }
}

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
    runningAction.textContent = activeState.action === "shutdown" ? t("shutdownScheduled") : t("sleepScheduled");
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
    if (!response?.ok) throw new Error(response?.error || t("nativeConnectionFailed"));
    hostStatus.className = "dot ok";
    hostText.textContent = `${t("hostConnected")}${response.version ? ` (v${response.version})` : ""}`;
  } catch (_error) {
    hostStatus.className = "dot error";
    hostText.textContent = t("hostNotConnected");
    setMessage(t("installFirst"));
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
    if (action === "shutdown" && !confirm(t("confirmShutdown", [String(totalMinutes)]))) return;
    const response = await chrome.runtime.sendMessage({ type: "start", totalMinutes, action });
    if (!response?.ok) throw new Error(response?.error || t("timerStartFailed"));
    activeState = response.state;
    setMessage(t("timerStarted"));
    render();
  } catch (error) {
    setMessage(error.message || String(error));
  }
});

cancelButton.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "cancel" });
  if (!response?.ok) {
    setMessage(response?.error || t("timerCancelFailed"));
    return;
  }
  activeState = response.state;
  setMessage(t("timerCancelled"));
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

localizeDocument();
await Promise.all([refreshState(), checkHost()]);
startTicker();
