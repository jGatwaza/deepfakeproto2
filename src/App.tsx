import { useState } from 'react';
import { 
  FluentProvider, 
  webLightTheme,
  makeStyles,
  shorthands,
  Title1,
  Text
} from '@fluentui/react-components';
import './App.css';

import UrlForm from './components/UrlForm';
import ResultCard from './components/ResultCard';
import type { AnalysisResult } from './components/ResultCard';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    maxWidth: '800px',
    marginInline: 'auto',
    ...shorthands.padding('16px'),
    boxSizing: 'border-box',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  subtitle: {
    fontWeight: 'normal',
    marginTop: '8px',
  }
});

function App() {
  const styles = useStyles();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setImageUrl(url);
    
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

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Title1>AI Image Analyzer</Title1>
          <Text className={styles.subtitle}>Analyze images for AI-generated content</Text>
        </header>

        <UrlForm 
          onAnalyzeUrl={analyzeUrl} 
          isLoading={isLoading} 
          error={error}
        />

        {imageUrl && result && (
          <ResultCard imageUrl={imageUrl} result={result} />
        )}

        {imageUrl && !result && !isLoading && !error && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <img 
              src={imageUrl} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
            />
          </div>
        )}
      </div>
    </FluentProvider>
  );
}

export default App;
