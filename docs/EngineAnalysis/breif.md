# AI Coding Assistant Brief

## v1 — Python Hybrid Analyzer
- Validates C++ syntax using `g++`.
- Runs static rules to detect common bug/security patterns.
- First it compiles the code to catch syntax errors, using g++. If compilation fails, it captures the error output for analysis.
- Then applies regex-based rules for deeper analysis, particularly for runtime errors and common coding mistakes.
- Finally calls LLM (Gemini/Ollama - qwen3:8b) to generate explanations and guided fixes.

### Output Images
#### Explanation using Gemini:
![v1 Gemini Output](imgs/v1/gemini_api.png)
#### Explanation using Ollama:
![v1 Ollama Output](imgs/v1/qwen3_8b_local.png)

---

## v2 — Node.js Multi-Stage LLM Pipeline
- Accepts code and numbers lines for better issue referencing.
- Runs 3 LLM stages: **Detect → Validate → Explain**.
- Currently using same Ollama Qwen 3.8b model for all stages, but designed to allow different models per stage.
- Having different system prompts for each stage to optimize for the specific task (detection, validation, explanation).
- Enforces JSON structure with Zod and retries invalid model output.

### Output Images
![v2 Output Part 1](imgs/v2/image_part1.png)
![v2 Output Part 2](imgs/v2/image_part2.png)
![v2 Output Part 3](imgs/v2/image_part3.png)
![v2 Output Part 4](imgs/v2/image_part4.png)

---

## v3 — Node.js MVC Gemini Engine
- Uses Express 5 MVC + middleware for production-grade request handling.
- Sends a language-aware single-pass prompt to Gemini.
- Normalizes/cleans model response before returning API output.

### Output Images
![v3 Output Part 1](imgs/v3/image_part1.png)
![v3 Output Part 2](imgs/v3/image_part2.png)
![v3 Output Part 3](imgs/v3/image_part3.png)


## Github Repository (dev - branch)
- https://github.com/DeepPatel4505/MentiCode-Backend.git