import { TypedEmitter } from "./emitter";

interface Events {
  ping: { n: number };
  pong: void;
}

describe("TypedEmitter", () => {
  it("delivers payloads to listeners", () => {
    const e = new TypedEmitter<Events>();
    const seen: number[] = [];
    e.on("ping", (p) => seen.push(p.n));
    e.emit("ping", { n: 1 });
    e.emit("ping", { n: 2 });
    expect(seen).toEqual([1, 2]);
  });

  it("unsubscribes via the returned function", () => {
    const e = new TypedEmitter<Events>();
    const seen: number[] = [];
    const off = e.on("ping", (p) => seen.push(p.n));
    e.emit("ping", { n: 1 });
    off();
    e.emit("ping", { n: 2 });
    expect(seen).toEqual([1]);
  });

  it("isolates listeners per event type", () => {
    const e = new TypedEmitter<Events>();
    const ping = jest.fn();
    const pong = jest.fn();
    e.on("ping", ping);
    e.on("pong", pong);
    e.emit("pong", undefined);
    expect(ping).not.toHaveBeenCalled();
    expect(pong).toHaveBeenCalledTimes(1);
  });

  it("tolerates a listener unsubscribing during emit", () => {
    const e = new TypedEmitter<Events>();
    const calls: string[] = [];
    const off2 = e.on("ping", () => {
      calls.push("a");
      off2();
    });
    e.on("ping", () => calls.push("b"));
    e.emit("ping", { n: 1 });
    e.emit("ping", { n: 2 });
    expect(calls).toEqual(["a", "b", "b"]);
  });

  it("keeps notifying other listeners when one throws", () => {
    const e = new TypedEmitter<Events>();
    const after = jest.fn();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    e.on("ping", () => {
      throw new Error("boom");
    });
    e.on("ping", after);
    expect(() => e.emit("ping", { n: 1 })).not.toThrow();
    expect(after).toHaveBeenCalledWith({ n: 1 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("clear() drops all listeners", () => {
    const e = new TypedEmitter<Events>();
    const fn = jest.fn();
    e.on("ping", fn);
    e.clear();
    e.emit("ping", { n: 1 });
    expect(fn).not.toHaveBeenCalled();
  });
});
