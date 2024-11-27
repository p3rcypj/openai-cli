import { command, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    extractJsonV2,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { Message } from "../../common/cli";
import {
    getSearchEngineResults,
    SearchResult,
    wantsToSearchWeb,
} from "../../actions/getSearchEngineResults";
import { getSearchQuery } from "./searchQuery";

const tone: Message = {
    role: "system",
    content: "You are a helpful assistant that reviews the order of a set of search web results.",
};

const defaults = {
    maxTokens: 10000,
    model: "gpt-4o-mini",
    temperature: 0.6,
};

const pickedResults = "three";

export async function getRankedResults(
    args: Args,
    completions: Completions,
    results: SearchResult[]
) {
    const messages: Message[] = [
        tone,
        {
            role: "user",
            content: `The web results are already ordered by a search engine, but you review if you like the set order. The search results contain: title, url, domain, and description (which might have the date of the webpage document published). Domain site reputation is very important. Discard results with unsafe domains. Based on the user query, and the mentioned metadata you pick the ${pickedResults} best results. You output the results in the same format they were (JSON).`,
        },
        { role: "user", content: "User query: " + args.prompt },
        { role: "user", content: "```json\n" + JSON.stringify(results, null, 2) + "\n```" },
    ];

    return completions.create(messages);
}

const cmd = command({
    name: "rankResults",
    description: "Rank web search results with OpenAI API LLM",
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
            const rankedResults = await getRankedResults(args, completions, results);

            console.log(extractJsonV2<SearchResult[]>(rankedResults.message));
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
