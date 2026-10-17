import { styled } from "./styled";
import { View } from "tamagui";
import { styleable } from "./styleable";

const Frame = styled(View, { p: "md" });
export const Wrapped = styleable(Frame, (props, ref) => <Frame ref={ref} {...props} />);
