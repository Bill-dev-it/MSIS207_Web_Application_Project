import { CATEGORIES } from "../../services/mockData";
import DataTable from "../../components/common/DataTable";

export default function AdminCategories() {
  const columns = [
    { key: "name", header: "Category" },
    { key: "action", header: "Action", render: () => <button className="text-sm font-medium text-accent">Edit</button> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary-800">Categories</h1>
        <button className="btn-primary">Add Category</button>
      </div>
      <DataTable columns={columns} rows={CATEGORIES} rowKey="id" />
    </div>
  );
}
