import * as React from "react";

import { type GetProps, styleable, styled, withStaticProperties } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type TableSpacingToken = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** A space token (`"md"`), a raw number (px) or any CSS length string. */
export type TableSpacing = TableSpacingToken | (string & {}) | number;
type Striped = "odd" | "even";

export interface TableData {
  head?: React.ReactNode[];
  body?: React.ReactNode[][];
  foot?: React.ReactNode[];
  caption?: string;
}

type Padding = BoxProps["padding"];

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

/**
 * 0-based body-row index, provided by `Table.Tbody` around each `Table.Tr`;
 * `undefined` outside a striped body (head/foot rows never stripe).
 *
 * Position is passed down by context rather than by cloning every row/cell with
 * an injected prop: cloning re-allocated one element per row AND per cell on
 * every render (a 500x8 table = ~4.5k throwaway elements) and, because the clone
 * always produced fresh props, it also defeated any bail-out on referentially
 * stable children.
 */
const TableRowIndexContext = React.createContext<number | undefined>(undefined);

/** `true` for the leading cell of a row — gates the column divider border. */
const TableFirstCellContext = React.createContext(false);

/* -------------------------------------------------------------------------- */
/* Frames                                                                     */
/* -------------------------------------------------------------------------- */

const TableFrame = styled(Box, {
  displayName: "Table",
  role: "table",
  flexDirection: "column",
  width: "100%",

  variants: {
    shadow: shadowVariant,
    withTableBorder: {
      true: { borderWidth: 1, borderColor: "borderColor", borderRadius: "xs" },
    },
  } as const,
});

/**
 * Pure role + layout frames: `Table.Thead` / `Table.Tfoot` / `Table.Caption`
 * carry no behaviour, so they are plain `styled()` components the compiler can
 * flatten to a host element at the call site.
 */
const RowGroup = styled(Box, {
  displayName: "TableRowGroup",
  role: "rowgroup",
  flexDirection: "column",
});

/**
 * Row striping, hover highlight and row dividers are STATIC variants: the row
 * wrapper only maps table context onto three booleans, so no per-row style
 * object is allocated. `striped` fills the resting slot and `highlightOnHover`
 * the `hover:` slot of the same property; v3 merges them per clause.
 */
const RowFrame = styled(Box, {
  displayName: "TableRow",
  role: "row",
  flexDirection: "row",
  alignItems: "stretch",
  borderBottomColor: "borderColor",
  borderBottomWidth: 0,

  variants: {
    striped: {
      true: { backgroundColor: "color2" },
    },
    highlightOnHover: {
      true: { backgroundColor: "hover:color3" },
    },
    withRowBorder: {
      true: { borderBottomWidth: 1 },
    },
  } as const,
});

const CellFrame = styled(Text, {
  displayName: "TableCell",
  role: "cell",
  flex: 1,
  minWidth: 0,
  fontSize: "sm",
  color: "color12",

  variants: {
    header: {
      true: { fontWeight: "700", color: "color11" },
    },
    columnBorder: {
      true: { borderLeftWidth: 1, borderLeftColor: "borderColor" },
    },
  } as const,
});

const HeaderCellFrame = styled(CellFrame, {
  displayName: "TableTh",
  role: "columnheader",
  header: true,
});

const CaptionFrame = styled(Text, {
  displayName: "TableCaption",
  fontSize: "xs",
  color: "color11",
  paddingVertical: "xs",
});

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

type CellFrameProps = Omit<GetProps<typeof CellFrame>, "columnBorder" | "header">;

export interface TableCellProps extends CellFrameProps {}

export type TableThProps = TableCellProps;
export type TableTdProps = TableCellProps;

/*
 * Cells stay behaviour wrappers (styleable, class B): their padding comes from
 * the table's `horizontalSpacing` / `verticalSpacing` and the column divider
 * from the row position, both read from context. The wrapper body is
 * allocation-free — it forwards context values straight onto the frame.
 */
const TableTh = styleable<TableThProps>(HeaderCellFrame, function TableTh(props, ref) {
  const ctx = useTableContext();
  const isFirst = React.useContext(TableFirstCellContext);
  return (
    <HeaderCellFrame
      ref={ref}
      columnBorder={ctx.withColumnBorders && !isFirst}
      paddingHorizontal={ctx.horizontalSpacing as Padding}
      paddingVertical={ctx.verticalSpacing as Padding}
      {...props}
    />
  );
});

