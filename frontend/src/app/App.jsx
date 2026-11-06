
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import AppRouter from "./router";
import { CartProvider } from "../features/buyer/cart";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
