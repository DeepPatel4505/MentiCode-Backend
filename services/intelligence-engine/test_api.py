"""
Test script that simulates API calls to the intelligence engine.
Uses C++ DSA code with various bugs. Run the service first: uvicorn app.main:app --reload
"""
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

# C++ DSA code with different bugs: syntax, vector OOB, division by zero, unsafe loops, etc.
BUGGY_CPP_CODE = '''
#include <iostream>
#include <vector>
using namespace std;

int binarySearch(vector<int>& arr, int target) {
    int left = 0;
    int right = arr.size();  // off-by-one: should be size()-1
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target)
            return mid;
        if (arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    return -1;
}

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i <= n; i++) {  // loop_bound_risk: <= causes OOB
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

int divide(int a, int b) {
    return a / b;  // division_without_check: no zero check
}

int main() {
    vector<int> v;  // vector without resize
    int x = v[0];   // vector_index_without_resize: indexing empty vector

    if (x = 5) {    // assignment_in_condition: should be ==
        cout << x;
    }

    int result = divide(10, 0);  // division_by_zero literal

    vector<int> arr = {3, 1, 4, 1, 5};
    int idx = binarySearch(arr, 4);
    bubbleSort(arr);

    return 0;
}
'''

# Simpler code with syntax error only (for quick /analyze test)
SYNTAX_ERROR_CODE = '''
#include <iostream>
int main() {
    int x = 5
    std::cout << x;
    return 0;
}
'''


def call_analyze(code: str, bundle_id: str = "test-dsa") -> dict:
    """Call POST /analyze endpoint."""
    payload = {
        "bundleId": bundle_id,
        "language": "cpp",
        "files": [{"path": "main.cpp", "content": code}],
    }
    resp = httpx.post(f"{BASE_URL}/analyze", json=payload, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


def call_analyze_explain(code: str, bundle_id: str = "test-dsa-explain") -> dict:
    """Call POST /analyze/explain endpoint (requires LLM)."""
    payload = {
        "bundleId": bundle_id,
        "language": "cpp",
        "files": [{"path": "main.cpp", "content": code}],
    }
    resp = httpx.post(f"{BASE_URL}/analyze/explain", json=payload, timeout=120.0)
    resp.raise_for_status()
    return resp.json()


def main():
    print("=" * 60)
    print("Intelligence Engine - API Test")
    print("=" * 60)

    # Health check
    try:
        r = httpx.get(f"{BASE_URL}/health", timeout=5.0)
        r.raise_for_status()
        print("\n[OK] Service is running:", r.json())
    except httpx.ConnectError:
        print("\n[ERROR] Cannot connect. Start the service: uvicorn app.main:app --reload")
        return 1

    # Test /analyze with syntax error
    print("\n" + "-" * 60)
    print("1. POST /analyze (syntax error)")
    print("-" * 60)
    result = call_analyze(SYNTAX_ERROR_CODE, "test-syntax")
    print(f"bundleId: {result['bundleId']}")
    print(f"Issues: {len(result['issues'])}")
    for i, issue in enumerate(result["issues"], 1):
        print(f"  {i}. [{issue.get('severity')}] {issue.get('type')}: {issue.get('message')} (line {issue.get('line')})")

    # Test /analyze with buggy DSA code
    print("\n" + "-" * 60)
    print("2. POST /analyze (buggy DSA code)")
    print("-" * 60)
    result = call_analyze(BUGGY_CPP_CODE, "test-dsa")
    print(f"bundleId: {result['bundleId']}")
    print(f"Issues: {len(result['issues'])}")
    for i, issue in enumerate(result["issues"], 1):
        src = issue.get("source", "")
        print(f"  {i}. [{issue.get('severity')}] {issue.get('type')} ({src}): {issue.get('message')[:60]}... (line {issue.get('line')})")

    # Test /analyze/explain (optional, needs LLM)
    print("\n" + "-" * 60)
    print("3. POST /analyze/explain (requires LLM)")
    print("-" * 60)
    try:
        result = call_analyze_explain(BUGGY_CPP_CODE)
        print(f"bundleId: {result['bundleId']}")
        print(f"Summary: {result['summary']}")
        print(f"Findings: {len(result['findings'])}")
        for i, f in enumerate(result["findings"][:3], 1):
            print(f"  {i}. [{f.get('category')}] {f.get('issue')[:50]}...")
        if result.get("final_solution"):
            print(f"final_solution: {result['final_solution'][:80]}...")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 503:
            print("  [SKIP] LLM unavailable (503). Set LLM_PROVIDER and run Ollama or provide GEMINI_API_KEY.")
        else:
            raise

    print("\n" + "=" * 60)
    print("Done")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    exit(main())
