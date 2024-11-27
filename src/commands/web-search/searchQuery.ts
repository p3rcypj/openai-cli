import { command, positional, string } from "cmd-ts";
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
        "You are a helpful assistant that finds the best web search query for a search engine. You explicitly answer 'Searching the web for: ' and the query you think will fit best based on what the user has asked you.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.6,
};

export async function getSearchQuery(args: Args, completions: Completions) {
    const messages: Message[] = [
        tone,
        { role: "user", content: `Today is: ${new Date().toISOString().split("T")[0]}` },
        { role: "user", content: args.prompt },
    ];
    return completions.create(messages);
}

const cmd = command({
    name: "searchQuery",
    description: "Ask something to OpenAI API LLM to get the best web search query.",
    version: "0.1.0",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description:
                "The input or instruction for the LLM to initiate or guide the interaction.",
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const res = await getSearchQuery(args, completions);
        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; outputDirectory?: string };

export default cmd;
