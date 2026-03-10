# Ollama API Proxy - Swagger UI Guide

This guide provides complete documentation for interacting with the Large Language Model (LLM) through the Swagger UI interface of the Ollama Proxy API. Since you're not using the frontend chat interface, this guide focuses on programmatic access via the API documentation.

## Prerequisites

1. **Running the Application**: Ensure the Ollama Proxy API is running (see README.md for setup instructions).
2. **API Key**: You need a valid API key or JWT token for authentication.
   - Register at `http://localhost:8000/chat` and create an API key in the sidebar.
   - Or obtain a JWT by logging in via the API.

## Accessing Swagger UI

1. Open your browser and navigate to: `http://localhost:8000/docs`
2. The Swagger UI will load, showing all available API endpoints.

## Authentication in Swagger UI

1. Click the **"Authorize"** button (green lock icon) in the top-right corner.
2. In the authorization modal, you have two options:
   - **BearerAuth**: Enter your API key directly (without "Bearer " prefix)
   - **X-API-Key**: Enter your API key in the header field
3. Click **"Authorize"** to apply the authentication.
4. Close the modal. All subsequent requests will include your authentication.

## Available LLM Endpoints

The proxy forwards requests to Ollama's native API. The main endpoints for LLM interaction are:

### 1. List Available Models (`GET /api/tags`)

Retrieves a list of models available on the Ollama server.

**Swagger Usage:**
- Expand the **Proxy** section
- Click **GET** for the endpoint with path parameter
- Click **"Try it out"**
- In the **path** field, enter: `api/tags`
- Leave the request body empty
- Click **"Execute"**

**Response Example:**
```json
{
  "models": [
    {
      "name": "qwen2.5:3b",
      "modified_at": "2024-01-15T10:30:00Z",
      "size": 1918439616,
      "digest": "sha256:...",
      "details": {
        "format": "gguf",
        "family": "qwen2",
        "families": ["qwen2"],
        "parameter_size": "3B",
        "quantization_level": "Q4_0"
      }
    }
  ]
}
```

### 2. Generate Text (`POST /api/generate`)

Generates a completion for a given prompt. This is Ollama's text generation endpoint.

**Swagger Usage:**
- Expand the **Proxy** section
- Click **POST** for the endpoint with path parameter
- Click **"Try it out"**
- In the **path** field, enter: `api/generate`
- In the request body, provide a JSON object with the following structure:

**Request Body Parameters:**
- `model` (string, required): The model name (e.g., "qwen2.5:3b")
- `prompt` (string, required): The text prompt to generate from
- `stream` (boolean, optional): Whether to stream the response. Set to `false` for Swagger UI testing. Default: `false`
- `options` (object, optional): Model parameters like temperature, top_p, etc.

**Example Request Body:**
```json
{
  "model": "qwen2.5:3b",
  "prompt": "Explain quantum computing in simple terms",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "num_predict": 100
  }
}
```

**Response Example (non-streaming):**
```json
{
  "model": "qwen2.5:3b",
  "created_at": "2024-01-15T10:30:00Z",
  "response": "Quantum computing is a type of computing that uses quantum-mechanical phenomena, such as superposition and entanglement, to perform operations on data. Unlike classical computers that use bits (0 or 1), quantum computers use quantum bits or qubits that can exist in multiple states simultaneously.\n\nThis allows quantum computers to process vast amounts of data in parallel and solve certain problems much faster than classical computers. For example, quantum computers could potentially factor large numbers exponentially faster than classical computers, which would break many current encryption schemes.\n\nHowever, quantum computing is still in its early stages and faces significant technical challenges, including error correction and qubit stability.",
  "done": true,
  "done_reason": "stop",
  "context": [123, 456, ...],
  "total_duration": 2500000000,
  "load_duration": 500000000,
  "prompt_eval_count": 8,
  "prompt_eval_duration": 120000000,
  "eval_count": 92,
  "eval_duration": 2300000000
}
```

### 3. Chat Completion (`POST /api/chat`)

Generates a chat completion using the chat format with messages.

**Swagger Usage:**
- Expand the **Proxy** section
- Click **POST** for the endpoint with path parameter
- Click **"Try it out"**
- In the **path** field, enter: `api/chat`
- In the request body, provide a JSON object with the following structure:

**Request Body Parameters:**
- `model` (string, required): The model name (e.g., "qwen2.5:3b")
- `messages` (array, required): Array of message objects with `role` and `content`
- `stream` (boolean, optional): Whether to stream the response. Set to `false` for Swagger UI testing. Default: `false`
- `options` (object, optional): Model parameters

**Message Roles:**
- `system`: System instructions
- `user`: User input
- `assistant`: Assistant response (for multi-turn conversations)

