import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const login = useCallback(({ email, role }) => {
        const allowedRoles = ["BUYER", "ADMIN", "SUPPLIER"];

        if (!email || !allowedRoles.includes(role)) {
            throw new Error("Invalid email or role.");
        }

        const nextUser = {
            id: `demo-${role.toLowerCase()}`,
            email,
            role,
        };

        setUser(nextUser);
        return nextUser;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            role: user?.role ?? null,
            login,
            logout,
        }),
        [user, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider.");
    }

    return context;
}
