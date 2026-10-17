"use client";
import { Frame } from "./Frame";

export const Thing = Frame.styleable((props, ref) => <Frame ref={ref} {...props} />);
