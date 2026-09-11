export default async function handler(req, res) {

    try {

        const feeds = [

            "https://news.google.com/rss/search?q=Indian+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=Team+India+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=IPL+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=Indian+cricket+players+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            "https://news.google.com/rss/search?q=BCCI+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en"

        ];

        let articles = [];

        for (const feed of feeds) {

            try {

                const response = await fetch(feed);

                if (!response.ok) continue;

                const xml = await response.text();

                const items =
                    xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

                for (const item of items) {

                    const titleMatch =
                        item.match(/<title>([\s\S]*?)<\/title>/i);

                    const linkMatch =
                        item.match(/<link>([\s\S]*?)<\/link>/i);

                    const dateMatch =
                        item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

                    const sourceMatch =
                        item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

                    const descriptionMatch =
                        item.match(/<description>([\s\S]*?)<\/description>/i);

                    if (!titleMatch || !linkMatch) continue;

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

                    let image = "";

                    if (descriptionMatch) {

                        const description =
                            descriptionMatch[1];

                        const imageMatch =
                            description.match(
                                /<img[^>]+src=["']([^"']+)["']/i
                            );

                        if (imageMatch) {
                            image = imageMatch[1];
                        }

                    }

                    articles.push({

                        title,
                        link,
                        source,
                        date,
                        image

                    });

                }

            } catch (error) {

                console.error(
                    "Feed error:",
                    error
                );

            }

        }


        // Remove duplicate headlines

        const uniqueArticles = [];

        const seen = new Set();

        for (const article of articles) {

            const key =
                article.title
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();

            if (!seen.has(key)) {

                seen.add(key);

                uniqueArticles.push(article);

            }

        }


        // Newest first

        uniqueArticles.sort((a, b) => {

            const dateA =
                new Date(a.date).getTime() || 0;

            const dateB =
                new Date(b.date).getTime() || 0;

            return dateB - dateA;

        });


        res.status(200).json(
            uniqueArticles.slice(0, 50)
        );


    } catch (error) {

        console.error(
            "News API Error:",
            error
        );

        res.status(500).json({

            error:
                "Unable to load cricket news"

        });

    }

}


function cleanText(text) {

    return String(text)

        .replace(/<!\[CDATA\[/g, "")

        .replace(/\]\]>/g, "")

        .replace(/&amp;/g, "&")

        .replace(/&quot;/g, '"')

        .replace(/&#39;/g, "'")

        .replace(/&apos;/g, "'")

        .replace(/&lt;/g, "<")

        .replace(/&gt;/g, ">")

        .replace(/&#x27;/g, "'")

        .replace(/&#x2F;/g, "/")

        .trim();

}
