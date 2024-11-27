import _ from "lodash";
import { command, positional, string } from "cmd-ts";
import {
    CompletionsArgs,
    extractJsonV2,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
    sequential,
} from "../../common/cli";
import { Completions } from "../../common/completions";
import { Message } from "../../common/cli";
import {
    getSearchEngineResults,
    SearchResult,
    wantsToSearchWeb,
} from "../../actions/getSearchEngineResults";
import { getSearchQuery } from "./searchQuery";
import { getRankedResults } from "./rank";
import { scrapeWebPage } from "../../actions/scrapeWebPage";
import { fromHtml } from "../file-types/html";

const tone: Message = {
    role: "system",
    content:
        "You are a helpful assistant that combines information from multiple similar texts or articles. Your job is to understand the similarities between the texts and identify the details that might be only found in one of the texts. Therefore, you will use that knowledge to directly address the user's needs. Accuracy is key and long explanations might be useful. Answer with rich and detailed paragraphs.",
};

const defaults = {
    maxTokens: 500000,
    model: "gpt-4o-mini",
    temperature: 0.4,
};

export async function summarize(
    prompt: string,
    completions: Completions,
    processedDocuments: string[]
) {
    const messages: Message[] = [
        tone,
        { role: "user", content: "User query: " + prompt },
        ...processedDocuments.map(doc => ({
            role: "user" as const,
            content: doc,
        })),
    ];

    return completions.create(messages);
}

const cmd = command({
    name: "web",
    description:
        "Ask to OpenAI API LLM using real web search and the HTML documents. Use of /v1/chat/completions endpoint.",
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
        const prompt = args.prompt;
        const completions = Completions.fromArgs(args, defaults);
        //change model should return completions object instead of mutating it
        completions.changeModel("gpt-4o-mini");
        const queryResponse = await getSearchQuery(args, completions);
        console.log(queryResponse.message);

        if (wantsToSearchWeb(queryResponse.message)) {
            const results = await getSearchEngineResults(queryResponse.message);
            const rankResponse = await getRankedResults(args, completions, results);
            const rankedResults = extractJsonV2<SearchResult[]>(rankResponse.message);

            const requests = rankedResults.map(r => async () => ({
                ...r,
                html: await scrapeWebPage(r.url),
            }));

            const documents = await sequential(requests, (r, ms) =>
                console.log(`Fetched: ${r.url}. Done in ${ms}ms.`)
            );

            const processedDocuments = await sequential(
                documents.map(doc => async () => fromHtml(prompt, completions, doc.html)),
                () => {}
            ).then(responses => responses.map(r => r.message));

            completions.changeModel("gpt-4o");
            const summaryResponse = await summarize(prompt, completions, processedDocuments);

            console.log(`\n${summaryResponse.message}`);
            console.log("\nSources:", _.uniq(rankedResults.map(r => r.domain)).join(", "));
            console.log("URLs:", rankedResults.map(r => r.url).join(", "));
            console.log("\nTokens used:", completions.getUsedTokens());
        } else {
            console.log(
                "The LLM answer didn't meet the criteria in order to search the web. Please try again."
            );

            console.log("LLM answer: ", queryResponse.message);
        }
    },
});

type Args = OpenAIArgs & CompletionsArgs & { prompt: string; outputDirectory?: string };

export default cmd;
