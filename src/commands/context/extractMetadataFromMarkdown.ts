import { readFile } from "fs/promises";
import { command, option, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { Message } from "../../common/cli";

const tone: Message = {
    role: "system",
    content:
        "You are an assistant that processes and extracts relevant information from markdown documents. Your role is to generate structured metadata for each document to assist in future retrieval based on user queries.",
};

// Prompt suggested by ChatGPT 4o: https://chatgpt.com/share/671ad0b5-14ec-8008-a587-369ec198d853
const prompts: Message[] = [
    "Please analyze the provided document and extract the following information.",
    "1. Purpose of the document: Identify the primary purpose of the document. It could be: Instructional (provides step-by-step guidance or how-to instructions), Informative (presents general facts or explanations on a topic), Technical (contains specialized, domain-specific details), Narrative (describes events or tells a story), Descriptive (focuses on detailed descriptions of concepts or objects). Return the identified purpose and a short explanation of why you selected it.",
    "2. Key topics: Extract 5 to 10 key terms or phrases that summarize the main subjects of the document. These should include important concepts or technical terms, and any recurring themes that are central to the document’s content. Provide the terms and a brief rationale for their selection.",
    "3. Relevant entities: Identify and extract any named entities relevant to the document. This includes people, organizations, or companies, important dates or events, key locations or technologies. Return a list of entities with a brief explanation of their relevance to the document.",
    "4. Document structure: Note the document's structure. Identify any sections or headings that break the content into parts. If no clear structure exists, mark it as 'free-form'. Optionally, summarize the content of major sections or headings in 1-2 sentences.",
    "5. Summary of content: Provide a concise summary (3 to 5 sentences) that outlines the document's key points, including the main topic, important arguments or conclusions, and any notable recommendations or results.",
    "6. Thematic classification: Classify the document into one or more thematic categories (e.g., Technology, Health, Science). If it covers multiple topics, assign approximate percentage weights to each category to reflect its distribution.",
    "7. Relevance for potential queries: Rate the document’s potential relevance in the following areas: Specific answers (if the document contains concrete information that can directly answer queries), Background research (if it offers a broader context or overview), Technical reference (if it provides detailed, domain-specific content useful for technical queries). Provide a relevance score from 0 to 1 for each category.",
].map(content => ({ role: "user", content: content }));

const defaults = {
    maxTokens: 50000,
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

export async function extractMetadataFromMarkdown(args: Args, completions: Completions) {
    const markdown = await getContext(args.context);
    if (!markdown) throw new Error("Error reading context file.");

    const messages: Message[] = [
        tone,
        ...prompts,
        {
            role: "user",
            content: "Document in Markdown format: \n```markdown\n" + markdown + "\n```",
        },
    ];
    const res = await completions.create(messages);

    return res;
}

const cmd = command({
    name: "extractMetadataFromMarkdown",
    description:
        "Extract structured metadata from a markdown document to assist in future retrieval based on user queries.",
    version: "0.0.1",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        context: option({
            type: string,
            long: "file",
            short: "f",
            description: "The markdown file path to be analyzed for metadata extraction.",
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const res = await extractMetadataFromMarkdown(args, completions);
        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { context: string };

export default cmd;
