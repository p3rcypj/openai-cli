import { readFile } from "fs/promises";

export async function getFile(filePath: string) {
    try {
        const data = await readFile(filePath, "utf8");
        return data;
    } catch (err) {
        console.error("Error reading file:", err);
    }
}
