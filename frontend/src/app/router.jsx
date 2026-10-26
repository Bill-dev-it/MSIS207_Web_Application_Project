import { Navigate, Route, Routes } from "react-router-dom";
import AdminHome from "../screens/admin/AdminHome";
import BuyerHome from "../screens/buyer/BuyerHome";
import Home from "../screens/public/Home";
import SupplierHome from "../screens/supplier/SupplierHome";
import SupplierListings from "../screens/supplier/SupplierListings";
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
import MyEngines from "../screens/buyer/Frontend_code/MyEngines";
import Orders from "../screens/buyer/Frontend_code/Orders";
import OrderDetail from "../screens/buyer/Frontend_code/OrderDetail";
import OrderConfirmation from "../screens/buyer/Frontend_code/OrderConfirmation";

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
      </Route>
      <Route element={<BuyerLayout />}>
        <Route path="/buyer" element={<BuyerHome />} />
      </Route>
      <Route path="/buyer/engines" element={<MyEngines />} />
      <Route path="/buyer/orders" element={<Orders />} />
      <Route path="/buyer/orders/:orderId" element={<OrderDetail />} />
      <Route path="/buyer/order-confirmation" element={<OrderConfirmation />} />
      <Route element={<SupplierLayout />}>
        <Route path="/supplier" element={<SupplierHome />} />
        <Route path="/supplier/listings" element={<SupplierListings />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminHome />} />
      </Route>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/moderation" element={<AdminModeration />} />
      <Route path="/admin/rul-status" element={<AdminRULStatus />} />
      <Route path="/admin/recommendations" element={<Recommendations />} />
      <Route path="/buyer/recommendations" element={<Recommendations />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
