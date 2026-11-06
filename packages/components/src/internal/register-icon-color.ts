import { registerIconColorResolver } from "@knitui/icons/context";

import { useIconColor } from "./use-icon-color";

// Lets `<IconStar color="blue9" />` resolve theme colours as every other component does.
registerIconColorResolver(useIconColor);
