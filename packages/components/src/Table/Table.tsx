import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type TableSpacingToken = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export type TableSpacing = TableSpacingToken | (string & {}) | number;
type Striped = "odd" | "even";

export interface TableData {
  head?: React.ReactNode[];
  body?: React.ReactNode[][];
  foot?: React.ReactNode[];
  caption?: string;
}

/** `7` → `7`; `"md"` → `"$md"`; a `$`-token / CSS value passes through. */
const toSpace = (val: TableSpacing): BoxProps["padding"] => {
  if (typeof val === "number") {
    return val;
  }

  switch (val) {
    case "xxs":
    case "xs":
    case "sm":
    case "md":
    case "lg":
    case "xl":
    case "xxl":
      return `$${val}` as BoxProps["padding"];
    default:
      return val as BoxProps["padding"];
  }
};

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface TableContextValue {
  striped?: Striped;
  highlightOnHover: boolean;
  withColumnBorders: boolean;
  withRowBorders: boolean;
  horizontalSpacing: TableSpacing;
  verticalSpacing: TableSpacing;
}

const TableContext = React.createContext<TableContextValue | null>(null);

const useTableContext = (): TableContextValue => {
  const ctx = React.useContext(TableContext);
  if (!ctx) {
    throw new Error("Table compound components must be rendered inside <Table>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Frames                                                                     */
/* -------------------------------------------------------------------------- */

const TableFrame = styled(Box, {
  name: "Table",
  flexDirection: "column",
  width: "100%",

  variants: {
    shadow: shadowVariant,
    withTableBorder: {
      true: { borderWidth: 1, borderColor: "$borderColor", borderRadius: "$xs" },
    },
  } as const,
});

const RowGroup = styled(Box, {
  name: "TableRowGroup",
  flexDirection: "column",
});

const RowFrame = styled(Box, {
  name: "TableRow",
  flexDirection: "row",
  alignItems: "stretch",
});

const CellFrame = styled(Text, {
  name: "TableCell",
  flex: 1,
  minWidth: 0,
  fontSize: "$sm",
  color: "$color12",

  variants: {
    header: {
      true: { fontWeight: "700", color: "$color11" },
    },
    columnBorder: {
      true: { borderLeftWidth: 1, borderLeftColor: "$borderColor" },
    },
  } as const,
});

const CaptionFrame = styled(Text, {
  name: "TableCaption",
  fontSize: "$xs",
  color: "$color11",
  paddingVertical: "$xs",
});

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

type CellFrameProps = Omit<GetProps<typeof CellFrame>, "columnBorder" | "header">;

export interface TableCellProps extends CellFrameProps {}

interface InternalTableCellProps extends TableCellProps {
  /** @internal first-cell flag injected by `Table.Tr` (gates column borders). */
  __first?: boolean;
}

function makeCell(header: boolean, role: NonNullable<BoxProps["role"]>, displayName: string) {
  const Cell = CellFrame.styleable<InternalTableCellProps>(function Cell(props, ref) {
    const ctx = useTableContext();
    const { __first, ...rest } = props;
    return (
      <CellFrame
        ref={ref}
        role={role}
        header={header}
        columnBorder={ctx.withColumnBorders && !__first}
        paddingHorizontal={toSpace(ctx.horizontalSpacing)}
        paddingVertical={toSpace(ctx.verticalSpacing)}
        {...rest}
      />
    );
  });
  Cell.displayName = displayName;
  return Cell;
}

export type TableThProps = TableCellProps;
export type TableTdProps = TableCellProps;

const TableTh = makeCell(true, "columnheader", "Table.Th");
const TableTd = makeCell(false, "cell", "Table.Td");

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

export type TableTrProps = GetProps<typeof RowFrame>;

interface InternalTableTrProps extends TableTrProps {
  /** @internal 0-based row index injected by `Table.Tbody` (drives striping). */
  __index?: number;
}

const TableTr = RowFrame.styleable<InternalTableTrProps>(function TableTr(props, ref) {
  const ctx = useTableContext();
  const { __index, children, ...rest } = props;

  const isStriped =
    ctx.striped !== undefined &&
    __index !== undefined &&
    (ctx.striped === "odd" ? __index % 2 === 0 : __index % 2 === 1);

  // Tag the first cell so column borders only appear BETWEEN columns.
  const cells = React.Children.map(children, (child, i) =>
    React.isValidElement<InternalTableCellProps>(child)
      ? React.cloneElement(child, { __first: i === 0 })
      : child,
  );

  return (
    <RowFrame
      ref={ref}
      role="row"
      backgroundColor={isStriped ? "$color2" : undefined}
      borderBottomWidth={ctx.withRowBorders ? 1 : 0}
      borderBottomColor="$borderColor"
      hoverStyle={ctx.highlightOnHover ? { backgroundColor: "$color3" } : undefined}
      {...rest}
    >
      {cells}
    </RowFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

export type TableTheadProps = GetProps<typeof RowGroup>;
export type TableTbodyProps = GetProps<typeof RowGroup>;
export type TableTfootProps = GetProps<typeof RowGroup>;

const TableThead = RowGroup.styleable<TableTheadProps>(function TableThead(props, ref) {
  return <RowGroup ref={ref} role="rowgroup" {...props} />;
});

const TableTfoot = RowGroup.styleable<TableTfootProps>(function TableTfoot(props, ref) {
  return <RowGroup ref={ref} role="rowgroup" {...props} />;
});

const TableTbody = RowGroup.styleable<TableTbodyProps>(function TableTbody(props, ref) {
  const { children, ...rest } = props;
  // Inject a row index so `Table.Tr` can stripe odd/even body rows.
  let rowIndex = 0;
  const rows = React.Children.map(children, (child) => {
    if (React.isValidElement<InternalTableTrProps>(child) && child.type === TableTr) {
      const cloned = React.cloneElement(child, { __index: rowIndex });
      rowIndex += 1;
      return cloned;
    }
    return child;
  });
  return (
    <RowGroup ref={ref} role="rowgroup" {...rest}>
      {rows}
    </RowGroup>
  );
});

export type TableCaptionProps = GetProps<typeof CaptionFrame>;
const TableCaption = CaptionFrame.styleable<TableCaptionProps>(function TableCaption(props, ref) {
  return <CaptionFrame ref={ref} {...props} />;
});

/* -------------------------------------------------------------------------- */
/* Style slots                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). One optional key per
 * exposed `Table.*` part; each maps to that part's props, so
 * `styles={{ td: { color: "$red9" } }}` is sugar for `<Table.Td color="$red9" />`.
 *
 * In the `data`-driven render path these are distributed onto the generated
 * parts; `styles` is the LOWEST-precedence sugar, so any prop the data path
 * sets itself (or a composed part's own prop) wins.
 */
export interface TableStyles {
  /** Props for the root `Table` frame. */
  table?: GetProps<typeof TableFrame>;
  /** Props for `Table.Thead`. */
  thead?: TableTheadProps;
  /** Props for `Table.Tbody`. */
  tbody?: TableTbodyProps;
  /** Props for `Table.Tfoot`. */
  tfoot?: TableTfootProps;
  /** Props for every `Table.Tr`. */
  tr?: TableTrProps;
  /** Props for every `Table.Th`. */
  th?: TableThProps;
  /** Props for every `Table.Td`. */
  td?: TableTdProps;
  /** Props for `Table.Caption`. */
  caption?: TableCaptionProps;
}

const TABLE_SLOT_KEYS = [
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
] as const satisfies readonly (keyof TableStyles)[];

type TableSlots = ReturnType<typeof slotStyles<TableStyles>>;

/* -------------------------------------------------------------------------- */
/* Data renderer                                                              */
/* -------------------------------------------------------------------------- */

function renderRow(cells: React.ReactNode[], header: boolean, key: string, s: TableSlots) {
  const Cell = header ? TableTh : TableTd;
  const cellSlot = header ? ("th" as const) : ("td" as const);
  return (
    <TableTr key={key} {...s.get("tr")}>
      {cells.map((cell, i) => (
        <Cell key={i} {...s.get(cellSlot)}>
          {cell}
        </Cell>
      ))}
    </TableTr>
  );
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

type TableFrameProps = Omit<GetProps<typeof TableFrame>, "withTableBorder">;

export interface TableProps extends TableFrameProps {
  /** Render the table from a data object (ignored when `children` is set). */
  data?: TableData;
  /** Stripe odd/even rows. `true` → `"odd"`. @default false */
  striped?: boolean | Striped;
  /** Highlight rows on hover (web). @default false */
  highlightOnHover?: boolean;
  /** Outer table border. @default false */
  withTableBorder?: boolean;
  /** Borders between columns. @default false */
  withColumnBorders?: boolean;
  /** Borders between rows. @default true */
  withRowBorders?: boolean;
  /** Horizontal cell padding (token/number). @default 'xs' */
  horizontalSpacing?: TableSpacing;
  /** Vertical cell padding (token/number). @default 'xs' */
  verticalSpacing?: TableSpacing;
  /** Side the caption is placed on. @default 'bottom' */
  captionSide?: "top" | "bottom";
  /** Per-slot style sugar — props spread onto the matching parts (data path). */
  styles?: SlotStyles<TableStyles>;
}

const TableRoot = TableFrame.styleable<TableProps>(function Table(props, ref) {
  const {
    data,
    children,
    striped = false,
    highlightOnHover = false,
    withColumnBorders = false,
    withRowBorders = true,
    horizontalSpacing = "xs",
    verticalSpacing = "xs",
    captionSide = "bottom",
    styles,
    ...rest
  } = props;

  const s = slotStyles<TableStyles>(styles, TABLE_SLOT_KEYS, "Table");

  const ctx = React.useMemo<TableContextValue>(
    () => ({
      striped: striped === true ? "odd" : striped || undefined,
      highlightOnHover,
      withColumnBorders,
      withRowBorders,
      horizontalSpacing,
      verticalSpacing,
    }),
    [
      striped,
      highlightOnHover,
      withColumnBorders,
      withRowBorders,
      horizontalSpacing,
      verticalSpacing,
    ],
  );

  let content = children;
  if (!content && data) {
    const caption = data.caption ? (
      <TableCaption {...s.get("caption")}>{data.caption}</TableCaption>
    ) : null;
    content = (
      <>
        {captionSide === "top" ? caption : null}
        {data.head ? (
          <TableThead {...s.get("thead")}>{renderRow(data.head, true, "head", s)}</TableThead>
        ) : null}
        {data.body ? (
          <TableTbody {...s.get("tbody")}>
            {data.body.map((row, i) => renderRow(row, false, `row-${i}`, s))}
          </TableTbody>
        ) : null}
        {data.foot ? (
          <TableTfoot {...s.get("tfoot")}>{renderRow(data.foot, true, "foot", s)}</TableTfoot>
        ) : null}
        {captionSide === "bottom" ? caption : null}
      </>
    );
  }

  return (
    <TableContext.Provider value={ctx}>
      <TableFrame ref={ref} role="table" {...s.merge("table", rest)}>
        {content}
      </TableFrame>
    </TableContext.Provider>
  );
});

export const Table = withStaticProperties(TableRoot, {
  Thead: TableThead,
  Tbody: TableTbody,
  Tfoot: TableTfoot,
  Tr: TableTr,
  Th: TableTh,
  Td: TableTd,
  Caption: TableCaption,
});
