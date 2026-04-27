import "./styles/index.scss";
import { render } from "preact";
import { StyleSheetManager } from "styled-components";

import "../external/lang/Languages.patch";
import { App } from "./pages/app";
import "./updateWorker";

const blockedStyledProps = new Set([
    "closing",
    "actions",
    "confirmation",
    "palette",
]);

const shouldForwardProp = (propName: string, target: unknown) => {
    if (typeof target === "string") {
        return !blockedStyledProps.has(propName);
    }

    return true;
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        <App />
    </StyleSheetManager>,
    document.getElementById("app")!,
);
