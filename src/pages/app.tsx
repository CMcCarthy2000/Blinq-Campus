import { Route, Switch } from "react-router-dom";
import { useEffect, useState } from "preact/hooks";

import { lazy, Suspense } from "preact/compat";

import { Masks, Preloader } from "@revoltchat/ui";

import ErrorBoundary from "../lib/ErrorBoundary";

import Context from "../context";

import { clientController } from "../controllers/client/ClientController";
import { CheckAuth } from "../controllers/client/jsx/CheckAuth";
import Invite from "./invite/Invite";

const Login = lazy(() => import("./login/Login"));
const ConfirmDelete = lazy(() => import("./login/ConfirmDelete"));
const RevoltApp = lazy(() => import("./RevoltApp"));

const LoadSuspense: React.FC = ({ children }) => (
    // @ts-expect-error Typing issue between Preact and Preact.
    <Suspense fallback={<Preloader type="ring" />}>{children}</Suspense>
);

export function App() {
    const [oauthHandled, setOauthHandled] = useState(false);

    useEffect(() => {
        // Accept OAuth session handoff via URL fragment, e.g.
        // #token=...&user_id=...&created_account=true
        const hash = window.location.hash.startsWith("#")
            ? window.location.hash.slice(1)
            : "";

        if (!hash) {
            setOauthHandled(true);
            return;
        }

        const params = new URLSearchParams(hash);
        const token = params.get("token");
        const user_id = params.get("user_id");

        if (!token || !user_id) {
            setOauthHandled(true);
            return;
        }

        clientController.addSession(
            {
                session: {
                    token,
                    user_id,
                    name: "Google OAuth",
                },
            },
            "new",
        );

        // Prevent token leakage via URL (copy/paste/history/screenshots).
        history.replaceState(
            null,
            document.title,
            window.location.pathname + window.location.search,
        );

        setOauthHandled(true);
    }, []);

    if (!oauthHandled) {
        return <Preloader type="ring" />;
    }

    return (
        <ErrorBoundary section="client">
            <Context>
                <Masks />
                <Switch>
                    <Route path="/login/verify/:token">
                        <LoadSuspense>
                            <Login />
                        </LoadSuspense>
                    </Route>
                    <Route path="/login/reset/:token">
                        <LoadSuspense>
                            <Login />
                        </LoadSuspense>
                    </Route>
                    <Route path="/delete/:token">
                        <LoadSuspense>
                            <ConfirmDelete />
                        </LoadSuspense>
                    </Route>
                    <Route path="/invite/:code">
                        <CheckAuth blockRender>
                            <Invite />
                        </CheckAuth>
                        <CheckAuth auth blockRender>
                            <Invite />
                        </CheckAuth>
                    </Route>
                    <Route path="/login">
                        <CheckAuth>
                            <LoadSuspense>
                                <Login />
                            </LoadSuspense>
                        </CheckAuth>
                    </Route>
                    <Route path="/">
                        <CheckAuth auth>
                            <LoadSuspense>
                                <RevoltApp />
                            </LoadSuspense>
                        </CheckAuth>
                    </Route>
                </Switch>
            </Context>
        </ErrorBoundary>
    );
}
