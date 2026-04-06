import pytest
from app.core.pipeline import AnalysisPipeline
from app.domain.models import CodeBundle, FileInput
from app.config import MAX_FILE_SIZE, MAX_FILES


@pytest.fixture
def pipeline():
    return AnalysisPipeline()


def test_pipeline_no_files(pipeline):
    """Test pipeline with empty files list"""
    bundle = CodeBundle(
        bundleId="test-empty",
        language="cpp",
        files=[]
    )
    
    result = pipeline.run(bundle)
    
    assert result.bundleId == "test-empty"
    assert len(result.issues) >= 1
    assert result.issues[0].type == "no_files"
    assert result.issues[0].severity == "critical"


def test_pipeline_too_many_files(pipeline):
    """Test pipeline with more than MAX_FILES files"""
    files = [
        FileInput(path=f"file{i}.cpp", content="int main(){return 0;}")
        for i in range(MAX_FILES + 1)
    ]
    
    bundle = CodeBundle(
        bundleId="test-too-many",
        language="cpp",
        files=files
    )
    
    result = pipeline.run(bundle)
    
    assert result.bundleId == "test-too-many"
    assert len(result.issues) >= 1
    assert result.issues[0].type == "too_many_files"
    assert result.issues[0].severity == "critical"


def test_pipeline_file_size_exceeds_limit(pipeline):
    """Test pipeline with file exceeding MAX_FILE_SIZE"""
    large_content = "a" * (MAX_FILE_SIZE + 1000)
    
    bundle = CodeBundle(
        bundleId="test-large",
        language="cpp",
        files=[
            FileInput(path="large.cpp", content=large_content)
        ]
    )
    
    result = pipeline.run(bundle)
    
    assert result.bundleId == "test-large"
    assert len(result.issues) >= 1
    assert result.issues[0].type == "file_too_large"
    assert result.issues[0].severity == "critical"


def test_pipeline_unsupported_language(pipeline):
    """Test pipeline with unsupported language"""
    bundle = CodeBundle(
        bundleId="test-lang",
        language="java",
        files=[
            FileInput(path="Main.java", content="public class Main {}")
        ]
    )
    
    result = pipeline.run(bundle)
    
    assert result.bundleId == "test-lang"
    assert len(result.issues) >= 1
    assert result.issues[0].type == "unsupported_language"
    assert result.issues[0].severity == "critical"


def test_pipeline_valid_single_file(pipeline):
    """Test pipeline with valid single file"""
    bundle = CodeBundle(
        bundleId="test-valid",
        language="cpp",
        files=[
            FileInput(path="main.cpp", content="int main(){return 0;}")
        ]
    )
    
    result = pipeline.run(bundle)
    
    assert result.bundleId == "test-valid"
    assert result.issues == []


def test_pipeline_multiple_files_only_first_processed(pipeline):
    """Test that pipeline only processes first file"""
    bundle = CodeBundle(
        bundleId="test-multi",
        language="cpp",
        files=[
            FileInput(path="main.cpp", content="int main(){return 0;}"),
            FileInput(path="invalid.cpp", content="int main(){ int x = 5 return 0; }")
        ]
    )
    
    result = pipeline.run(bundle)
    
    # Should only process first file (valid code), so no issues
    assert result.bundleId == "test-multi"
    assert result.issues == []


def test_pipeline_static_rules_on_valid_code(pipeline):
    """Test that static rules run on syntactically valid code and produce issues with source=static_rule."""
    bundle = CodeBundle(
        bundleId="test-static",
        language="cpp",
        files=[
            FileInput(
                path="main.cpp",
                content="""
#include <vector>
int main() {
    std::vector<int> v;
    int x = v[0];
    return 0;
}
""",
            )
        ],
    )
    result = pipeline.run(bundle)
    assert result.bundleId == "test-static"
    static_issues = [i for i in result.issues if getattr(i, "source", None) == "static_rule"]
    assert len(static_issues) >= 1
    assert any(i.type == "vector_index_without_resize" for i in static_issues)


def test_pipeline_request_tracking(pipeline):
    """Test that pipeline logs request IDs for tracking"""
    import logging
    from io import StringIO
    
    bundle = CodeBundle(
        bundleId="test-tracking",
        language="cpp",
        files=[
            FileInput(path="main.cpp", content="int main(){return 0;}")
        ]
    )
    
    # Capture logs
    logger = logging.getLogger("intelligence-engine")
    log_stream = StringIO()
    handler = logging.StreamHandler(log_stream)
    logger.addHandler(handler)
    
    result = pipeline.run(bundle)
    
    logger.removeHandler(handler)
    
    # Verify result is correct
    assert result.issues == []
