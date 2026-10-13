import { useAuth } from "../../hooks/useAuth";
export default function CompanyProfile() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary-800">Company Profile</h1>
      <div className="card space-y-3 p-4">
        <div>
          <p className="label">Company Name</p>
          <input className="input" defaultValue={user?.companyName} />
        </div>
        <div>
          <p className="label">Contact Email</p>
          <input className="input" defaultValue={user?.email} />
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}
