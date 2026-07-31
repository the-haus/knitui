/**
 * The provider must REGISTER the config it is handed.
 *
 * `<TamaguiProvider config={…}>` does not — it only reads `getCSS()` and
 * `animations` — so before this the active config was whichever module called
 * `createTamagui` last, i.e. a bundler-decided race between an app's
 * `createTheme()` and the kit's own `../config/config`. See `activateConfig` in
 * `Provider.shared.tsx` for the two failure modes that produced.
 *
 * Rendered through `react-dom/server` rather than a DOM renderer so the assertion
 * stays in this package's `node` test environment: registration happens during
 * render, which is exactly what an SSR pass exercises.
 */
import * as React from "react";
import { renderToString } from "react-dom/server";

import { getConfig, setConfig } from "@tamagui/core";

import stockConfig from "../config/config";
import { createTheme } from "../config/theme";
import { Provider } from "./Provider";

// A consumer config that is distinguishable from the stock one by a raw token the
// stock config does not have — the exact class of token that dies when the wrong
// config wins.
const appConfig = createTheme({ colors: { probe: "#ff00ff" } });

const rawColorTokens = (config: unknown) =>
  Object.keys((config as { tokensParsed?: { color?: object } }).tokensParsed?.color ?? {});

/** Simulate having lost the race: the stock config is the registered one. */
const registerStock = () => {
  setConfig(stockConfig as Parameters<typeof setConfig>[0]);
  expect(getConfig()).toBe(stockConfig);
};

describe("Provider config registration", () => {
  afterEach(() => {
    // Leave the process-wide config on the app one, so an ordering change in this
    // file can never make a later suite assert against a half-registered config.
    setConfig(appConfig as Parameters<typeof setConfig>[0]);
  });

  it("registers the config it is handed", () => {
    registerStock();

    renderToString(
      <Provider config={appConfig}>
        <></>
      </Provider>,
    );

    expect(getConfig()).toBe(appConfig);
    expect(rawColorTokens(getConfig())).toContain("$probe");
  });

  it("keeps the app config active when a later render re-asserts it", () => {
    renderToString(
      <Provider config={appConfig}>
        <></>
      </Provider>,
    );
    // A stray `createTamagui` elsewhere (or a lazily-evaluated stock config on
    // some later route) clobbers it...
    registerStock();
    // ...and the next render of the provider puts it back, rather than the app
    // spending the rest of the session on the wrong config.
    renderToString(
      <Provider config={appConfig}>
        <></>
      </Provider>,
    );

    expect(getConfig()).toBe(appConfig);
  });

  it("falls back to the kit's own config when none is passed", () => {
    setConfig(appConfig as Parameters<typeof setConfig>[0]);

    renderToString(
      <Provider>
        <></>
      </Provider>,
    );

    expect(getConfig()).toBe(stockConfig);
  });
});
