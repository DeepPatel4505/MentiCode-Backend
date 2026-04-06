"""Unit tests for explanation service."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.domain.issue import AnalysisResult, Issue
from app.services.explanation_service import explain, _issues_to_dicts, _extract_json


def test_issues_to_dicts():
    issues = [
        Issue(type="syntax_error", severity="critical", line=2, message="expected ;", source="compiler"),
        Issue(type="vector_index", severity="major", line=5, message="unsafe", source="static_rule"),
    ]
    out = _issues_to_dicts(issues)
    assert len(out) == 2
    assert out[0]["type"] == "syntax_error"
    assert out[0]["line"] == 2
    assert out[1]["source"] == "static_rule"


def test_extract_json_from_raw():
    assert _extract_json('{"a": 1}') == '{"a": 1}'


def test_extract_json_from_markdown():
    text = '```json\n{"summary": {"risk_level": "low"}}\n```'
    assert "risk_level" in _extract_json(text)


@pytest.mark.asyncio
async def test_explain_empty_issues():
    analysis = AnalysisResult(bundleId="x", issues=[])
    result = await explain(analysis, "int main(){}")
    assert result.summary.risk_level == "low"
    assert result.summary.overall_quality == 100.0
    assert result.findings == []


@pytest.mark.asyncio
async def test_explain_with_mocked_llm():
    analysis = AnalysisResult(
        bundleId="x",
        issues=[
            Issue(type="syntax_error", severity="critical", line=2, message="expected ;", source="compiler")
        ],
    )
    mock_client = AsyncMock()
    mock_client.complete.return_value = '''
    {
      "summary": {"risk_level": "high", "overall_quality": 20.0},
      "findings": [
        {
          "category": "bug",
          "severity": "critical",
          "line_range": [2, 2],
          "issue": "Missing semicolon",
          "why_it_matters": "Syntax error",
          "hint": "Add ;",
          "guided_fix": "Add ; before return"
        }
      ],
      "final_solution": null
    }
    '''
    result = await explain(analysis, "int main(){ int x = 5 return 0; }", client=mock_client)
    assert result.summary.risk_level == "high"
    assert result.summary.overall_quality == 20.0
    assert len(result.findings) == 1
    assert result.findings[0].issue == "Missing semicolon"
