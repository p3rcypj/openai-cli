import { Completions } from "../common/completions";
import { writeFile } from "fs/promises";

const regex = /^```.+\n([\s\S]*)\n```$/g;

export function wantsToCreateFile(message: string) {
    return regex.test(message.trim());
}

export function createFile(options: Options) {
    const { previousPrompt, answer, completions, outputDirectory } = options;

    const message = answer.trim();

    //prettier-ignore
    const askForFilename = completions.create([
        { role: "system", content: "You are a helpful assistant that comes out with a filename from a given code block that was generated using a user query." },
        { role: "user", content: "Output only the name of the file you think fits best for the following code block and the user query." },
        { role: "user", content: "If the code contains a class, a variable, or a function that fits 'the main purpose' of the code block, the filename will be that name." },
        { role: "user", content: "User query: " + previousPrompt },
        { role: "user", content: "Code block: " + message }
    ]).then(res => res.message);

    return askForFilename.then(filename => {
        if (filename.length > 100)
            throw new Error(
                "The filename the GPT was trying to generate is too long. Please try again."
            );

        const pathname = `${outputDirectory ?? ""}${outputDirectory?.endsWith("/") ? "" : "/"}${filename}`;
        const content = message.replace(regex, "$1");

        return writeFile(pathname, content)
            .then(() => console.log(`Please look at the file I created for you on: ${pathname}`))
            .catch(err => {
                console.error(
                    `Tried to create file '${pathname}', but something went wrong: ${err}`
                );

                console.log("Here is the content that was supposed to be written to the file: ");

                console.log(content);
            });
    });
}

type Options = {
    previousPrompt: string;
    answer: string;
    completions: Completions;
    outputDirectory?: string;
};
