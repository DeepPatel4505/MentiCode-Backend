import dotenv from "dotenv";
import app from './app.js';

dotenv.config({
  path: './.env'
});

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // If you have DB, connect here
    // await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Server failed to start:", error);
  }
};

startServer();