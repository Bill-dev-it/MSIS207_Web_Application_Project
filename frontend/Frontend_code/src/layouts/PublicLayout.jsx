import { Outlet } from "react-router-dom";
import { PublicHeader } from "../components/common/Header";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-200 bg-white py-8 text-sm text-neutral-500">
        <div className="container-page flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AeroRUL Marketplace. B2B aviation engine & parts marketplace.</p>
          <div className="flex gap-4">
            <span>Support</span>
            <span>Terms</span>
            <span>Privacy</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
