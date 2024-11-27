import { command, option, string } from "cmd-ts";
import {
    CompletionsArgs,
    getCompletionsOptions,
    getOpenAIOptions,
    OpenAIArgs,
    sequential,
} from "../../common/cli";
import { getAllMarkdownFiles } from "./getAllMarkdownFiles";
import { extractMetadataFromMarkdown } from "./extractMetadataFromMarkdown";
import { writeFile } from "fs/promises";
import { Completions } from "../../common/completions";

const defaults = {
    maxTokens: 50000,
    model: "gpt-4o-mini",
    temperature: 0.2,
};

async function handler(args: Args) {
    const files = getAllMarkdownFiles(args.directory);

    // README.md and the index.md don't give relevant information
    const filteredFiles = files.filter(
        file => !file.includes("README.md") && !file.includes("index.md")
    );

    const completions = Completions.fromArgs(args, defaults);

    const responses = filteredFiles.map(
        file => () =>
            extractMetadataFromMarkdown({ ...args, context: file }, completions).then(res => ({
                file,
                res,
            }))
    );

    const data = await sequential(responses, ({ file, res }, ms) =>
        console.log(`File: ${file}. Done in ${ms}ms. Tokens: ${res.tokens.total}`)
    );

    writeFile(args.output, JSON.stringify(data, null, 2));

    console.log(
        `Analysis extraction completed. Files analyzed: ${data.length}. Data written in ${args.output}`
    );
    console.log(`Tokens used: ${data.map(d => d.res.tokens.total).reduce((a, b) => a + b, 0)}`);
}

const cmd = command({
    name: "extractMetadataFromDirectoryWithMarkdowns",
    description:
        "Extract structured metadata from a directory with markdown documents to assist in future retrieval based on user queries.",
    version: "0.0.1",
    args: {
        ...getOpenAIOptions(),
        ...getCompletionsOptions(defaults),
        directory: option({
            type: string,
            long: "directory",
            short: "d",
            description: "The directory path where the markdown files are located (tree).",
        }),
        output: option({
            type: string,
            long: "output",
            short: "o",
            description: "The output file path to save the metadata extraction results.",
        }),
    },
    handler: handler,
});

type Args = OpenAIArgs & CompletionsArgs & { directory: string; output: string };

export default cmd;
