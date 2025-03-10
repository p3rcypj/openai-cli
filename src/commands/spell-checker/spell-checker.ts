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
        "You are a grammar assistant. Check the spelling, grammar, and punctuation of the following text accurately and provide corrections if necessary.",
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
    name: "spell-checker",
    description:
        "Check spelling, grammar, and punctuation using the OpenAI API LLM. Utilizes the /v1/chat/completions endpoint.",
    version: "0.1.0",
    aliases: ["sc", "spell-checker"],
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description: indentedDescription([
                "The text to be checked for spelling, grammar, and punctuation errors by the LLM.",
                "Provide the text or phrase that you want to check for errors.",
                "",
                "For example:",
                '  - A phrase (e.g., "Helo, how are you?")',
                '  - A sentence (e.g., "Pleese check this sentence.")',
                '  - A paragraph (e.g., "Check this paragraph for errors.")',
            ]),
        }),
    },
    handler: handler,
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string };

export default cmd;
