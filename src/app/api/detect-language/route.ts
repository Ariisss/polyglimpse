import { NextRequest, NextResponse } from "next/server";
import DetectLanguage from "detectlanguage";

// Ensure you have the API key in your environment variables
const apiKey = process.env.DETECTLANGUAGE_API_KEY;

if (!apiKey) {
	console.error("DETECTLANGUAGE_API_KEY environment variable is not set.");
	// Optionally throw an error during build or startup if the key is essential
}

// Initialize the DetectLanguage client only if the API key is available
const detectLanguage = apiKey ? new DetectLanguage(apiKey) : null;

export async function POST(request: NextRequest) {
	if (!detectLanguage) {
		return NextResponse.json({ error: "Language detection service is not configured." }, { status: 500 });
	}

	try {
		const body = await request.json();
		const text = body.text;

		if (!text || typeof text !== "string" || text.trim().length === 0) {
			return NextResponse.json({ error: "Text input is required and cannot be empty." }, { status: 400 });
		}

        // Basic input length check (adjust as needed)
        if (text.length > 5000) {
             return NextResponse.json({ error: "Input text exceeds maximum length (5000 characters)." }, { status: 400 });
        }

		// Call the Detect Language API
		const results = await detectLanguage.detect(text);

        // The detectlanguage library returns an array of possible detections
        // Format: [ { language: 'en', isReliable: true, confidence: 12.34 } ]
		return NextResponse.json(results);

	} catch (error: any) {
		console.error("Detect Language API error:", error);

        // Handle specific errors from the library if possible
        let errorMessage = "Failed to detect language due to an internal server error.";
        let statusCode = 500;

        if (error.message?.includes('Authentication failed') || error.message?.includes('Invalid API key')) {
            errorMessage = "Language detection service authentication failed. Check API key.";
            statusCode = 500; // Internal config issue
        } else if (error.message?.includes('Request limit exceeded')) {
            errorMessage = "Language detection API request limit exceeded.";
            statusCode = 429; // Too Many Requests
        }
        // Add more specific error handling based on potential API responses

		return NextResponse.json({ error: errorMessage }, { status: statusCode });
	}
}
