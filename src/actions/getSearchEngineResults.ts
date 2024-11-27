import axios from "axios";
import * as cheerio from "cheerio";

const regex = /^Searching the web for: ["']{0,1}([\w\s]*)["']{0,1}/;

export function wantsToSearchWeb(message: string) {
    return regex.test(message.trim());
}

export async function getSearchEngineResults(query: string): Promise<SearchResult[]> {
    const q = query.replace(regex, "$1");

    // For now, only Google Search Engine is supported.
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q.trim())}`;

    try {
        const response = await axios.get(searchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
        });

        /* By parsing the HTML we find more hrefs to specific actions we might want to also fetch */

        /* In case something fails, please look at the html because something might have changed
         * console.log(response.data); */

        const $ = cheerio.load(response.data);
        const results = $("div#search div[jscontroller][lang]")
            .map((_i, element) => {
                const title = $(element).find("h3").text();
                const link = $(element).find("a").attr("href");
                const domain = link && new URL(link).hostname;
                const description = $(element).find("div[data-sncf='1']").text();

                return title && link && domain
                    ? { title, url: link, domain: domain, description: description }
                    : undefined;
            })
            .get()
            .filter(result => result !== undefined);

        return results;
    } catch (error) {
        console.error(`Error fetching search results: ${error}`);
        return [];
    }
}

export type SearchResult = {
    title: string;
    url: string;
    domain: string;
    description: string;
};

/* BACKUP USER AGENT
 * Chrome/58.0.3029.110

 * "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"

 * const $ = cheerio.load(response.data);
 * const results = $("div#main > div")
 *     .map((_i, element) => {
 *         const title = $(element).find("h3").text();
 *         const link = $(element).find("a").attr("href");

 *         const safeLink = link && new URLSearchParams(link.split("?")[1] ?? "").get("url");
 *         const domain = safeLink && new URL(safeLink).hostname;

 *         return title && safeLink && domain
 *             ? { title, url: safeLink, domain: domain }
 *             : null;
 *     })
 *     .get()
 *     .filter(result => result !== null);
 */
