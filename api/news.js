export default async function handler(req, res) {
    try {

        const feeds = [

            // Indian Cricket
            "https://news.google.com/rss/search?q=Indian+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            // Team India
            "https://news.google.com/rss/search?q=Team+India+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            // IPL
            "https://news.google.com/rss/search?q=IPL+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            // Indian Cricket Players
            "https://news.google.com/rss/search?q=Indian+cricket+players+when:1d&hl=en-IN&gl=IN&ceid=IN:en",

            // BCCI
            "https://news.google.com/rss/search?q=BCCI+cricket+when:1d&hl=en-IN&gl=IN&ceid=IN:en"

        ];

        let articles = [];

        for (const feed of feeds) {

            try {

                const response = await fetch(feed);

                if (!response.ok) {
                    continue;
                }

                const xml = await response.text();

                const items =
                    xml.match(/<item>[\s\S]*?<\/item>/g) || [];

                for (const item of items) {

                    const titleMatch =
                        item.match(/<title>([\s\S]*?)<\/title>/i);

                    const linkMatch =
                        item.match(/<link>([\s\S]*?)<\/link>/i);

                    const dateMatch =
                        item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

                    const sourceMatch =
                        item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

                    if (!titleMatch || !linkMatch) {
                        continue;
                    }

                    let title = cleanText(titleMatch[1]);
                    let link = cleanText(linkMatch[1]);
                    let date = dateMatch
                        ? cleanText(dateMatch[1])
                        : "";

                    let source = sourceMatch
                        ? cleanText(sourceMatch[1])
                        : "Cricket News";

                    if (!title || !link) {
                        continue;
                    }

                    articles.push({
                        title: title,
                        link: link,
                        source: source,
                        date: date
                    });

                }

            } catch (feedError) {

                console.error("Feed error:", feedError);

            }

        }

        // Remove duplicate news
        const uniqueArticles = [];
        const seenTitles = new Set();

        for (const article of articles) {

            const key = article.title
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            if (!seenTitles.has(key)) {

                seenTitles.add(key);
                uniqueArticles.push(article);

            }

        }

        // Newest news first
        uniqueArticles.sort((a, b) => {

            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;

            return dateB - dateA;

        });

        // Send maximum 50 articles
        const result = uniqueArticles.slice(0, 50);

        res.status(200).json(result);

    } catch (error) {

        console.error("News API Error:", error);

        res.status(500).json({
            error: "Unable to load cricket news"
        });

    }
}


// Clean RSS text
function cleanText(text) {

    return text
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
