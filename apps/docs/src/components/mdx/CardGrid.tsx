import type { ReactNode } from "react";

import Link from "next/link";

/** A responsive grid of link cards — used on overview and landing pages. */
export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid-cards">{children}</div>;
}

export function CardLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children?: ReactNode;
}) {
  const external = href.startsWith("http");
  // The body is a `div`, not a `p`: MDX wraps a JSX block's text content in its own
  // paragraph, and a `<p>` inside a `<p>` makes the browser close the outer one —
  // which restructures the DOM and breaks hydration (React error #418).
  const content = (
    <>
      <span className="card-link__title">{title}</span>
      {children ? <div className="card-link__body">{children}</div> : null}
    </>
  );

  return external ? (
    <a className="card-link" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <Link className="card-link" href={href}>
      {content}
    </Link>
  );
}
