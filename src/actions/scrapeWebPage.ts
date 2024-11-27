import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

async function fetchPageContent(url: string): Promise<string> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2" });
    const content = await page.content();
    await browser.close();

    return content;
}

export async function scrapeWebPage(url: string): Promise<string> {
    try {
        const response = await fetchPageContent(url);

        const $ = cheerio.load(response);

        // Remove all <style> and <script> tags
        $("style, script").remove();

        // Remove all head metadata tags that are not relevant for SEO
        $("head meta").each((_, element) => {
            const name = $(element).attr("name") ?? $(element).attr("property");

            const relevantMetaTags = [
                "og:",
                "fb:",
                "twitter:",
                "article:",
                "description",
                "keywords",
                "title",
            ];

            if (!name || relevantMetaTags.every(tag => !name.toLowerCase().startsWith(tag))) {
                $(element).remove();
            }
        });

        $("head").children().not("meta, title").remove();

        // // Remove all tags that might not contain relevant text
        $("nav, footer, aside, form, input, button, iframe, noscript").remove();

        // Remove all <svg>, <img>, and <video> tags
        $("svg, img, video").remove();

        return $.html();
    } catch (error) {
        console.error(`Error fetching search results: ${error}`);
        console.error(`Skipping: ${url}`);

        return "";
    }
}
