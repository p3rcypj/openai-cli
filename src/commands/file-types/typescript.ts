import { command, option, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    indentedDescription,
    OpenAIArgs,
} from "../../common/cli";
import { Message } from "../../common/cli";
import { Completions } from "../../common/completions";
import { getFile } from "../../actions/getFile";

const tone: Message = {
    role: "system",
    content:
        "You are a helpful assistant that specializes in analyzing, debugging, and generating TypeScript code. You are proficient in TypeScript syntax, semantics, and best practices, and you can assist with tasks such as explaining code, fixing errors, optimizing performance, or refactoring code for better readability and maintainability. Focus on clean, idiomatic TypeScript, ensuring adherence to modern practices like strict typing and functional programming paradigms when applicable. Provide clear, step-by-step guidance and include comments or explanations when needed.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.1,
};

export async function fromTypescript(args: Args, completions: Completions, ts: string) {
    const messages: Message[] = [
        tone,
        {
            role: "user",
            content: args.prompt,
        },
        {
            role: "user",
            content: "```typescript\n" + ts + "\n```",
        },
    ];

    const res = await completions.create(messages);

    return res;
}

const cmd = command({
    name: "html",
    description:
        "Ask to OpenAI API LLM based on a given context in TypeScript format. Use of /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["md"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        context: option({
            type: string,
            long: "input",
            short: "i",
            description: "The TS file path to use as context for the prompt.",
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The input or instruction for the LLM to initiate or guide the interaction using the provided TypeScript context.",
                "This input can take various forms, such as a question, command, statement, or request for information. Creativity in this prompt is almost completely limited to the context provided.",
                "",
                "For example:",
                '  - A question (e.g., "What is the purpose of the provided TypeScript code?")',
                '  - A command (e.g., "Fix the TypeScript code to remove the syntax error.")',
                '  - A statement (e.g., "Explain the TypeScript code and its functionality.")',
            ]),
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const html = await getFile(args.context);
        if (!html) throw new Error("Error reading context file.");
        const res = await fromTypescript(args, completions, html);
        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; context: string };

export default cmd;
