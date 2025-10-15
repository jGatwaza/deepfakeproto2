// Using simple type definitions since @vercel/node might not be installed locally
type VercelRequest = {
  method: string;
  body: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
};
import { OpenAI } from 'openai';
import axios from 'axios';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory cache for recent analyses (LRU-like implementation)
const MAX_CACHE_SIZE = 5;
const cache = new Map<string, {
  timestamp: number,
  result: any
}>();

// Helper to convert image URL to base64
async function getImageAsBase64(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // Check if response contains an image
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
}

// Add entry to cache (LRU-like behavior)
function addToCache(url: string, result: any) {
  // If cache is full, remove oldest entry
  if (cache.size >= MAX_CACHE_SIZE) {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
  
  // Add new entry
  cache.set(url, {
    timestamp: Date.now(),
    result
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Check cache first
    if (cache.has(url)) {
      const cachedResult = cache.get(url);
      if (cachedResult) {
        // Update timestamp to mark as recently used
        cachedResult.timestamp = Date.now();
        return res.status(200).json({ ...cachedResult.result, cached: true });
      }
    }

    // Convert image URL to base64
    const base64Image = await getImageAsBase64(url);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI image analyst. Analyze the provided image and determine: ' +
            '1. A brief description of what the image shows. ' +
            '2. The likelihood that the image is AI-generated (score between 0 and 1, where 0 is definitely real and 1 is definitely AI-generated). ' +
            '3. Specific visual features or anomalies that support your assessment.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this image. Is it likely AI-generated? Provide a description, a likelihood score from 0-1, and specific visual features supporting your assessment.' },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      max_tokens: 1000
    });

    // Process the response text to extract the information we need
    const analysisText = response.choices[0]?.message?.content || '';
    
    // Parse the GPT response to create our structured format
    let description = '';
    let aiLikelihood = { score: 0.5, label: 'Uncertain' };
    let reasons = ['Analysis incomplete'];
    
    // Extract description (usually first paragraph)
    const descMatch = analysisText.match(/^(.+?)(?=\n\n|\n|$)/);
    if (descMatch) {
      description = descMatch[0].substring(0, 150) + (descMatch[0].length > 150 ? '...' : '');
    }
    
    // Extract likelihood score (looking for patterns like "0.7" or "70%")
    const scoreMatch = analysisText.match(/(?:score|likelihood).*?([0-9.]+)/i) ||
                      analysisText.match(/([0-9.]+)(?:\s*\/\s*1|\s*%)/);
    
    if (scoreMatch) {
      let score = parseFloat(scoreMatch[1]);
      // Convert percentage to decimal if needed
      if (score > 1 && score <= 100) {
        score = score / 100;
      }
      aiLikelihood.score = score;
      
      // Generate label based on score
      if (score >= 0.8) aiLikelihood.label = 'Very Likely AI-generated';
      else if (score >= 0.6) aiLikelihood.label = 'Likely AI-generated';
      else if (score >= 0.4) aiLikelihood.label = 'Uncertain';
      else if (score >= 0.2) aiLikelihood.label = 'Likely Real';
      else aiLikelihood.label = 'Very Likely Real';
    }
    
    // Extract reasons (often in a list format or after "reasons:" or similar keywords)
    const reasonsText = analysisText.match(/(?:reasons|features|evidence|indicators|signs)(?::|include|\n)([\s\S]+)/i);
    
    if (reasonsText) {
      const reasonsList = reasonsText[1].split(/\n-|\n\d+\.|\n\*/).filter(Boolean);
      reasons = reasonsList
        .map(r => r.trim())
        .filter(r => r.length > 0 && r.length < 100)
        .slice(0, 5); // Limit to 5 reasons
    }
    
    if (reasons.length === 0) {
      // Fallback if no reasons were found
      reasons = ['Analysis could not determine specific reasons'];
    }
    
    // Construct the result object
    const result = {
      description,
      aiLikelihood,
      reasons
    };
    
    // Add to cache
    addToCache(url, result);
    
    // Return the result
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
}
