import styles from "../Login.module.scss";
import { Text } from "preact-i18n";

import { Button, Tip } from "@revoltchat/ui";

interface Props {
    email?: string;
}

const RECOMMENDED_DOMAINS = ["wgcloud.org", "wgmail.org", "chivanet.org"];

function getDomain(email?: string): string | undefined {
    if (!email) return;
    const parts = email.split("@");
    return parts.length === 2 ? parts[1].toLowerCase() : undefined;
}

function mapMailProvider(email?: string): [string, string] | undefined {
    if (!email) return;

    const domain = getDomain(email);
    if (!domain) return;

    switch (domain) {
        case "chivanet.org":
            return ["Chivanet", "https://mail.chivanet.org"];
        case "wgmail.org":
        case "wgcloud.org":
        case "gmail.com":
        case "googlemail.com":
            return ["Gmail", "https://gmail.com"];
        case "hotmail.com":
        case "aol.com":
        case "aim.com":
            return ["AOL Mail", "https://mail.aol.com/"];
        case "icloud.com":
            return ["iCloud Mail", "https://mail.icloud.com/"];
        case "mail.com":
        case "email.com":
            return ["mail.com", "https://www.mail.com/mail/"];
        default:
            return [domain, `https://${domain}`];
    }
}

export function MailProvider({ email }: Props) {
    const provider = mapMailProvider(email);
    if (!provider) return null;

    const domain = getDomain(email);
    const isRecommended = domain ? RECOMMENDED_DOMAINS.includes(domain) : false;

    return (
        <div className={styles.mailProvider}>
            <a href={provider[1]} target="_blank" rel="noreferrer">
                <Button>
                    <Text
                        id="login.open_mail_provider"
                        fields={{ provider: provider[0] }}
                    />
                </Button>
            </a>

            {!isRecommended && (
                <Tip palette="error">
                    <span>
                        Please note that if you are on a district issued device
                        you might not be able to view the verification email. To
                        get around this please register the account on a
                        personal device and log in on the district device after
                        verifying your account.
                    </span>
                </Tip>
            )}
        </div>
    );
}
