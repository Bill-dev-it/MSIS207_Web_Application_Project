import { useState } from "react";

export default function SearchBar({ defaultValue = "", onSearch, placeholder }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(value);
      }}
    >
      <input
        className="input"
        placeholder={placeholder || "Search by keyword, Part Number, or Engine Model…"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn-primary shrink-0">Search</button>
    </form>
  );
}
