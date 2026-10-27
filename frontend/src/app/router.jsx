import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";

// Public screens (untouched)
import PublicLayout from "../layouts/PublicLayout";
import Home from "../screens/public/Home";
import Marketplace from "../screens/public/Marketplace";
import ProductDetail from "../screens/public/ProductDetail";

// Supplier screens (untouched)
import SupplierLayout from "../layouts/SupplierLayout";
import SupplierHome from "../screens/supplier/SupplierHome";

// Auth & Common screens
import Login from "../screens/auth/Login";
import NotFound from "../screens/common/NotFound";

// Buyer layouts & screens
import BuyerLayout from "../layouts/BuyerLayout";
import BuyerHome from "../screens/buyer/BuyerHome";
import MyEngines from "../screens/buyer/Frontend_code/MyEngines";
import Orders from "../screens/buyer/Frontend_code/Orders";
import OrderDetail from "../screens/buyer/Frontend_code/OrderDetail";
import OrderConfirmation from "../screens/buyer/Frontend_code/OrderConfirmation";

// Admin layouts & screens
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../screens/admin/Admin_frontend_Code/AdminDashboard";
import AdminModeration from "../screens/admin/Admin_frontend_Code/AdminModeration";
import AdminRULStatus from "../screens/admin/Admin_frontend_Code/AdminRULStatus";
import Recommendations from "../screens/admin/Admin_frontend_Code/Recommendations";
import AdminUsers from "../screens/admin/Admin_frontend_Code/AdminUsers";
import AdminCompanies from "../screens/admin/Admin_frontend_Code/AdminCompanies";
import AdminSuppliers from "../screens/admin/Admin_frontend_Code/AdminSuppliers";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Marketplace */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/products/:productId" element={<ProductDetail />} />
      </Route>

      {/* Authentication */}
      <Route path="/login" element={<Login />} />

      {/* Buyer Portal - Strict Role Protection & Nested Layout */}
      <Route
        path="/buyer"
        element={
          <ProtectedRoute allowedRoles={["BUYER"]}>
            <BuyerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BuyerHome />} />
        <Route path="engines" element={<MyEngines />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        <Route path="order-confirmation" element={<OrderConfirmation />} />
        <Route path="recommendations" element={<Recommendations />} />
      </Route>

      {/* Supplier Portal (Untouched) */}
      <Route element={<SupplierLayout />}>
        <Route path="/supplier" element={<SupplierHome />} />
      </Route>

      {/* Admin Portal - Strict Role Protection & Nested Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="rul-status" element={<AdminRULStatus />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
      </Route>

      {/* Fallback to Clear 404 with Navigation Actions */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
