import { configDotenv } from "dotenv"
configDotenv({
    path: "./.env",
});
export default {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
}