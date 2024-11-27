import { command, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    indentedDescription,
    OpenAIArgs,
} from "../common/cli";
import { Completions } from "../common/completions";
import { Message } from "../common/cli";

const tone: Message = { role: "system", content: "You are a helpful assistant." };

const defaults = {
    maxTokens: 1000,
    model: "gpt-4o-mini",
    temperature: 0.5,
};

async function handler(args: Args) {
    const completions = Completions.fromArgs(args, defaults);

    const messages: Message[] = [tone, { role: "user", content: args.prompt }];
    const res = await completions.create(messages);

    console.log(args.stats ? res : res.message);
}

const cmd = command({
    name: "generic",
    description: "Ask to OpenAI API LLM. Use of /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["g", "ask", "completions"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The input or instruction for the LLM to initiate or guide the interaction.",
                "This input can take various forms, such as a question, command, statement, or request for information or creativity.",
                "",
                "For example:",
                '  - A question (e.g., "What is the capital of France?")',
                '  - A command (e.g., "Translate this text.")',
                '  - A statement (e.g., "Tell me about the weather.")',
                '  - A request for creativity (e.g., "Write a short story about a dragon.")',
            ]),
        }),
    },
    handler: handler,
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string };

export default cmd;
