import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";
import BuyerLayout from "./layouts/BuyerLayout";
import SupplierLayout from "./layouts/SupplierLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./app/routes/ProtectedRoute";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Marketplace from "./pages/public/Marketplace";
import ProductDetail from "./pages/public/ProductDetail";
import HowItWorks from "./pages/public/HowItWorks";

import BuyerDashboard from "./pages/buyer/Dashboard";
import MyEngines from "./pages/buyer/MyEngines";
import EngineDetail from "./pages/buyer/EngineDetail";
import RULAnalysis from "./pages/buyer/RULAnalysis";
import Recommendations from "./pages/buyer/Recommendations";
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import Orders from "./pages/buyer/Orders";
import OrderDetail from "./pages/buyer/OrderDetail";
import Wishlist from "./pages/buyer/Wishlist";
import Notifications from "./pages/buyer/Notifications";
import CompanyProfile from "./pages/buyer/CompanyProfile";
import BuyerSettings from "./pages/buyer/Settings";

import SupplierDashboard from "./pages/supplier/Dashboard";
import SupplierProducts from "./pages/supplier/Products";
import ProductForm from "./pages/supplier/ProductForm";
import Inventory from "./pages/supplier/Inventory";
import SupplierOrders from "./pages/supplier/Orders";
import SupplierReviews from "./pages/supplier/Reviews";
import SupplierAnalytics from "./pages/supplier/Analytics";
import StoreProfile from "./pages/supplier/StoreProfile";
import SupplierSettings from "./pages/supplier/Settings";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCompanies from "./pages/admin/Companies";
import AdminSuppliers from "./pages/admin/Suppliers";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminReports from "./pages/admin/Reports";
import RULSystemStatus from "./pages/admin/RULSystemStatus";
import AdminSettings from "./pages/admin/Settings";

export default function App() {
  return (
    <Routes>
      {/* Public routes: Home, Marketplace, Product Detail, Auth */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Buyer portal */}
      <Route element={<ProtectedRoute role="buyer" />}>
        <Route element={<BuyerLayout />}>
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/buyer/engines" element={<MyEngines />} />
          <Route path="/buyer/engines/:id" element={<EngineDetail />} />
          <Route path="/buyer/rul-analysis" element={<RULAnalysis />} />
          <Route path="/buyer/recommendations" element={<Recommendations />} />
          <Route path="/buyer/cart" element={<Cart />} />
          <Route path="/buyer/checkout" element={<Checkout />} />
          <Route path="/buyer/orders" element={<Orders />} />
          <Route path="/buyer/orders/:id" element={<OrderDetail />} />
          <Route path="/buyer/wishlist" element={<Wishlist />} />
          <Route path="/buyer/notifications" element={<Notifications />} />
          <Route path="/buyer/company-profile" element={<CompanyProfile />} />
          <Route path="/buyer/settings" element={<BuyerSettings />} />
        </Route>
      </Route>

      {/* Supplier portal */}
      <Route element={<ProtectedRoute role="supplier" />}>
        <Route element={<SupplierLayout />}>
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/products" element={<SupplierProducts />} />
          <Route path="/supplier/products/new" element={<ProductForm />} />
          <Route path="/supplier/products/:id/edit" element={<ProductForm />} />
          <Route path="/supplier/inventory" element={<Inventory />} />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
          <Route path="/supplier/reviews" element={<SupplierReviews />} />
          <Route path="/supplier/analytics" element={<SupplierAnalytics />} />
          <Route path="/supplier/store-profile" element={<StoreProfile />} />
          <Route path="/supplier/settings" element={<SupplierSettings />} />
        </Route>
      </Route>

      {/* Admin portal */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/suppliers" element={<AdminSuppliers />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/rul-status" element={<RULSystemStatus />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
