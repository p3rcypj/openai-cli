import { encoding_for_model } from "tiktoken";
import { Message } from "./cli";

// Constants for token overhead
const ROLE_TOKENS = 1;  // Number of tokens used for roles and structure
const SPECIAL_TOKENS = 3;  // Special tokens: <|im_start|>, <|im_sep|>, <|im_end|>
const FINAL_ASSISTANT_TOKENS = 3;  // Tokens used for the final assistant message

// Function to tokenize a message's content and return the total token count for that message
const countTokensForMessage = (encoding, message: Message) => {
    const contentTokens = encoding.encode(message.content).length;
    return contentTokens + ROLE_TOKENS + SPECIAL_TOKENS;
};

// Function to sum the total tokens for all messages
const countTokensForMessages = (model, messages: Message[]) => {
    const encoding = encoding_for_model(model);
    const tokens = messages
        .map(m => countTokensForMessage(encoding, m))  // Map each message to its token count
        .reduce((total, current) => total + current, 0);  // Sum all the token counts
    encoding.free();
    return tokens + FINAL_ASSISTANT_TOKENS;
};

export { countTokensForMessages as countTokens };