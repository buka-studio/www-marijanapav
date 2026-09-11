import { randInt } from '~/src/math';

import StampMotionController from './StampMotionController';

type NodeResult = { x: number; y: number; fit: boolean; id: string };

function arrangeInGrid(opts: {
  container: HTMLElement;
  children: Array<{ width: number; height: number; id: string }>;
  paddingX: number;
  paddingY: number;
  gap: number;
}): NodeResult[] {
  const { container, children: originalChildren, paddingX, paddingY, gap } = opts;
  const children = [...originalChildren].sort((a, b) => b.width * b.height - a.width * a.height);
  const results: NodeResult[] = children.map((child) => ({ x: 0, y: 0, fit: false, id: child.id }));
  if (!container || children.length === 0) {
    return results;
  }

  const usableW = Math.max(0, container.clientWidth - 2 * paddingX);
  const usableH = Math.max(0, container.clientHeight - 2 * paddingY);
  if (usableW <= 0 || usableH <= 0) {
    return results;
  }

  const cellW = Math.max(...children.map((child) => child.width));
  const cellH = Math.max(...children.map((child) => child.height));
  const cols = Math.max(1, Math.floor((usableW + gap) / (cellW + gap)));
  const rowsFit = Math.max(1, Math.floor((usableH + gap) / (cellH + gap)));
  const capacity = cols * rowsFit;
  const overflowCount = Math.max(0, children.length - capacity);
  const rowsUsed = Math.min(rowsFit, Math.ceil(Math.min(children.length, capacity) / cols));
  const contentH = rowsUsed * cellH + (rowsUsed - 1) * gap;
  const originY = paddingY + (usableH - contentH) / 2;
  const placed = Math.min(children.length, capacity);

  for (let r = 0; r < rowsUsed; r++) {
    const baseIdx = r * cols;
    const remaining = placed - baseIdx;
    const nInRow = Math.max(0, Math.min(cols, remaining));
    if (nInRow <= 0) {
      break;
    }

    const rowContentW = nInRow * cellW + (nInRow - 1) * gap;
    const originX = paddingX + (usableW - rowContentW) / 2;
    const yCenter = originY + r * (cellH + gap) + cellH / 2;

    for (let j = 0; j < nInRow; j++) {
      const idx = baseIdx + j;
      const xCenter = originX + j * (cellW + gap) + cellW / 2;
      results[idx] = { x: xCenter, y: yCenter, fit: true, id: children[idx].id };
    }
  }

  if (overflowCount > 0) {
    for (let idx = placed; idx < children.length; idx++) {
      const base = idx % placed;
      const { x, y } = results[base];
      results[idx] = { x, y, fit: false, id: children[idx].id };
    }
  }

  return results;
}

type Entry = {
  controller: StampMotionController;
  z: number;
  dragging: boolean;
};

export default class StampBoard {
  #items = new Map<string, Entry>();

  register(controller: StampMotionController) {
    if (!controller.id) {
      return;
    }

    const existing = this.#items.get(controller.id);
    this.#items.set(controller.id, {
      controller,
      z: existing?.z ?? 1,
      dragging: existing?.dragging ?? false,
    });
  }

  unregister(id: string | null | undefined) {
    if (!id) {
      return;
    }
    this.#items.delete(id);
  }

  getEntry(id: string | null | undefined) {
    if (!id) {
      return undefined;
    }
    return this.#items.get(id);
  }

  getElement(id: string | null | undefined) {
    return this.getEntry(id)?.controller.placementEl ?? null;
  }

  getController(id: string | null | undefined) {
    return this.getEntry(id)?.controller;
  }

  setDragging(id: string, dragging: boolean) {
    const entry = this.#items.get(id);
    if (entry) {
      entry.dragging = dragging;
    }
  }

  placeOnTop(id: string, forceZ?: number) {
    const entry = this.#items.get(id);
    if (!entry?.controller.placementEl) {
      return;
    }

    const nextZ = forceZ ?? this.#maxZ() + 1;
    entry.z = nextZ;
    entry.controller.placementEl.style.setProperty('--z', String(nextZ));

    if (nextZ > this.#items.size + 1) {
      this.#compact(id);
    }

    return nextZ;
  }

  organize({
    container,
    parent,
    ids,
  }: {
    container: HTMLElement;
    parent: HTMLElement;
    ids: string[];
  }) {
    const origin = container.getBoundingClientRect();
    const parentBox = parent.getBoundingClientRect();
    const offsetX = origin.left - parentBox.left;
    const offsetY = origin.top - parentBox.top;
    const children = ids.flatMap((id) => {
      const el = this.getElement(id);
      return el ? [{ id, width: el.offsetWidth, height: el.offsetHeight }] : [];
    });
    const childrenById = Object.fromEntries(children.map((child) => [child.id, child]));
    const positions = arrangeInGrid({
      container,
      children,
      paddingX: 12,
      paddingY: 12,
      gap: 12,
    });

    for (const pos of positions) {
      const size = childrenById[pos.id];
      const controller = this.getController(pos.id);
      if (!size || !controller) {
        continue;
      }

      this.placeOnTop(pos.id);
      controller.placeAt({
        x: offsetX + pos.x - size.width / 2,
        y: offsetY + pos.y - size.height / 2,
        rotate: pos.fit ? randInt(-5, 5) : randInt(-35, 35),
      });
    }
  }

  setInert(zoomedId: string | null, zoomed: boolean) {
    for (const [id, entry] of this.#items) {
      if (entry.controller.placementEl) {
        entry.controller.placementEl.inert = Boolean(zoomed && id !== zoomedId);
      }
    }
  }

  #maxZ() {
    let max = 0;
    for (const entry of this.#items.values()) {
      if (entry.z > max) {
        max = entry.z;
      }
    }
    return max;
  }

  #compact(activeId?: string) {
    const entries = [...this.#items.entries()].sort(([, a], [, b]) => a.z - b.z);
    if (!entries.length) {
      return;
    }

    let nextZ = 1;
    for (const [id, entry] of entries) {
      if (activeId && id === activeId) {
        continue;
      }
      entry.z = nextZ;
      entry.controller.placementEl?.style.setProperty('--z', String(nextZ));
      nextZ += 1;
    }

    if (!activeId) {
      return;
    }

    const active = this.#items.get(activeId);
    if (!active) {
      return;
    }
    active.z = entries.length + 1;
    active.controller.placementEl?.style.setProperty('--z', String(active.z));
  }
}
