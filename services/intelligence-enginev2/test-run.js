// test-run.js

import { analyze } from "./src/core/pipeline.js";

async function runTest() {
    const sampleCode = `
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
`;

    try {
        const result = await analyze(sampleCode);

        console.log("=== ANALYSIS RESULT ===");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error running analysis:");
        console.error(error);
    }
}

runTest();
