import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { InlineMarkdown } from "@/components/mdx/InlineMarkdown";
import { Header } from "@/components/shell/Header";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every Knit UI release, grouped by version, generated from the packages' changelogs.",
};

type Change = { kind: "major" | "minor" | "patch"; text: string };
type Entry = { package: string; changes: Change[] };
type Version = { version: string; entries: Entry[] };

/**
 * The release timeline, parsed from each package's Changesets `CHANGELOG.md`
 * (see `scripts/docs/build-changelog.mjs`).
 *
 * Grouped by version rather than by date: a Changesets changelog has no dates, and
 * this repo releases by merging one version PR that bumps several packages at once —
 * so the version string *is* the release.
 */
export default function ChangelogPage() {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/changelog.json"), "utf8"),
  ) as { timeline: Version[] };

  return (
    <div className="shell">
      <Header />
      <div className="layout" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <main className="content">
          <article
            className="prose"
            style={{ maxWidth: "56rem", margin: "0 auto" }}
            data-pagefind-body
          >
            <h1>Changelog</h1>
            <p>
              Generated from each package&apos;s changelog. Packages are versioned independently and
              published with Changesets; a release is one version PR that bumps everything affected
              together.
            </p>

            {data.timeline.map((version) => (
              <section key={version.version}>
                <h2 id={`v${version.version}`}>{version.version}</h2>
                {version.entries.map((entry) => (
                  <div key={`${version.version}-${entry.package}`}>
                    <h3>
                      <code>{entry.package}</code>
                    </h3>
                    <ul>
                      {entry.changes.map((change, index) => (
                        <li key={index}>
                          {change.kind !== "patch" ? (
                            <span className="badge badge--warn">{change.kind}</span>
                          ) : null}{" "}
                          <InlineMarkdown text={change.text} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </article>
        </main>
      </div>
    </div>
  );
}
