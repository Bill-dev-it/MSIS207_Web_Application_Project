
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const MUTATING_METHODS = new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
]);

async function request(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // CSRF protection for all write operations.
    if (MUTATING_METHODS.has(method)) {
        headers["X-AeroRUL-Request"] = "1";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
        ...options,
        headers,
    });

    const contentType = response.headers.get("content-type");

    const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(
            data?.error?.message || data?.message || `API Error: ${response.status}`
        );
    }

    return data;
}

const apiClient = {
    get(endpoint) {
        return request(endpoint, {
            method: "GET",
        });
    },

    post(endpoint, body) {
        return request(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body) {
        return request(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    patch(endpoint, body, options = {}) {
        return request(endpoint, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body),
        });
    },

    delete(endpoint) {
        return request(endpoint, {
            method: "DELETE",
        });
    },
};

export default apiClient;
