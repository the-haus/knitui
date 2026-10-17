// tamagui-v3-codemod-ignore-next-line
const legacy = "$md";
const kept = "$md";

const layer = { type: "symbol", filter: ["==", ["get", "$type"], "Point"] };
const marker = { $ref: "voyagerStyle", $fn: "(x) => x" };

export function Price({ value }: { value: number }) {
  return (
    <>
      <NumberFormatter prefix="$" value={value} thousandSeparator="," />
      <RollingNumber prefix="$" suffix=" USD" value={value} />
      <Text>{`$${value.toFixed(2)}`}</Text>
      <Text>{"$md"}</Text>
      <Box slotStyles={{ root: { p: "$md", pressStyle: { opacity: 0.5 } } }} />
    </>
  );
}

const spreadVariants = styled(Box, {
  variants: {
    radius: radiusVariant,
    size: { ":number": (v: number) => ({ width: v }) },
  },
});
