function createFocusRing(stage: HTMLElement) {
  const doc = stage.ownerDocument;

  const ring = () => stage.querySelector<HTMLElement>(':scope > [data-slot="book-focus"]');

  function place() {
    const el = ring();
    if (!el) return;
    const held = doc.activeElement;
    const shown =
      held instanceof HTMLElement &&
      held !== stage &&
      stage.contains(held) &&
      held.matches(':focus-visible') &&
      held.closest('[data-slot="book-page-frame"][data-under]') !== null;
    if (!shown) {
      if (!el.hidden) el.hidden = true;
      return;
    }
    const box = held.getBoundingClientRect();
    const base = stage.getBoundingClientRect();
    const at = [box.left - base.left, box.top - base.top, box.width, box.height].map(
      (value) => `${value.toFixed(1)}px`,
    );
    const style = el.style;
    if (style.left !== at[0]) style.left = at[0]!;
    if (style.top !== at[1]) style.top = at[1]!;
    if (style.width !== at[2]) style.width = at[2]!;
    if (style.height !== at[3]) style.height = at[3]!;
    if (el.hidden) el.hidden = false;
  }

  const later = () => queueMicrotask(place);
  stage.addEventListener('focusin', later);
  stage.addEventListener('focusout', later);

  return {
    place,
    clear() {
      stage.removeEventListener('focusin', later);
      stage.removeEventListener('focusout', later);
      const el = ring();
      if (el) el.hidden = true;
    },
  };
}

export { createFocusRing };
