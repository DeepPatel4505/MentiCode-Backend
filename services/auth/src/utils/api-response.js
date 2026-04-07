// Shim: bridges the legacy (statusCode, data, message) call signature used throughout
// the auth controller to the canonical @menticode/shared ApiResponse shape.
// New code should use ApiResponse.success(message, data) directly from @menticode/shared.
import { ApiResponse as SharedApiResponse } from "@menticode/shared";

class ApiResponse extends SharedApiResponse {
    constructor(statusCode, data, message = "Success") {
        super(data, message);
        this.statusCode = statusCode;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };