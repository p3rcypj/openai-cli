import { command, option, optional, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    indentedDescription,
    OpenAIArgs,
} from "../common/cli";
import { Completions } from "../common/completions";
import { Message } from "../common/cli";
import { createFile, wantsToCreateFile } from "../actions/createFile";

const tone: Message = {
    role: "system",
    content:
        "You are a programming assistant focused on solving software development challenges using a specific tech stack that includes Node.js, TypeScript, React, and Material-UI v4 for the UI components. You always use functional programming paradigm, and you follow Clean Architecture principles. You provide precise and concise suggestions for code, optimization, and debugging. When responding, consider current coding style (if provided), code conventions, good practices, and clean architecture patterns. Use examples and code snippets relevant to this stack when necessary. Your knowledge is based on practical examples, Stack Overflow solutions, official documentation, and best practices in modern software development.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.5,
};

async function copilot(args: Args, completions: Completions) {
    const messages: Message[] = [
        tone,
        {
            role: "user",
            content:
                "You also have the hability to create files. Depending on the user query, you might want to create a file.",
        },
        {
            role: "user",
            content: "If you want to create files, strict output only the file you want to create.",
        },
        {
            role: "user",
            content: "If you want to add explanations, add them as comments in the code.",
        },
        { role: "user", content: args.prompt },
    ];

    return completions.create(messages);
}

const cmd = command({
    name: "copilot",
    description: "Ask something to OpenAI API LLM with software development context as Copilot.",
    version: "0.1.0",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        outputDirectory: option({
            type: optional(string),
            long: "outputDirectory",
            short: "d",
            description: `Directory where the output file will be saved.`,
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The input or instruction for the LLM to initiate or guide the interaction.",
                "This input can take various forms, such as a question, command, statement, or request for information or creativity.",
                "",
                "For example:",
                "  - Write a React component that fetches data from an API and displays it in a list.",
                "  - Optimize the following code snippet to improve performance.",
                "  - Explain the difference between a function and a method in JavaScript.",
            ]),
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const res = await copilot(args, completions);
        if (wantsToCreateFile(res.message))
            await createFile({
                previousPrompt: args.prompt,
                answer: res.message,
                completions: completions,
                outputDirectory: args.outputDirectory,
            });
        else console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; outputDirectory?: string };

export default cmd;
