export const APP_VERSION = "__APP_VERSION__";
export const IS_REVOLT =
    import.meta.env.VITE_API_URL === "https://api.revolt.chat" ||
    // future proofing
    import.meta.env.VITE_API_URL === "https://local.blinqcampus.chat/api" ||
    import.meta.env.VITE_API_URL === "https://revolt.chat/api";

export const ERROR_REPORT_URL = import.meta.env.VITE_ERROR_REPORT_URL;
export const HEALTHCHECK_URL = import.meta.env.VITE_HEALTHCHECK_URL;
