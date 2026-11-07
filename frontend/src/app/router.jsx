import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminHome from "../screens/admin/AdminHome";
import Home from "../screens/public/UI_UX_code/Home";
import Login from "../screens/auth/Login";
import Register from "../screens/auth/Register";
import VerifyEmail from "../screens/auth/VerifyEmail";
import SupplierHome from "../screens/supplier/SupplierHome";
import SupplierListings from "../screens/supplier/UI_UX_code/SupplierListings";
import SupplierInventory from "../screens/supplier/UI_UX_code/SupplierInventory";
import SupplierListingForm from "../screens/supplier/UI_UX_code/SupplierListingForm";
import SupplierOrders from "../screens/supplier/UI_UX_code/SupplierOrders";
import SupplierOrderDetail from "../screens/supplier/UI_UX_code/SupplierOrderDetail";
import AdminLayout from "../layouts/AdminLayout";
import BuyerLayout from "../layouts/BuyerLayout";
import PublicLayout from "../layouts/PublicLayout";
import SupplierLayout from "../layouts/SupplierLayout";
import Marketplace from "../screens/public/UI_UX_code/Marketplace";
import ProductDetail from "../screens/public/UI_UX_code/ProductDetail";
import Recommendations from "../screens/admin/UI_UX_Code/Recommendations";
import AdminModeration from "../screens/admin/UI_UX_Code/AdminModeration";
import AdminDashboard from "../screens/admin/UI_UX_Code/AdminDashboard";
import AdminRULStatus from "../screens/admin/UI_UX_Code/AdminRULStatus";
import AdminUsers from "../features/admin/users/AdminUsers";
import AdminOrders from "../features/admin/orders/AdminOrders";
import AdminCompanies from "../features/admin/companies/AdminCompanies";
import AdminReports from "../features/admin/reports/AdminReports";
import AdminSettings from "../features/admin/settings/AdminSettings";
import BuyerHome from "../screens/buyer/BuyerHome";
import BuyerDashboard from "../screens/buyer/UI_UX_code/BuyerDashboard";
import MyEngines from "../screens/buyer/UI_UX_code/MyEngines";
import EngineDetail from "../screens/buyer/UI_UX_code/EngineDetail";
import CartPage from "../screens/buyer/UI_UX_code/CartPage";
import CheckoutShippingPage from "../screens/buyer/UI_UX_code/CheckoutShippingPage";
import CheckoutPaymentPage from "../screens/buyer/UI_UX_code/CheckoutPaymentPage";
import CheckoutReviewPage from "../screens/buyer/UI_UX_code/CheckoutReviewPage";
import OrdersPage from "../screens/buyer/UI_UX_code/OrdersPage";
import OrderDetailPage from "../screens/buyer/UI_UX_code/OrderDetailPage";
import OrderConfirmationPage from "../screens/buyer/UI_UX_code/OrderConfirmationPage";
import RULAnalysis from "../screens/buyer/UI_UX_code/RULAnalysis";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>
      <Route element={<ProtectedRoute roles={["BUYER"]} />}>
        <Route element={<BuyerLayout />}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route
            path="/marketplace/products/:productId"
            element={<ProductDetail />}
          />
          <Route path="/buyer/marketplace" element={<Navigate to="/marketplace" replace />} />
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/home" element={<BuyerHome />} />
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
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/moderation" element={<AdminModeration />} />
          <Route path="/admin/products" element={<AdminModeration />} />
          <Route path="/admin/suppliers" element={<AdminModeration />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/rul-status" element={<AdminRULStatus />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
        <Route path="/admin/recommendations" element={<Recommendations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
