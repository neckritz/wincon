import './HelpHint.css';

type HelpHintSize = 'default' | 'large';
type HelpHintTone = 'default' | 'green' | 'blue';

interface HelpHintProps {
  text: string;
  ariaLabel?: string;
  className?: string;
  size?: HelpHintSize;
  tone?: HelpHintTone;
}

export default function HelpHint({
  text,
  ariaLabel = 'More information',
  className,
  size = 'default',
  tone = 'default',
}: HelpHintProps) {
  const rootClassName = [
    'help-hint',
    `help-hint--${size}`,
    `help-hint--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={rootClassName}>
      <button type="button" className="help-hint__trigger" aria-label={ariaLabel}>
        ?
      </button>
      <span role="tooltip" className="help-hint__tooltip">
        {text}
      </span>
    </span>
  );
}
