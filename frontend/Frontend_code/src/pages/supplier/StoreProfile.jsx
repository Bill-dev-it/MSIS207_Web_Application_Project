import { useAuth } from "../../hooks/useAuth";
export default function StoreProfile() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Store Profile</h1>
      <div className="card space-y-3 p-4">
        <div>
          <p className="label">Store Name</p>
          <input className="input" defaultValue={user?.companyName} />
        </div>
        <div>
          <p className="label">Region</p>
          <input className="input" placeholder="e.g. US" />
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