**Example Request Body (Single Turn):**
```json
{
  "model": "qwen2.5:3b",
  "messages": [
    {
      "role": "user",
      "content": "Hello! Can you help me understand machine learning?"
    }
  ],
  "stream": false
}
```

**Example Request Body (Multi-turn Conversation):**
```json
{
  "model": "qwen2.5:3b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant specializing in programming."
    },
    {
      "role": "user",
      "content": "What is Python?"
    },
    {
      "role": "assistant",
      "content": "Python is a high-level programming language known for its simplicity and readability."
    },
    {
      "role": "user",
      "content": "Can you show me a simple example?"
    }
  ],
  "stream": false
}
```

**Response Example (non-streaming):**
```json
{
  "model": "qwen2.5:3b",
  "created_at": "2024-01-15T10:30:00Z",
  "message": {
    "role": "assistant",
    "content": "I'd be happy to help you understand machine learning!\n\nMachine learning is a subset of artificial intelligence (AI) that focuses on creating algorithms and models that can learn patterns from data and make predictions or decisions without being explicitly programmed for every specific task.\n\nThere are three main types of machine learning:\n\n1. **Supervised Learning**: The algorithm learns from labeled training data to make predictions on new, unseen data.\n\n2. **Unsupervised Learning**: The algorithm finds patterns in data without labeled examples.\n\n3. **Reinforcement Learning**: The algorithm learns through trial and error by interacting with an environment.\n\nMachine learning has applications in many fields, including image recognition, natural language processing, recommendation systems, and autonomous vehicles."
  },
  "done": true,
  "total_duration": 3200000000,
  "load_duration": 500000000,
  "prompt_eval_count": 12,
  "prompt_eval_duration": 180000000,
  "eval_count": 156,
  "eval_duration": 2900000000
}
```

## Streaming Responses

For real-time responses, set `"stream": true` in the request body. The response will be in NDJSON format (Newline Delimited JSON).

**Streaming Response Format:**
```
{"model":"qwen2.5:3b","created_at":"2024-01-15T10:30:00Z","message":{"role":"assistant","content":"The"},"done":false}
{"model":"qwen2.5:3b","created_at":"2024-01-15T10:30:00Z","message":{"role":"assistant","content":" sky"},"done":false}
...
{"model":"qwen2.5:3b","created_at":"2024-01-15T10:30:00Z","message":{"role":"assistant","content":"."},"done":false}
{"model":"qwen2.5:3b","created_at":"2024-01-15T10:30:00Z","done":true,"total_duration":2500000000,...}
```

## Advanced Options

You can customize model behavior using the `options` object:

```json
{
  "model": "qwen2.5:3b",
  "prompt": "Write a haiku about programming",
  "stream": false,
  "options": {
    "temperature": 0.8,        // Controls randomness (0.0-1.0)
    "top_p": 0.9,             // Nucleus sampling parameter
    "top_k": 40,              // Top-k sampling parameter
    "num_predict": 50,        // Maximum tokens to generate
    "repeat_penalty": 1.1,    // Penalty for repeating tokens
    "repeat_last_n": 64,      // Last n tokens to consider for repeat penalty
    "seed": 42                // Random seed for reproducible results
  }
}
```

## Error Handling

Common HTTP status codes:
- **200**: Success
- **401**: Unauthorized (invalid or missing API key)
- **404**: Model not found or endpoint not available
- **422**: Invalid request parameters
- **502**: Backend (Ollama) error
- **504**: Request timeout

**Example Error Response:**
```json
{
  "error": {
    "message": "model 'unknown-model' not found, try pulling it first",
    "type": "api_error"
  }
}
```

## Additional Proxy Endpoints

The proxy supports all Ollama API endpoints. Other useful endpoints include:

- `GET /api/version` - Get Ollama version
- `POST /api/show` - Show model information
- `POST /api/copy` - Copy a model
- `DELETE /api/delete` - Delete a model
- `POST /api/pull` - Pull a model
- `POST /api/push` - Push a model

Use the same Swagger UI pattern: set the `path` parameter to the desired endpoint (e.g., "api/version") and provide the appropriate request body if required.

## Programmatic Access

For production use, you can make direct HTTP requests instead of using Swagger UI:

```bash
# Using Bearer token
curl -X POST "http://localhost:8000/api/chat" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:3b",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'

# Using X-API-Key header
curl -X POST "http://localhost:8000/api/chat" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5:3b",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## Troubleshooting

1. **Model not found**: Ensure the model is pulled on the Ollama server
2. **401 Unauthorized**: Verify your API key is correct and properly formatted
3. **Timeout errors**: Large requests may timeout; try smaller prompts or adjust timeout settings
4. **Streaming issues**: Ensure your client can handle NDJSON streaming responses

For more details, refer to the [official Ollama API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md).
