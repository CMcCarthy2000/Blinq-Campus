import { Wrench } from "@styled-icons/boxicons-solid";

import { useEffect, useState } from "preact/hooks";
import { useHistory } from "react-router-dom";

import { Button } from "@revoltchat/ui";

import PaintCounter from "../../lib/PaintCounter";

import { PageHeader } from "../../components/ui/Header";
import { useClient } from "../../controllers/client/ClientController";

export default function Developer() {
    const client = useClient();
    const history = useHistory();
    const [ping, setPing] = useState<undefined | number>(client.websocket.ping);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [audits, setAudits] = useState<any[]>([]);
    const [dmSummaries, setDmSummaries] = useState<any[]>([]);
    const [dmSearch, setDmSearch] = useState("");
    const [loadingDms, setLoadingDms] = useState(false);

    useEffect(() => {
        const timer = setInterval(
            () => setPing(client.websocket.ping),
            client.options.heartbeat * 1e3,
        );

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!client.user?.privileged) return;

        client.api
            .get("/admin/alerts/messages?limit=100")
            .then(setAlerts)
            .catch(() => setAlerts([]));
        client.api
            .get("/admin/dm-audit?limit=100")
            .then(setAudits)
            .catch(() => setAudits([]));
    }, [client.user?._id]);

    useEffect(() => {
        if (!client.user?.privileged) return;
        setLoadingDms(true);

        const timeout = setTimeout(() => {
            const query = dmSearch
                ? `?q=${encodeURIComponent(dmSearch)}&limit=500`
                : "?limit=500";

            client.api
                .get(`/admin/dms/summary${query}`)
                .then(setDmSummaries)
                .catch(() => setDmSummaries([]))
                .finally(() => setLoadingDms(false));
        }, 180);

        return () => clearTimeout(timeout);
    }, [client.user?._id, dmSearch]);

    if (!client.user?.privileged) {
        return (
            <div style={{ padding: "16px" }}>
                <PageHeader icon={<Wrench size="24" />}>Admin</PageHeader>
                Access denied.
            </div>
        );
    }

    function openChannel(channelId: string) {
        history.push(`/channel/${channelId}`);
    }

    return (
        <div>
            <PageHeader icon={<Wrench size="24" />}>Admin</PageHeader>
            <div style={{ padding: "16px" }}>
                <PaintCounter always />
            </div>
            <div style={{ padding: "16px" }}>
                <b>Classroom Service Ping:</b> {ping ?? "?"}ms
            </div>
            <div style={{ padding: "16px" }}>
                <b>DM Inspector:</b>
                <br />
                <input
                    placeholder="Search users, or %(text) to search DM content"
                    value={dmSearch}
                    onInput={(event) =>
                        setDmSearch((event.target as HTMLInputElement).value)
                    }
                    style={{
                        width: "100%",
                        maxWidth: "680px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--accent)",
                        background: "var(--secondary-background)",
                        color: "var(--foreground)",
                        outline: "none",
                    }}
                />
                <br />
                <small>
                    Example: <code>Gabriel Alex %(assignment overdue)</code>
                </small>
                <div style={{ marginTop: "12px" }}>
                    <b>
                        Results ({dmSummaries.length})
                        {loadingDms ? " - loading..." : ""}
                    </b>
                    <div
                        style={{
                            marginTop: "8px",
                            maxWidth: "860px",
                            maxHeight: "420px",
                            overflowY: "auto",
                            border: "1px solid var(--secondary-background)",
                            borderRadius: "12px",
                            padding: "10px",
                            background: "var(--background)",
                        }}>
                        <div style={{ display: "grid", gap: "8px" }}>
                            {dmSummaries.map((entry) => (
                                <button
                                    key={entry.channel_id}
                                    onClick={() => openChannel(entry.channel_id)}
                                    style={{
                                        textAlign: "left",
                                        background: "transparent",
                                        border: "1px solid var(--secondary-background)",
                                        borderRadius: "8px",
                                        padding: "10px",
                                        cursor: "pointer",
                                        color: "inherit",
                                    }}>
                                    <div>
                                        <b>
                                            {entry.user_a_name} and {entry.user_b_name}
                                        </b>
                                    </div>
                                    <div
                                        style={{
                                            marginTop: "4px",
                                            opacity: 0.85,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}>
                                        {entry.last_message_preview ??
                                            "(no message content)"}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div style={{ padding: "16px" }}>
                <b>Message Alerts ({alerts.length})</b>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(alerts.slice(0, 25), null, 2)}
                </pre>
            </div>
            <div style={{ padding: "16px" }}>
                <b>DM Audit ({audits.length})</b>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(audits.slice(0, 25), null, 2)}
                </pre>
            </div>
        </div>
    );
}
