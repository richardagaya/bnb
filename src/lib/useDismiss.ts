"use client";

import { useEffect, type RefObject } from "react";

/** Call `onClose` when the user presses Escape while `open` is true. */
export function useDismissOnEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/** Call `onClose` when the user clicks outside `ref` while `open` is true. */
export function useDismissOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const el = ref.current;
      const target = e.target as Node;
      // Portaled UI (e.g. DatePicker) lives outside `ref` — don't treat it as an outside click.
      let node: Node | null = target;
      while (node) {
        if (node instanceof Element && node.hasAttribute("data-outside-click-ignore")) return;
        node = node.parentNode;
      }
      if (el && !el.contains(target)) onClose();
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, onClose, ref]);
}
