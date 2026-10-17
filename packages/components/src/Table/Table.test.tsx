import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf, declarationsUnder } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Table } from "./Table";

describe("Table", () => {
  it("exposes the table role", () => {
    render(
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Cell</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders compound sub-components with correct roles", () => {
    render(
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Alice</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(screen.getByRole("columnheader")).toHaveTextContent("Name");
    expect(screen.getByRole("cell")).toHaveTextContent("Alice");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("renders from a data object", () => {
    render(
      <Table
        data={{
          head: ["Country", "Capital"],
          body: [
            ["France", "Paris"],
            ["Japan", "Tokyo"],
          ],
        }}
      />,
    );
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });

  it("renders a caption from data", () => {
    render(
      <Table
        data={{
          caption: "Population table",
          body: [["A"]],
        }}
      />,
    );
    expect(screen.getByText("Population table")).toBeInTheDocument();
  });

  it("accepts the full token spacing scale", () => {
    render(
      <Table horizontalSpacing="xxl" verticalSpacing="xxs">
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>Token spaced</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );

    expect(screen.getByText("Token spaced")).toBeInTheDocument();
  });

  it("distributes the styles map onto generated cells in the data path", () => {
    render(
      <Table
        styles={{
          th: { "aria-label": "from-th-slot" },
          td: { "aria-label": "from-td-slot" },
        }}
        data={{
          head: ["Country", "Capital"],
          body: [
            ["France", "Paris"],
            ["Japan", "Tokyo"],
          ],
        }}
      />,
    );
    // Every generated header cell carries the `th` slot props.
    expect(screen.getAllByLabelText("from-th-slot")).toHaveLength(2);
    // Every generated body cell carries the `td` slot props.
    expect(screen.getAllByLabelText("from-td-slot")).toHaveLength(4);
  });

  it("distributes the styles map onto generated sections and caption in the data path", () => {
    render(
      <Table
        styles={{
          thead: { testID: "thead-slot" },
          tbody: { testID: "tbody-slot" },
          tfoot: { testID: "tfoot-slot" },
          tr: { "aria-label": "row-slot" },
          caption: { testID: "caption-slot" },
        }}
        data={{
          caption: "Cap",
          head: ["H"],
          body: [["B"]],
          foot: ["F"],
        }}
      />,
    );
    expect(screen.getByTestId("thead-slot")).toBeInTheDocument();
    expect(screen.getByTestId("tbody-slot")).toBeInTheDocument();
    expect(screen.getByTestId("tfoot-slot")).toBeInTheDocument();
    expect(screen.getByTestId("caption-slot")).toHaveTextContent("Cap");
    // One row in head, body, and foot each carries the `tr` slot props.
    expect(screen.getAllByLabelText("row-slot")).toHaveLength(3);
  });

  // v3 emits hashed atomic classes, so these guards read the CSS rules that
  // target the element (resting declarations only — no pseudo / media rules).
  const restingDecls = (el: Element) =>
    cssRulesOf(el)
      .filter((rule) => !rule.startsWith("@") && !rule.includes(":where("))
      .map((rule) => /\{([^{}]*)\}/.exec(rule)?.[1]?.trim() ?? "");
  const hasBackground = (el: Element) =>
    restingDecls(el).some((d) => d.startsWith("background-color"));
  const hasLeftBorder = (el: Element) =>
    restingDecls(el).some((d) => d.startsWith("border-left-width: 1px"));

  it("stripes body rows by position (composed path)", () => {
    render(
      <Table striped>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>r0</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td>r1</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    const rows = screen.getAllByRole("row");
    // `striped` (→ "odd") shades the first row, not the second.
    expect(hasBackground(rows[0])).toBe(true);
    expect(hasBackground(rows[1])).toBe(false);
  });

  it("stripes even body rows in the data path", () => {
    render(<Table striped="even" data={{ body: [["x"], ["y"], ["z"]] }} />);
    const rows = screen.getAllByRole("row");
    expect(hasBackground(rows[0])).toBe(false);
    expect(hasBackground(rows[1])).toBe(true);
    expect(hasBackground(rows[2])).toBe(false);
  });

  it("draws column borders between columns only (not before the first cell)", () => {
    render(
      <Table withColumnBorders>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>c0</Table.Td>
            <Table.Td>c1</Table.Td>
            <Table.Td>c2</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(hasLeftBorder(screen.getByText("c0"))).toBe(false);
    expect(hasLeftBorder(screen.getByText("c1"))).toBe(true);
    expect(hasLeftBorder(screen.getByText("c2"))).toBe(true);
  });

  it("finds the leading cell through nested arrays, fragments and empty slots", () => {
    render(
      <Table withColumnBorders>
        <Table.Tbody>
          <Table.Tr>
            {null}
            {[<Table.Td key="n0">n0</Table.Td>, <Table.Td key="n1">n1</Table.Td>]}
          </Table.Tr>
          <Table.Tr>
            <>
              <Table.Td>f0</Table.Td>
              <Table.Td>f1</Table.Td>
            </>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(hasLeftBorder(screen.getByText("n0"))).toBe(false);
    expect(hasLeftBorder(screen.getByText("n1"))).toBe(true);
    expect(hasLeftBorder(screen.getByText("f0"))).toBe(false);
    expect(hasLeftBorder(screen.getByText("f1"))).toBe(true);
  });

  it("forwards a ref to the table element", () => {
    const ref = React.createRef<GetRef<typeof Table>>();
    render(
      <Table ref={ref}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td>X</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("highlights rows on hover only when highlightOnHover is set", () => {
    const { unmount } = render(
      <Table highlightOnHover>
        <Table.Tbody>
          <Table.Tr testID="hl">
            <Table.Td>x</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(declarationsUnder(screen.getByTestId("hl"), ":hover")).toContain(
      "background-color: var(--color3)",
    );
    unmount();

    render(
      <Table>
        <Table.Tbody>
          <Table.Tr testID="plain">
            <Table.Td>x</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    expect(declarationsUnder(screen.getByTestId("plain"), ":hover")).toEqual([]);
  });

  it("composes the stripe fill with the hover fill on the same row", () => {
    render(
      <Table striped highlightOnHover>
        <Table.Tbody>
          <Table.Tr testID="both">
            <Table.Td>x</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>,
    );
    const row = screen.getByTestId("both");
    expect(restingDecls(row)).toContain("background-color: var(--color2);");
    expect(declarationsUnder(row, ":hover")).toContain("background-color: var(--color3)");
  });

  it("draws row dividers by default and drops them with withRowBorders={false}", () => {
    const { unmount } = render(<Table data={{ body: [["a"]] }} />);
    expect(restingDecls(screen.getByRole("row"))).toContain("border-bottom-width: 1px;");
    unmount();
    render(<Table withRowBorders={false} data={{ body: [["a"]] }} />);
    expect(restingDecls(screen.getByRole("row"))).toContain("border-bottom-width: 0px;");
  });

  it("resolves horizontal/vertical spacing tokens and raw numbers onto cells", () => {
    const { unmount } = render(
      <Table horizontalSpacing="xl" verticalSpacing="xxs" data={{ body: [["tok"]] }} />,
    );
    const decls = restingDecls(screen.getByText("tok"));
    expect(decls).toContain("padding-inline: var(--t-space-xl);");
    expect(decls).toContain("padding-block: var(--t-space-xxs);");
    unmount();

    render(<Table horizontalSpacing={14} data={{ body: [["num"]] }} />);
    expect(restingDecls(screen.getByText("num"))).toContain("padding-inline: 14px;");
  });

  it("renders header cells bold with the columnheader role", () => {
    render(<Table data={{ head: ["H"], body: [["b"]] }} />);
    const th = screen.getByRole("columnheader");
    expect(restingDecls(th)).toContain("font-weight: 700;");
    expect(restingDecls(screen.getByRole("cell"))).not.toContain("font-weight: 700;");
  });

  it("does not leak styled frame names onto the DOM", () => {
    render(<Table data={{ head: ["h"], body: [["a"]], caption: "c" }} />);
    const table = screen.getByRole("table");
    expect(table).not.toHaveAttribute("name");
    expect(table.querySelector("[name]")).toBeNull();
  });
});
