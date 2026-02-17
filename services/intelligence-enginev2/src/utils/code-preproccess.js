export function numberLines(code) {
    return code
        .split("\n")
        .map((line, i) => `${i + 1}: ${line}`)
        .join("\n");
}
