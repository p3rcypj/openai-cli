import { command, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    indentedDescription,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { Message } from "../../common/cli";

const tone: Message = {
    role: "system",
    content:
        "You are a translation assistant. Translate the following words and phrases from one language to another accurately and contextually. From Spanish to English.",
};

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
    name: "translate-spanish-english",
    description:
        "Translate text using the OpenAI API LLM. Utilizes the /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["t-es-en", "translate-spanish-english"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The text to be translated by the LLM.",
                "Provide the text or phrase that you want to translate from one language to another.",
                "",
                "For example:",
                '  - A phrase (e.g., "Hello, how are you?")',
                '  - A sentence (e.g., "Please translate this sentence.")',
                '  - A paragraph (e.g., "Translate this paragraph.")',
            ]),
        }),
    },
    handler: handler,
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string };

export default cmd;