const TableTd = styleable<TableTdProps>(CellFrame, function TableTd(props, ref) {
  const ctx = useTableContext();
  const isFirst = React.useContext(TableFirstCellContext);
  return (
    <CellFrame
      ref={ref}
      columnBorder={ctx.withColumnBorders && !isFirst}
      paddingHorizontal={ctx.horizontalSpacing as Padding}
      paddingVertical={ctx.verticalSpacing as Padding}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

export type TableTrProps = Omit<
  GetProps<typeof RowFrame>,
  "striped" | "highlightOnHover" | "withRowBorder"
>;

/**
 * Wraps a row's leading cell in `TableFirstCellContext` so column dividers only
 * appear BETWEEN columns. Recurses through arrays and fragments the way
 * `React.Children.map` flattens them, rebuilding only the branch that leads to
 * the first cell — one extra element (plus one array copy) per row, instead of a
 * clone of every cell. Returns `null` when the subtree renders no cell at all.
 *
 * Empty slots (`null` / `false` / `undefined`) are skipped rather than counted,
 * so a conditionally rendered leading cell is still recognised as first — the
 * old `__first: i === 0` flag counted them and mis-bordered that case.
 */
function markFirstCell(node: React.ReactNode): React.ReactNode | null {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      const marked = markFirstCell(node[i] as React.ReactNode);
      if (marked !== null) {
        const next = node.slice() as React.ReactNode[];
        next[i] = marked;
        return next;
      }
    }
    return null;
  }

  if (React.isValidElement(node)) {
    if (node.type === React.Fragment) {
      const props = node.props as { children?: React.ReactNode };
      const inner = markFirstCell(props.children);
      return inner === null ? node : React.cloneElement(node, undefined, inner);
    }
    return (
      <TableFirstCellContext.Provider key={node.key ?? "first-cell"} value={true}>
        {node}
      </TableFirstCellContext.Provider>
    );
  }

  // A text child occupies the leading slot but cannot carry the flag: nothing is
  // marked, matching the old behavior. Empty slots keep the search going.
  return node === null || node === undefined || typeof node === "boolean" ? null : node;
}

const TableTr = styleable<TableTrProps>(RowFrame, function TableTr(props, ref) {
  const ctx = useTableContext();
  const rowIndex = React.useContext(TableRowIndexContext);
  const { children, ...rest } = props;

  const isStriped =
    ctx.striped !== undefined &&
    rowIndex !== undefined &&
    (ctx.striped === "odd" ? rowIndex % 2 === 0 : rowIndex % 2 === 1);

  // Only the first cell needs flagging, and only when dividers are on at all —
  // with `withColumnBorders` off the flag can never change a cell's styling.
  const cells = ctx.withColumnBorders ? (markFirstCell(children) ?? children) : children;

  return (
    <RowFrame
      ref={ref}
      striped={isStriped}
      highlightOnHover={ctx.highlightOnHover}
      withRowBorder={ctx.withRowBorders}
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

const TableThead = styled(RowGroup, { displayName: "TableThead" });
const TableTfoot = styled(RowGroup, { displayName: "TableTfoot" });

/** Publishes a 0-based index to each `Table.Tr` child so it can stripe itself. */
function withRowIndices(children: React.ReactNode): React.ReactNode {
  let rowIndex = 0;
  return React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TableTr) {
      const index = rowIndex;
      rowIndex += 1;
      return <TableRowIndexContext.Provider value={index}>{child}</TableRowIndexContext.Provider>;
    }
    return child;
  });
}

const TableTbody = styleable<TableTbodyProps>(RowGroup, function TableTbody(props, ref) {
  const ctx = useTableContext();
  const { children, ...rest } = props;
  // Row indices only matter for striping — skip the walk entirely without it.
  const rows = ctx.striped === undefined ? children : withRowIndices(children);
  return (
    <RowGroup ref={ref} {...rest}>
      {rows}
    </RowGroup>
  );
});

export type TableCaptionProps = GetProps<typeof CaptionFrame>;
const TableCaption = CaptionFrame;

/* -------------------------------------------------------------------------- */
/* Style slots                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). One optional key per
 * exposed `Table.*` part; each maps to that part's props, so
 * `styles={{ td: { color: "red9" } }}` is sugar for `<Table.Td color="red9" />`.
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

const TableRoot = styleable<TableProps>(TableFrame, function Table(props, ref) {
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
      {/* Reset row/cell position so a table nested in a cell starts clean. */}
      <TableRowIndexContext.Provider value={undefined}>
        <TableFirstCellContext.Provider value={false}>
          <TableFrame ref={ref} {...s.merge("table", rest)}>
            {content}
          </TableFrame>
        </TableFirstCellContext.Provider>
      </TableRowIndexContext.Provider>
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
