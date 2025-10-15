import axios from 'axios';
import type { AnalysisResult } from './components/ResultCard';

// In-memory cache for recent analyses (LRU-like implementation)
const MAX_CACHE_SIZE = 5;
const cache = new Map<string, {
  timestamp: number,
  result: any
}>();

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

export async function analyzeImage(url: string): Promise<AnalysisResult> {
  // Check cache first
  if (cache.has(url)) {
    const cachedResult = cache.get(url);
    if (cachedResult) {
      // Update timestamp to mark as recently used
      cachedResult.timestamp = Date.now();
      return cachedResult.result;
    }
  }

  // In development, we'll use a mock response since we can't call OpenAI directly
  // In production, this would call the actual API
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Check if URL is an image by trying to fetch it
      await axios.get(url, { responseType: 'arraybuffer' });
      
      // Mock response for development
      const mockResult: AnalysisResult = {
        description: "This appears to be an image of a landscape with mountains and a lake reflecting the scenery. The colors are vibrant and the composition is well-balanced.",
        aiLikelihood: {
          score: 0.3,
          label: "Likely Real"
        },
        reasons: [
          "Natural lighting patterns and shadows",
          "Consistent perspective and proportions",
          "No digital artifacts or unnatural smoothing",
          "Realistic textures and details",
          "Proper reflections in the water"
        ]
      };
      
      // Add to cache
      addToCache(url, mockResult);
      
      return mockResult;
    } catch (error) {
      throw new Error("Invalid image URL or not accessible");
    }
  } else {
    // In production, call the actual API endpoint
    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const result = await response.json();
      
      // Add to cache
      addToCache(url, result);
      
      return result;
    } catch (err) {
      console.error('Error:', err);
      throw err;
    }
  }
}
