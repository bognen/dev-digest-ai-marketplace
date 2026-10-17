import { t } from '../i18n';
import { CopyButton } from './CopyButton';
import s from './CopyCommand.module.css';
import { CopyIcon } from './Icons';

interface Props {
  command: string;
  /** Names the command for screen readers: "Copy {label}". */
  label: string;
  /** Renders as a file block with the name in a header row. */
  filename?: string;
  /** Marks contextual install commands ("session" or "shell"). */
  installCmd?: 'session' | 'shell';
}

/** A command or snippet with a copy button. */
export function CopyCommand({ command, label, filename, installCmd }: Props) {
  const button = (
    <CopyButton text={command} className={`btn btn-ghost ${s.copy}`} ariaLabel={t('common.copyAriaLabel', { label })}>
      <CopyIcon size={14} />
    </CopyButton>
  );
  const pre = (
    <pre className={s.pre} data-install-cmd={installCmd}>
      <code>{command}</code>
    </pre>
  );
  if (filename) {
    return (
      <div className={`${s.cmd} ${s.file}`}>
        <div className={s.fileHead}>
          <span>{filename}</span>
          {button}
        </div>
        {pre}
      </div>
    );
  }
  return (
    <div className={s.cmd}>
      {pre}
      {button}
    </div>
  );
}
