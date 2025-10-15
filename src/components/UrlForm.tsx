import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  Input, 
  Button, 
  Label, 
  makeStyles, 
  shorthands,
  tokens
} from '@fluentui/react-components';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '600px',
    marginInline: 'auto',
    ...shorthands.padding('16px'),
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  submitButton: {
    marginTop: '12px',
    alignSelf: 'flex-start',
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: '4px',
  },
});

interface UrlFormProps {
  onAnalyzeUrl: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export default function UrlForm({ onAnalyzeUrl, isLoading, error }: UrlFormProps) {
  const styles = useStyles();
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  // Check URL from query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
      // Auto-analyze if URL is provided via query param
      onAnalyzeUrl(urlParam).catch(console.error);
    }
  }, [onAnalyzeUrl]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setIsValidUrl(false);
      return;
    }

    const valid = validateUrl(url);
    setIsValidUrl(valid);
    
    if (valid) {
      await onAnalyzeUrl(url);
      
      // Update URL with the analyzed image URL for sharing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('url', url);
      window.history.pushState({ path: newUrl.href }, '', newUrl.href);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formField}>
        <Label htmlFor="image-url">Image URL</Label>
        <Input
          id="image-url"
          placeholder="https://example.com/image.jpg"
          value={url}
          onChange={(_, data) => {
            setUrl(data.value);
            if (data.value) {
              setIsValidUrl(true);
            }
          }}
          disabled={isLoading}
        />
        {!isValidUrl && <span className={styles.errorText}>Please enter a valid URL</span>}
        {error && <span className={styles.errorText}>{error}</span>}
      </div>

      <Button 
        appearance="primary" 
        type="submit" 
        className={styles.submitButton}
        disabled={isLoading || !url}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Image'}
      </Button>
    </form>
  );
}
