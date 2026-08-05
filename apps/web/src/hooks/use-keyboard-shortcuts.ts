"use client";

import { useEffect } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutOptions {
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  enabled?: boolean;
}

/**
 * Register a keyboard shortcut. Prefer meta/ctrl for cross-platform Cmd/Ctrl.
 */
export function useKeyboardShortcut(
  key: string,
  handler: ShortcutHandler,
  options: ShortcutOptions = {}
) {
  const {
    meta = false,
    ctrl = false,
    shift = false,
    alt = false,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      // Allow Cmd/Ctrl+K even while focused in inputs for command palette
      const isPalette =
        key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if (isTyping && !isPalette) return;

      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      if (!keyMatches) return;

      const metaOk = meta ? event.metaKey || event.ctrlKey : true;
      const ctrlOk = ctrl ? event.ctrlKey || event.metaKey : !ctrl;
      const shiftOk = shift ? event.shiftKey : !event.shiftKey;
      const altOk = alt ? event.altKey : !event.altKey;

      // When meta is requested, accept either Meta or Ctrl (mac/win)
      if (meta) {
        if (!(event.metaKey || event.ctrlKey)) return;
        if (shift !== event.shiftKey) return;
        if (alt !== event.altKey) return;
      } else {
        if (!metaOk || !ctrlOk || !shiftOk || !altOk) return;
        if (event.metaKey || event.ctrlKey) return;
      }

      event.preventDefault();
      handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, meta, ctrl, shift, alt, enabled]);
}

export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string;
    handler: ShortcutHandler;
    options?: ShortcutOptions;
  }>
) {
  useEffect(() => {
    const listeners = shortcuts.map(({ key, handler, options = {} }) => {
      const {
        meta = false,
        shift = false,
        alt = false,
        enabled = true,
      } = options;

      return (event: KeyboardEvent) => {
        if (!enabled) return;
        if (event.key.toLowerCase() !== key.toLowerCase()) return;

        if (meta) {
          if (!(event.metaKey || event.ctrlKey)) return;
          if (shift !== event.shiftKey) return;
          if (alt !== event.altKey) return;
        } else if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        } else if (shift !== event.shiftKey) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isTyping =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target?.isContentEditable;
        const isPalette =
          key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
        if (isTyping && !isPalette) return;

        event.preventDefault();
        handler(event);
      };
    });

    const onKeyDown = (event: KeyboardEvent) => {
      listeners.forEach((fn) => fn(event));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
