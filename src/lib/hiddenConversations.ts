import State from "../mobx/State";

export const HIDDEN_DM_KEY = "ui:hidden_dms" as const;

export function getHiddenDms(state: State) {
    return state.settings.get("ui:hidden_dms", []);
}

export function hideDm(state: State, channelId: string) {
    const current = getHiddenDms(state);
    if (current.includes(channelId)) return;
    state.settings.set("ui:hidden_dms", [...current, channelId]);
}

export function unhideDm(state: State, channelId: string) {
    const current = getHiddenDms(state);
    if (!current.includes(channelId)) return;
    state.settings.set(
        "ui:hidden_dms",
        current.filter((id) => id !== channelId),
    );
}

export function isDmHidden(state: State, channelId?: string) {
    if (!channelId) return false;
    return getHiddenDms(state).includes(channelId);
}

