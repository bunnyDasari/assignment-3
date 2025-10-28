// server.js
const express = require("express");
const cors = require("cors");
const { GMRScraper } = require("gm-review-scraper");
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = 3002;

// Middleware
app.use(cors("*"));
app.use(express.json()); // To parse JSON bodies

// 🟢 Test route (GET)


const GEMINI_API_KEY = "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
app.get("/", async (req, res) => {
    const url = "https://www.google.com/maps/place/Paradise+Biryani+%7C+Secunderabad/@17.4417141,78.3347801,12z/data=!4m6!3m5!1s0x3bcb9a0f8cf1fd1b:0x386e919f25da1d16!8m2!3d17.4417141!4d78.4872154!16s%2Fg%2F1tfrkt3d";

    const options = {
        sort_type: "newest", // 'relevent', 'newest', 'highest_rating', 'lowest_rating'
        pages: 2, // scrape just enough pages for about 20 reviews
        clean: true,
    };

    const scraper = new GMRScraper(options);

    try {
        const result = await scraper.scrape(url);

        // Limit to exactly 20 reviews
        const limitedReviews = result.reviews.slice(0, 20);

        console.log(`✅ Found ${limitedReviews.length} reviews (limited to 20)`);
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-001',
            contents: JSON.stringify({
                ...result,
                reviews: limitedReviews,
                total_scraped: limitedReviews.length,
            }) + "give me a top 5 best reviews about the restaurant from the below reviews",
        });
        console.log(response.text);
        res.json({
            ...result,
            reviews: limitedReviews,
            total_scraped: limitedReviews.length,
        });
    } catch (error) {
        console.error("❌ Error scraping:", error);
        res.status(500).json({ error: error.message });
    }
});


// 🟡 Dynamic scrape route (POST)
app.post("/data", async (req, res) => {
    const { data } = req.body;
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: data + "top 5 best reviews about the restaurant",
    });
    console.log(response.text);
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});
