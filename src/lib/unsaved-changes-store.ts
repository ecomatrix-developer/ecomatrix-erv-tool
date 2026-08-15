"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny cross-component flag for "does the ERV simulator currently have scenario
 * work that hasn't been saved". The sidebar (rendered once at the (app) layout
 * level, outside the simulator page tree) reads this to decide whether to
 * intercept a nav click and show a confirmation instead of navigating straight
 * away.
 */
let hasUnsavedChanges = false;
const listeners = new Set<() => void>();

export function setHasUnsavedChanges(value: boolean) {
  if (hasUnsavedChanges === value) return;
  hasUnsavedChanges = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return hasUnsavedChanges;
}

export function useHasUnsavedChanges() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
