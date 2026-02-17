const API_URL = process.env.API_URL || "http://localhost:3000/code_review";

const payload = {
    language: "javascript",
    code: `
function add(a, b) {
  return a + b
}

console.log(add(2, "3"));
`,
};

async function main() {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        console.log("Status:", res.status, res.statusText);

        const text = await res.text();
        try {
            const json = JSON.parse(text);
            console.log("Response JSON:", JSON.stringify(json, null, 2));
        } catch {
            console.log("Raw response:", text);
        }
    } catch (err) {
        console.error("Request failed:", err);
        process.exit(1);
    }
}

main();

