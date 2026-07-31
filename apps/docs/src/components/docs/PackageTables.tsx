import { readFileSync } from "node:fs";
import { join } from "node:path";

type PackageInfo = {
  name: string;
  slug: string;
  version: string;
  description?: string;
  private: boolean;
  dependencies: string[];
  peerDependencies: string[];
  optionalPeers: string[];
  exportPaths: string[];
  exportCount: number;
  hasStories: boolean;
};

type ExportInfo = {
  name: string;
  kind: "component" | "type" | "hook" | "function" | "constant";
  package: string;
  packageSlug: string;
  route?: string;
};

let cache: { packages: PackageInfo[]; exports: ExportInfo[] } | undefined;

function data() {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), "src/generated/exports.json"), "utf8"));
  return cache!;
}

/** `/docs/api/packages` — what to install, and what each package brings. */
export function PackageTable() {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Version</th>
            <th>Exports</th>
            <th>What it is</th>
          </tr>
        </thead>
        <tbody>
          {data().packages.map((pkg) => (
            <tr key={pkg.name}>
              <td>
                <code>{pkg.name}</code>
              </td>
              <td>
                <code>{pkg.version}</code>
              </td>
              <td>{pkg.exportCount.toLocaleString()}</td>
              <td>{pkg.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Peer-dependency matrix. Peers are the part of installing a React Native design
 * system that actually goes wrong, so the docs show them per package with the
 * optional ones marked, straight from each `package.json`.
 */
export function PeerDependencyTable() {
  const packages = data().packages.filter((pkg) => pkg.peerDependencies.length);

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Required peers</th>
            <th>Optional peers</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => {
            const required = pkg.peerDependencies.filter(
              (peer) => !pkg.optionalPeers.includes(peer),
            );
            return (
              <tr key={pkg.name}>
                <td>
                  <code>{pkg.name}</code>
                </td>
                <td>
                  {required.map((peer) => (
                    <code key={peer}>{peer} </code>
                  ))}
                </td>
                <td>
                  {pkg.optionalPeers.length
                    ? pkg.optionalPeers.map((peer) => <code key={peer}>{peer} </code>)
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * `/docs/api/exports` — the A–Z of every importable name.
 *
 * Types are included but unlinked; values link to their page where one exists.
 * `@knitui/icons` and `@knitui/emoji` are excluded by the generator (thousands of
 * generated glyphs each) — they have dedicated browsers instead.
 */
export function ExportIndex({ kind }: { kind?: ExportInfo["kind"] }) {
  const exports = data().exports.filter((item) => (kind ? item.kind === kind : true));

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Export</th>
            <th>Kind</th>
            <th>Package</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((item) => (
            <tr key={`${item.package}-${item.name}`}>
              <td>
                {item.route ? (
                  <a href={item.route}>
                    <code>{item.name}</code>
                  </a>
                ) : (
                  <code>{item.name}</code>
                )}
              </td>
              <td>{item.kind}</td>
              <td>
                <code>{item.package}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
