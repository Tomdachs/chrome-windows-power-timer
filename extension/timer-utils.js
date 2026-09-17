export const ACTIONS = Object.freeze(["sleep", "shutdown"]);

export function toTotalMinutes(hours, minutes) {
  const h = Number(hours);
  const m = Number(minutes);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59) {
    throw new Error("Hours and minutes must be whole numbers; minutes must be 0-59.");
  }
  const total = h * 60 + m;
  if (total < 1 || total > 7 * 24 * 60) {
    throw new Error("Timer must be between 1 minute and 7 days.");
  }
  return total;
}

export function splitMinutes(totalMinutes) {
  const total = Math.max(0, Math.trunc(Number(totalMinutes) || 0));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function isAction(value) {
  return ACTIONS.includes(value);
}

export function formatRemaining(targetTime, now = Date.now()) {
  const remainingMs = Math.max(0, Number(targetTime) - Number(now));
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
