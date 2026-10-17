import { Box, styled, Text, getTokenValue } from "@knitui/core";

type Size = "$sm" | "$md";
type Tok = `$${string}`;

const SIZES = { sm: "$sm", md: "$md" } as const;
const toToken = (v: string) => `$${v}`;

export const Frame = styled(Box, {
  name: "Frame",
  p: "$md",
  bg: "$color2",
  variants: {
    size: {
      $sm: { p: "$sm" },
      "$md": { p: "$md" },
      "...size": (val) => ({ height: val }),
    },
  } as const,
  defaultVariants: { size: "$md" },
});

export function Demo({ price }: { price: number }) {
  const px = getTokenValue("$md", "space");
  return (
    <Box p="$lg" gap="$sm" bg="$background" boxShadow="0px 5px 12px 0px $dropShadowColor">
      <Text prefix="$" suffix="$">{`$${price.toFixed(2)}`}</Text>
      <NumberInput prefix="$" thousandSeparator="$" />
      <Box size="$true" $sm={{ p: "$xs" }} />
      <Box w={`$${"md"}`} />
      {"$5.00"}
    </Box>
  );
}

const schema = { $type: "object", $ref: "#/x", value: "$type" };
const isTok = (v: string) => v.startsWith("$") || v[0] === "$";
const dot = "$color.blue";
