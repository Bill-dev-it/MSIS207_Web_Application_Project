import { useEffect, useState } from "react";
import {
  getCompanyAircraft,
  getEngineModels,
  createEngine,
} from "../services/engineApi";

export function RegisterEngineModal({ isOpen, onClose, onSuccess }) {
  // Engine basic fields
  const [engineCode, setEngineCode] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [currentCycle, setCurrentCycle] = useState("0");

  // Model search & selection
  const [modelSearch, setModelSearch] = useState("");
  const [modelsList, setModelsList] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // Aircraft assignment
  const [aircraftMode, setAircraftMode] = useState("new");
  const [aircraftList, setAircraftList] = useState([]);
  const [loadingAircraft, setLoadingAircraft] = useState(false);
  const [selectedAircraftId, setSelectedAircraftId] = useState("");

  // New aircraft inline fields
  const [newAircraftReg, setNewAircraftReg] = useState("");
  const [newAircraftMfr, setNewAircraftMfr] = useState("");
  const [newAircraftModel, setNewAircraftModel] = useState("");
  const [newAircraftType, setNewAircraftType] = useState("Commercial Fixed-Wing");
  const [newAircraftYear, setNewAircraftYear] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Reset & load initial data on modal open
  useEffect(() => {
    if (!isOpen) return;

    let aborted = false;
    setSubmitError("");

    async function loadInitialData() {
      // 1. Fetch company aircraft
      setLoadingAircraft(true);
      try {
        const aircraft = await getCompanyAircraft();
        if (!aborted) {
          const list = Array.isArray(aircraft) ? aircraft : [];
          setAircraftList(list);
          if (list.length > 0) {
            setAircraftMode("existing");
            setSelectedAircraftId(list[0].aircraftId);
          } else {
            setAircraftMode("new");
            setSelectedAircraftId("");
          }
        }
      } catch (err) {
        if (!aborted) {
          setAircraftList([]);
          setAircraftMode("new");
        }
      } finally {
        if (!aborted) setLoadingAircraft(false);
      }

      // 2. Fetch initial engine model catalog sample
      setLoadingModels(true);
      try {
        const models = await getEngineModels("", { limit: 8 });
        if (!aborted) {
          setModelsList(Array.isArray(models) ? models : []);
        }
      } catch (err) {
        if (!aborted) setModelsList([]);
      } finally {
        if (!aborted) setLoadingModels(false);
      }
    }

    loadInitialData();

    return () => {
      aborted = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSearchModels(e) {
    if (e) e.preventDefault();
    setLoadingModels(true);
    setSubmitError("");
    try {
      const results = await getEngineModels(modelSearch, { limit: 20 });
      setModelsList(Array.isArray(results) ? results : []);
    } catch (err) {
      setModelsList([]);
      setSubmitError(err.message || "Failed to search engine models.");
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!engineCode.trim()) {
      setSubmitError("Engine code is required.");
      return;
    }
    if (!serialNumber.trim()) {
      setSubmitError("Serial number is required.");
      return;
    }
    if (!selectedModel) {
      setSubmitError("Please search and select an engine model from the catalog.");
      return;
    }

    if (aircraftMode === "existing" && !selectedAircraftId) {
      setSubmitError("Please select an existing company aircraft.");
      return;
    }

    if (aircraftMode === "new") {
      if (!newAircraftReg.trim()) {
        setSubmitError("Aircraft registration / tail number is required.");
        return;
      }
      if (!newAircraftMfr.trim()) {
        setSubmitError("Aircraft manufacturer is required.");
        return;
      }
      if (!newAircraftModel.trim()) {
        setSubmitError("Aircraft model is required.");
        return;
      }
    }

    const payload = {
      engine_code: engineCode.trim(),
      serial_number: serialNumber.trim(),
      engine_model_id: selectedModel.engineModelId,
      current_cycle: Math.max(0, parseInt(currentCycle, 10) || 0),
    };

    if (aircraftMode === "existing") {
      payload.aircraft_id = selectedAircraftId;
    } else {
      payload.new_aircraft = {
        registration_number: newAircraftReg.trim(),
        manufacturer: newAircraftMfr.trim(),
        model: newAircraftModel.trim(),
        aircraft_type: newAircraftType.trim() || "Commercial Fixed-Wing",
        year: newAircraftYear ? parseInt(newAircraftYear, 10) : null,
      };
    }

    setSubmitting(true);
    try {
      const created = await createEngine(payload);
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message || "Failed to register engine.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-engine-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 my-6 sm:my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2
              id="register-engine-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Register Company Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new aircraft engine asset to your company fleet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          {submitError && (
            <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              <span className="font-bold block mb-0.5">Registration Error:</span>
              {submitError}
            </div>
          )}

          {/* SECTION A: Engine Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] pb-1.5 border-b border-slate-100">
              Section A: Engine Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Engine Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG-001 or CFM56-L1"
                  value={engineCode}
                  onChange={(e) => setEngineCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  maxLength={80}
                  disabled={submitting}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Unique engine code for the aircraft.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-892341"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  maxLength={100}
                  disabled={submitting}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Component serial number from manufacturer.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Operating Cycles
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={currentCycle}
                  onChange={(e) => setCurrentCycle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  disabled={submitting}
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Cumulative operating cycles recorded to date (default 0).
                </span>
              </div>
            </div>

            {/* Engine Model Search Box */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engine Model <span className="text-red-500">*</span>
              </label>

              {/* Selected Model Highlight */}
              {selectedModel ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200 mb-2.5">
                  <div className="text-xs">
                    <span className="font-bold text-sky-950 block">
                      ✓ {selectedModel.manufacturer} {selectedModel.modelName}
                    </span>
                    <span className="text-[11px] text-sky-700 font-mono">
                      ID: #{selectedModel.engineModelId}
                      {selectedModel.engineFamily ? ` • Family: ${selectedModel.engineFamily}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedModel(null)}
                    className="text-xs font-bold text-sky-700 hover:text-sky-900 underline px-2 py-1"
                  >
                    Change Model
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search model name or manufacturer (e.g. CFM56, AEROVEE, V2500)..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchModels();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                      disabled={submitting || loadingModels}
                    />
                    <button
                      type="button"
                      onClick={handleSearchModels}
                      disabled={loadingModels || submitting}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    >
                      {loadingModels ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {/* Models list */}
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                    {loadingModels ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Searching engine catalog...
                      </div>
                    ) : modelsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No matching engine models found. Try another search query.
                      </div>
                    ) : (
                      modelsList.map((m) => (
                        <button
                          key={m.engineModelId}
                          type="button"
                          onClick={() => setSelectedModel(m)}
                          className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between text-xs group"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 group-hover:text-blue-700">
                              {m.manufacturer} {m.modelName}
                            </span>
                            {m.engineFamily && (
                              <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                                ({m.engineFamily})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100">
                            Select &rarr;
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: Aircraft Assignment */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] pb-1.5 border-b border-slate-100">
              Section B: Aircraft Fitment
            </h3>

            {/* Mode selection tabs */}
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold gap-1">
              <button
                type="button"
                disabled={aircraftList.length === 0}
                onClick={() => setAircraftMode("existing")}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                  aircraftMode === "existing"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                Option A: Existing Company Aircraft ({aircraftList.length})
              </button>
              <button
                type="button"
                onClick={() => setAircraftMode("new")}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all ${
                  aircraftMode === "new"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Option B: Register New Aircraft Inline
              </button>
            </div>

            {aircraftMode === "existing" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Existing Aircraft <span className="text-red-500">*</span>
                </label>
                {loadingAircraft ? (
                  <p className="text-xs text-slate-400">Loading company aircraft...</p>
                ) : (
                  <select
                    value={selectedAircraftId}
                    onChange={(e) => setSelectedAircraftId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    disabled={submitting}
                  >
                    {aircraftList.map((a) => (
                      <option key={a.aircraftId} value={a.aircraftId}>
                        {a.registrationNumber} — {a.manufacturer} {a.model} ({a.status})
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Assigns this engine to an existing aircraft in your company fleet.
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5">
                <p className="text-[11px] text-slate-500">
                  Provide aircraft specifications. A company aircraft record will be created and linked to this engine automatically in a single transaction.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Registration / Tail Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VN-A899 or N101AA"
                      value={newAircraftReg}
                      onChange={(e) => setNewAircraftReg(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength={50}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aircraft Manufacturer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BOEING or AIRBUS"
                      value={newAircraftMfr}
                      onChange={(e) => setNewAircraftMfr(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength={100}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aircraft Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 737-800 or A321-200"
                      value={newAircraftModel}
                      onChange={(e) => setNewAircraftModel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength={100}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aircraft Classification Type
                    </label>
                    <input
                      type="text"
                      placeholder="Commercial Fixed-Wing"
                      value={newAircraftType}
                      onChange={(e) => setNewAircraftType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      maxLength={100}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Manufacture Year (Optional)
                    </label>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="e.g. 2018"
                      value={newAircraftYear}
                      onChange={(e) => setNewAircraftYear(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0B1F3A] hover:bg-[#16335a] text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Engine...</span>
                </>
              ) : (
                <span>Register Engine</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

