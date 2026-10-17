"use client";
import { Frame } from "./Frame";
import { styleable } from "@knitui/core";

export const Thing = styleable(Frame, (props, ref) => <Frame ref={ref} {...props} />);
