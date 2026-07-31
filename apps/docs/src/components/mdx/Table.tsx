import type { ComponentPropsWithoutRef } from "react";

/**
 * Markdown tables get a horizontal scroll container.
 *
 * Prop and compatibility tables are wide by nature; without this the page body
 * itself scrolls sideways, which breaks the sticky sidebar and the reading column
 * on every narrow viewport.
 */
export function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="table-scroll">
      <table {...props} />
    </div>
  );
}
