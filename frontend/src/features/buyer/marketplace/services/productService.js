
import apiClient from "../../../../shared/services/apiClient";

const productService = {
    async getProducts() {
        const response = await apiClient.get("/products");

        if (!response?.success || !Array.isArray(response.data)) {
            throw new Error(
                response?.error?.message ||
                response?.message ||
                "Invalid product API response."
            );
        }

        return response.data;
    },
};

export default productService;
