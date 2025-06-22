import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const SERPAPI_KEY = process.env.SERPAPI_KEY;

async function urlToGenerativePart(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const mimeType = response.headers['content-type'];
        if (!mimeType?.startsWith('image/')) return null;

        const buffer = Buffer.from(response.data, 'binary');
        return {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType,
            },
        };
    } catch {
        return null;
    }
}

async function serpApiReverseImageSearchFull(imageUrl) {
    if (!SERPAPI_KEY) return null;
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google_reverse_image',
                image_url: imageUrl,
                api_key: SERPAPI_KEY,
                no_cache: true,
            },
        });
        return response.data;
    } catch (error) {
        if (error.response?.data?.error?.includes('monthly searches')) {
            return 'quota_exceeded';
        }
        return null;
    }
}

async function serpApiGoogleSearch(productName) {
    if (!SERPAPI_KEY) return null;
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google',
                q: productName + " India price and specs",
                api_key: SERPAPI_KEY,
                num: 5
            }
        });
        return (response.data.organic_results || []).map(r => ({
            title: r.title,
            snippet: r.snippet,
            link: r.link
        }));
    } catch {
        return [];
    }
}

async function analyzeProduct(product) {
    if (!process.env.GEMINI_API_KEY) {
        return {
            trustScore: 0,
            summary: 'Analysis service is not properly configured.',
            redFlags: ['GEMINI_API_KEY is not configured'],
            analyzedAt: new Date().toISOString(),
            error: 'GEMINI_API_KEY is not set'
        };
    }

    try {
        const imageData = await Promise.all(
            (product.images || []).map(async (img) => {
                const part = await urlToGenerativePart(img.url);
                const serpApiData = await serpApiReverseImageSearchFull(img.url);
                let serpSummary = '';

                if (serpApiData === 'quota_exceeded') {
                    serpSummary = `Quota exceeded. Check manually: https://images.google.com/searchbyimage?image_url=${encodeURIComponent(img.url)}`;
                } else if (!serpApiData) {
                    serpSummary = `Failed. Check manually: https://images.google.com/searchbyimage?image_url=${encodeURIComponent(img.url)}`;
                } else {
                    const lines = [];
                    if (serpApiData.image_results?.length) {
                        lines.push('Top image results:');
                        serpApiData.image_results.slice(0, 3).forEach((r, i) => {
                            lines.push(`${i+1}. ${r.title || 'Untitled'} - ${r.link}`);
                        });
                    }
                    if (serpApiData.inline_images?.length)
                        lines.push(`Inline similar images (${serpApiData.inline_images.length})`);
                    if (serpApiData.knowledge_graph?.title)
                        lines.push(`Knowledge Graph: ${serpApiData.knowledge_graph.title}`);
                    if (serpApiData.google_reverse_image_url)
                        lines.push(`Google UI: ${serpApiData.google_reverse_image_url}`);
                    if (!lines.length)
                        lines.push(`No reverse image results found.`);
                    serpSummary = lines.join('\n');
                }

                return { part, url: img.url, serpSummary };
            })
        );

        const imageParts = imageData.map(d => d.part).filter(Boolean);
        const imageSerpSummaries = imageData.map(d => `Image: ${d.url}\nReverse image search findings:\n${d.serpSummary}`).join('\n\n');
        const googleSearchResults = await serpApiGoogleSearch(product.name);
        const googleSearchSummary = googleSearchResults.length
            ? googleSearchResults.map((r, i) => `${i+1}. ${r.title}\n   Snippet: ${r.snippet}\n   Link: ${r.link}`).join('\n')
            : 'No Google Search results found.';

        const prompt = `
    You are an expert product authenticity analyst specialized in the Indian market. Analyze the provided inputs (Product Details, Google Search summaries, and Reverse Image Search summaries) and produce ONLY a JSON object with a trust assessment. Do NOT include any extra text outside the JSON.

    Use the hardcoded exchange rate 1 USD = ₹80. When comparing US-based prices to Indian market prices, allow ±20% tolerance for regional differences (taxes, import duties).

    ---  
    INPUTS (each may be "Not specified" or empty):
    1. **Product Details**:
    - Name: ${product.name || 'Not specified'}
    - Brand: ${product.brand || 'Not specified'}
    - Price: ₹${product.price != null ? product.price.toFixed(2) : 'Not specified'} (INR). Internally, USD_price ≈ (INR_price / 80).
    - Description: ${product.description || 'No description provided'}
    2. **Google Search Results Summary**:
    ${googleSearchSummary}
    - This is a block of text or structured snippets. Each snippet may include identifiers (e.g., “snippet #3 from example.com”). Reference these identifiers in findings.
    3. **Reverse Image Search Summaries**:
    ${imageSerpSummaries}
    - Summaries list occurrences of the image on various domains, with context or snippet IDs. Reference these in findings.

    ---  
    TASK: Produce ONLY a valid JSON object, following the schema below. Do not output any explanatory text or additional wrappers.

    ### SCHEMA FOR OUTPUT JSON
    {
    "trustScore": <integer 0–100>,
    "summary": "<Concise summary referencing key evidence and overall verdict>",
    "redFlags": [
        "<Short factual red flag with evidence reference>",
        ...
    ],
    "verification": {
        "descriptionCheck": {
        "isConsistent": <true|false>,
        "quality": "<Good|Average|Poor>",
        "findings": "<Evidence references or note of absence/mismatch>"
        },
        "priceCheck": {
        "status": "<Reasonable|Slightly Off|Too Low|Too High|Unknown>",
        "findings": "<Extracted price evidence and comparison>"
        },
        "imageCheck": {
        "authenticity": "<Authentic|Stock Photo|Suspicious|No Images>",
        "findings": "<Domains/contexts with snippet identifiers>"
        },
        "brandCheck": {
        "status": "<Present|Unverified|Missing>",
        "findings": "<Evidence references or note of absence>"
        }
    }
    }

    ---  
    PROCESS & GUIDANCE

    1. DATA EXTRACTION
    - **Price Extraction**:
        • From each snippet in Google Search summary, use regex/pattern matching to find price mentions (currencies: ₹, Rs., INR, $, USD, etc.).  
        • For each match, record original amount, currency, and source identifier (e.g., "snippet #4 from example.com").  
        • Convert non-INR to INR via 1 USD = ₹80. If other currencies appear (e.g., EUR), note “converted approximately via USD↔INR.”  
        • Build a list of extracted INR prices. If none found, mark “Insufficient data” for price extraction.
    - **Brand Mentions**:
        • Search snippets for authoritative mentions: e.g., “<Brand> official”, “authorized reseller of <Brand>”, “<Brand> India site”, etc., recording identifiers.  
        • If brand is “Not specified”, note absence.
    - **Seller Reputation Clues**:
        • From summaries, extract mentions of seller name, reviews, ratings, “authorized dealer”, “unverified seller”, forum discussions, scam reports; record identifiers.  
        • If seller not provided, mark “Seller not specified.”
    - **Image Occurrences**:
        • From reverse-image summaries, collect domains where the image appears. Classify each domain as:
        - if same image is found with different product names/models, mark as Suspicious.
        - Reputable/manufacturer/official retailer (e.g., brand site, Amazon.in, Flipkart).  
        - Unknown or suspicious (unrelated marketplaces, unclear domains).  
        • Note contexts: matching product name/model, price mentions, or mismatches (same image for different product). Record identifiers and quoted context.  
        • If only generic manufacturer stock images appear, record “generic stock/manufacturer image.” If no image summaries, record “No Images Data.”
    - If any category yields no findings, mark “Insufficient data.”

    2. CONSISTENCY CHECKS & SUB-SCORES  
    Compute a normalized sub-score [0–1] for each check, then combine with weights to get trustScore = round((sum(weight_i * subscore_i)) * 100), bounded [0,100]. If evidence absent, use defaults (sub-score 0.5) but note “Unknown” or “Insufficient data.”

    Weights (sum = 1):
    - Description Check: 0.10  
    - Price Check: 0.25  
    - Image Check: 0.30  
    - Seller Check: 0.15  
    - Brand Check: 0.20

    2.1 **Description Check** (weight 0.10)  
        - Compare provided description against extracted/spec data from reputable snippets.  
        • If description claims specs not corroborated by any reputable snippet, mark mismatch.  
        • If description omits brand but brand appears in evidence (or vice versa), note.  
        - Sub-score:  
        • 1.0 if description aligns closely with multiple reputable sources.  
        • ~0.5 if partially matches or generic (some features match but ambiguous).  
        • 0.0 if major contradictions (e.g., spec conflict) or brand mismatch.  
        - Fields:  
        • isConsistent: true if no direct contradictions; false otherwise.  
        • quality: "Good" (>0.8), "Average" (0.4–0.8), "Poor" (<0.4).  
        • findings: reference specific evidence, e.g., “Description: '16GB RAM' vs snippet #2 lists only 8GB model.”

    2.2 **Price Check** (weight 0.25)  
        - From extracted INR prices, compute observed range: [minINR, maxINR].  
        • For US-based prices, convert via INR = USD * 80, then apply ±20% tolerance: effective comparison range = [minINR * 0.8, maxINR * 1.2].  
        - Compare product.price (INR):  
        • Within tolerance: status “Reasonable”, sub-score ~1.0.  
        • Moderately outside (10–20% beyond tolerance): status “Slightly Off”, sub-score ~0.5.  
        • Clearly outside (>20% below/above): status “Too Low” or “Too High”, sub-score ~0.0.  
        • No extracted prices: status “Unknown”, sub-score 0.5 (tentative neutral).  
        - findings: cite evidence, e.g., “Extracted ₹12,000–₹15,000 (from snippet #4, #7; converted from $150–$187 at ₹80); tolerance ₹9,600–₹18,000; product price ₹8,500 → Too Low.”

    2.3 **Image Check** (weight 0.30)  
        - Determine authenticity:  
        • “Authentic” (sub-score 1.0): image appears on multiple reputable/official sites with matching model context.  
        • “Stock Photo” (sub-score 0.7): only generic manufacturer images, but matches known official image.  
        • “Suspicious” (sub-score 0.0): image appears mainly on unrelated/suspicious sites with mismatched contexts.  
        • “No Images” (sub-score 0.5): image data absent or insufficient.  
        - findings: list domains and contexts with snippet IDs, e.g., “Image on brand-site.in listing ModelX (snippet #5); also on unknownsite.com listing unrelated item (snippet #9) → Suspicious.”

    2.4 **Brand Check** (weight 0.20)  
        - Confirm if brand is known/established and appears in authoritative contexts:  
        • If brand appears in official/reputable contexts: status “Present” (sub-score 1.0).  
        • Brand specified but no corroboration: status “Unverified” (sub-score 0.3).  
        • Brand “Not specified” or absent with no mentions: status “Missing” (sub-score 0.0).  
        - findings: e.g., “Brand appears in snippet #2 from official site” or “Brand not specified and no mention in any snippet.”

    3. RED FLAG IDENTIFICATION  
    Based on findings and sub-scores, list red flags as short statements with evidence references.  
    - Major red flags (sub-score 0.0 in key check):  
        • Price clearly outside tolerance (>20%): “Price ₹X >20% [below/above] range ₹A–₹B (snippet #...).”  
        • Brand missing/unverified.  
        • Image marked Suspicious.  
    - Minor red flags:  
        • Slight price mismatch (10–20% beyond).  
        • Only generic stock images.  
        • Description partial mismatch.  
    Use evidence references in each.

    4. FINAL SCORING  
    - Compute weighted sum:  
        trustScore = round((description_subscore*0.30 + price_subscore*0.30 + image_subscore*0.30 + brand_subscore*0.10) * 100).  
    - Ensure result between 0 and 100.  
    - If multiple “Unknown” categories, summary should note “Tentative due to insufficient data.”

    5. OUTPUT JSON  
    - Return strictly valid JSON matching the schema above.  
    - Fields must be exactly those keys: trustScore, summary, redFlags, verification (with its subfields).  
    - In each “findings” or redFlag, reference snippet identifiers or quoted text from provided summaries.  
    - Do NOT hallucinate or fetch external data. If evidence is absent, explicitly state “No evidence found in provided summaries” or “Insufficient data,” and use neutral sub-score defaults.

    Example of expected output structure:
    {
    "trustScore": 65,
    "summary": "Moderate confidence: price ₹87,900 within tolerance; description detailed but generic marketing; image appears stock-like; brand present; seller unknown.",
    "redFlags": [
        "Only generic stock images found (snippet #3, #5).",
        "Seller not specified."
    ],
    "verification": {
        "descriptionCheck": {
        "isConsistent": true,
        "quality": "Average",
        "findings": "Description details match specs in snippets #2 and #4, but text is generic."
        },
        "priceCheck": {
        "status": "Reasonable",
        "findings": "Extracted ₹85,000–₹90,000 from snippet #6; tolerance ₹68,000–₹108,000; product ₹87,900 within range."
        },
        "imageCheck": {
        "authenticity": "Stock Photo",
        "findings": "Only manufacturer stock images appear (snippet #3, #5); no live listing images."
        },
        "brandCheck": {
        "status": "Present",
        "findings": "Brand appears in snippet #2 from official brand site."
        }
    }
    }
`; 

        let result, response, text;
        try {
            result = await model.generateContent([prompt, ...imageParts]);
            response = await result.response;
            text = await response.text();
        } catch (apiError) {
            if (imageParts.length && /invalid|format|image/.test(apiError.message)) {
                try {
                    result = await model.generateContent(prompt);
                    response = await result.response;
                    text = await response.text();
                } catch (textError) {
                    throw new Error(`Gemini fallback failed: ${textError.message}`);
                }
            } else {
                throw new Error(`Gemini API error: ${apiError.message}`);
            }
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to parse JSON response from Gemini.");
        const analysisData = JSON.parse(jsonMatch[0]);

        return {
            ...analysisData,
            analyzedAt: new Date().toISOString(),
            productId: product._id?.toString(),
            productName: product.name
        };

    } catch (error) {
        return {
            trustScore: 100,
            summary: `Analysis failed: ${error.message}`,
            redFlags: ['An error occurred during analysis.'],
            analyzedAt: new Date().toISOString(),
            verification: {
                descriptionCheck: {
                    isConsistent: false,
                    quality: 'Unknown',
                    findings: 'Analysis failed.'
                },
                imageCheck: {
                    authenticity: 'Unknown',
                    findings: 'Analysis failed.'
                },
                priceCheck: {
                    status: 'Unknown',
                    findings: 'Analysis failed.'
                },
                sellerCheck: {
                    status: 'Unknown',
                    findings: 'Analysis failed.'
                },
                brandCheck: {
                    status: 'Unknown',
                    findings: 'Analysis failed.'
                }
            },
            error: error.message
        };
    }
}

export { analyzeProduct };
