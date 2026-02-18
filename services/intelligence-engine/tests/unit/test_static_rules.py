"""Unit tests for static rule checks."""
import pytest
from app.services.static_rules.engine import StaticRuleEngine
from app.services.static_rules.registry import RuleRegistry
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


def _run_engine_with_rules(*rules):
    registry = RuleRegistry()
    for r in rules:
        registry.register(r())
    return StaticRuleEngine(registry)


def test_assignment_in_condition_detected():
    code = """
    int main() {
        int x = 0;
        if (x = 5) { return 1; }
        return 0;
    }
    """
    rule = AssignmentInConditionRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "assignment_in_condition" for i in issues)
    assert all(i.source == "static_rule" for i in issues)


def test_unconditional_loop_detected():
    code = """
    int main() {
        while(true) {
            int a = 1;
            int b = 2;
            int c = 3;
            int d = 4;
            int e = 5;
            int f = 6;
            int g = 7;
            int h = 8;
        }
        return 0;
    }
    """
    rule = UnconditionalLoopRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "unconditional_loop" for i in issues)


def test_unconditional_loop_with_break_not_detected():
    code = """
    int main() {
        while(true) {
            break;
        }
        return 0;
    }
    """
    rule = UnconditionalLoopRule()
    issues = rule.check(code)
    assert len(issues) == 0


def test_for_ever_loop_detected():
    # return must be beyond 15 lines from for(;;) for rule to flag
    lines_in_loop = "\n".join([f"            int x{i} = {i};" for i in range(20)])
    code = f"""
    int main() {{
        for(;;) {{
{lines_in_loop}
        }}
        return 0;
    }}
    """
    rule = ForEverLoopRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "for_ever_loop" for i in issues)


def test_for_ever_loop_with_break_not_detected():
    code = """
    int main() {
        for(;;) {
            break;
        }
        return 0;
    }
    """
    rule = ForEverLoopRule()
    issues = rule.check(code)
    assert len(issues) == 0


def test_division_by_zero_literal_detected():
    code = """
    int main() {
        int x = 5 / 0;
        return 0;
    }
    """
    rule = DivisionByZeroLiteralRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "division_by_zero" for i in issues)


def test_modulo_by_zero_detected():
    code = """
    int main() {
        int x = 5 % 0;
        return 0;
    }
    """
    rule = DivisionByZeroLiteralRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "modulo_by_zero" for i in issues)


def test_unsafe_string_gets_detected():
    code = """
    #include <cstdio>
    int main() {
        char buf[100];
        gets(buf);
        return 0;
    }
    """
    rule = UnsafeStringFunctionsRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "unsafe_string_function" for i in issues)
    assert any("gets" in i.message for i in issues)


def test_unsafe_string_strcpy_detected():
    code = """
    #include <cstring>
    int main() {
        char a[10], b[20];
        strcpy(a, b);
        return 0;
    }
    """
    rule = UnsafeStringFunctionsRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any("strcpy" in i.message for i in issues)


def test_array_bounds_negative_index():
    code = """
    int main() {
        int arr[5];
        int x = arr[-1];
        return 0;
    }
    """
    rule = ArrayBoundsRiskRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "array_bounds_risk" for i in issues)


def test_array_bounds_size_index():
    code = """
    int main() {
        int arr[5];
        int size = 5;
        int x = arr[size];
        return 0;
    }
    """
    rule = ArrayBoundsRiskRule()
    issues = rule.check(code)
    assert len(issues) >= 1


def test_vector_index_without_resize():
    code = """
    #include <vector>
    int main() {
        std::vector<int> v;
        int x = v[0];
        return 0;
    }
    """
    rule = VectorIndexWithoutResizeRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "vector_index_without_resize" for i in issues)


def test_loop_bound_risk_detected():
    code = """
    int main() {
        for (int i = 0; i <= 10; i++) {}
        return 0;
    }
    """
    rule = LoopBoundRiskRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "loop_bound_risk" for i in issues)


def test_null_pointer_risk_detected():
    code = """
    #include <cstdlib>
    int main() {
        int* p = (int*)malloc(sizeof(int));
        *p = 42;
        return 0;
    }
    """
    rule = NullPointerDereferenceRiskRule()
    issues = rule.check(code)
    assert len(issues) >= 1
    assert any(i.type == "possible_null_dereference" for i in issues)


def test_static_engine_runs_all_rules():
    registry = RuleRegistry()
    registry.register(AssignmentInConditionRule())
    registry.register(DivisionByZeroLiteralRule())
    engine = StaticRuleEngine(registry)
    code = """
    int main() {
        if (x = 1) {}
        int z = 5 / 0;
        return 0;
    }
    """
    issues = engine.run(code)
    types = {i.type for i in issues}
    assert "assignment_in_condition" in types
    assert "division_by_zero" in types
