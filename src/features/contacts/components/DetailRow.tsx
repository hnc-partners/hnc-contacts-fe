/**
 * DetailRow Component
 *
 * Display a label-value pair in the side panel details.
 */

interface DetailRowProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
  isUrl?: boolean;
}

export function DetailRow({ label, value, children, isUrl }: DetailRowProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">
        {children ||
          (isUrl && value && value !== '\u2014' ? (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline hover:text-muted-foreground"
            >
              {value}
            </a>
          ) : (
            value
          ))}
      </dd>
    </div>
  );
}
