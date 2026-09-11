export default async function handler(req, res) {

    try {

        const feeds = [

            "https://news.google.com/rss/search?q=Indian+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=Team+India+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=IPL+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=Indian+cricket+players+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=BCCI+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://www.hindustantimes.com/feeds/rss/cricket/rssfeed.xml"

        ];

        let articles = [];

        for (const feed of feeds) {

            try {

                const response = await fetch(feed, {
                    headers: {
                        "User-Agent": "Mozilla/5.0"
                    }
                });

                if (!response.ok) continue;

                const xml = await response.text();

                const items =
                    xml.match(/<item[\s\S]*?<\/item>/gi) || [];

                for (const item of items) {

                    const titleMatch =
                        item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

                    const linkMatch =
                        item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);

                    const dateMatch =
                        item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);

                    const sourceMatch =
                        item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

                    if (!titleMatch || !linkMatch) {
                        continue;
                    }

                    const title =
                        cleanText(titleMatch[1]);

                    const link =
                        cleanText(linkMatch[1]);

                    const date =
                        dateMatch
                            ? cleanText(dateMatch[1])
                            : "";

                    const source =
                        sourceMatch
                            ? cleanText(sourceMatch[1])
                            : "Cricket News";

                    /*
                     * Find article image
                     */

                    let image = "";

                    // media:content
                    let mediaContent =
                        item.match(
                            /<media:content[^>]+url=["']([^"']+)["']/i
                        );

                    if (mediaContent) {
                        image = cleanText(mediaContent[1]);
                    }

                    // media:thumbnail
                    if (!image) {

                        let thumbnail =
                            item.match(
                                /<media:thumbnail[^>]+url=["']([^"']+)["']/i
                            );

                        if (thumbnail) {
                            image = cleanText(thumbnail[1]);
                        }

                    }

                    // enclosure
                    if (!image) {

                        let enclosure =
                            item.match(
                                /<enclosure[^>]+url=["']([^"']+)["']/i
                            );

                        if (enclosure) {
                            image = cleanText(enclosure[1]);
                        }

                    }

                    // Image inside description
                    if (!image) {

                        let descriptionMatch =
                            item.match(
                                /<description[^>]*>([\s\S]*?)<\/description>/i
                            );

                        if (descriptionMatch) {

                            let description =
                                descriptionMatch[1];

                            let imgMatch =
                                description.match(
                                    /<img[^>]+src=["']([^"']+)["']/i
                                );

                            if (imgMatch) {
                                image = cleanText(imgMatch[1]);
                            }
                        }
                    }

                    if (title && link) {

                        articles.push({

                            title: title,

                            link: link,

                            source: source,

                            date: date,

                            image: image

                        });

                    }

                }

            } catch (feedError) {

                console.log("Feed error:", feedError);

            }

        }


        /*
         * Remove duplicate news
         */

        const uniqueArticles = [];

        const seenTitles = new Set();

        for (const article of articles) {

            const key =
                article.title
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();

            if (!seenTitles.has(key)) {

                seenTitles.add(key);

                uniqueArticles.push(article);

            }

        }


        /*
         * Newest news first
         */

        uniqueArticles.sort((a, b) => {

            const dateA =
                new Date(a.date).getTime() || 0;

            const dateB =
                new Date(b.date).getTime() || 0;

            return dateB - dateA;

        });


        /*
         * Return maximum 50 news articles
         */

        const result =
            uniqueArticles.slice(0, 50);


        res.setHeader(
            "Cache-Control",
            "s-maxage=300, stale-while-revalidate=600"
        );

        res.status(200).json(result);


    } catch (error) {

        console.error("News API Error:", error);

        res.status(500).json({

            error: "Unable to load cricket news"

        });

    }

}


/*
 * Clean RSS text
 */

function cleanText(text) {

    if (!text) return "";

    return text

        .replace(/<!\[CDATA\[/gi, "")
        .replace(/\]\]>/gi, "")

        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#x27;/gi, "'")
        .replace(/&#x2F;/gi, "/")

        .trim();

}
