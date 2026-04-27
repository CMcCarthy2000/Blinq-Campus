import semver from "semver";
import { ulid } from "ulid";

function isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a == null || b == null) return false;
    if (typeof a !== "object") return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
        if (!bKeys.includes(key)) return false;
        if (!isEqual(a[key], b[key])) return false;
    }
    return true;
}

import { registerSW } from "virtual:pwa-register";

import { useEffect, useState } from "preact/hooks";

import { internalEmit, internalSubscribe } from "./lib/eventEmitter";

import { modalController } from "./controllers/modals/ModalController";
import { APP_VERSION, HEALTHCHECK_URL } from "./version";

const INTERVAL_HOUR = 36e5;

let forceUpdate = false;
let registration: ServiceWorkerRegistration | undefined;

export const updateSW = registerSW({
    onNeedRefresh() {
        if (forceUpdate) {
            updateSW(true);
        } else {
            internalEmit("PWA", "update");
        }
    },
    onOfflineReady() {
        console.info("Ready to work offline.");
        // show a ready to work offline to user
    },
    onRegistered(r) {
        registration = r;

        // Check for updates every hour
        setInterval(() => r!.update(), INTERVAL_HOUR);
    },
});

let currentPollRate: number;
let scheduledTask: number;

/**
 * Schedule version checker
 * @param poll_rate Set poll rate in milliseconds
 */
function schedule(poll_rate = INTERVAL_HOUR) {
    if (poll_rate !== currentPollRate) {
        currentPollRate = poll_rate;
        clearInterval(scheduledTask);
        scheduledTask = setInterval(
            checkVersion,
            poll_rate,
        ) as unknown as number;
    }
}

let currentAlert: SystemAlert | undefined;
type SystemAlert = {
    text: string;
    dismissable?: boolean;
    actions?: {
        text: string;
        type: "internal" | "external";
        href: string;
    }[];
};

/**
 * Get the current system alert
 */
export function useSystemAlert() {
    const [alert, setAlert] = useState(currentAlert);
    useEffect(() => internalSubscribe("System", "alert", setAlert as any), []);
    return alert;
}

/**
 * Check whether the client is out of date
 */
async function checkVersion() {
    if (!HEALTHCHECK_URL) {
        return;
    }

    const { version, poll_rate, alert } = (await fetch(
        HEALTHCHECK_URL,
    ).then((res) => res.json())) as {
        version: string;
        poll_rate?: number;
        alert?: SystemAlert;
    };

    // Re-schedule if necessary
    schedule(poll_rate);

    // Apply any active alerts
    if (!isEqual(alert, currentAlert)) {
        currentAlert = alert;
        internalEmit("System", "alert", alert);
    }

    // Check if we need to update
    if (version !== "0.5.3-7" && !semver.satisfies(APP_VERSION, version)) {
        // Let the worker know we should immediately refresh
        forceUpdate = true;

        // Prompt service worker to update
        registration?.update();

        // Push information that the client is out of date
        modalController.push({
            key: ulid(),
            type: "out_of_date",
            version,
        });
    }
}

if (HEALTHCHECK_URL) {
    // Check for critical updates hourly
    schedule();
    checkVersion();
}
