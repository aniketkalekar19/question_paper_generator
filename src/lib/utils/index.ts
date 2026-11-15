/**
 * Utility functions for formatting and string manipulation
 */

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours} hr${hours > 1 ? "s" : ""}`;
}

export function formatMarks(marks: number): string {
  return `${marks} mark${marks === 1 ? "" : "s"}`;
}
