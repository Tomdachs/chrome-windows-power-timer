import { isAction } from "./timer-utils.js";

const ALARM_NAME = "windows-power-timer";
const HOST_NAME = "com.tomdachs.windows_power_timer";
const MAX_LATE_MS = 2 * 60 * 1000;

async function getState() {
  const { timerState = null } = await chrome.storage.local.get("timerState");
  return timerState;
}

async function setState(timerState) {
  await chrome.storage.local.set({ timerState });
  return timerState;
}

function sendNative(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(HOST_NAME, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(response);
    });
  });
}

async function startTimer(totalMinutes, action) {
  const minutes = Number(totalMinutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 7 * 24 * 60) {
    throw new Error("Timer must be between 1 minute and 7 days.");
  }
  if (!isAction(action)) throw new Error("Unsupported power action.");

  await chrome.alarms.clear(ALARM_NAME);
  const targetTime = Date.now() + minutes * 60_000;
  const timerState = {
    active: true,
    action,
    targetTime,
    durationMinutes: minutes,
    lastError: null,
    startedAt: Date.now()
  };
  await setState(timerState);
  await chrome.alarms.create(ALARM_NAME, { when: targetTime });
  return timerState;
}

async function cancelTimer() {
  await chrome.alarms.clear(ALARM_NAME);
  const state = await getState();
  if (!state) return null;
  return setState({ ...state, active: false, cancelledAt: Date.now(), lastError: null });
}

async function executeTimer() {
  const state = await getState();
  if (!state?.active || !isAction(state.action)) return;

  const lateness = Date.now() - state.targetTime;
  if (lateness > MAX_LATE_MS) {
    await setState({
      ...state,
      active: false,
      lastError: "Timer expired while Chrome was not running. Nothing was executed."
    });
    return;
  }

  try {
    const response = await sendNative({ command: "execute", action: state.action });
    if (!response?.ok) throw new Error(response?.error || "Native host rejected the request.");
    await setState({ ...state, active: false, executedAt: Date.now(), lastError: null });
  } catch (error) {
    await setState({ ...state, active: false, lastError: error.message || String(error) });
  }
}

async function restoreAlarm() {
  const state = await getState();
  if (!state?.active) return;
  if (state.targetTime <= Date.now()) {
    await setState({
      ...state,
      active: false,
      lastError: "Timer expired while Chrome was not running. Nothing was executed."
    });
    return;
  }
  const alarm = await chrome.alarms.get(ALARM_NAME);
  if (!alarm) await chrome.alarms.create(ALARM_NAME, { when: state.targetTime });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) void executeTimer();
});

chrome.runtime.onStartup.addListener(() => void restoreAlarm());
chrome.runtime.onInstalled.addListener(() => void restoreAlarm());

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "start":
        return { ok: true, state: await startTimer(message.totalMinutes, message.action) };
      case "cancel":
        return { ok: true, state: await cancelTimer() };
      case "status":
        return { ok: true, state: await getState() };
      case "ping-native": {
        const response = await sendNative({ command: "ping" });
        return response?.ok
          ? { ok: true, version: response.version }
          : { ok: false, error: response?.error };
      }
      default:
        return { ok: false, error: "Unknown message type." };
    }
  })()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
  return true;
});

void restoreAlarm();
