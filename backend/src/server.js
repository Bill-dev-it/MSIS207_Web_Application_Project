const { createApp } = require("./app");

const PORT = process.env.PORT || 5000; // matches the Vite dev proxy target

createApp().listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});