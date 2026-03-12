import { Wrench } from "@styled-icons/boxicons-solid";

import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useHistory } from "react-router-dom";
import { decodeTime } from "ulid";

import { Button } from "@revoltchat/ui";


import { PageHeader } from "../../components/ui/Header";
import { useClient } from "../../controllers/client/ClientController";
import { getDisplayName } from "../../lib/userDisplay";
import UserIcon from "../../components/common/user/UserIcon";
import Message from "../../components/common/messaging/Message";
import { Message as MessageI } from "revolt.js";
import MessageBase, {
    MessageContent,
    MessageDetail,
    MessageInfo,
} from "../../components/common/messaging/MessageBase";
import { Username } from "../../components/common/user/UserShort";

type AdminTool = {
    id: string;
    label: string;
    url: string;
};

type AdminUserEntry = {
    _id: string;
    username: string;
    display_name?: string;
    email?: string;
};

type AdminDmSummary = {
    channel_id: string;
    user_a_id: string;
    user_a_name: string;
    user_a_avatar?: any;
    user_b_id: string;
    user_b_name: string;
    user_b_avatar?: any;
    last_message_id?: string | null;
    last_message_preview?: string | null;
};

type DmAuditEntry = {
    id?: string;
    _id?: string;
    action: string;
    occurred_at: string;
    actor_id: string;
    channel_id: string;
    message_id: string;
    recipients: string[];
    author_id: string;
    old_content?: string | null;
    new_content?: string | null;
};

const ADMIN_TOOLS: AdminTool[] = [
    {
        id: "rabbitmq",
        label: "RabbitMQ",
        url: import.meta.env.VITE_RABBITMQ_URL ?? "",
    },
    {
        id: "admin_api",
        label: "Admin API",
        url: import.meta.env.VITE_ADMIN_API_URL ?? "",
    },
    {
        id: "api_docs",
        label: "API Docs",
        url: import.meta.env.VITE_API_DOCS_URL ?? "",
    },
].filter((tool) => tool.url.length > 0);

