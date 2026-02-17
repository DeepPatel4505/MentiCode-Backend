# Intelligence Engine v2 - Implementation Summary

## Project Overview
Intelligence Engine v2 is a Node.js-based AI-powered code analysis service that leverages large language models to detect, validate, and explain code issues. The service runs on port 4002 and exposes a REST API for code analysis.

## Architecture

### Core Components

#### 1. **Pipeline** (`src/core/pipeline.js`)
- **Main Entry Point**: `analyze(code)` function
- **Workflow**:
  1. Preprocesses code by adding line numbers
  2. Runs detection stage to identify potential issues
  3. Validates detection results
  4. Explains findings with detailed context
- **Output**: Structured findings with details and confidence scores

#### 2. **Model Client** (`src/core/model-client.js`)
- **Purpose**: Interface with Ollama LLM service
- **Configuration**:
  - Model: `qwen:8b`
  - Endpoint: `http://localhost:11434/api/generate`
  - Temperature: 0 (deterministic)
  - Top P: 1, Top K: 40
- **Function**: `runModel(prompt)` - sends prompts to LLM and returns responses

#### 3. **Validator** (`src/core/validator.js`)
- **Purpose**: Validates and sanitizes LLM output
- **Validation Steps**:
  1. Safe JSON parsing with fallback handling
  2. Schema validation using Zod
  3. Line range validation (ensures ranges fit within code)
  4. Confidence threshold filtering (minimum 0.6 by default)
  5. Duplicate removal (based on category, line range, and issue)
  6. Result capping (max 8 findings by default)
- **Output**: Cleaned findings array

#### 4. **Schema Definitions** (`src/core/schema/`)
- `detect.schema.js` - Detection output schema
- `validate.schema.js` - Validation output schema
- `explain.schema.js` - Explanation output schema
- `final.schema.js` - Final combined findings schema
- All schemas validated using Zod library

### Utility Modules

#### 1. **Retry Handler** (`src/utils/retry.js`)
- **Function**: `safeRun(prompt, schema)`
- **Features**:
  - Retries up to 2 times on failure
  - JSON parsing with error handling
  - Schema validation on each attempt
  - Returns empty findings array on complete failure
- **Purpose**: Ensures resilience against LLM parsing failures

#### 2. **Code Preprocessor** (`src/utils/code-preproccess.js`)
- **Function**: `numberLines(code)`
- **Purpose**: Adds line numbers to code for precise issue location
- **Format**: `1: code line`, `2: code line`, etc.

### Prompt Modules

The service uses specialized prompts for each analysis stage:

- `prompts/detect.js` - Detection prompt building
- `prompts/validate.js` - Validation prompt building
- `prompts/explain.js` - Explanation prompt building

## API Endpoints

### POST `/analyze`
**Request Body**:
```json
{
  "language": "javascript",
  "code": "// code to analyze"
}
```

**Response**:
```json
{
  "findings": [
    {
      "category": "string",
      "issue": "string",
      "line_range": [start, end],
      "confidence": 0.0-1.0,
      "explanation": "string"
    }
  ]
}
```

## Data Flow

```
Input Code
    ↓
[Preprocess] - Add line numbers
    ↓
[Detect] - Identify potential issues (LLM + Schema Validation)
    ↓
[Validate] - Confirm and refine findings (LLM + Schema Validation)
    ↓
[Explain] - Generate detailed explanations (LLM + Schema Validation)
    ↓
[Output] - Structured findings with confidence scores
```

## Key Features

1. **Multi-Stage Analysis**: Detection → Validation → Explanation pipeline
2. **Resilient Error Handling**: Retry logic and graceful fallbacks
3. **Output Sanitization**: JSON parsing, schema validation, duplicate removal
4. **Configurable Thresholds**: Confidence levels, max findings count
5. **Line Precision**: Accurate code issue location using line numbering
6. **Deterministic Results**: Temperature set to 0 for consistent outputs

## Technology Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **LLM Engine**: Ollama (qwen:8b model)
- **Validation**: Zod (schema validation)
- **HTTP**: Native fetch API

## Configuration

### Ollama Service
- Address: `http://localhost:11434`
- Model: `qwen:8b`
- Must be running for the service to function

### Analysis Options
- **minConfidence**: 0.6 (default)
- **maxFindings**: 8 (default)
- **totalLines**: Automatically calculated from input code

## Error Handling

1. **Failed LLM Response**: Retries up to 2 times, then returns empty findings
2. **Invalid JSON**: Safely caught and handled, returns empty findings
3. **Schema Validation Failure**: Filtered or excluded from results
4. **Invalid Line Ranges**: Removed from results
5. **Low Confidence Findings**: Filtered based on threshold

## Deployment Notes

- Service runs on port **4002**
- Requires Ollama service running on localhost:11434
- Uses CommonJS module system
- Expects Express.js and Zod as dependencies
