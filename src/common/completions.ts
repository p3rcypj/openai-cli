import OpenAI from "openai";
import { countTokens } from "./token";
import { CompletionsArgs, Message, OpenAIArgs } from "./cli";

export class Completions {
    totalTokensUsed: number;
    maxTokens: number;
    model: string;
    temperature: number;
    responses: CompletionsResponse[] = [];
    openai: OpenAI;

    // Rate limits per minute: https://platform.openai.com/account/rate-limits
    // Each model has different limits
    limitRequests = 10_000;
    limitTokens = 200_000; // 200k 4o-mini, 30k 4o

    private requestsCount = 0;
    private tokensCount = 0;
    private resetTime = Date.now() + 60 * 1000; // 1 minute

    constructor(params: { maxTokens: number; model: string; temperature: number; openai: OpenAI }) {
        this.maxTokens = params.maxTokens;
        this.model = params.model;
        this.temperature = params.temperature;
        this.openai = params.openai;
        this.totalTokensUsed = 0;
    }

    static fromArgs<Args extends CompletionsArgs & OpenAIArgs>(
        args: Args,
        defaults: {
            model: string;
            maxTokens: number;
            temperature: number;
        }
    ): Completions {
        return new Completions({
            model: args.model ?? defaults.model,
            maxTokens: args.maxTokens ?? defaults.maxTokens,
            temperature: args.temperature ?? defaults.temperature,
            openai: new OpenAI({ apiKey: args.apiKey, organization: args.organisationID }),
        });
    }

    getUsedTokens() {
        return this.totalTokensUsed;
    }

    // change model should return completions object instead of mutating it
    // but some properties will be lost for now because are not included in the constructor
    changeModel(model: string) {
        this.model = model;
    }

    async create(messages: Message[]): Promise<CompletionsResponse> {
        const { maxTokens, model, temperature } = this;

        const totalTokens = countTokens(model, messages);

        if (totalTokens > maxTokens) {
            throw new Error(
                `Total tokens (${totalTokens}) exceeds the maximum tokens allowed (${maxTokens}).`
            );
        }

        await this.waitForRateLimit(totalTokens);

        // https://platform.openai.com/docs/api-reference/chat/create
        const completion = await this.openai.chat.completions.create({
            n: 1, // Number of completions to generate (for example when ChatGPT gives you two answers to choose which one is better).
            model: model,
            messages: messages,
            temperature: temperature, // Higher values will result in more creative completions. Lower values give more predictable completions. (From 0 to 2)
            max_completion_tokens: null, // Max total number of all types of tokens
            logprobs: null, // Further research would be useful for quality of completions.
            response_format: undefined, // Further research would be useful for specific output returns as diffs for example.
            stream: false, // Further research would be useful for UX output response as ChatGPT does.
            user: undefined, // Further research would be useful for user abuse detection from OpenAI (Not CLI intended).
        });

        this.requestsCount++;
        this.tokensCount += totalTokens;

        const tokens = {
            prompt: completion.usage?.prompt_tokens ?? 0,
            completion: completion.usage?.completion_tokens ?? 0,
            total: completion.usage?.total_tokens ?? 0,
            reasoning: completion.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
        };

        const sumOfAllTokens = tokens.prompt + tokens.completion + tokens.total + tokens.reasoning;

        this.totalTokensUsed += sumOfAllTokens;

        return {
            model: completion.model,
            message: completion.choices[0].message.content ?? "",
            tokens: tokens,
        };
    }

    private async resetRateLimit() {
        this.requestsCount = 0;
        this.tokensCount = 0;
        this.resetTime = Date.now() + 60 * 1000; // Reset en 1 minuto
    }

    private async waitForRateLimit(newTokens: number) {
        const now = Date.now();
        if (now >= this.resetTime) {
            this.resetRateLimit();
        }

        if (
            this.requestsCount + 1 >= this.limitRequests ||
            this.tokensCount + newTokens >= this.limitTokens
        ) {
            // If error appears, please take into account if several requests have been made in other process or previously on that minute.
            const waitTime = this.resetTime - now;
            console.log(`Waiting ${waitTime}ms to respect rate limits.`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.resetRateLimit();
        }
    }
}

export type CompletionsResponse = {
    model: string;
    message: string;
    tokens: {
        prompt: number;
        completion: number;
        total: number;
        reasoning: number;
    };
};
