import { flag, number, option, optional, string } from "cmd-ts";

export type OpenAIArgs = {
    apiKey: string;
    organisationID?: string;
};

export function getOpenAIOptions() {
    return {
        apiKey: option({
            type: string,
            long: "apiKey",
            short: "k",
            description: "OpenAI API Key. Create yours at: https://platform.openai.com/api-keys",
        }),
        organizationId: option({
            type: optional(string),
            long: "orgId",
            description:
                "Organisation ID for use cases where the API key is restricted to a specific organisation.",
        }),
    };
}

export type CompletionsArgs = {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stats?: boolean;
};

export function getCompletionsOptions(defaults: {
    maxTokens: number;
    model: string;
    temperature: number;
}) {
    return {
        maxTokens: option({
            type: optional(number),
            long: "tokens",
            short: "t",
            description: `Maximum number of INPUT tokens to spend. Defaults to ${defaults.maxTokens}.`,
            defaultValue: () => defaults.maxTokens,
        }),
        model: option({
            type: optional(string),
            long: "model",
            short: "m",
            description: `One of the model names listed in the v1/chat/completions endpoint. Defaults to ${defaults.model}.`,
            defaultValue: () => defaults.model,
        }),
        temperature: option({
            type: optional(number),
            long: "temperature",
            short: "T",
            description: `Randomness/Creativity value for the LLM output. Higher the value, the more creative the output. Defaults to ${defaults.temperature}.`,
            defaultValue: () => defaults.temperature,
        }),
        stats: flag({
            short: "s",
            long: "stats",
            description: "Show response stats. Defaults to false.",
            defaultValue: () => false,
        }),
    };
}

function getDescriptionLines(s: string | string[]): string[] {
    return Array.isArray(s) ? s : [s];
}

function mapTopic({ title, description }: Topic): string[] {
    return [
        `${title}:`,
        ...getDescriptionLines(description).map(s => `  - ${s}`),
        "", //breakline
    ];
}

export function topicsDescription(topics: Topic[]): string {
    return "  ".concat(topics.map(mapTopic).flat().join("\n  "));
}

export function indentedDescription(description: string[] | string, topics: Topic[] = []): string {
    return getDescriptionLines(description).concat(topics.map(mapTopic).flat()).join("\n\t");
}

export function multilineDescription(description: string[] | string): string {
    return getDescriptionLines(description).join("\n");
}

export function extractJson<T>(jsonString: string): T {
    try {
        const parsedJson = JSON.parse(jsonString.replaceAll("```json", "").replaceAll("```", ""));
        return parsedJson as T;
    } catch (error) {
        console.log(jsonString);
        throw new Error("Invalid JSON string");
    }
}

export function extractJsonV2<T>(jsonString: string): T {
    const regex = /```json\n([\s\S]*)\n```/g;

    const match = jsonString.match(regex);
    const json = match?.[0];
    if (!json) throw new Error("Invalid extracted JSON string");

    try {
        const extract = json.replaceAll(regex, "$1");
        const parsedJson = JSON.parse(extract);

        return parsedJson as T;
    } catch (error) {
        console.log(jsonString);
        throw new Error(error as unknown as string);
    }
}

export async function sequential<T>(
    promiseFactories: (() => Promise<T>)[],
    callback: (p: T, ms: number) => void
): Promise<T[]> {
    const results: T[] = [];

    for (const promiseFactory of promiseFactories) {
        const startTime = Date.now();
        const result = await promiseFactory();
        const endTime = Date.now();

        results.push(result);
        callback(result, endTime - startTime);
    }

    return results;
}

type Topic = {
    title: string;
    description: string[] | string;
};

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};
