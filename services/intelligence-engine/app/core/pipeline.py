from typing import List
from app.domain.models import CodeBundle
from app.domain.issue import AnalysisResult, Issue
from app.services.syntax_validator import validate_syntax
from app.utils.file_manager import create_temp_cpp, delete_temp_file
from app.config import MAX_FILE_SIZE, SUPPORTED_LANGUAGES, MAX_FILES
from app.utils.logger import logger
from app.services.static_rules.rules.assignment_in_condition import AssignmentInConditionRule
from app.services.static_rules.rules.unconditional_loop import UnconditionalLoopRule
from app.services.static_rules.rules.for_ever_loop import ForEverLoopRule
from app.services.static_rules.rules.division_rule import DivisionByVariableRule
from app.services.static_rules.rules.division_by_zero_literal import DivisionByZeroLiteralRule
from app.services.static_rules.rules.vector_rule import VectorIndexWithoutResizeRule
from app.services.static_rules.rules.loop_bound import LoopBoundRiskRule
from app.services.static_rules.rules.unsafe_string_functions import UnsafeStringFunctionsRule
from app.services.static_rules.rules.null_pointer_check import NullPointerDereferenceRiskRule
from app.services.static_rules.rules.array_bounds_risk import ArrayBoundsRiskRule
from app.services.static_rules.registry import RuleRegistry
from app.services.static_rules.engine import StaticRuleEngine
import uuid
import time



class AnalysisPipeline:

    def __init__(self):
        registry = RuleRegistry()
        registry.register(AssignmentInConditionRule())
        registry.register(UnconditionalLoopRule())
        registry.register(ForEverLoopRule())
        registry.register(DivisionByVariableRule())
        registry.register(DivisionByZeroLiteralRule())
        registry.register(VectorIndexWithoutResizeRule())
        registry.register(LoopBoundRiskRule())
        registry.register(UnsafeStringFunctionsRule())
        registry.register(NullPointerDereferenceRiskRule())
        registry.register(ArrayBoundsRiskRule())
        self.static_engine = StaticRuleEngine(registry)
    
    def run(self, bundle: CodeBundle) -> AnalysisResult:
        if bundle.language not in SUPPORTED_LANGUAGES:
            return AnalysisResult(
                bundleId=bundle.bundleId,
                issues=[
                    Issue(
                        type="unsupported_language",
                        severity="critical",
                        message="Unsupported language",
                        confidence="high"
                    )
                ]
            )
        
        if not bundle.files:
            return AnalysisResult(
                bundleId=bundle.bundleId,
                issues=[
                    Issue(
                        type="no_files",
                        severity="critical",
                        message="No files provided in bundle",
                        confidence="high"
                    )
                ]
            )
            
        if len(bundle.files) > MAX_FILES:
            return AnalysisResult(
                bundleId=bundle.bundleId,
                issues=[Issue(
                    type="too_many_files",
                    severity="critical",
                    line=None,
                    message="Too many files in bundle",
                    confidence="high"
                )]
            )

        start_total = time.time()
        issues: List[Issue] = []

        request_id = str(uuid.uuid4())
        logger.info(f"[{request_id}] Processing bundle {bundle.bundleId}")

        # Only first file for MVP
        file = bundle.files[0]
        code = file.content

        # File size check
        if len(code) > MAX_FILE_SIZE:
            return AnalysisResult(
                bundleId=bundle.bundleId,
                issues=[
                    Issue(
                        type="file_too_large",
                        severity="critical",
                        message="File exceeds maximum allowed size",
                        confidence="high"
                    )
                ]
            )

        temp_path = create_temp_cpp(code)

        try:
            start_syntax = time.time()
            syntax_issues = validate_syntax(temp_path)
            issues.extend(syntax_issues)
            
            logger.info(f"[{request_id}] Syntax validation time: {time.time() - start_syntax:.2f} seconds")
            if not any(issue.severity == "critical" for issue in issues):
                static_issues = self.static_engine.run(code)
                issues.extend(static_issues)

        finally:
            logger.info(f"[{request_id}] Total Analysis time: {time.time() - start_total:.2f} seconds")
            delete_temp_file(temp_path)

        return AnalysisResult(
            bundleId=bundle.bundleId,
            issues=issues
        )
