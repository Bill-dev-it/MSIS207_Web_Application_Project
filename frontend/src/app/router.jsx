
import { Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        AeroRUL
      </h1>
      <p className="mt-3 text-slate-600">
        B2B Aviation Marketplace — Frontend Foundation
      </p>
    </main>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
