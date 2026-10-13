import { ENGINES, delay } from "./mockData";

// TODO(backend): replace with GET /engines, GET /engines/:id.
export const engineApi = {
  async listMyEngines() {
    await delay();
    return ENGINES;
  },

  async getById(id) {
    await delay();
    return ENGINES.find((e) => e.id === id) || null;
  },
};
