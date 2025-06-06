import { ok } from "node:assert/strict";

/**
 * Delay helper function
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function inBounds(value: number, min: number, max: number) {
  ok(min <= max, "'min' must be less than or equal 'max'");

  if (value < min) return min;
  if (value > max) return max;
  return value;
}
