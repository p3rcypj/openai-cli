import { readFile } from "fs/promises";
import { command, option, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    extractJson,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { Message } from "../../common/cli";

const tone: Message = {
    role: "system",
    content:
        "You are an assistant that selects the most relevant document from a list of pre-analyzed files based on a user's query. You have access to metadata for each document, including its purpose, key topics, relevant entities, structure, summary, thematic classification, and relevance scores for specific answers, background research, and technical references. Your task is to compare the user's query with this metadata and identify the document or documents that best match the user's needs, explaining why they are the most relevant.",
};

const secondTone: Message = {
    role: "system",
    content:
        "You are an assistant that finds the exact pathname of a file from a text referencing from it. You have a list of filenames. You answer in JSON format following this structure ```json\n{relevantFile: string, otherFiles: [...]}\n```",
};

const defaults = {
    maxTokens: 50000, //intended per file, not for all files
    model: "gpt-4o-mini",
    temperature: 0.2,
};

async function getContext(filePath: string) {
    try {
        const data = await readFile(filePath, "utf8");
        return data;
    } catch (err) {
        console.error("Error reading file:", err);
    }
}

export async function pickFileFromAnalysis(args: Args, completions: Completions) {
    const analysisJson = await getContext(args.analysis);
    if (!analysisJson) throw new Error("Error reading analysis file.");

    // use codecs to parse the JSON
    const analysis = (JSON.parse(analysisJson) as { file: string; res: { message: string } }[]).map(
        ({ file, res }) => ({ file, message: res.message })
    );
    const filenames = analysis.map(({ file }) => file);

    const messages: Message[] = [
        tone,
        {
            role: "user",
            content: `Following the user's query: "${args.prompt}", please pick the documents (can be one or more) from the next list of messages that will fit best to answer or follow the user's query`,
        },
        ...analysis.map(({ file, message }) => ({
            role: "user" as const,
            content: `File: ${file}. Metadata: ${message}`,
        })),
    ];

    const midProgress = await completions.create(messages);

    console.log(midProgress.message);

    const res = await completions.create([
        secondTone,
        { role: "user", content: `List of filenames: ${filenames.join(", ")}` },
        { role: "user", content: `Text referencing a file: "${midProgress.message}"` },
    ]);

    return res;
}

const cmd = command({
    name: "pickFileFromAnalysis",
    description:
        "From an analysis JSON file with a set of files with metadata, choose which file will fit the best for the user query.",
    version: "0.0.1",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        analysis: option({
            type: string,
            long: "file",
            short: "f",
            description: "The analysis JSON file.",
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description:
                "The input or instruction for the LLM to initiate or guide the interaction using the specific context provided.",
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const res = await pickFileFromAnalysis(args, completions);
        console.log(
            args.stats
                ? res
                : extractJson<{ relevantFile: string; otherFiles: string[] }>(res.message)
        );
    },
});

type Args = OpenAIArgs & CompletionsArgs & { analysis: string; prompt: string };

export default cmd;
