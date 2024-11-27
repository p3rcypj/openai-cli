import { command, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { getSearchQuery } from "./searchQuery";
import { getSearchEngineResults, wantsToSearchWeb } from "../../actions/getSearchEngineResults";

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.6,
};

const cmd = command({
    name: "surf",
    description:
        "Get search results from the web by interpreting user's query into a search engine query using OpenAI API LLM.",
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
        if (wantsToSearchWeb(res.message)) {
            const results = await getSearchEngineResults(res.message);
            console.log(results);
        } else {
            console.log(
                "The LLM answer didn't meet the criteria in order to search the web. Please try again."
            );

            console.log("LLM answer: ", res.message);
        }
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; outputDirectory?: string };

export default cmd;
