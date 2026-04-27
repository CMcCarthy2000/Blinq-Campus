// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function takeError(error: any): string {
    try {
        const type = error?.response?.data?.type;
        if (typeof type === "string" && type.length > 0) {
            return type;
        }

        const status = error?.response?.status;
        if (typeof status === "number") {
            switch (status) {
                case 429:
                    return "TooManyRequests";
                case 401:
                    return "Unauthorized";
                case 403:
                    return "Forbidden";
                case 500:
                    return "InternalError";
                case 502:
                case 503:
                case 504:
                    return "NetworkError";
                default:
                    return "UnknownError";
            }
        }

        if (error?.request) {
            return "NetworkError";
        }

        if (typeof error === "string") {
            return error;
        }
    } catch (inner) {
        console.error("takeError failed to normalize error:", inner, error);
        return "UnknownError";
    }
    return "UnknownError";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapError(error: any): never {
    throw takeError(error);
}
