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

// Hint (spanish): https://chatgpt.com/share/67467337-7d3c-8008-985a-602177c51a9c
const tone: Message = {
    role: "system",
    content:
        "You are a helpful assistant that specializes in processing Markdown files. You excel at tasks such as summarizing, answering questions, generating structured outputs, converting formats, and improving content. Respond clearly, concisely, and with step-by-step instructions when necessary. Adopt a neutral and professional tone unless instructed otherwise.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.1,
};

export async function fromMarkdown(prompt: string, completions: Completions, markdown: string) {
    const formattedPrompt = prompt.slice(-1).match(/[.!?]/) ? prompt : prompt + ".";
    const messages: Message[] = [
        tone,
        {
            role: "user",
            content: formattedPrompt + " Markdown content: \n```markdown\n" + markdown + "\n```",
        },
    ];
    const res = await completions.create(messages);

    return res;
}

const cmd = command({
    name: "markdown",
    description:
        "Ask to OpenAI API LLM based on a given context in markdown format. Use of /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["md"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        context: option({
            type: string,
            long: "input",
            short: "i",
            description: "The markdown file path to use as context for the prompt.",
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The input or instruction for the LLM to initiate or guide the interaction using the provided markdown context.",
                "This input can take various forms, such as a question, command, statement, or request for information. Creativity in this prompt is almost completely limited to the context provided.",
                "",
                "For example:",
                '  - A question (e.g., "What is the capital of France based on the provided markdown?")',
                '  - A command (e.g., "Translate the provided markdown text.")',
                '  - A statement (e.g., "Summarize the provided markdown context.")',
            ]),
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const markdown = await getFile(args.context);
        if (!markdown) throw new Error("Error reading context file.");
        const res = await fromMarkdown(args.prompt, completions, markdown);

        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; context: string };

export default cmd;
