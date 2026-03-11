interface ImportMetaEnv {
    DEV: boolean;
    VITE_API_URL: string;
    VITE_CANONICAL_ORIGIN?: string;
    VITE_RABBITMQ_URL?: string;
    VITE_ADMIN_API_URL?: string;
    VITE_API_DOCS_URL?: string;
    VITE_THEMES_URL: string;
    BASE_URL: string;
}

interface ImportMeta {
    env: ImportMetaEnv;
}
