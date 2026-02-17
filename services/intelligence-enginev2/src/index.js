import express from "express";
import { analyze } from "./core/pipeline.js";

const app = express();
app.use(express.json());

app.post("/analyze", async (req, res) => {
    const { language, code } = req.body;
    const result = await analyze(code);
    res.json(result);
});

app.listen(4002, () => {
    console.log("Intelligence Engine v2 running on port 4002");
});
