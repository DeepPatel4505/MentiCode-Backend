export async function runModel(prompt) {
    console.log("Sending prompt to model...");

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "qwen3:8b",
            prompt,
            temperature: 0,
            top_p: 1,
            top_k: 40,
            stream: false,
            num_predict: 400,
        }),
    });

    const data = await response.json();
    return data.response;
}
