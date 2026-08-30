import { readFileSync } from "node:fs";
import { join } from "node:path";

import Link from "next/link";

import { Example } from "@/components/example/Example";
import { Showcase } from "@/components/example/Showcase";
import { InstallCommand } from "@/components/mdx/InstallCommand";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { Header } from "@/components/shell/Header";
import { PlatformBand, PlatformStrip } from "@/components/shell/Platforms";
import { entries } from "@/lib/registry";

/** Newest release, for the hero's "what's new" pill — same source as /changelog. */
function latestVersion(): string | undefined {
  const changelog = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/changelog.json"), "utf8"),
  ) as { timeline: { version: string }[] };
  return changelog.timeline[0]?.version;
}

export default function LandingPage() {
  const all = entries();
  /** Everything documented, satellite kits included — the number the hero quotes. */
  const componentCount = all.filter((e) => !e.internal).length;
  /** Just `@knitui/components`, for the card that links into that section. */
  const coreComponentCount = all.filter((e) => e.package === "components" && !e.internal).length;
  const storyCount = all.reduce((total, entry) => total + entry.stories.length, 0);
  const packageCount = new Set(all.map((e) => e.package)).size;
  const version = latestVersion();

  return (
    <div className="shell">
      <SiteJsonLd version={version} componentCount={componentCount} />
      <Header />

      <section className="hero">
        <div className="hero__inner">
          {version ? (
            <Link className="hero__eyebrow" href="/changelog">
              <span className="hero__eyebrow-tag">v{version}</span>
              See what&apos;s new <span aria-hidden="true">→</span>
            </Link>
          ) : null}

          <h1>
            Knit one kit.
            <br />
            <span className="hero__gradient-text">Ship three platforms.</span>
          </h1>
          <p>
            {componentCount} cross-platform components, one design system, one import. Built on
            Tamagui and React Native — rendered natively on iOS and Android, as real DOM on the web.
          </p>

          <div className="hero__actions">
            <Link className="cta" href="/docs/getting-started/installation">
              Get started
            </Link>
            <Link className="cta cta--ghost" href="/docs/components/inputs/button">
              Browse components
              <span className="cta__hint">{componentCount}</span>
            </Link>
          </div>

          <PlatformStrip />

          <div className="stats">
            <div className="stat">
              <div className="stat__value">{componentCount}</div>
              <div className="stat__label">components</div>
            </div>
            <div className="stat">
              <div className="stat__value">{storyCount.toLocaleString()}</div>
              <div className="stat__label">live examples</div>
            </div>
            <div className="stat">
              <div className="stat__value">{packageCount}</div>
              <div className="stat__label">packages</div>
            </div>
            <div className="stat">
              <div className="stat__value">3</div>
              <div className="stat__label">platforms, one source</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--platforms">
        <div className="section__head">
          <span className="section__eyebrow">Write once, run everywhere — literally</span>
          <h2 className="section__title">
            One import. Three platforms.{" "}
            <span className="hero__gradient-text">No forks, no wrappers.</span>
          </h2>
          <p className="section__lede">
            You write <code>&lt;Button variant=&quot;filled&quot; /&gt;</code> once. Knit UI
            resolves it to the right primitive on each target — the props, the theme, the sizing
            ladder and the tests are shared.
          </p>
        </div>
        <PlatformBand />
      </section>

      {/*
        The showcase runs before any prose. Everything in it is a real story
        module — the same file Storybook and the device gallery render — mounted
        lazily by `StoryStage`, so the page stays cheap until you scroll to it.
      */}
      <section className="section section--showcase">
        <div className="section__head">
          <span className="section__eyebrow">Not just boxes and buttons</span>
          <h2 className="section__title">Skia canvases, gesture decks, 60fps carousels</h2>
          <p className="section__lede">
            Every tile below is running right now, on this page, from the kit&apos;s own story files
            — and the identical code renders on iOS and Android.
          </p>
        </div>

        {/* Six tiles, all span-3: three tidy rows of two, every demo given room. */}
        <div className="showcase-grid">
          <Showcase
            id="map/sources/svg-icon"
            story="TenThousandClustered"
            tag="@knitui/map"
            span={3}
            title="Maps, 10,000 markers"
            blurb="SVG icons rasterised once and drawn by the GPU as a clustered symbol layer — MapLibre on web, native on device."
          />
          <Showcase
            id="graphics/audio-mesh"
            scale={1.3}
            story="Default"
            tag="@knitui/graphics"
            span={3}
            title="Audio mesh"
            blurb="A Skia mesh gradient flowing to live audio bands — the same shader on every platform."
          />
          <Showcase
            id="carousel"
            scale={1.4}
            story="Coverflow"
            tag="@knitui/carousel"
            span={3}
            title="Coverflow carousel"
            blurb="Ten layout modes, pluggable per-slide transitions, driven by Reanimated on the UI thread."
          />
          <Showcase
            id="carousel/swipe-deck"
            scale={0.65}
            /* The deck is 460px tall before any zoom — twice a phone tile. */
            narrowScale={0.5}
            story="FanEffect"
            tag="@knitui/carousel"
            span={3}
            title="Swipe deck"
            blurb="A gesture-driven card deck with swappable effect worklets — fan, stack, or your own."
          />
          <Showcase
            id="graphics/audio-visualizer"
            scale={1.4}
            story="Neon"
            tag="@knitui/graphics"
            span={3}
            title="Neon visualizer"
            blurb="A crisp waveform with a separately tinted halo, smoothed from a bursty data source."
          />
          <Showcase
            id="graphics/effects/effect-view"
            scale={1.4}
            /* 220x130 authored: it still fits a phone tile at full zoom. */
            narrowScale={1.4}
            story="SweepBorder"
            tag="@knitui/graphics"
            span={3}
            title="Sweep border"
            blurb="Conic gradient borders, glows and inner shadows, painted in Skia rather than faked in CSS."
          />
        </div>
      </section>

      <main className="section">
        <div className="prose section__prose">
          <h2 id="install">Install</h2>
          {/*
           * The same `InstallCommand` the docs use, not a hardcoded npm line —
           * this is the highest-traffic install command on the site, so it is the
           * one that most needs to match the reader's package manager. The choice
           * is shared, so picking pnpm here holds for every other block.
           */}
          <InstallCommand
            expo
            packages="@knitui/core @knitui/components react-native-gesture-handler react-native-reanimated react-native-svg react-native-teleport react-native-worklets"
          />

          <h2 id="live">Live, on this page</h2>
          <p>
            Every example in these docs is a real component, mounted for real — and it is the same
            story file the kit&apos;s Storybook and its iOS/Android gallery render, so nothing here
            can drift from what ships.
          </p>
          <Example id="components/inputs/button" story="Variants" expanded />

          <h2 id="explore">Explore</h2>
          <div className="grid-cards">
            <Link className="card-link" href="/docs/foundations/tokens">
              <span className="card-link__title">Foundations</span>
              <p className="card-link__body">
                Tokens, themes, sizing, motion — the systems every component shares.
              </p>
            </Link>
            <Link className="card-link" href="/docs/components/inputs/button">
              <span className="card-link__title">Components</span>
              <p className="card-link__body">
                {coreComponentCount} components in the core kit, with live examples, generated prop
                tables and slot references.
              </p>
            </Link>
            <Link className="card-link" href="/docs/dates">
              <span className="card-link__title">Satellite kits</span>
              <p className="card-link__body">
                Dates, carousel, maps, media, graphics, sheets, icons and emoji.
              </p>
            </Link>
            <Link className="card-link" href="/docs/guides/cross-platform-authoring">
              <span className="card-link__title">Guides</span>
              <p className="card-link__body">
                Cross-platform authoring, theming, performance, testing, migration.
              </p>
            </Link>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <span>MIT licensed · © The Haus</span>
          <span>
            <Link href="/docs/all">All pages</Link>
            {" · "}
            <a href="https://github.com/the-haus/knitui">GitHub</a>
            {" · "}
            <a href="https://github.com/the-haus/knitui/discussions">Discussions</a>
            {" · "}
            <a href="https://www.npmjs.com/org/knitui">npm</a>
            {" · "}
            <a href="https://the-haus.github.io/knitui">Storybook</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
