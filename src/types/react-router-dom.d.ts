declare module "react-router-dom" {
    export * from "react-router";

    export const Link: any;
    export type LinkProps = any;
    export const Prompt: any;
    export const Redirect: any;
    export const Route: any;
    export const Router: any;
    export const Switch: any;

    export function useHistory(): any;
    export function useLocation(): any;
    export function useParams<T = any>(): T;
}
