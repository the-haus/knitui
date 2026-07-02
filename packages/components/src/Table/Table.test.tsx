import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
