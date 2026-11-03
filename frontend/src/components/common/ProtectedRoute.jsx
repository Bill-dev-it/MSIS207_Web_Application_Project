import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
    const { isAuthenticated, role } = useAuth();
    const location = useLocation();

    // Chưa đăng nhập: chuyển về trang login.
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // Đã đăng nhập nhưng không có quyền.
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return <Navigate to="/forbidden" replace />;
    }

    return <Outlet />;
}
