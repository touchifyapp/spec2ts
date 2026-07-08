export const defaults: RequestOptions = {
    baseUrl: "/",
};

export const servers = {};

export type RequestOptions = {
    baseUrl?: string;
    fetch?: typeof fetch;
    headers?: Record<string, string | undefined>;
} & Omit<RequestInit, "body" | "headers">;

export type ApiResponse<T> = {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: T;
};

type Encoders = Array<(s: string) => string>;
type TagFunction = (strings: TemplateStringsArray, ...values: any[]) => string;

type FetchRequestOptions = RequestOptions & {
    body?: string | FormData;
};

type JsonRequestOptions = RequestOptions & {
    body: unknown;
};

type FormRequestOptions<T extends Record<string, unknown>> = RequestOptions & {
    body: T;
};

type MultipartRequestOptions = RequestOptions & {
    body: Record<string, any>; // string | Blob
};

/** Utilities functions */
export const _ = {
    // Encode param names and values as URIComponent
    encodeReserved: [encodeURI, encodeURIComponent],
    allowReserved: [encodeURI, encodeURI],

    /** Deeply remove all properties with undefined values. */
    stripUndefined<T extends Record<string, U | undefined>, U>(obj?: T): Record<string, U> | undefined {
        return obj && JSON.parse(JSON.stringify(obj));
    },

    isEmpty(v: unknown): boolean {
        return typeof v === "object" && !!v ?
            Object.keys(v).length === 0 && v.constructor === Object :
            v === undefined;
    },

    /** Creates a tag-function to encode template strings with the given encoders. */
    encode(encoders: Encoders, delimiter = ","): TagFunction {
        return (strings: TemplateStringsArray, ...values: any[]) => {
            return strings.reduce((prev, s, i) => `${prev}${s}${q(values[i] ?? "", i)}`, "");
        };

        function q(v: any, i: number): string {
            const encoder = encoders[i % encoders.length];
            if (typeof v === "object") {
                if (Array.isArray(v)) {
                    return v.map(encoder).join(delimiter);
                }
                const flat = Object.entries(v).reduce(
                    (flat, entry) => [...flat, ...entry],
                    [] as any
                );
                return flat.map(encoder).join(delimiter);
            }

            return encoder(String(v));
        }
    },

    /** Separate array values by the given delimiter. */
    delimited(delimiter = ","): (params: Record<string, any>, encoders?: Encoders) => string {
        return (params: Record<string, any>, encoders = _.encodeReserved) =>
            Object.entries(params)
                .filter(([, value]) => !_.isEmpty(value))
                .map(([name, value]) => _.encode(encoders, delimiter)`${name}=${value}`)
                .join("&");
    },

    /** Join URLs parts. */
    joinUrl(...parts: Array<string | undefined>): string {
        return parts
            .filter(Boolean)
            .join("/")
            .replace(/([^:]\/)\/+/, "$1");
    }
};

/** Functions to serialize query parameters in different styles. */
export const QS = {
    /** Join params using an ampersand and prepends a questionmark if not empty. */
    query(...params: string[]): string {
        const s = params.filter(p => !!p).join("&");
        return s && `?${s}`;
    },

    /**
     * Serializes nested objects according to the `deepObject` style specified in
     * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#style-values
     */
    deep(params: Record<string, any>, [k, v] = _.encodeReserved): string {
        const qk = _.encode([(s) => s, k]);
        const qv = _.encode([(s) => s, v]);
        // don't add index to arrays
        // https://github.com/expressjs/body-parser/issues/289
        const visit = (obj: any, prefix = ""): string =>
            Object.entries(obj)
                .filter(([, v]) => !_.isEmpty(v))
                .map(([prop, v]) => {
                    const isValueObject = typeof v === "object";
                    const index = Array.isArray(obj) && !isValueObject ? "" : prop;
                    const key = prefix ? qk`${prefix}[${index}]` : prop;
                    if (isValueObject) {
                        return visit(v, key);
                    }
                    return qv`${key}=${v}`;
                })
                .join("&");

        return visit(params);
    },

    /**
     * Property values of type array or object generate separate parameters
     * for each value of the array, or key-value-pair of the map.
     * For other types of properties this property has no effect.
     * See https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#encoding-object
     */
    explode(params: Record<string, any>, encoders = _.encodeReserved): string {
        const q = _.encode(encoders);
        return Object.entries(params)
            .filter(([, value]) => typeof value !== "undefined")
            .map(([name, value]) => {
                if (Array.isArray(value)) {
                    return value.map((v) => q`${name}=${v}`).join("&");
                }

                if (typeof value === "object") {
                    return QS.explode(value, encoders);
                }

                return q`${name}=${value}`;
            })
            .join("&");
    },

    form: _.delimited(),
    pipe: _.delimited("|"),
    space: _.delimited("%20"),
};

