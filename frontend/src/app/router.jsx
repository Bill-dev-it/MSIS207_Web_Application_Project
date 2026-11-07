import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminHome from "../screens/admin/AdminHome";
import Home from "../screens/public/Home";
import Login from "../screens/auth/Login";
import Register from "../screens/auth/Register";
import VerifyEmail from "../screens/auth/VerifyEmail";
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
import Marketplace from "../screens/public/Marketplace";
import ProductDetail from "../screens/public/ProductDetail";
import Recommendations from "../screens/admin/Admin_frontend_Code/Recommendations";
import AdminModeration from "../screens/admin/Admin_frontend_Code/AdminModeration";
import AdminDashboard from "../screens/admin/Admin_frontend_Code/AdminDashboard";
import AdminRULStatus from "../screens/admin/Admin_frontend_Code/AdminRULStatus";
import AdminUsers from "../features/admin/users/AdminUsers";
import AdminOrders from "../features/admin/orders/AdminOrders";
import BuyerDashboard from "../screens/buyer/BuyerDashboard";
import MyEngines from "../screens/buyer/MyEngines";
import EngineDetail from "../screens/buyer/EngineDetail";
import CartPage from "../screens/buyer/CartPage";
import CheckoutShippingPage from "../screens/buyer/CheckoutShippingPage";
import CheckoutPaymentPage from "../screens/buyer/CheckoutPaymentPage";
import CheckoutReviewPage from "../screens/buyer/CheckoutReviewPage";
import OrdersPage from "../screens/buyer/OrdersPage";
import OrderDetailPage from "../screens/buyer/OrderDetailPage";
import OrderConfirmationPage from "../screens/buyer/OrderConfirmationPage";
import RULAnalysis from "../screens/buyer/RULAnalysis";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/marketplace/products/:productId"
          element={<ProductDetail />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>
      <Route element={<ProtectedRoute roles={["BUYER"]} />}>
        <Route element={<BuyerLayout />}>
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          <Route path="/buyer/engines" element={<MyEngines />} />
          <Route path="/buyer/engines/:engineId" element={<EngineDetail />} />
          <Route path="/buyer/rul" element={<RULAnalysis />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/shipping" element={<CheckoutShippingPage />} />
          <Route path="/checkout/payment" element={<CheckoutPaymentPage />} />
          <Route path="/checkout/review" element={<CheckoutReviewPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders/:orderId/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/buyer/orders" element={<Navigate to="/orders" replace />} />
          <Route path="/buyer/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/buyer/order-confirmation" element={<Navigate to="/orders" replace />} />
        </Route>
      </Route>
      <Route
        element={
          <ProtectedRoute roles={["SUPPLIER"]} requireSupplierApproval />
        }
      >
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
      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/moderation" element={<AdminModeration />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/rul-status" element={<AdminRULStatus />} />
        <Route path="/admin/recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
