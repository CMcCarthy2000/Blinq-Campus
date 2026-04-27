import {
    HelpCircle,
    ChevronUp,
    ChevronDown,
} from "@styled-icons/boxicons-solid";
import isEqual from "lodash.isequal";
import { observer } from "mobx-react-lite";
import { Server } from "revolt.js";
import { Text } from "preact-i18n";
import { useEffect, useMemo, useState } from "preact/hooks";

import {
    Button,
    PermissionsLayout,
    SpaceBetween,
    H1,
    Checkbox,
    ColourSwatches,
    InputBox,
    Category,
    Row,
} from "@revoltchat/ui";

import Tooltip from "../../../components/common/Tooltip";
import { PermissionList } from "../../../components/settings/roles/PermissionList";
import { RoleOrDefault } from "../../../components/settings/roles/RoleSelection";
import { useSession } from "../../../controllers/client/ClientController";
import { modalController } from "../../../controllers/modals/ModalController";

interface Props {
    server: Server;
}

const roleReorderContainerStyle = {
    margin: "16px 0",
} as const;

const roleItemStyle = {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    margin: "12px 0",
    background: "var(--secondary-background)",
    borderRadius: "var(--border-radius)",
} as const;

const roleInfoStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
} as const;

const roleNameStyle = {
    fontWeight: 600,
    color: "var(--foreground)",
} as const;

const roleRankStyle = {
    fontSize: 12,
    color: "var(--secondary-foreground)",
} as const;

const roleControlsStyle = {
    display: "flex",
    gap: "4px",
} as const;

const roleIdStyle = {
    gap: 4,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--tertiary-foreground)",
} as const;

const roleIdLinkStyle = {
    color: "var(--tertiary-foreground)",
} as const;

const deleteRoleButtonStyle = {
    margin: "16px 0",
} as const;

const reorderButtonStyle = {
    marginInline: "auto 8px",
} as const;

/**
 * Hook to memo-ize role information with proper ordering
 * @param server Target server
 * @returns Role array with default at bottom
 */
export function useRolesForReorder(server: Server) {
    return useMemo(() => {
        const roles = [...server.orderedRoles] as RoleOrDefault[];

        roles.push({
            id: "default",
            name: "Default",
            permissions: server.default_permissions,
        });

        return roles;
    }, [server.roles, server.default_permissions]);
}

/**
 * Role reordering component
 */
