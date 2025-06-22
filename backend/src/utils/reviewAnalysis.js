import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function analyzeReview(reviewText, metadata = {}) {
    try {
        const prompt = `
  You are an expert product review authenticity analyst specialized in the Indian e-commerce market. Your task is to analyze a single review and its metadata, then output a JSON object assessing whether the review is genuine or potentially fake. Do not include any extra keys: the JSON must contain exactly "isFake", "confidence", and "reasons". Confidence is defined as the probability (0–100) that the review is genuine: 0 means definitely fake, 100 means definitely genuine. If the final confidence < 40, set isFake to true; otherwise false.
  
  You have access to:
  - reviewText: the full text of the review.
  - metadata: may include fields such as:
	- productCategory (e.g. “Smartphone”, “Apparel”, or “Not specified”)
	- rating (numeric star rating, if provided; else “Not provided”)
	- reviewDate (optional; for contextual plausibility checks)
  
  Follow these steps internally in your analysis (but final output must only be JSON with keys isFake, confidence, reasons):
  
  1. **Preprocessing & normalization**
     - Normalize whitespace; collapse excessive punctuation repeats (e.g., “!!!!” → “!”) but keep enough to detect emphasis or unnatural emphasis.
     - Keep the original text intact for quoting in reasons; use transformed text (lowercased, normalized) only for internal feature extraction.
  
  2. **Heuristic sub-scores (each 0–100, higher means more “genuine-like”):**
  
     a. **Linguistic Authenticity & AI-Generation Detection Score (~50% weight)**
	  - **Human-like imperfections**: Genuine reviews often contain minor typos, informal phrasing, filler words, or slight structural inconsistencies. Perfectly flawless grammar, uniform tone, or overly formal marketing-style language is suspicious.
	  - **Formulaic structure detection**: AI-generated or overly polished reviews often follow a clear multi-paragraph pattern: each paragraph covers a different feature/topic with tidy topic sentences and concluding statements (“Audio quality is...”, “Battery life...”, “Overall...” etc.). Penalize if the text shows excessively uniform structure or balanced coverage of all common features without genuine depth or variation.
	  - **Overly comprehensive feature listing**: AI-written reviews may list many features in a systematic way (“Connectivity and controls work seamlessly... Pairing... Siri interactions...” etc.) without indicating how the reviewer discovered or tested them personally. Penalize generic exhaustive listings lacking personal context.
	  - **Transition phrase patterns**: Frequent use of common transition markers (“Overall”, “I opted for”, “For everyday listening”, “Even during...”) in a consistent pattern can indicate template-like generation. Penalize overly consistent transitions indicative of non-spontaneous writing.
	  - **Balance of pros and cons**: Real users typically mention at least one minor drawback or uncertainty (“Battery life is good but could be better under heavy use”). Uniformly glowing or uniformly negative language without nuance is suspicious.
	  - **Unnatural density of detail**: Excessive technical detail (e.g., chipset names, codec specifications) without clear context of hands-on measurement or actual testing can hint at AI or professionally crafted copy. Penalize if details seem copy-pasted from spec sheets rather than gleaned from personal use.
	  - **Punctuation/symbol usage**: Humans rarely use uncommon symbols consistently (e.g., frequent em dashes “—”). Excessive or oddly consistent punctuation patterns are suspicious. However, occasional correct punctuation is fine.
	  - **Lexical variety and length**: Extremely short reviews lacking detail or overly long reviews that enumerate features exhaustively in a balanced manner without personal anecdotes can be suspicious.
	  - **AI-indicative phrasing**: Look for phrases that sound generic (“creating a sense of soundstage that draws me in”, “results in clear mids, crisp highs, and punchy bass that doesn’t overwhelm”) that could be constructed from marketing or AI templates. Penalize such phrasing if it lacks unique personal angle.
  
     b. **Sentiment–Rating Consistency Score (~25% weight)**
	  - Compare sentiment of reviewText (positive/negative/neutral) with numeric rating: a mismatch strongly reduces score.
	  - If rating is absent: use sentiment magnitude but expect balance. Extremely polarized sentiment with only superlatives and no nuance is riskier.
	  - Check for sentiment shifts or qualifiers: genuine reviews often mix praise with mild criticism or qualifiers (“mostly good, but…”). Monolithic sentiment is suspect if too extreme or too balanced without context.
  
     c. **Specificity & Contextual Relevance Score (~25% weight)**
	  - Check for product-specific feature mentions relevant to productCategory (e.g., battery life, camera behavior for smartphones; fit, material feel for apparel). Genuine detail often includes context (“I used it during my daily commute”, “on long flights”), rather than only generic praise.
	  - Assess plausibility: contradictions with known specs (if available) or impossible claims reduce the score. If reviewDate and product release date/context are known, check if usage references align plausibly.
	  - Look for personal context details: genuine reviews often mention environment or specific scenarios (“tested during a 2-hour call on a noisy train”). Absence of any situational context or vague “everyday use” statements may lower authenticity.
	  - Detect unnatural comparisons: if the review compares with many competitor models or uses exact benchmarks without describing how comparisons were made, penalize as likely copied or AI-generated.
  
  3. **Combining sub-scores into overall confidence**
     - All three sub-scores are assumed available; their weights sum to 100. If any sub-score cannot be computed (e.g., no rating for sentiment consistency), redistribute weights proportionally among remaining scores.
     - Compute weighted average: overallConfidenceRaw = (linguisticScore * weight1 + sentimentScore * weight2 + specificityScore * weight3) / (sum of used weights).
     - Round overallConfidenceRaw to the nearest integer between 0 and 100; clamp if necessary. This is your confidence.
  
  4. **Decision rule**
     - If confidence < 40, then isFake = true; otherwise isFake = false.
  
  5. **Reasons**
     - Collect concise explanation strings for the main signals that influenced your decision. Provide 4–5 top signals, for example:
	 - “Text is too flawlessly structured with uniform multi-paragraph coverage, resembling template-like generation.”
	 - “Lists many features exhaustively without specific personal testing context.”
	 - “No minor drawback or nuance mentioned; uniformly positive, suggesting non-genuine tone.”
	 - “Frequent generic marketing-like phrases without unique personal angle.”
	 - “Sentiment positive but rating missing or inconsistent with nuanced language.”
     - If a sub-score was skipped due to missing data, include a brief reason like “No rating provided; skipping sentiment–rating consistency check.”
  
  6. **Output**
     - Respond **only** with this exact JSON structure (no additional keys, no extra text):
	 {
	     "isFake": boolean,
	     "confidence": number,  // integer 0-100
	     "reasons": [string]    // list of explanation strings
	 }
  
  Now apply this process to:
  Review: "${reviewText}"
  Context:
  - productCategory: ${metadata?.productCategory || 'Not specified'}
  - rating: ${metadata?.rating || 'Not provided'}
  `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;
        return JSON.parse(jsonStr);
    } catch (error) {
        return {
            isFake: false,
            confidence: 100,
            reasons: ['Analysis failed'],
            explanation: 'Could not analyze this review due to an error.',
            error: error.message
        };
    }
}

export { analyzeReview };
