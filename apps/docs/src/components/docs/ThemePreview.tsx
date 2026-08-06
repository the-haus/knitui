import { StoryStage } from "../example/StoryStage";
import { ThemePlayground } from "./ThemePlayground";

/**
 * The theme playground's preview content.
 *
 * A server component so the stories come from the registry the same way every other
 * example does — the playground itself is a client component and only supplies the
 * controls and the token overrides around this.
 *
 * The cluster is chosen to show the knobs doing something: a Button for the accent
 * ramp, a Card for radius on a large surface, and an input for control metrics and
 * spacing together.
 */
const PREVIEW = [
  { id: "components/inputs/button", story: "Variants" },
  { id: "components/display/card", story: "Playground" },
  { id: "components/inputs/text-input", story: "Playground" },
  { id: "components/display/badge", story: "Variants" },
] as const;

export function ThemePreview() {
  return (
    <ThemePlayground>
      <div className="theme-play__cluster">
        {PREVIEW.map(({ id, story }) => (
          <StoryStage key={id} id={id} story={story} mode="stack" />
        ))}
      </div>
    </ThemePlayground>
  );
}
