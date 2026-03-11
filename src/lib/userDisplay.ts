export function displayNameFromEmail(email?: string) {
    if (!email || !email.includes("@")) return undefined;
    const local = email.split("@")[0]?.trim();
    if (!local) return undefined;

    const words = local
        .split(/[._+-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

    if (words.length === 0) return undefined;
    return words.join(" ");
}

export function getDisplayName(user?: {
    display_name?: string | null;
    username?: string | null;
}) {
    if (!user) return undefined;
    return (
        user.display_name ??
        displayNameFromEmail(user.username ?? undefined) ??
        user.username ??
        undefined
    );
}
