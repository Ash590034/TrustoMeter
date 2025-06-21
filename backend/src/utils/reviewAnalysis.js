import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function analyzeReview(reviewText, metadata = {}) {
    try {
        const prompt = `
        Analyze the following product review and determine if it appears to be genuine or potentially fake.
        Consider:
        - Language patterns
        - Specificity of product details
        - Unnatural/marketing language
        - Comparison with typical review patterns
        - Overly perfect grammar and punctuation

        Review: "${reviewText}"

        Context:
        - Product category: ${metadata?.productCategory || 'Not specified'}
        - Rating: ${metadata?.rating || 'Not provided'}

        Respond in this JSON format:
        {
            "isFake": boolean,
            "confidence": number (0-100),
            "reasons": string[]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;
        return JSON.parse(jsonStr);
    } catch (error) {
        return {
            isFake: false,
            confidence: 0,
            reasons: ['Analysis failed'],
            explanation: 'Could not analyze this review due to an error.',
            error: error.message
        };
    }
}

export { analyzeReview };
