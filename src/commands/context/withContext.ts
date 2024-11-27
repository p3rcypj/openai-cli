import { command, option, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    extractJson,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { pickFileFromAnalysis } from "./pickFileFromAnalysis";
import { fromMarkdown } from "../file-types/markdown";
import { getFile } from "../../actions/getFile";

const defaults = {
    maxTokens: 50000, // counts also analysis file
    model: "gpt-4o-mini",
    temperature: 0.3, // also affects the analysis file (behavior should be changed)
};

const cmd = command({
    name: "withContext",
    description:
        "Ask something to OpenAI API LLM based on a specific pre-analyzed context. Use of /v1/chat/completions endpoint.",
    version: "0.0.1",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        analysis: option({
            type: string,
            long: "file",
            short: "f",
            description: "The analysis JSON file.",
        }),
        prompt: positional({
            type: string,
            displayName: "prompt",
            description:
                "The input or instruction for the LLM to initiate or guide the interaction using the specific context provided.",
        }),
    },
    handler: async (args: Args) => {
        const completions = Completions.fromArgs(args, defaults);
        const file = await pickFileFromAnalysis(args, completions);
        const json = extractJson<{ relevantFile: string; otherFiles: string[] }>(file.message);

        const markdown = await getFile(json.relevantFile);
        if (!markdown) throw new Error("Error reading context file.");

        const res = await fromMarkdown(args.prompt, completions, markdown);

        console.log(args.stats ? res : res.message);
    },
});

type Args = OpenAIArgs & CompletionsArgs & { analysis: string; prompt: string };

export default cmd;
