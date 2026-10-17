import { Button, Card, styled } from "@knitui/core";

const LABELS = { primary: "$md" };
const theme = "$color9";

const Hero = styled(Card, {
  p: "lg",
  bg: "hover:color2",
});

export function App() {
  return (
    <Hero bg="background" size="md">
      <Button radius="sm" title="$sm" prefix="$" onPress={() => track("$md")} />
    </Hero>
  );
}
