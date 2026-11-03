import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminHome from "../screens/admin/AdminHome";
import BuyerHome from "../screens/buyer/BuyerHome";
import Home from "../screens/public/Home";
import Login from "../screens/auth/Login";
import Register from "../screens/auth/Register";
import VerifyEmail from "../screens/auth/VerifyEmail";
import Marketplace from "../screens/buyer/Marketplace";
import PublicMarketplace from "../screens/public/Marketplace";
import ProductDetail from "../screens/public/ProductDetail";
import SupplierHome from "../screens/supplier/SupplierHome";
import SupplierListings from "../screens/supplier/SupplierListings";
import SupplierInventory from "../screens/supplier/SupplierInventory";
import SupplierListingForm from "../screens/supplier/SupplierListingForm";
import SupplierOrders from "../screens/supplier/SupplierOrders";
import SupplierOrderDetail from "../screens/supplier/SupplierOrderDetail";

import AdminLayout from "../layouts/AdminLayout";
import BuyerLayout from "../layouts/BuyerLayout";
import PublicLayout from "../layouts/PublicLayout";
import SupplierLayout from "../layouts/SupplierLayout";

import AdminDashboard from "../screens/admin/Admin_frontend_Code/AdminDashboard";
import AdminModeration from "../screens/admin/Admin_frontend_Code/AdminModeration";
import AdminRULStatus from "../screens/admin/Admin_frontend_Code/AdminRULStatus";
import Recommendations from "../screens/admin/Admin_frontend_Code/Recommendations";

import MyEngines from "../screens/buyer/Frontend_code/MyEngines";
import OrderConfirmation from "../screens/buyer/Frontend_code/OrderConfirmation";
import OrderDetail from "../screens/buyer/Frontend_code/OrderDetail";
import Orders from "../screens/buyer/Frontend_code/Orders";

export default function AppRouter() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/public-marketplace" element={<PublicMarketplace />} />
        <Route
          path="/products/:productId"
          element={<ProductDetail />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* BUYER ROUTES */}
      <Route element={<ProtectedRoute roles={["BUYER"]} />}>
        <Route element={<BuyerLayout />}>
          <Route path="/buyer" element={<BuyerHome />} />
        </Route>
        <Route path="/buyer/engines" element={<MyEngines />} />
        <Route path="/buyer/orders" element={<Orders />} />
        <Route path="/buyer/orders/:orderId" element={<OrderDetail />} />
        <Route path="/buyer/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/buyer/recommendations" element={<Recommendations />} />
      </Route>

      {/* SUPPLIER ROUTES */}
      <Route element={<ProtectedRoute roles={["SUPPLIER"]} />}>
        <Route element={<SupplierLayout />}>
          <Route path="/supplier" element={<SupplierHome />} />
          <Route path="/supplier/listings" element={<SupplierListings />} />
          <Route path="/supplier/inventory" element={<SupplierInventory />} />
          <Route
            path="/supplier/listings/new"
            element={<SupplierListingForm />}
          />
          <Route
            path="/supplier/listings/:listingId/edit"
            element={<SupplierListingForm />}
          />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
          <Route
            path="/supplier/orders/:sellerOrderId"
            element={<SupplierOrderDetail />}
          />
        </Route>
      </Route>

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/rul-status" element={<AdminRULStatus />} />
          <Route path="/admin/recommendations" element={<Recommendations />} />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
