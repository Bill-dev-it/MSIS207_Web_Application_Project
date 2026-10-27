
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import { AuthProvider } from "../auth/AuthContext";
import { ToastProvider } from "../components/ui/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
