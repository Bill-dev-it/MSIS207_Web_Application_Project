import { useEffect, useState } from "react";
import { getAdminRulHealth } from "../../features/admin/services/adminApi";

export default function AdminRULHealthLive() {
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      setState({ loading: true, error: "", data: null });
      try {
        const response = await getAdminRulHealth({ signal: controller.signal });
        if (!controller.signal.aborted) {
          setState({ loading: false, error: "", data: response.data });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ loading: false, error: error.message, data: null });
        }
      }
    }

    loadHealth();
    return () => controller.abort();
  }, [refresh]);

  const healthy = state.data?.status === "healthy" && state.data?.model_loaded === true;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-primary-800">RUL service monitoring</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Live FastAPI check through Express. Not an aircraft safety certification.
        </p>
      </header>
      <section className="max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {state.loading ? (
          <p role="status">Checking internal RUL service…</p>
        ) : state.error ? (
          <p role="alert" className="text-red-800">{state.error}</p>
        ) : (
          <div role="status">
            <p className={`text-lg font-bold ${healthy ? "text-green-700" : "text-red-800"}`}>
              {healthy ? "Healthy — model loaded" : "Unavailable / model not loaded"}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Service availability does not confirm prediction accuracy or aircraft readiness.
            </p>
          </div>
        )}
        <button
          className="btn btn-secondary mt-5"
          type="button"
          disabled={state.loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Check again
        </button>
      </section>
    </div>
  );
}

