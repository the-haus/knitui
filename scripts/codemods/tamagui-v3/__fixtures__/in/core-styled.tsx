import { styled } from "./styled";
import { View } from "tamagui";

const Frame = styled(View, { p: "$md" });
export const Wrapped = Frame.styleable((props, ref) => <Frame ref={ref} {...props} />);
