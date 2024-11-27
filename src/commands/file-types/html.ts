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
        "You are a helpful assistant that specializes in processing and analyzing HTML content, particularly the content within the `<body>` tag. You can extract text, summarize content, answer questions based on the information provided, reformat the structure, or generate new HTML based on user requirements. Focus on interpreting semantic meaning from tags (e.g., `<h1>`, `<p>`, `<ul>`) and handle the content clearly and efficiently. Respond concisely, maintain HTML integrity, and provide step-by-step outputs when needed.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.1,
};

// HTML intended to be the body with <style> and <script> tags removed for simplicity with addition of some <head> tags that add metadata context.
export async function fromHtml(prompt: string, completions: Completions, html: string) {
    const messages: Message[] = [
        tone,
        {
            role: "user",
            content:
                "You ignore text that is not relevant for the user. For example you will ignore the cookies consent banner, advertisements, navigation, and footer.",
        },
        {
            role: "user",
            content: "User query: " + prompt,
        },
        {
            role: "user",
            content: "```html\n" + html + "\n```",
        },
    ];

    const res = await completions.create(messages);

    return res;
}

const cmd = command({
    name: "html",
    description:
        "Ask to OpenAI API LLM based on a given context in HTML format. Use of /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["md"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        context: option({
            type: string,
            long: "input",
            short: "i",
            description: "The HTML file path to use as context for the prompt.",
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The input or instruction for the LLM to initiate or guide the interaction using the provided HTML context.",
                "This input can take various forms, such as a question, command, statement, or request for information. Creativity in this prompt is almost completely limited to the context provided.",
                "",
                "For example:",
                '  - A question (e.g., "What is the capital of France based on the provided HTML?")',
                '  - A command (e.g., "Translate the provided HTML.")',
                '  - A statement (e.g., "Summarize the provided HTML context.")',
            ]),
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const html = await getFile(args.context);
        if (!html) throw new Error("Error reading context file.");
        const res = await fromHtml(args.prompt, completions, html);
        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; context: string };

export default cmd;
