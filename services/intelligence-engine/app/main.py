from fastapi import FastAPI, HTTPException
from app.domain.models import CodeBundle
from app.core.pipeline import AnalysisPipeline
from app.domain.issue import AnalysisResult
from app.domain.responses import AnalyzeWithExplanationResponse
from app.services.explanation_service import explain
from app.utils.logger import logger
import time

app = FastAPI()
pipeline = AnalysisPipeline()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(bundle: CodeBundle):
    try:
        result = pipeline.run(bundle)
        return result

    except Exception:
        logger.exception("Unhandled engine failure")

        return AnalysisResult(
            bundleId=bundle.bundleId,
            issues=[
                {
                    "type": "engine_failure",
                    "severity": "critical",
                    "message": "Internal engine error",
                    "confidence": "low"
                }
            ]
        )


@app.post("/analyze/explain", response_model=AnalyzeWithExplanationResponse)
async def analyze_with_explanation(bundle: CodeBundle):
    """Run analysis and LLM explanation. Requires LLM provider (Ollama/Gemini)."""
    try:
        analysis = pipeline.run(bundle)
        code = bundle.files[0].content if bundle.files else ""

        start_explanation = time.time()
        explanation = await explain(analysis, code)
        logger.info(f"[{bundle.bundleId}] Explanation time: {time.time() - start_explanation:.2f} seconds")

        return AnalyzeWithExplanationResponse(
            bundleId=bundle.bundleId,
            analysis=analysis,
            summary=explanation.summary.model_dump(),
            findings=[f.model_dump() for f in explanation.findings],
            final_solution=explanation.final_solution,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail="LLM service unavailable")
