export const UserPermission = {
    Access: 1 << 0,
    ViewProfile: 1 << 1,
    SendMessage: 1 << 2,
    Invite: 1 << 3,
} as const;

export const Permission = {
    ManageChannel: 2 ** 0,
    ManageServer: 2 ** 1,
    ManagePermissions: 2 ** 2,
    ManageRole: 2 ** 3,
    ManageCustomisation: 2 ** 4,
    KickMembers: 2 ** 6,
    BanMembers: 2 ** 7,
    TimeoutMembers: 2 ** 8,
    AssignRoles: 2 ** 9,
    ChangeNickname: 2 ** 10,
    ManageNicknames: 2 ** 11,
    ChangeAvatar: 2 ** 12,
    RemoveAvatars: 2 ** 13,
    ViewChannel: 2 ** 20,
    ReadMessageHistory: 2 ** 21,
    SendMessage: 2 ** 22,
    ManageMessages: 2 ** 23,
    ManageWebhooks: 2 ** 24,
    InviteOthers: 2 ** 25,
    SendEmbeds: 2 ** 26,
    UploadFiles: 2 ** 27,
    Masquerade: 2 ** 28,
    React: 2 ** 29,
    Connect: 2 ** 30,
    Speak: 2 ** 31,
    Video: 2 ** 32,
    MuteMembers: 2 ** 33,
    DeafenMembers: 2 ** 34,
    MoveMembers: 2 ** 35,
    MentionEveryone: 2 ** 37,
    MentionRoles: 2 ** 38,
    GrantAllSafe: 0x000f_ffff_ffff_ffff,
} as const;

const DEFAULT_PERMISSION =
    Permission.ViewChannel +
    Permission.ReadMessageHistory +
    Permission.SendMessage +
    Permission.InviteOthers +
    Permission.SendEmbeds +
    Permission.UploadFiles +
    Permission.Connect +
    Permission.Speak;

export const DEFAULT_PERMISSION_DIRECT_MESSAGE =
    DEFAULT_PERMISSION + Permission.React + Permission.ManageChannel;

export const LIBRARY_VERSION = "7.2.0";

export type ClientboundNotification =
    | { type: "UserSettingsUpdate"; update: Record<string, unknown> }
    | { type: string; update?: unknown };
