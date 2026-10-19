import { Navigate, Route, Routes } from "react-router-dom";
import AdminHome from "../screens/admin/AdminHome";
import BuyerHome from "../screens/buyer/BuyerHome";
import Home from "../screens/public/Home";
import SupplierHome from "../screens/supplier/SupplierHome";
import AdminLayout from "../layouts/AdminLayout";
import BuyerLayout from "../layouts/BuyerLayout";
import PublicLayout from "../layouts/PublicLayout";
import SupplierLayout from "../layouts/SupplierLayout";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route element={<BuyerLayout />}>
        <Route path="/buyer" element={<BuyerHome />} />
      </Route>
      <Route element={<SupplierLayout />}>
        <Route path="/supplier" element={<SupplierHome />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminHome />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