export default function Developer() {
    const client = useClient();
    const history = useHistory();
    const [ping, setPing] = useState<undefined | number>(client.websocket.ping);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [audits, setAudits] = useState<DmAuditEntry[]>([]);
    const [dmSummaries, setDmSummaries] = useState<AdminDmSummary[]>([]);
    const [dmSearch, setDmSearch] = useState("");
    const [loadingDms, setLoadingDms] = useState(false);
    const [selectedDm, setSelectedDm] = useState<AdminDmSummary | null>(null);
    const [dmMessages, setDmMessages] = useState<any[]>([]);
    const [dmUsers, setDmUsers] = useState<Record<string, any>>({});
    const [loadingDmMessages, setLoadingDmMessages] = useState(false);
    const [dmImageFilter, setDmImageFilter] = useState<"all" | "flagged">(
        "all",
    );
    const [activeToolId, setActiveToolId] = useState<string | null>("dm");
    const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(
        "dm",
    );
    const [adminUsers, setAdminUsers] = useState<AdminUserEntry[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const dmPollInFlight = useRef(false);

    useEffect(() => {
        const timer = setInterval(
            () => setPing(client.websocket.ping),
            client.options.heartbeat * 1e3,
        );

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!client.user?.privileged) return;

        const fetchAuditData = () => {
            client.api
                .get("/admin/alerts/messages?limit=100")
                .then(setAlerts)
                .catch(() => setAlerts([]));
            client.api
                .get("/admin/dm-audit?limit=200")
                .then((data) => setAudits(data as DmAuditEntry[]))
                .catch(() => setAudits([]));
        };

        fetchAuditData();
        const interval = setInterval(fetchAuditData, 5000);
        return () => clearInterval(interval);
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

    const loadDmMessages = (silent = false) => {
        if (!client.user?.privileged || !selectedDm) return;
        if (dmPollInFlight.current) return;
        dmPollInFlight.current = true;

        if (!silent) {
            setLoadingDmMessages(true);
        }

        client.api
            .get(
                `/admin/dms/${selectedDm.channel_id}/messages?limit=100&sort=Latest&include_users=true`,
            )
            .then((payload) => {
                if (Array.isArray(payload)) {
                    setDmMessages(payload.slice().reverse());
                    setDmUsers({});
                    return;
                }

                const messages = payload.messages ?? [];
                const users = payload.users ?? [];
                const map: Record<string, any> = {};
                for (const u of users) {
                    map[u._id] = u;
                    try {
                        client.users.createObj(u);
                    } catch (err) {
                        console.warn("Failed to cache user:", err);
                    }
                }
                setDmUsers(map);
                setDmMessages(messages.slice().reverse());
            })
            .catch((err) => {
                console.error("Failed to fetch DM messages:", err);
                setDmMessages([]);
                setDmUsers({});
            })
            .finally(() => {
                if (!silent) {
                    setLoadingDmMessages(false);
                }
                dmPollInFlight.current = false;
            });
    };

    useEffect(() => {
        loadDmMessages(false);
    }, [client.user?._id, selectedDm]);

    useEffect(() => {
        setDmImageFilter("all");
    }, [selectedDm?.channel_id]);

    useEffect(() => {
        if (!selectedDm) return;
        const interval = setInterval(() => {
            loadDmMessages(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedDm]);

    useEffect(() => {
        if (!client.user?.privileged) return;
        setLoadingUsers(true);
        setUsersError(null);

        client.api
            .get("/admin/users?limit=5000")
            .then((data) => {
                setAdminUsers(data as AdminUserEntry[]);
            })
            .catch((err) => {
                console.error("Failed to fetch users:", err);
                setUsersError("Failed to fetch users");
            })
            .finally(() => setLoadingUsers(false));
    }, [client.user?._id]);

    if (!client.user?.privileged) {
        return (
            <div style={{ padding: "16px" }}>
                <PageHeader icon={<Wrench size="24" />}>Admin</PageHeader>
                Access denied.
            </div>
        );
    }

    const selectedDmAudits = selectedDm
        ? audits.filter((entry) => entry.channel_id === selectedDm.channel_id)
        : [];
    const deletedMessageAudits = selectedDmAudits.filter(
        (entry) => entry.action === "delete",
    );

    const lookupUser = (userId?: string | null) => {
        if (!userId) return undefined;
        return dmUsers[userId] ?? client.users.get(userId);
    };

    const formatAuditTime = (value?: string | null) => {
        if (!value) return "Unknown time";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    };

    const mergedDmEntries = useMemo(() => {
        if (!selectedDm) return [];

        const entries: Array<
            | {
                  kind: "message";
                  id: string;
                  time: number;
                  message: any;
              }
            | {
                  kind: "deleted";
                  id: string;
                  time: number;
                  entry: DmAuditEntry;
              }
        > = [];

        for (const message of dmMessages) {
            let time = 0;
            try {
                time = decodeTime(message._id);
            } catch (err) {
                time = 0;
            }

            entries.push({
                kind: "message",
                id: message._id,
                time,
                message,
            });
        }

        for (const entry of deletedMessageAudits) {
            const entryId =
                entry.id ??
                entry._id ??
                `${entry.message_id}-${entry.occurred_at}`;
            let time = 0;
            try {
                time = decodeTime(entry.message_id);
            } catch (err) {
                const parsed = Date.parse(entry.occurred_at);
                time = Number.isNaN(parsed) ? 0 : parsed;
            }

            entries.push({
                kind: "deleted",
                id: `deleted-${entry.message_id}-${entryId}`,
                time,
                entry,
            });
        }

        entries.sort((a, b) => a.time - b.time);
        return entries;
    }, [dmMessages, deletedMessageAudits, selectedDm]);

    const messageHasFlaggedImage = (message: any) => {
        const attachments = message?.attachments ?? [];
        return attachments.some((attachment: any) => {
            const moderation = attachment?.image_moderation;
            return moderation?.nsfw || moderation?.profanity;
        });
    };

    const getMessageModerationLabels = (message: any) => {
        const attachments = message?.attachments ?? [];
        const labels = new Set<string>();
        for (const attachment of attachments) {
            const moderation = attachment?.image_moderation;
            if (!moderation) continue;
            if (moderation.nsfw) {
                labels.add(
                    moderation.nsfw_label
                        ? `NSFW (${moderation.nsfw_label})`
                        : "NSFW",
                );
            }
            if (moderation.profanity) {
                labels.add("Profanity");
            }
        }
        return Array.from(labels);
    };

    const filteredDmEntries = useMemo(() => {
        if (dmImageFilter === "all") return mergedDmEntries;
        return mergedDmEntries.filter(
            (entry) =>
                entry.kind === "message" && messageHasFlaggedImage(entry.message),
        );
    }, [dmImageFilter, mergedDmEntries]);

    const renderDeletedMessage = (entry: DmAuditEntry) => {
        const author = lookupUser(entry.author_id);
        const messageLike = { _id: entry.message_id, edited: null } as any;
        const content =
            entry.old_content ?? "(deleted message had no text)";

        return (
            <MessageBase
                head
                highlight={false}
                contrast={false}
                sending={false}
                mention={undefined}
                failed={false}>
                <MessageInfo click={false}>
                    <UserIcon
                        className="avatar"
                        target={author}
                        size={36}
                        showServerIdentity
                    />
                </MessageInfo>
                <MessageContent>
                    <span className="detail">
                        <Username
                            user={author}
                            className="author"
                            showServerIdentity
                        />
                        <MessageDetail message={messageLike} position="top" />
                    </span>
                    <span style={{ color: "var(--error)" }}>{content}</span>
                </MessageContent>
            </MessageBase>
        );
    };

    async function openDmWithUser(userId: string) {
        try {
            const channel = await client.api.get(`/users/${userId}/dm`);
            const channelId = channel?._id ?? channel?.id;
            if (channelId) {
                history.push(`/channel/${channelId}`);
            }
        } catch (err) {
            console.error("Failed to open DM:", err);
            setUsersError("Failed to open DM");
        }
    }

    const activeTool =
        ADMIN_TOOLS.find((tool) => tool.id === activeToolId) ?? null;

    const cardStyle = {
        border: "1px solid var(--secondary-background)",
        borderRadius: "12px",
        padding: "12px",
        background: "var(--background)",
    } as const;

    const sidebarButtonStyle = (isActive: boolean) =>
        ({
            border: isActive
                ? "1px solid var(--accent)"
                : "1px solid transparent",
            background: isActive
                ? "var(--secondary-background)"
                : "transparent",
        }) as const;

    return (
        <div>
            <PageHeader icon={<Wrench size="24" />}>Admin</PageHeader>
            <div
                style={{
                    padding: "16px",
                    display: "grid",
                    gap: "16px",
                    gridTemplateColumns: "minmax(0, 1fr) 260px",
                    alignItems: "start",
                }}>
                <div style={{ minWidth: 0, display: "grid", gap: "16px" }}>
                    <div style={cardStyle}>
                        <b>Classroom Service Ping:</b> {ping ?? "?"}ms
                    </div>
                    {activeToolId === "dm" ? (
                        <div id="dm-inspector" style={cardStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}>
                                <b>DM Inspector</b>
                                {selectedDm && (
                                    <Button
                                        onClick={() => {
                                            setSelectedDm(null);
                                            setDmMessages([]);
                                            setDmUsers({});
                                        }}>
                                        Back to DM Inspector
                                    </Button>
                                )}
                            </div>
                            <div
                                style={{
                                    marginTop: "10px",
                                    height: "520px",
                                    border: "1px solid var(--secondary-background)",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    background: "var(--secondary-background)",
                                }}>
                                <div
                                    style={{
                                        height: "100%",
                                        overflowY: "auto",
                                        padding: "12px",
                                        background: "var(--background)",
                                    }}>
                                    {selectedDm ? (
                                        <>
                                            <div style={{ marginBottom: "12px" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: "12px",
                                                        flexWrap: "wrap",
                                                    }}>
                                                    <b>
                                                        {selectedDm.user_a_name} and{" "}
                                                        {selectedDm.user_b_name}
                                                    </b>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                        }}>
                                                        <Button
                                                            onClick={() =>
                                                                setDmImageFilter(
                                                                    "all",
                                                                )
                                                            }
                                                            size="small"
                                                            subtle={
                                                                dmImageFilter !==
                                                                "all"
                                                            }>
                                                            All messages
                                                        </Button>
                                                        <Button
                                                            onClick={() =>
                                                                setDmImageFilter(
                                                                    "flagged",
                                                                )
                                                            }
                                                            size="small"
                                                            subtle={
                                                                dmImageFilter !==
                                                                "flagged"
                                                            }>
                                                            Flagged images
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            {loadingDmMessages ? (
                                                <div>Loading messages…</div>
                                            ) : (
                                                <div>
                                                    {filteredDmEntries.map(
                                                        (entry) => {
                                                            if (
                                                                entry.kind ===
                                                                "deleted"
                                                            ) {
                                                                return (
                                                                    <div
                                                                        key={
                                                                            entry.id
                                                                        }>
                                                                        {renderDeletedMessage(
                                                                            entry.entry,
                                                                        )}
                                                                    </div>
                                                                );
                                                            }

                                                            const instance =
                                                                new MessageI(
                                                                    client,
                                                                    entry.message,
                                                                );

                                                            const labels =
                                                                getMessageModerationLabels(
                                                                    entry.message,
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        entry.id
                                                                    }>
                                                                    {labels.length >
                                                                        0 && (
                                                                        <div
                                                                            style={{
                                                                                margin:
                                                                                    "6px 0",
                                                                                fontSize:
                                                                                    "0.75rem",
                                                                                opacity:
                                                                                    0.75,
                                                                                textTransform:
                                                                                    "uppercase",
                                                                                letterSpacing:
                                                                                    "0.04em",
                                                                            }}>
                                                                            {labels.join(
                                                                                " · ",
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <Message
                                                                        message={
                                                                            instance as any
                                                                        }
                                                                        attachContext={
                                                                            false
                                                                        }
                                                                        head
                                                                        readOnly
                                                                    />
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                placeholder="Search users, or %(text) to search DM content"
                                                value={dmSearch}
                                                onInput={(event) =>
                                                    setDmSearch(
                                                        (
                                                            event.target as HTMLInputElement
                                                        ).value,
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    maxWidth: "680px",
                                                    padding: "10px 12px",
                                                    borderRadius: "10px",
                                                    border: "1px solid var(--accent)",
                                                    background:
                                                        "var(--secondary-background)",
                                                    color: "var(--foreground)",
                                                    outline: "none",
                                                }}
                                            />
                                            <br />
                                            <small>
                                                Example:{" "}
                                                <code>
                                                    Gabriel Alex %(assignment overdue)
                                                </code>
                                            </small>
                                            <div style={{ marginTop: "12px" }}>
                                                <b>
                                                    Results ({dmSummaries.length})
                                                    {loadingDms
                                                        ? " - loading..."
                                                        : ""}
                                                </b>
                                                <div
                                                    style={{
                                                        marginTop: "8px",
                                                        border:
                                                            "1px solid var(--secondary-background)",
                                                        borderRadius: "12px",
                                                        padding: "10px",
                                                        background:
                                                            "var(--background)",
                                                    }}>
                                                    <div
                                                        style={{
                                                            display: "grid",
                                                            gap: "8px",
                                                        }}>
                                                        {dmSummaries.map(
                                                            (entry) => (
                                                                <button
                                                                    key={
                                                                        entry.channel_id
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedDm(
                                                                            entry,
                                                                        )
                                                                    }
                                                                    style={{
                                                                        textAlign:
                                                                            "left",
                                                                        background:
                                                                            "transparent",
                                                                        border:
                                                                            "1px solid var(--secondary-background)",
                                                                        borderRadius:
                                                                            "8px",
                                                                        padding:
                                                                            "10px",
                                                                        cursor:
                                                                            "pointer",
                                                                        color:
                                                                            "inherit",
                                                                        display:
                                                                            "flex",
                                                                        gap: "10px",
                                                                        alignItems:
                                                                            "center",
                                                                    }}>
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                        }}>
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                            }}>
                                                                            <UserIcon
                                                                                size={
                                                                                    28
                                                                                }
                                                                                attachment={
                                                                                    entry.user_a_avatar
                                                                                }
                                                                            />
                                                                            <UserIcon
                                                                                size={
                                                                                    28
                                                                                }
                                                                                attachment={
                                                                                    entry.user_b_avatar
                                                                                }
                                                                                style={{
                                                                                    marginLeft:
                                                                                        "-8px",
                                                                                    border:
                                                                                        "2px solid var(--background)",
                                                                                    borderRadius:
                                                                                        "50%",
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            flex: 1,
                                                                        }}>
                                                                        <div>
                                                                            <b>
                                                                                {
                                                                                    entry.user_a_name
                                                                                }{" "}
                                                                                and{" "}
                                                                                {
                                                                                    entry.user_b_name
                                                                                }
                                                                            </b>
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                marginTop:
                                                                                    "4px",
                                                                                opacity:
                                                                                    0.85,
                                                                                overflow:
                                                                                    "hidden",
                                                                                textOverflow:
                                                                                    "ellipsis",
                                                                            }}>
                                                                            {entry.last_message_preview ??
                                                                                "(no message content)"}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div style={{ marginTop: "16px" }}>
                                        <b>Message Alerts ({alerts.length})</b>
                                        {alerts.length === 0 ? (
                                            <div
                                                style={{
                                                    marginTop: "6px",
                                                    opacity: 0.75,
                                                }}>
                                                No message alerts yet.
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    marginTop: "8px",
                                                    display: "grid",
                                                    gap: "8px",
                                                }}>
                                                {alerts.slice(0, 25).map(
                                                    (entry, index) => (
                                                        <div
                                                            key={
                                                                entry.id ??
                                                                `${index}`
                                                            }
                                                            style={{
                                                                border:
                                                                    "1px solid var(--secondary-background)",
                                                                borderRadius:
                                                                    "8px",
                                                                padding: "8px",
                                                                background:
                                                                    "var(--background)",
                                                            }}>
                                                            <div
                                                                style={{
                                                                    fontWeight:
                                                                        600,
                                                                }}>
                                                                {entry.title ??
                                                                    "Alert"}
                                                            </div>
                                                            {entry.reason && (
                                                                <div
                                                                    style={{
                                                                        marginTop:
                                                                            "4px",
                                                                        opacity:
                                                                            0.8,
                                                                    }}>
                                                                    {entry.reason}
                                                                </div>
                                                            )}
                                                            <pre
                                                                style={{
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                    marginTop:
                                                                        "6px",
                                                                    opacity:
                                                                        0.75,
                                                                    fontSize:
                                                                        "0.75rem",
                                                                }}>
                                                                {JSON.stringify(
                                                                    entry,
                                                                    null,
                                                                    2,
                                                                )}
                                                            </pre>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ marginTop: "16px" }}>
                                        <b>DM Audit ({selectedDmAudits.length})</b>
                                        {selectedDm ? (
                                            selectedDmAudits.length === 0 ? (
                                                <div
                                                    style={{
                                                        marginTop: "6px",
                                                        opacity: 0.75,
                                                    }}>
                                                    No audit entries for this DM.
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        marginTop: "8px",
                                                        display: "grid",
                                                        gap: "8px",
                                                    }}>
                                                    {selectedDmAudits
                                                        .slice(0, 50)
                                                        .map((entry) => {
                                                            const auditId =
                                                                entry.id ??
                                                                entry._id ??
                                                                `${entry.message_id}-${entry.occurred_at}`;
                                                            const actor =
                                                                lookupUser(
                                                                    entry.actor_id,
                                                                );
                                                            const author =
                                                                lookupUser(
                                                                    entry.author_id,
                                                                );
                                                            return (
                                                                <div
                                                                    key={auditId}
                                                                    style={{
                                                                        border:
                                                                            "1px solid var(--secondary-background)",
                                                                        borderRadius:
                                                                            "8px",
                                                                        padding:
                                                                            "8px",
                                                                        background:
                                                                            "var(--background)",
                                                                    }}>
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexWrap:
                                                                                "wrap",
                                                                            gap:
                                                                                "8px 16px",
                                                                        }}>
                                                                        <span
                                                                            style={{
                                                                                fontWeight:
                                                                                    600,
                                                                                textTransform:
                                                                                    "capitalize",
                                                                            }}>
                                                                            {entry.action}
                                                                        </span>
                                                                        <span
                                                                            style={{
                                                                                opacity:
                                                                                    0.75,
                                                                            }}>
                                                                            {formatAuditTime(
                                                                                entry.occurred_at,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                "6px",
                                                                            display:
                                                                                "grid",
                                                                            gap:
                                                                                "4px",
                                                                            fontSize:
                                                                                "0.85rem",
                                                                        }}>
                                                                        <div>
                                                                            Actor:{" "}
                                                                            <b>
                                                                                {getDisplayName(
                                                                                    actor,
                                                                                ) ??
                                                                                    entry.actor_id}
                                                                            </b>
                                                                        </div>
                                                                        <div>
                                                                            Author:{" "}
                                                                            <b>
                                                                                {getDisplayName(
                                                                                    author,
                                                                                ) ??
                                                                                    entry.author_id}
                                                                            </b>
                                                                        </div>
                                                                        {entry.old_content && (
                                                                            <div>
                                                                                Old:{" "}
                                                                                <span>
                                                                                    {
                                                                                        entry.old_content
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {entry.new_content && (
                                                                            <div>
                                                                                New:{" "}
                                                                                <span>
                                                                                    {
                                                                                        entry.new_content
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )
                                        ) : (
                                            <div
                                                style={{
                                                    marginTop: "6px",
                                                    opacity: 0.75,
                                                }}>
                                                Select a DM to see audit entries.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeToolId === "people" ? (
                        <div style={cardStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}>
                                <b>People</b>
                            </div>
                            <div
                                style={{
                                    marginTop: "10px",
                                    height: "520px",
                                    border: "1px solid var(--secondary-background)",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    background: "var(--secondary-background)",
                                }}>
                                <div
                                    style={{
                                        height: "100%",
                                        overflowY: "auto",
                                        padding: "12px",
                                        background: "var(--background)",
                                    }}>
                                    {usersError && (
                                        <div
                                            style={{
                                                color: "var(--error)",
                                                marginBottom: "8px",
                                            }}>
                                            {usersError}
                                        </div>
                                    )}
                                    <div style={{ marginBottom: "12px" }}>
                                        <b>
                                            Teachers
                                            {loadingUsers ? " (loading…)" : ""}
                                        </b>
                                        <div style={{ marginTop: "8px" }}>
                                            {adminUsers
                                                .filter((entry) =>
                                                    entry.email
                                                        ?.toLowerCase()
                                                        .endsWith(
                                                            "@wgmail.org",
                                                        ),
                                                )
                                                .map((entry) => (
                                                    <div
                                                        key={entry._id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: "12px",
                                                            padding: "8px",
                                                            border:
                                                                "1px solid var(--secondary-background)",
                                                            borderRadius: "8px",
                                                            marginBottom: "6px",
                                                        }}>
                                                        <div>
                                                            <div>
                                                                <b>
                                                                    {entry.display_name ??
                                                                        entry.username}
                                                                </b>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    opacity: 0.8,
                                                                    fontSize:
                                                                        "0.85rem",
                                                                }}>
                                                                {entry.email ??
                                                                    "No email"}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() =>
                                                                openDmWithUser(
                                                                    entry._id,
                                                                )
                                                            }>
                                                            Message
                                                        </Button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                    <div>
                                        <b>Students</b>
                                        <div style={{ marginTop: "8px" }}>
                                            {adminUsers
                                                .filter((entry) =>
                                                    entry.email
                                                        ?.toLowerCase()
                                                        .endsWith(
                                                            "@wgcloud.org",
                                                        ),
                                                )
                                                .map((entry) => (
                                                    <div
                                                        key={entry._id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: "12px",
                                                            padding: "8px",
                                                            border:
                                                                "1px solid var(--secondary-background)",
                                                            borderRadius: "8px",
                                                            marginBottom: "6px",
                                                            opacity: 0.9,
                                                        }}>
                                                        <div>
                                                            <div>
                                                                <b>
                                                                    {entry.display_name ??
                                                                        entry.username}
                                                                </b>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    opacity: 0.8,
                                                                    fontSize:
                                                                        "0.85rem",
                                                                }}>
                                                                {entry.email ??
                                                                    "No email"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTool ? (
                        <div style={cardStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}>
                                <b>{activeTool.label}</b>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Button
                                        onClick={() =>
                                            window.open(
                                                activeTool.url,
                                                "_blank",
                                                "noopener,noreferrer",
                                            )
                                        }>
                                        Open in new tab
                                    </Button>
                                </div>
                            </div>
                            <div
                                style={{
                                    marginTop: "10px",
                                    height: "520px",
                                    border: "1px solid var(--secondary-background)",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    background: "var(--secondary-background)",
                                }}>
                                <iframe
                                    title={activeTool.label}
                                    src={activeTool.url}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: 0,
                                    }}
                                />
                            </div>
                        </div>
                    ) : ADMIN_TOOLS.length ? (
                        <div style={cardStyle}>
                            <b>Admin Tools</b>
                            <div style={{ marginTop: "8px", opacity: 0.8 }}>
                                Select a tool from the right to open it here.
                            </div>
                        </div>
                    ) : (
                        <div style={cardStyle}>
                            <b>Admin Tools</b>
                            <div style={{ marginTop: "8px", opacity: 0.8 }}>
                                Set `VITE_RABBITMQ_URL`, `VITE_ADMIN_API_URL`, or
                                `VITE_API_DOCS_URL` to enable tool buttons.
                            </div>
                        </div>
                    )}
                </div>
                <aside
                    style={{
                        position: "sticky",
                        top: "16px",
                        display: "grid",
                        gap: "8px",
                        border: "1px solid var(--secondary-background)",
                        borderRadius: "12px",
                        padding: "12px",
                        background: "var(--background)",
                    }}>
                    <b>Admin Tools</b>
                    <Button
                        style={sidebarButtonStyle(activeSidebarItem === "dm")}
                        onClick={() => {
                            setActiveToolId("dm");
                            setActiveSidebarItem("dm");
                        }}>
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                                width: "100%",
                            }}>
                            <span>DM Inspector</span>
                            <span
                                style={{
                                    minWidth: "24px",
                                    padding: "2px 6px",
                                    borderRadius: "999px",
                                    background:
                                        alerts.length === 0
                                            ? "rgba(58, 166, 112, 0.2)"
                                            : "var(--error)",
                                    color:
                                        alerts.length === 0
                                            ? "var(--success, #3a8f5a)"
                                            : "var(--foreground)",
                                    fontSize: "0.75rem",
                                    textAlign: "center",
                                }}>
                                {alerts.length}
                            </span>
                        </span>
                    </Button>
                    <Button
                        style={sidebarButtonStyle(
                            activeSidebarItem === "people",
                        )}
                        onClick={() => {
                            setActiveToolId("people");
                            setActiveSidebarItem("people");
                        }}>
                        People
                    </Button>
                    {ADMIN_TOOLS.length ? (
                        ADMIN_TOOLS.map((tool) => (
                            <Button
                                key={tool.id}
                                style={sidebarButtonStyle(
                                    activeSidebarItem === tool.id,
                                )}
                                onClick={() => {
                                    setActiveToolId(tool.id);
                                    setActiveSidebarItem(tool.id);
                                }}>
                                {tool.label}
                            </Button>
                        ))
                    ) : (
                        <div style={{ opacity: 0.7 }}>
                            No tools configured.
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
