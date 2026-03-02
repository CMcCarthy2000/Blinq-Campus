import { Link } from "react-router-dom";

import styles from "./Panes.module.scss";
import { Text } from "preact-i18n";

import { Tip } from "@revoltchat/ui";

import EditAccount from "../../../components/settings/account/EditAccount";

export function Account() {
    return (
        <div className={styles.user}>
            <EditAccount />

            <Tip>
                <span>
                    <Text id="app.settings.tips.account.a" />
                </span>{" "}
                <Link to="/settings/profile" replace>
                    <Text id="app.settings.tips.account.b" />
                </Link>
            </Tip>
        </div>
    );
}
