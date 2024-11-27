import { command } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../common/cli";
import { Completions } from "../common/completions";
import { Message } from "../common/cli";

const tone: Message = { role: "system", content: "You are a helpful assistant." };

const defaults = {
    maxTokens: 500,
    model: "gpt-4o-mini",
    temperature: 1,
};

async function handler(args: Args) {
    const completions = Completions.fromArgs(args, defaults);

    const messages: Message[] = [tone, { role: "user", content: "Hello world!" }];
    const res = await completions.create(messages);

    console.log(args.stats ? res : res.message);
}

const cmd = command({
    name: "hello-world",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
    },
    handler: handler,
});

type Args = OpenAIArgs & CompletionsArgs;

export default cmd;
