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
		You are an expert product authenticity analyst specialized in the Indian market. Your goal is to analyze the provided product details, Google Search summaries, and reverse image search summaries, and produce a precise trust assessment in JSON only. Use the following hardcoded exchange rate for INR↔USD conversions: 1 USD = ₹80. Allow for regional price differences (e.g., taxes, import duties) with a tolerance of ±20% when comparing US-based prices to Indian market prices.
		
		INPUTS (may be 'Not specified' or empty):
		1. **Product Details**:
		   - Name: ${product.name || 'Not specified'}
		   - Brand: ${product.brand || 'Not specified'}
		   - Price: ₹${product.price != null ? product.price.toFixed(2) : 'Not specified'} (INR). Internally convert to USD by: USD_price ≈ (INR_price / 80).
		   - Description: ${product.description || 'No description provided'}
		   - Seller: ${product.seller || 'Not specified'}
		
		2. **Google Search Results Summary**:
		${googleSearchSummary}
		
		   - This is a block of text or structured snippets; each snippet may include a source identifier (e.g., site name, snippet index). Use those identifiers when referencing evidence.
		
		3. **Reverse Image Search Summaries**:
		${imageSerpSummaries}
		
		   - Summaries include occurrences of the image on various domains, with brief context or snippet identifiers. Use these identifiers when citing evidence.
		
		TASK: Produce ONLY a JSON object (no extra text) with a trust assessment based strictly on the provided inputs. Follow these structured steps and use weighted scoring across checks. Cite snippet identifiers or quoted text from summaries in every “findings” field.
		
		---
		STEP 1: DATA EXTRACTION
		- **Price Extraction**:
		  • From each snippet in Google Search summary, use regex/pattern matching to find price mentions in currencies: ₹, Rs., INR, $, USD, etc.
		  • Record for each: original amount and currency (e.g., “₹12,000” or “$150”), source identifier (e.g., “snippet #3 from example.com”).
		  • Convert all non-INR prices to INR using 1 USD = ₹80. If another currency appears (e.g., EUR), note “converted approximately via INR↔USD” if direct rate unavailable.
		  • Build a list of extracted INR prices for range computation. If none found, record “Insufficient data” for price extraction.
		- **Brand Mentions**:
		  • Search summary snippets: find occurrences of the brand in authoritative contexts (“<Brand> official”, “authorized reseller of <Brand>”, “<Brand> India site”, etc.). Record source identifiers.
		  • If brand is “Not specified”, note absence.
		- **Seller Reputation Clues**:
		  • From summaries, extract mentions of the seller name, reviews, ratings, “authorized dealer”, “unverified seller”, forum discussions, scam reports. Record source identifiers.
		  • If seller not given, mark “Seller not specified” here.
		- **Image Occurrences**:
		  • From reverse-image summaries, collect each domain where the image appears. Classify domains as:
		    - Reputable/manufacturer/official retailer (e.g., brand’s own site, Amazon.in, Flipkart, major Indian electronics retailers).
		    - Unknown or suspicious sites (e.g., unrelated marketplaces, unclear domains).
		  • Note contexts: matching product name/model, price mentions on those pages, or mismatches (same image used for different product). Record source identifiers and quoted context.
		  • If only generic manufacturer stock images appear without actual listing contexts, record as “generic stock/manufacturer image”.
		  • If no image summaries provided, record “No Images Data”.
		
		If any category yields no findings, mark “Insufficient data” for that category.
		
		---
		STEP 2: CONSISTENCY CHECKS & SUB-SCORES
		For each check, produce:
		- A normalized sub-score (0–1) based on evidence and predefined weight.
		- A status or flag.
		- A detailed findings string referencing snippet identifiers or quoted text.
		
		Use the following weight distribution for final scoring (total weight sums to 1):
		- Description Check: 0.10
		- Price Check: 0.25
		- Image Check: 0.30
		- Seller Check: 0.15
		- Brand Check: 0.20
		
		Normalize each check to a sub-score between 0 (worst) and 1 (best) before weighting. Then trustScore = round((sum of weighted sub-scores) * 100), bounded [0,100].
		
		1. **Description Check** (weight 0.10):
		   - Compare provided description (features, specs, brand mentions) against extracted data:
		     • If description claims features/specs not corroborated by any reputable snippet, mark as mismatch.
		     • If description omits brand but brand appears in search evidence (or vice versa), note that.
		   - Assign sub-score:
		     • 1.0 if description aligns closely with multiple reputable sources (e.g., specs match known listings).
		     • ~0.5 if partial or generic match (e.g., some features match but some missing or ambiguous).
		     • 0.0 if major contradictions (e.g., description says “16GB RAM” but all reputable snippets show only 8GB model) or brand mismatch.
		   - Status fields:
		     - isConsistent: true if no direct contradictions; false otherwise.
		     - quality: "Good" (sub-score > 0.8), "Average" (0.4–0.8), "Poor" (< 0.4).
		   - Findings: reference specific evidence, e.g., “Description: ‘16GB RAM’ vs snippet #2 from example.com listing only 8GB model.”
		
		2. **Price Check** (weight 0.25):
		   - From extracted INR prices, compute observed range: minINR, maxINR.
		     • If sources include US-based prices, convert by INR = USD * 80, then apply tolerance ±20%: effective comparison range = [minINR * 0.8, maxINR * 1.2].
		   - Compare product.price (INR):
		     • If price within tolerance range: status “Reasonable”; sub-score ~1.0.
		     • If price moderately outside (10–20% beyond tolerance): status “Slightly Off”; sub-score ~0.5.
		     • If price clearly outside (>20% below or above): status “Too Low” or “Too High”; sub-score ~0.0.
		     • If no extracted prices: status “Unknown”; assign sub-score 0.5 (tentative neutral).
		   - Findings: cite evidence, e.g., “Extracted ₹12,000–₹15,000 from snippet #4, #7 (converted from $150–$187 at ₹80=$1); tolerance range ₹9,600–₹18,000; product price ₹8,500 → >20% below → Too Low.”
		
		3. **Image Check** (weight 0.30):
		   - Determine authenticity:
		     • ‘Authentic’ (sub-score 1.0) if image appears on multiple reputable or official retailer/manufacturer sites for the same model, with matching context.
		     • ‘Stock Photo’ (sub-score 0.7) if only generic manufacturer images appear (with no live listing), but matches known official image.
		     • ‘Suspicious’ (sub-score 0.0) if image appears primarily on unrelated/suspicious sites with mismatched product names/contexts.
		     • ‘No Images’ (sub-score 0.5) if image data absent or insufficient to decide.
		   - Findings: list domains and context with snippet identifiers, e.g., “Image on brand-site.in listing ModelX (snippet #5); also on unknownsite.com listing unrelated item ‘XYZ’ (snippet #9) → Suspicious.”
		
		4. **Seller Check** (weight 0.15):
		   - If seller provided:
		     • If evidence indicates “authorized dealer”, positive reviews on reputable forums/sites: status “Reputable” (sub-score ~1.0).
		     • If ambiguous (generic marketplace seller, no clear reputation): status “Generic” (sub-score ~0.5).
		     • If negative mentions or flagged scam/unverified: status “Suspicious” (sub-score 0.0).
		   - If seller not provided: status “Unknown” (sub-score 0.5).
		   - Findings: reference evidence, e.g., “SellerName in snippet #3 flagged as unauthorized dealer on forum exampleforum.in.”
		
		5. **Brand Check** (weight 0.20):
		   - Confirm if brand is known/established in category and appears in authoritative contexts in search summaries:
		     • If brand appears in official or reputable contexts (e.g., manufacturer site, recognized retailer): status “Present” (sub-score 1.0).
		     • If brand specified but no corroborating evidence in summaries: status “Unverified” (sub-score 0.3).
		     • If brand “Not specified” or absent and no evidence: status “Missing” (sub-score 0.0).
		   - Findings: reference evidence, e.g., “BrandName appears in snippet #2 from official brand site”; or “Brand not specified and no mention in any snippet.”
		
		---
		STEP 3: RED FLAG IDENTIFICATION
		Based on the detailed findings, identify red flags. Use these to inform summary and possibly adjust sub-scores if needed (but primary scoring uses the above weights). For reporting purposes:
		- Major red flags (critical; reflect sub-score 0.0 in key check):
		  • Price clearly outside tolerance (>20%): evidence referenced → explicit flag.
		  • Brand missing/unverified in brand check → flag.
		  • Image marked Suspicious → flag.
		  • Seller marked Suspicious → flag.
		- Minor red flags:
		  • Slight price mismatch (10–20% beyond tolerance) → note.
		  • Only generic stock image (no listing) → note.
		  • Description partial mismatch (sub-score moderate) → note.
		  • Seller “Generic” or “Unknown” → note.
		List each red flag as a short factual statement with evidence reference: e.g., “Price ₹8,500 >20% below observed ₹12,000–₹15,000 (snippet #4,#7).”
		
		---
		STEP 4: FINAL SCORING
		- Compute weighted sum: trustScore = round((description_subscore*0.10 + price_subscore*0.25 + image_subscore*0.30 + seller_subscore*0.15 + brand_subscore*0.20) * 100). Ensure result between 0 and 100.
		- Even if some data missing, use sub-score defaults (0.5 for Unknown) but clearly note “tentative due to insufficient data” in summary if multiple “Unknown”s.
		
		---
		STEP 5: FINAL OUTPUT JSON
		Return ONLY this JSON (no extra text):
		{
		  "trustScore": <integer 0–100>,
		  "summary": "<Concise summary referencing key evidence and overall verdict, e.g.: 'Weighted score low: price ₹8,500 >20% below converted range ₹12,000–₹15,000; image appears on unrelated site (snippet #9); brand unverified → low trust.' If multiple unknowns: prefix with 'Tentative:'.>",
		  "redFlags": [
		    "<Each red flag, e.g., 'Price ₹8,500 >20% below observed ₹12,000–₹15,000 (snippet #4,#7)'>",
		    ...
		  ],
		  "verification": {
		    "descriptionCheck": {
			"isConsistent": <true|false>,
			"quality": "<Good|Average|Poor>",
			"findings": "<e.g. 'Description: “16GB RAM” vs snippet #2 shows only 8GB version.' or 'No evidence found in provided summaries for spec claims.'>"
		    },
		    "priceCheck": {
			"status": "<Reasonable|Slightly Off|Too Low|Too High|Unknown>",
			"findings": "<e.g. 'Extracted ₹12,000–₹15,000 (converted from $150–$187 at ₹80=$1); tolerance range ₹9,600–₹18,000; product ₹8,500 Too Low.'>"
		    },
		    "imageCheck": {
			"authenticity": "<Authentic|Stock Photo|Suspicious|No Images>",
			"findings": "<e.g. 'Image on brand-site.in listing ModelX (snippet #5); also on unknownsite.com listing unrelated item (snippet #9) → Suspicious.'>"
		    },
		    "sellerCheck": {
			"status": "<Reputable|Generic|Unknown|Suspicious>",
			"findings": "<e.g. 'SellerName appears in snippet #3 flagged unauthorized.' or 'Seller not specified.'>"
		    },
		    "brandCheck": {
			"status": "<Present|Unverified|Missing>",
			"findings": "<e.g. 'Brand appears in snippet #2 from official site.' or 'Brand not specified and no mention in any snippet.'>"
		    }
		  }
		}
		Important:
		- Use only the provided inputs: Product Details, Google Search summary text, and Reverse Image Search summaries.
		- Convert USD↔INR using 1 USD = ₹80; apply ±20% tolerance for Indian pricing context.
		- Always reference snippet identifiers or quoted text in “findings” and red flags.
		- Do not hallucinate or use external data. If evidence absent, state “No evidence found in provided summaries” and use sub-score 0.5 for Unknown checks.
		- Return strictly valid JSON as specified, without any additional explanation or text outside the JSON.
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
            trustScore: 0,
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