/** Http request base methods. */
export const http = {
    async fetch(url: string, req?: FetchRequestOptions): Promise<ApiResponse<string | undefined>> {
        const { baseUrl, headers, fetch: customFetch, ...init } = { ...defaults, ...req };
        const href = _.joinUrl(baseUrl, url);
        const res = await (customFetch || fetch)(href, {
            ...init,
            headers: _.stripUndefined({ ...defaults.headers, ...headers }),
        });

        let text: string | undefined;
        try { text = await res.text(); }
        catch (err) { /* ok */ }

        if (!res.ok) {
            throw new HttpError(res.status, res.statusText, href, res.headers, text);
        }

        return {
            status: res.status,
            statusText: res.statusText,
            headers: http.headers(res.headers),
            data: text
        };
    },

    async fetchJson(url: string, req: FetchRequestOptions = {}): Promise<ApiResponse<any>> {
        const res = await http.fetch(url, {
            ...req,
            headers: {
                ...req.headers,
                Accept: "application/json",
            },
        });

        res.data = res.data && JSON.parse(res.data);
        return res;
    },

    async fetchVoid(url: string, req: FetchRequestOptions = {}): Promise<ApiResponse<undefined>> {
        const res = await http.fetch(url, {
            ...req,
            headers: {
                ...req.headers,
                Accept: "application/json",
            },
        });

        return res as ApiResponse<undefined>;
    },

    json({ body, headers, ...req }: JsonRequestOptions): FetchRequestOptions {
        return {
            ...req,
            body: JSON.stringify(body),
            headers: {
                ...headers,
                "Content-Type": "application/json",
            },
        };
    },

    form<T extends Record<string, unknown>>({ body, headers, ...req }: FormRequestOptions<T>): FetchRequestOptions {
        return {
            ...req,
            body: QS.form(body),
            headers: {
                ...headers,
                "Content-Type": "application/x-www-form-urlencoded",
            },
        };
    },

    multipart({ body, ...req }: MultipartRequestOptions): FetchRequestOptions {
        const data = new FormData();
        Object.entries(body).forEach(([name, value]) => {
            data.append(name, value);
        });
        return {
            ...req,
            body: data,
        };
    },

    headers(headers: Headers): Record<string, string> {
        const res: Record<string, string> = {};
        headers.forEach((value, key) => res[key] = value);
        return res;
    }
};

export class HttpError extends Error {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data?: Record<string, unknown>;

    constructor(status: number, statusText: string, url: string, headers: Headers, text?: string) {
        super(`${url} - ${statusText} (${status})`);
        this.status = status;
        this.statusText = statusText;
        this.headers = http.headers(headers);

        if (text) {
            try { this.data = JSON.parse(text); }
            catch (err) { /* ok */ }
        }
    }
}

/** Utility Type to extract returns type from a method. */
export type ApiResult<Fn> = Fn extends (...args: any) => Promise<ApiResponse<infer T>> ? T : never;
