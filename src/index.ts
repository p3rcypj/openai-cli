import { run, subcommands } from "cmd-ts";
import { multilineDescription, topicsDescription } from "./common/cli";
import genericCmd from "./commands/generic";
import markdownCmd from "./commands/file-types/markdown";
import htmlCmd from "./commands/file-types/html";
import extractMdCmd from "./commands/context/extractMetadataFromMarkdown";
import extractMdDirectoryCmd from "./commands/context/extractMetadataFromDirectoryWithMarkdowns";
import pickFileFromAnalysisCmd from "./commands/context/pickFileFromAnalysis";
import withContextCmd from "./commands/context/withContext";
import copilotCmd from "./commands/copilot";
import searchQueryCmd from "./commands/web-search/searchQuery";
import surfCmd from "./commands/web-search/surf";
import rankCmd from "./commands/web-search/rank";
import webCmd from "./commands/web-search/web";
import helloWorldCmd from "./commands/hello-world";

const topics = [
    {
        title: "TERMS AND POLICIES",
        description: ["Legal stuff: https://openai.com/policies/"],
    },
    {
        title: "DATA PRIVACY",
        description: [
            "Default data retention: https://platform.openai.com/docs/models/default-usage-policies-by-endpoint",
            "Is the data passed into the API stored? https://platform.openai.com/docs/guides/text-generation/do-you-store-the-data-that-is-passed-into-the-api",
            "Privacy policy: https://openai.com/policies/privacy-policy/",
            "Europe privacy policy (EEA, Switzerland, or UK): https://openai.com/policies/eu-privacy-policy/",
            "GPTs Data Privacy FAQs: https://help.openai.com/en/articles/8554402-gpts-data-privacy-faqs",
        ],
    },
    {
        title: "TOKENS",
        description: [
            "Tokens key concept: https://platform.openai.com/docs/concepts/tokens.",
            "More info (managing tokens): https://platform.openai.com/docs/advanced-usage/managing-tokens",
        ],
    },
    {
        title: "MODELS",
        description: [
            "Models: https://platform.openai.com/docs/models",
            "List of models for completions endpoint: https://platform.openai.com/docs/models/model-endpoint-compatibility",
        ],
    },
    {
        title: "TEMPERATURE",
        description:
            "How should I set the temperature parameter? https://platform.openai.com/docs/guides/text-generation/how-should-i-set-the-temperature-parameter",
    },
    {
        title: "PROMPT ENGINEERING",
        description:
            "Prompt engineering guide: https://platform.openai.com/docs/guides/prompt-engineering/prompt-engineering",
    },
    {
        title: "PRICING",
        description: "Pricing for each model: https://openai.com/api/pricing/",
    },
];

function main() {
    const cliSubcommands = subcommands({
        name: "openai",
        description: multilineDescription([
            "Command-line interface to interact with OpenAI's JavaScript/TypeScript API",
            "  Privacy Note: OpenAI states that messages sent to the API are not collected or stored beyond the retention period used as a prevention method against abuse.",
            "",
            topicsDescription(topics),
        ]),
        version: "0.0.1",
        cmds: {
            helloWorld: helloWorldCmd,
            generic: genericCmd,
            html: htmlCmd,
            markdown: markdownCmd,
            extractMetadataFromMarkdown: extractMdCmd,
            extractMetadataFromDirectoryWithMarkdowns: extractMdDirectoryCmd,
            pickFileFromAnalysis: pickFileFromAnalysisCmd,
            withContext: withContextCmd,
            copilot: copilotCmd,
            searchQuery: searchQueryCmd,
            surf: surfCmd,
            rank: rankCmd,
            web: webCmd,
        },
    });

    const args = process.argv.slice(2);
    run(cliSubcommands, args);
}

main();
