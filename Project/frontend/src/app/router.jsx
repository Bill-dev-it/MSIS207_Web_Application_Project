import { Navigate, Route, Routes } from "react-router-dom";
import Marketplace from "../features/buyer/marketplace/pages/Marketplace";
import ProductDetail from "../features/buyer/marketplace/pages/ProductDetail";
import { CartPage } from "../features/buyer/cart";
import { CheckoutShippingPage } from "../features/buyer/checkout/shipping";
import { CheckoutPaymentPage } from "../features/buyer/checkout/payment";
import { CheckoutReviewPage } from "../features/buyer/checkout/review";
import { OrdersPage } from "../features/buyer/orders";
import { OrderDetailPage } from "../features/buyer/orders/order-detail";
import { OrderConfirmationPage } from "../features/buyer/orders/order-confirmation";
import { BuyerDashboard } from "../features/buyer/dashboard";
import { MyEngines, EngineDetail } from "../features/buyer/engines";
import { RULAnalysis } from "../features/buyer/rul-analysis";
import AdminHome from "../features/admin/dashboard/AdminHome";
import Home from "../screens/public/Home";
import Login from "../screens/auth/Login";
import Register from "../screens/auth/Register";
import VerifyEmail from "../screens/auth/VerifyEmail";
import Forbidden from "../screens/public/Forbidden";
import AdminModeration from "../features/admin/moderation/AdminModeration";
import AdminRULStatus from "../features/admin/rul-monitoring/AdminRULStatus";
import AdminRecommendations from "../features/admin/recommendations/AdminRecommendations";
import SupplierHome from "../screens/supplier/SupplierHome";
import SupplierListings from "../screens/supplier/SupplierListings";
import SupplierInventory from "../screens/supplier/SupplierInventory";
import SupplierListingForm from "../screens/supplier/SupplierListingForm";
import SupplierOrders from "../screens/supplier/SupplierOrders";
import SupplierOrderDetail from "../screens/supplier/SupplierOrderDetail";

import AdminLayout from "../layouts/admin/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import SupplierLayout from "../layouts/SupplierLayout";

import ProtectedRoute from "../shared/components/common/ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forbidden" element={<Forbidden />} />
      </Route>

      {/* BUYER DISCOVERY & PRODUCT DETAILS */}
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/products/:productId" element={<ProductDetail />} />
      <Route path="/products/:productId" element={<ProductDetail />} />

      {/* BUYER OPERATIONS: DASHBOARD, MY ENGINES & RUL ANALYSIS */}
      <Route path="/buyer" element={<BuyerDashboard />} />
      <Route path="/dashboard" element={<BuyerDashboard />} />
      <Route path="/engines" element={<MyEngines />} />
      <Route path="/engines/:engineId" element={<EngineDetail />} />
      <Route path="/rul-analysis" element={<RULAnalysis />} />

      {/* CART & CHECKOUT ROUTES (USES EMBEDDED BUYER SHELL) */}
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout/shipping" element={<CheckoutShippingPage />} />
      <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
      <Route path="/checkout/review" element={<CheckoutReviewPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/orders/:orderId" element={<OrderDetailPage />} />
      <Route path="/orders/:orderId/confirmation" element={<OrderConfirmationPage />} />

      {/* SUPPLIER ROUTES */}
      <Route element={<SupplierLayout />}>
        <Route path="/supplier" element={<SupplierHome />} />
        <Route path="/supplier/listings" element={<SupplierListings />} />
        <Route path="/supplier/inventory" element={<SupplierInventory />} />
        <Route path="/supplier/listings/new" element={<SupplierListingForm />} />
        <Route path="/supplier/listings/:listingId/edit" element={<SupplierListingForm />} />
        <Route path="/supplier/orders" element={<SupplierOrders />} />
        <Route path="/supplier/orders/:sellerOrderId" element={<SupplierOrderDetail />} />
      </Route>

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/rul-status" element={<AdminRULStatus />} />
          <Route
            path="/admin/recommendations"
            element={<AdminRecommendations />}
          />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


