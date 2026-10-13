export default function HowItWorks() {
  return (
    <div className="container-page py-12">
      <h1 className="text-xl font-semibold text-primary-800">How It Works</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Predict", "Upload engine sensor data and get a Remaining Useful Life (RUL) prediction."],
          ["Understand", "See replacement urgency and what it means for your fleet."],
          ["Recommend", "Get compatible replacement parts ranked by fit, price, and delivery."],
          ["Purchase", "Buy directly from verified suppliers and track your order."],
        ].map(([title, desc]) => (
          <div key={title} className="card p-4">
            <p className="font-medium text-primary-800">{title}</p>
            <p className="mt-1 text-sm text-neutral-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
