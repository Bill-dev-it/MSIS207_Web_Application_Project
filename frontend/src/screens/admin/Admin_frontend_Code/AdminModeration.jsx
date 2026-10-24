import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchModerationQueue } from "../../../services/adminService";

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState("products"); // 'suppliers' | 'products' | 'reported'
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("MOD-001");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState("");

  // Controlled form state for reviewer
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [checks, setChecks] = useState({
    infoComplete: true,
    priceReasonable: true,
    documentsAttached: false,
  });

  useEffect(() => {
    fetchModerationQueue()
      .then((data) => {
        setItems(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setChecks({
            infoComplete: data[0].infoComplete,
            priceReasonable: data[0].priceReasonable,
            documentsAttached: data[0].documentsAttached,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || items[0] || null;
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleSelect = (item) => {
    setSelectedId(item.id);
    setChecks({
      infoComplete: item.infoComplete,
      priceReasonable: item.priceReasonable,
      documentsAttached: item.documentsAttached,
    });
    setReviewerNotes(item.reviewerNotes || "");
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    setActionNotice(`Approved & published listing: "${selectedItem.title}"`);
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id ? { ...i, status: "Approved" } : i
      )
    );
    setTimeout(() => setActionNotice(""), 3500);
  };

  const handleReject = () => {
    if (!selectedItem) return;
    setActionNotice(`Rejected listing: "${selectedItem.title}"`);
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id ? { ...i, status: "Rejected" } : i
      )
    );
    setTimeout(() => setActionNotice(""), 3500);
  };

  const handleRequestChanges = () => {
    if (!selectedItem) return;
    setActionNotice(`Requested changes from supplier for: "${selectedItem.title}"`);
    setTimeout(() => setActionNotice(""), 3500);
  };

  const handleSuspendSupplier = () => {
    if (!selectedItem) return;
    if (
      window.confirm(
        `Are you sure you want to suspend supplier "${selectedItem.supplier}"?`
      )
    ) {
      setActionNotice(`Suspended supplier: "${selectedItem.supplier}"`);
      setTimeout(() => setActionNotice(""), 3500);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0B1F3A] antialiased">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {actionNotice}
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-[#E5E7EB] bg-white px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Logo with ADMIN badge */}
          <div className="flex items-center gap-2 px-2">
            <Link to="/" className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Aero<span className="text-accent">RUL</span>
            </Link>
            <span className="rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#6D28D9]">
              ADMIN
            </span>
          </div>

          {/* Admin Nav Items */}
          <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#475569]">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>

            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Users
            </Link>

            <Link
              to="/admin/companies"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Companies / Buyers
            </Link>

            <Link
              to="/admin/suppliers"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Suppliers
            </Link>

            {/* Active Products Item with Badge 5 */}
            <div className="flex items-center justify-between rounded-xl bg-[#0B1F3A] px-3.5 py-2.5 font-semibold text-white shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Products</span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white">
                5
              </span>
            </div>

            <Link
              to="/admin/categories"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
            </Link>

            <Link
              to="/admin/orders"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Orders
            </Link>

            <Link
              to="/admin/reports"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Reviews / Reports
            </Link>

            <Link
              to="/admin/rul-status"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>RUL System Status</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-success" />
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F3A]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              System Settings
            </Link>
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={() => alert("Admin logged out.")}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-8">
          <div className="relative w-full max-w-lg">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search listings, suppliers, catalog"
              className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-[13px] outline-none transition-all placeholder:text-[#94A3B8] focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-[#64748B] hover:text-[#0B1F3A]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <div className="flex items-center gap-3 pl-2">
              <div className="h-9 w-9 rounded-full bg-[#CBD5E1]" />
              <div className="text-left leading-tight">
                <p className="text-[13px] font-bold text-[#0B1F3A]">Platform Admin</p>
                <p className="text-[11px] text-[#64748B]">Marketplace operations</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 space-y-6 px-8 py-6 pb-12">
          {/* Header Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F3A]">
              Supplier & product moderation
            </h1>
            <p className="mt-1 text-xs text-[#64748B]">
              Approve supplier accounts, review catalog listings and handle reports.
            </p>
          </div>

          {/* Moderation Tabs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${activeTab === "suppliers"
                  ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                  : "border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                }`}
            >
              <span>Supplier requests</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${activeTab === "suppliers" ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#475569]"}`}>
                3
              </span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${activeTab === "products"
                  ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                  : "border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                }`}
            >
              <span>Product approvals</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "products" ? "bg-[#2563EB] text-white" : "bg-[#F1F5F9] text-[#475569]"}`}>
                5
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reported")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${activeTab === "reported"
                  ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                  : "border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                }`}
            >
              <span>Reported items</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${activeTab === "reported" ? "bg-white/20 text-white" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
                3
              </span>
            </button>
          </div>

          {/* 2-Column Queue and Review Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Queue List */}
            <div className="space-y-4 lg:col-span-5">
              <input
                type="text"
                placeholder="Filter queue by SKU or part name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs outline-none transition placeholder:text-[#94A3B8] focus:border-accent focus:ring-2 focus:ring-accent/15"
              />

              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium">
                  Status: <strong className="text-[#0B1F3A]">All pending (5)</strong>
                </span>
                <span>Showing {filteredItems.length} of 5</span>
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                {filteredItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] p-6 text-center text-xs text-[#64748B]">
                    No items match your filter criteria.
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = item.id === selectedItem?.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${isSelected
                            ? "border-[#2563EB] bg-[#F0F7FF] shadow-sm"
                            : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-[#0B1F3A] leading-snug">
                            {item.title}
                          </h3>
                          <span className="shrink-0 text-[11px] text-[#64748B]">
                            {item.timeAgo}
                          </span>
                        </div>

                        <p className="mt-1 font-mono text-[11px] text-[#64748B]">
                          P/N {item.partNumber}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-[11px] text-[#475569]">
                            {item.supplier}
                            {item.supplierVerified && (
                              <svg className="h-3 w-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className="font-extrabold text-[#0B1F3A]">
                            ${item.listedPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Review Panel */}
            <div className="lg:col-span-7">
              {selectedItem ? (
                <div className="space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  {/* Title & Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-[#0B1F3A]">
                      {selectedItem.title}
                    </h2>
                    <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#0369A1]">
                      {selectedItem.status}
                    </span>
                  </div>

                  {/* Attributes Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-[#F1F5F9] px-2.5 py-1 font-semibold text-[#475569]">
                      Condition: {selectedItem.condition}
                    </span>
                    <span className="rounded-md bg-[#F1F5F9] px-2.5 py-1 font-semibold text-[#475569]">
                      Stock: {selectedItem.stock}
                    </span>
                    <span className="rounded-md bg-[#F1F5F9] px-2.5 py-1 font-mono font-semibold text-[#475569]">
                      P/N {selectedItem.partNumber}
                    </span>
                  </div>

                  {/* Price & Supplier 2 Boxes */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#F8FAFC] p-3.5 border border-[#F1F5F9]">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        LISTED PRICE
                      </p>
                      <p className="mt-1 text-xl font-extrabold text-[#0B1F3A]">
                        ${selectedItem.listedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#F8FAFC] p-3.5 border border-[#F1F5F9]">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        SUPPLIER
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                        <span>{selectedItem.supplier}</span>
                        {selectedItem.supplierVerified && (
                          <svg className="h-3.5 w-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {selectedItem.supplierStatus} · {selectedItem.supplierRating} rating
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      DESCRIPTION
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Compatible Engines */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      COMPATIBLE ENGINES
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedItem.compatibleEngines.map((engine) => (
                        <span
                          key={engine}
                          className="rounded-md bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#0B1F3A]"
                        >
                          {engine}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Attached Documents */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      ATTACHED DOCUMENTS
                    </h4>
                    <div className="mt-2 space-y-2">
                      {selectedItem.attachedDocuments.map((doc) => (
                        <div
                          key={doc.name}
                          className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium text-[#0B1F3A]">
                              {doc.name} ({doc.format} · {doc.size})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                            <button
                              onClick={() => alert(`Viewing document: ${doc.name}`)}
                              className="hover:underline"
                            >
                              View
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => alert(`Downloading: ${doc.name}`)}
                              className="hover:underline"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviewer Notes */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      REVIEWER NOTES
                    </h4>
                    <textarea
                      rows={3}
                      placeholder="Add internal notes or feedback for the supplier"
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-xs outline-none transition placeholder:text-[#94A3B8] focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </div>

                  {/* Checklist Controls */}
                  <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-medium text-[#475569]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checks.infoComplete}
                        onChange={(e) =>
                          setChecks({ ...checks, infoComplete: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#0B1F3A] focus:ring-accent"
                      />
                      <span>Information complete</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checks.priceReasonable}
                        onChange={(e) =>
                          setChecks({ ...checks, priceReasonable: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#0B1F3A] focus:ring-accent"
                      />
                      <span>Price looks reasonable</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checks.documentsAttached}
                        onChange={(e) =>
                          setChecks({ ...checks, documentsAttached: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[#CBD5E1] text-[#0B1F3A] focus:ring-accent"
                      />
                      <span>Documents attached</span>
                    </label>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E5E7EB] pt-4">
                    <button
                      onClick={handleSuspendSupplier}
                      className="text-xs font-bold text-[#DC2626] transition hover:underline"
                    >
                      Suspend supplier
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleReject}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#475569] transition hover:bg-[#F8FAFC]"
                      >
                        Reject
                      </button>

                      <button
                        onClick={handleRequestChanges}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-bold text-[#0B1F3A] transition hover:bg-[#F8FAFC]"
                      >
                        Request changes
                      </button>

                      <button
                        onClick={handleApprove}
                        className="rounded-xl bg-[#0B1F3A] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1E293B]"
                      >
                        Approve and publish
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-12 text-center text-xs text-[#64748B]">
                  Select an item from the queue to review details.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
