import "dotenv/config";
import jwt from "jsonwebtoken";
import prisma from "../src/config/prisma.js";

const BASE_URL = process.env.ANALYSIS_SERVICE_URL || `http://localhost:${process.env.PORT || 4000}`;
const ENGINE_URL = process.env.ANALYSIS_ENGINE_URL || "http://localhost:5000/code_review";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function logStep(title, payload) {
    console.log(`\n=== ${title} ===`);
    console.log(JSON.stringify(payload, null, 2));
}

async function requestJson(path, method, token, body) {
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    let json = null;
    try {
        json = await response.json();
    } catch {
        json = null;
    }

    if (!response.ok) {
        throw new Error(`Request failed ${method} ${path}: ${response.status} ${JSON.stringify(json)}`);
    }

    return json;
}

async function run() {
    console.log(`Using analyzer service: ${BASE_URL}`);
    console.log(`Using analysis engine: ${ENGINE_URL}`);

    const userId = "44444444-4444-4444-4444-444444444444";
    const token = jwt.sign(
        {
            sub: userId,
            role: "student",
            plan: "free",
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
    const file_code = `
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
    const createPayload = {
        name: "Flow Test Playground",
        sourceType: "upload",
        files: [
            {
                name: "problem1.cpp",
                language: "cpp",
                storagePath: `inline://${encodeURIComponent(file_code)}`,
            },
        ],
    };

    const createdPlayground = await requestJson("/api/v1/analysis/playgrounds", "POST", token, createPayload);
    logStep("Create playground", createdPlayground);

    const listedPlaygrounds = await requestJson("/api/v1/analysis/playgrounds", "GET", token);
    logStep("List playgrounds", listedPlaygrounds);

    const listedFiles = await requestJson(
        `/api/v1/analysis/playgrounds/${createdPlayground.id}/files`,
        "GET",
        token
    );
    logStep("Upload file (verified by list files)", listedFiles);

    if (!Array.isArray(listedFiles) || listedFiles.length === 0) {
        throw new Error("No files were created for playground");
    }

    const fileId = listedFiles[0].id;

    const analysisResponse = await requestJson(
        `/api/v1/analysis/playgrounds/${createdPlayground.id}/files/${fileId}/analyze`,
        "POST",
        token
    );
    logStep("Analyze file (engine call response)", analysisResponse);

    const jobInDb = await prisma.analysisJob.findUnique({
        where: { id: analysisResponse.jobId },
        select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            errorMessage: true,
        },
    });

    const resultInDb = await prisma.analysisResult.findFirst({
        where: { jobId: analysisResponse.jobId },
        select: {
            id: true,
            jobId: true,
            summary: true,
            findings: true,
            createdAt: true,
        },
    });

    logStep("Engine runs -> Result stored -> Job completed (DB verification)", {
        job: jobInDb,
        result: resultInDb,
    });

    if (!jobInDb) {
        throw new Error("Job not found in DB");
    }

    if (jobInDb.status !== "completed") {
        throw new Error(`Expected completed job, got ${jobInDb.status}`);
    }

    if (!resultInDb) {
        throw new Error("Result not found in DB");
    }

    console.log("\n✅ Project flow test passed");
}

run()
    .catch((error) => {
        console.error("\n❌ Project flow test failed");
        console.error(error.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
