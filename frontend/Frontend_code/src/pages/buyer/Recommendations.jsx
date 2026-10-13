import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { rulApi } from "../../services/rulApi";
import { useCart } from "../../hooks/useCart";
import RecommendationCard from "../../components/engine/RecommendationCard";

export default function Recommendations() {
  const [params] = useSearchParams();
  const engineId = params.get("engine") || "ENG-037";
  const [data, setData] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    rulApi.getRecommendations(engineId).then(setData);
  }, [engineId]);

  if (!data) return <p className="text-sm text-neutral-500">Loading recommendations…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-800">Replacement Recommendations</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Based on: <span className="mono">{data.basedOn.engineId}</span> · {data.basedOn.engineModel} · Predicted RUL {data.basedOn.predictedRul} cycles
        </p>
      </div>

      {data.top && <RecommendationCard product={data.top} highlight onAddToCart={addItem} />}

      {data.alternatives.length > 0 && (
        <div>
          <p className="mb-3 font-semibold text-primary-800">Alternative Options</p>
          <div className="grid gap-4 md:grid-cols-2">
            {data.alternatives.map((p) => (
              <RecommendationCard key={p.id} product={p} onAddToCart={addItem} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