function RoleReorderPanelBase({
    server,
    onExit,
}: Props & { onExit: () => void }) {
    const session = useSession()!;

    const initialRoles = useRolesForReorder(server);
    const [roles, setRoles] = useState(initialRoles);
    const [isReordering, setIsReordering] = useState(false);

    // Update local state when server roles change
    useEffect(() => {
        setRoles(useRolesForReorder(server));
    }, [server.roles, server.default_permissions]);

    const moveRoleUp = (index: number) => {
        if (index === 0 || roles[index].id === "default") return;

        const newRoles = [...roles];
        [newRoles[index - 1], newRoles[index]] = [
            newRoles[index],
            newRoles[index - 1],
        ];
        setRoles(newRoles);
    };

    const moveRoleDown = (index: number) => {
        // Can't move down if it's the last non-default role or if it's default
        if (index >= roles.length - 2 || roles[index].id === "default") return;

        const newRoles = [...roles];
        [newRoles[index], newRoles[index + 1]] = [
            newRoles[index + 1],
            newRoles[index],
        ];
        setRoles(newRoles);
    };

    const saveReorder = async () => {
        setIsReordering(true);
        try {
            const nonDefaultRoles = roles.filter(
                (role) => role.id !== "default",
            );
            const roleIds = nonDefaultRoles.map((role) => role.id);

            const client = session.client!;

            // Make direct API request since it's not in r.js as of writing
            await client.api.patch(`/servers/${server._id}/roles/ranks`, {
                ranks: roleIds,
            } as any);

            console.log("Roles reordered successfully");
        } catch (error) {
            console.error("Failed to reorder roles:", error);
            setRoles(initialRoles);
        } finally {
            setIsReordering(false);
        }
    };

    const hasChanges = !isEqual(
        roles.filter((r) => r.id !== "default").map((r) => r.id),
        initialRoles.filter((r) => r.id !== "default").map((r) => r.id),
    );

    return (
        <div>
            <SpaceBetween>
                <H1>
                    <Text id="app.settings.permissions.role_ranking" />
                </H1>
                <Row>
                    <Button
                        palette="secondary"
                        onClick={onExit}
                        style={{ marginBottom: "16px" }}>
                        <Text id="app.special.modals.actions.back" />
                    </Button>
                    <Button
                        palette="secondary"
                        disabled={!hasChanges || isReordering}
                        onClick={saveReorder}>
                        <Text id="app.special.modals.actions.save" />
                    </Button>
                </Row>
            </SpaceBetween>

            <div style={roleReorderContainerStyle}>
                {roles.map((role, index) => (
                    <div key={role.id} style={roleItemStyle}>
                        <div style={roleInfoStyle}>
                            <div style={roleNameStyle}>{role.name}</div>
                            <div style={roleRankStyle}>
                                {role.id === "default" ? (
                                    <Text id="app.settings.permissions.default_desc" />
                                ) : (
                                    <>
                                        <Text id="app.settings.permissions.role_ranking" />{" "}
                                        {index}
                                    </>
                                )}
                            </div>
                        </div>

                        {role.id !== "default" && (
                            <div style={roleControlsStyle}>
                                <Button
                                    palette="secondary"
                                    style={{ padding: "4px 8px", minWidth: "auto" }}
                                    disabled={index === 0}
                                    onClick={() => moveRoleUp(index)}>
                                    <ChevronUp size={16} />
                                </Button>
                                <Button
                                    palette="secondary"
                                    style={{ padding: "4px 8px", minWidth: "auto" }}
                                    disabled={index >= roles.length - 2}
                                    onClick={() => moveRoleDown(index)}>
                                    <ChevronDown size={16} />
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const RoleReorderPanel = observer(RoleReorderPanelBase as any);

/**
 * Hook to memo-ize role information.
 * @param server Target server
 * @returns Role array
 */
export function useRoles(server: Server) {
    return useMemo(
        () =>
            [
                // Pull in known server roles.
                ...server.orderedRoles,
                // Include the default server permissions.
                {
                    id: "default",
                    name: "Default",
                    permissions: server.default_permissions,
                },
            ] as RoleOrDefault[],
        [server.roles, server.default_permissions],
    );
}

/**
 * Updated Roles settings menu with reordering panel
 */
const RolesBase = ({ server }: Props) => {
    const [showReorderPanel, setShowReorderPanel] = useState(false);

    // Consolidate all permissions that we can change right now.
    const currentRoles = useRoles(server);

    const renderRoleEditor = ({ selected }: { selected: string }) => {
        const currentRole = currentRoles.find((x) => x.id === selected);

        if (!currentRole) return null;

        const role = currentRole;

        const [value, setValue] = useState<Partial<RoleOrDefault>>({});

        const currentRoleValue = { ...role, ...value };

        function save() {
            const { permissions: permsCurrent, ...current } = role;
            const { permissions: permsValue, ...value } =
                currentRoleValue;

            if (!isEqual(permsCurrent, permsValue)) {
                server.setPermissions(
                    selected,
                    typeof permsValue === "number"
                        ? permsValue
                        : {
                              allow: permsValue.a,
                              deny: permsValue.d,
                          },
                );
            }

            if (!isEqual(current, value)) {
                server.editRole(selected, value);
            }
        }

        function deleteRole() {
            server.deleteRole(selected);
        }

        return (
            <div>
                <SpaceBetween>
                    <H1>
                        <Text
                            id="app.settings.actions.edit"
                            fields={{ name: currentRole.name }}
                        />
                    </H1>
                    <Button
                        palette="secondary"
                        style={reorderButtonStyle}
                        onClick={() => setShowReorderPanel(true)}>
                        <Text id="app.settings.permissions.role_ranking" />
                    </Button>
                    <Button
                        palette="secondary"
                        disabled={isEqual(
                            currentRole,
                            currentRoleValue,
                        )}
                        onClick={save}>
                        <Text id="app.special.modals.actions.save" />
                    </Button>
                </SpaceBetween>
                <hr />
                {selected !== "default" && (
                    <>
                        <section>
                            <Category>
                                <Text id="app.settings.permissions.role_name" />
                            </Category>
                            <p>
                                <InputBox
                                    value={currentRoleValue.name}
                                    onChange={(e: JSX.TargetedEvent<HTMLInputElement, Event>) =>
                                        setValue({
                                            ...value,
                                            name: e.currentTarget.value,
                                        })
                                    }
                                    palette="secondary"
                                />
                            </p>
                        </section>
                        <section>
                            <Category>{"Role ID"}</Category>
                            <div style={roleIdStyle}>
                                <Tooltip
                                    content={
                                        "This is a unique identifier for this role."
                                    }>
                                    <HelpCircle size={16} />
                                </Tooltip>
                                <Tooltip
                                    content={(<Text id="app.special.copy" />) as any}>
                                    <a
                                        style={roleIdLinkStyle}
                                        onClick={() =>
                                            modalController.writeText(
                                                currentRole.id,
                                            )
                                        }>
                                        {currentRole.id}
                                    </a>
                                </Tooltip>
                            </div>
                        </section>
                        <section>
                            <Category>
                                <Text id="app.settings.permissions.role_colour" />
                            </Category>
                            <p>
                                <ColourSwatches
                                    value={
                                        currentRoleValue.colour ?? "gray"
                                    }
                                    onChange={(colour) =>
                                        setValue({
                                            ...value,
                                            colour,
                                        })
                                    }
                                />
                            </p>
                        </section>
                        <section>
                            <Category>
                                <Text id="app.settings.permissions.role_options" />
                            </Category>
                            <p>
                                <Checkbox
                                    value={currentRoleValue.hoist ?? false}
                                    onChange={(hoist) =>
                                        setValue({
                                            ...value,
                                            hoist,
                                        })
                                    }
                                    title={
                                        (<Text id="app.settings.permissions.hoist_role" />) as any
                                    }
                                    description={
                                        (<Text id="app.settings.permissions.hoist_desc" />) as any
                                    }
                                />
                            </p>
                        </section>
                    </>
                )}
                <h1>
                    <Text id="app.settings.permissions.edit_title" />
                </h1>
                <PermissionList
                    value={currentRoleValue.permissions}
                    onChange={(permissions) =>
                        setValue({
                            ...value,
                            permissions,
                        } as RoleOrDefault)
                    }
                    target={server}
                />
                {selected !== "default" && (
                    <>
                        <hr />
                        <h1>
                            <Text id="app.settings.categories.danger_zone" />
                        </h1>
                        <Button
                            palette="error"
                            compact
                            style={deleteRoleButtonStyle}
                            onClick={deleteRole}>
                            <Text id="app.settings.permissions.delete_role" />
                        </Button>
                    </>
                )}
            </div>
        );
    };

    if (showReorderPanel) {
        return (
            <div>
                <RoleReorderPanel
                    server={server}
                    onExit={() => setShowReorderPanel(false)}
                />
            </div>
        );
    }

    return (
        <div>
            <PermissionsLayout
                server={server}
                rank={server.member?.ranking ?? Infinity}
                onCreateRole={(callback) =>
                    modalController.push({
                        type: "create_role",
                        server,
                        callback,
                    })
                }
                editor={renderRoleEditor as any}
            />
        </div>
    );
};

export const Roles = observer(RolesBase as any);
