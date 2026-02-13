from app.core import pipeline
from fastapi import FastAPI
from app.domain.models import CodeBundle
from app.core.pipeline import AnalysisPipeline
from app.domain.issue import AnalysisResult
from app.utils.logger import logger

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
