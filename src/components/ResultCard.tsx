import { 
  Card, 
  CardHeader, 
  makeStyles, 
  Text, 
  Image, 
  Badge, 
  shorthands,
  Button,
  Divider,
  tokens,
  Caption1,
  Body1
} from '@fluentui/react-components';
import { ShareRegular, CopyRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  card: {
    maxWidth: '600px',
    width: '100%',
    marginInline: 'auto',
    marginTop: '24px',
    ...shorthands.borderRadius('8px'),
    ...shorthands.overflow('hidden'),
    boxShadow: tokens.shadow4,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    ...shorthands.padding('16px'),
  },
  image: {
    width: '100%',
    height: 'auto',
    maxHeight: '300px',
    objectFit: 'contain',
    ...shorthands.borderRadius('4px'),
  },
  label: {
    fontWeight: 'bold',
  },
  description: {
    marginBottom: '12px',
  },
  reasonsList: {
    ...shorthands.margin('8px', '0'),
    ...shorthands.padding('0', '0', '0', '24px'),
  },
  reason: {
    marginBottom: '4px',
  },
  badge: {
    marginTop: '4px',
  },
  shareContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  }
});

export interface AnalysisResult {
  description: string;
  aiLikelihood: {
    score: number;
    label: string;
  };
  reasons: string[];
}

interface ResultCardProps {
  imageUrl: string;
  result: AnalysisResult;
}

export default function ResultCard({ imageUrl, result }: ResultCardProps) {
  const styles = useStyles();

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'danger';
    if (score >= 0.4) return 'warning';
    return 'success';
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(imageUrl)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'AI Image Analysis Result',
        text: `AI Image Analysis: ${result.aiLikelihood.label}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(shareUrl).catch(console.error);
      alert('Link copied to clipboard!');
    }
  };

  const handleCopy = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(imageUrl)}`;
    navigator.clipboard.writeText(shareUrl).catch(console.error);
    alert('Link copied to clipboard!');
  };

  return (
    <Card className={styles.card}>
      <CardHeader header={<Text weight="semibold">Image Analysis Results</Text>} />
      
      <Image 
        src={imageUrl} 
        alt="Analyzed image" 
        className={styles.image} 
      />
      
      <div className={styles.cardContent}>
        <div>
          <Caption1>DESCRIPTION</Caption1>
          <Body1 className={styles.description}>{result.description}</Body1>
        </div>
        
        <div>
          <Caption1>AI LIKELIHOOD</Caption1>
          <div>
            <Badge 
              appearance="filled" 
              color={getScoreColor(result.aiLikelihood.score)} 
              className={styles.badge}
            >
              {result.aiLikelihood.label} ({(result.aiLikelihood.score * 100).toFixed(0)}%)
            </Badge>
          </div>
        </div>
        
        <div>
          <Caption1>ANALYSIS REASONS</Caption1>
          <ul className={styles.reasonsList}>
            {result.reasons.map((reason, index) => (
              <li key={index} className={styles.reason}>
                <Text>{reason}</Text>
              </li>
            ))}
          </ul>
        </div>
        
        <Divider />
        
        <div className={styles.shareContainer}>
          <Button icon={<ShareRegular />} onClick={handleShare}>
            Share Result
          </Button>
          <Button icon={<CopyRegular />} onClick={handleCopy}>
            Copy Link
          </Button>
        </div>
      </div>
    </Card>
  );
}
