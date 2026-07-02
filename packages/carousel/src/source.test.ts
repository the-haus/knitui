import { createAsyncSlideSource } from "./source";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("createAsyncSlideSource", () => {
  it("returns undefined before load, then the fetched item", async () => {
    const fetchRange = jest.fn(async (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => `item-${start + i}`),
    );
    const src = createAsyncSlideSource({ length: 25, fetchRange, pageSize: 10 });

    expect(src.getItem(0)).toBeUndefined();
    src.ensure([0, 3]);
    expect(fetchRange).toHaveBeenCalledWith(0, 10);
    await flush();
    expect(src.getItem(0)).toBe("item-0");
    expect(src.getItem(3)).toBe("item-3");
  });

  it("batches indices into aligned pages and de-dupes in-flight pages", async () => {
    const fetchRange = jest.fn(async (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => start + i),
    );
    const src = createAsyncSlideSource({ length: 100, fetchRange, pageSize: 10 });

    src.ensure([0, 1, 2]); // page 0
    src.ensure([5, 9]); // still page 0, in flight → no new fetch
    src.ensure([12]); // page 1
    expect(fetchRange).toHaveBeenCalledTimes(2);
    expect(fetchRange).toHaveBeenNthCalledWith(1, 0, 10);
    expect(fetchRange).toHaveBeenNthCalledWith(2, 10, 10);

    await flush();
    // already-cached pages are not refetched
    src.ensure([0, 5]);
    expect(fetchRange).toHaveBeenCalledTimes(2);
  });

  it("clamps the final page's count to the list length", async () => {
    const fetchRange = jest.fn(async () => []);
    const src = createAsyncSlideSource({ length: 23, fetchRange, pageSize: 10 });
    src.ensure([22]); // page 2 → start 20, only 3 left
    expect(fetchRange).toHaveBeenCalledWith(20, 3);
  });

  it("notifies subscribers and bumps the version when data arrives", async () => {
    const fetchRange = jest.fn(async (s: number, c: number) =>
      Array.from({ length: c }, (_, i) => s + i),
    );
    const src = createAsyncSlideSource({ length: 10, fetchRange, pageSize: 10 });
    const listener = jest.fn();
    const unsub = src.subscribe(listener);
    const v0 = src.getVersion();

    src.ensure([0]);
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(src.getVersion()).toBeGreaterThan(v0);

    unsub();
    src.ensure([5]); // already cached (page 0) → no fetch, no notify
    await flush();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("allows a failed page to be retried", async () => {
    let attempt = 0;
    const fetchRange = jest.fn(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("network");
      return [0];
    });
    const src = createAsyncSlideSource({ length: 1, fetchRange, pageSize: 1 });

    src.ensure([0]);
    await flush();
    expect(src.getItem(0)).toBeUndefined(); // first attempt failed

    src.ensure([0]); // retry
    await flush();
    expect(src.getItem(0)).toBe(0);
    expect(fetchRange).toHaveBeenCalledTimes(2);
  });
});
