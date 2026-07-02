/**
 * Internal registries for sources, layers, and images.
 *
 * Each registry stores entries keyed by stable ID and preserves insertion
 * order for deterministic replay after style reload (web).
 *
 * These are internal implementation details — never exposed publicly.
 */

// ── Source registry ─────────────────────────────────────────────────

export interface SourceEntry {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

// ── Layer registry ──────────────────────────────────────────────────

export interface LayerEntry {
  id: string;
  type: string;
  sourceId?: string;
  config: Record<string, unknown>;
  /** Insert above this layer ID (ordering hint). */
  aboveLayerID?: string;
  /** Insert below this layer ID (ordering hint). */
  belowLayerID?: string;
  /** Absolute insertion index (ordering hint). */
  layerIndex?: number;
}

// ── Image registry ──────────────────────────────────────────────────

export interface ImageEntry {
  id: string;
  data: unknown;
}

// ── Registry implementation ─────────────────────────────────────────

export class Registry<T extends { id: string }> {
  private _entries = new Map<string, T>();

  /** Register or update an entry. */
  set(entry: T): void {
    this._entries.set(entry.id, entry);
  }

  /** Remove an entry by ID. */
  delete(id: string): boolean {
    return this._entries.delete(id);
  }

  /** Get an entry by ID. */
  get(id: string): T | undefined {
    return this._entries.get(id);
  }

  /** Whether an entry with this ID exists. */
  has(id: string): boolean {
    return this._entries.has(id);
  }

  /** All entries in insertion order. */
  values(): T[] {
    return Array.from(this._entries.values());
  }

  /** Number of registered entries. */
  get size(): number {
    return this._entries.size;
  }

  /** Remove all entries. */
  clear(): void {
    this._entries.clear();
  }
}
