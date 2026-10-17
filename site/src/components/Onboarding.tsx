// "How to connect the marketplace" guide. Rendered on /get-started and in the
// onboarding drawer; both instances share progress through localStorage.
// Commands and UI labels were checked against code.claude.com/docs (Oct 2026).
// The text is in src/i18n/en.json (onboarding.*); commands stay here because
// they are code, not prose, and are passed into the text as placeholders.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { rich, t } from '../i18n';
import { STEP_COUNTED, TABS, setStepDone, setTab, useOnboarding, type Tab } from '../lib/onboarding';
import { isPluginName, url } from '../lib/site';
import type { SiteInfo } from '../types';
import { CopyCommand } from './CopyCommand';
import { CheckIcon, ChevronDownIcon, InfoIcon } from './Icons';
import s from './Onboarding.module.css';

const DOCS = 'https://code.claude.com/docs/en';
const JETBRAINS_PLUGIN = 'https://plugins.jetbrains.com/plugin/27310-claude-code-beta-';

// Link tags used inside the onboarding text.
const LINKS = {
  setup: (c: ReactNode) => <a href={`${DOCS}/setup`}>{c}</a>,
  desktop: (c: ReactNode) => <a href={`${DOCS}/desktop`}>{c}</a>,
  vscode: (c: ReactNode) => <a href={`${DOCS}/vs-code`}>{c}</a>,
  jetbrains: (c: ReactNode) => <a href={JETBRAINS_PLUGIN}>{c}</a>,
  whatsNew: (c: ReactNode) => <a href={url('whats-new')}>{c}</a>,
};

interface Props {
  site: SiteInfo;
  idPrefix: string;
  headingLevel?: 'h2' | 'h3';
  /** Contextual plugin chosen by an install button; undefined = none chosen. */
  contextPlugin?: string | null;
  /** Read the contextual plugin from ?plugin= (used on /get-started). */
  fromQuery?: boolean;
}

export function Onboarding({ site, idPrefix, headingLevel = 'h2', contextPlugin, fromQuery = false }: Props) {
  const { done, tab } = useOnboarding();
  const [queryPlugin, setQueryPlugin] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!fromQuery) return;
    const plugin = new URLSearchParams(location.search).get('plugin');
    if (!isPluginName(plugin)) return;
    setQueryPlugin(plugin);
    requestAnimationFrame(() => rootRef.current?.querySelector('[data-step="install"]')?.scrollIntoView({ block: 'start' }));
  }, [fromQuery]);

  const plugin = contextPlugin !== undefined ? contextPlugin : queryPlugin;
  const mp = site.name;
  const repo = site.repo ?? '<owner>/<repo>';
  const name = plugin || '<plugin>';
  const cmd = {
    installScript: 'curl -fsSL https://claude.ai/install.sh | bash',
    installScriptWindows: 'irm https://claude.ai/install.ps1 | iex',
    versionCheck: 'claude --version && claude update',
    sessionAdd: `/plugin marketplace add ${repo}`,
    shellAdd: `claude plugin marketplace add ${repo}`,
    sessionInstall: `/plugin install ${name}@${mp}`,
    shellInstall: `claude plugin install ${name}@${mp}`,
    list: 'claude plugin list',
    sessionUpdate: `/plugin marketplace update ${mp}`,
    shellUpdate: `claude plugin marketplace update ${mp}`,
    projectAdd: `claude plugin marketplace add ${repo} --scope project`,
    projectInstall: `claude plugin install <plugin>@${mp} --scope project`,
    lsRemote: `git ls-remote https://github.com/${repo}.git`,
    pluginUpdate: `claude plugin update <plugin>@${mp}`,
    disableUninstall: `claude plugin disable <plugin>@${mp}\nclaude plugin uninstall <plugin>@${mp}`,
    removeMarketplace: `claude plugin marketplace remove ${mp}`,
  };
  const teamSnippet = JSON.stringify(
    {
      extraKnownMarketplaces: { [mp]: { source: { source: 'github', repo }, autoUpdate: true } },
      enabledPlugins: { [`<plugin>@${mp}`]: true },
    },
    null,
    2,
  );

  const id = (x: string) => `${idPrefix}-${x}`;
  const counted = done.filter((d) => STEP_COUNTED.includes(d)).length;
  const surface = (x: Tab) => ({ 'data-surface': x, hidden: tab !== x, className: s.surface });

  const selectTab = (x: Tab, focus = false) => {
    setTab(x);
    if (focus) tabRefs.current[x]?.focus();
  };

  const H = headingLevel;
  const step = (key: string, n: number, title: string, opts: { titleNode?: ReactNode; extra?: ReactNode; banner?: ReactNode; checkable?: boolean } = {}) => ({
    stepKey: key, n, title, H, idFor: id, done: done.includes(key), checkable: opts.checkable ?? true,
    titleNode: opts.titleNode, extra: opts.extra, banner: opts.banner,
  });
  const installTitle = plugin ? t('onboarding.install.titleFor', { plugin }) : t('onboarding.install.title');

  return (
    <div className={s.onboarding} data-onboarding data-from-query={fromQuery ? '' : undefined} ref={rootRef}>
      <div className={s.barRow}>
        <div className={s.tabs} role="tablist" aria-label={t('onboarding.tablist')}>
          {TABS.map((x, i) => (
            <button
              key={x}
              ref={(el) => { tabRefs.current[x] = el; }}
              type="button"
              role="tab"
              id={id(`tab-${x}`)}
              aria-controls={id('steps')}
              aria-selected={tab === x}
              tabIndex={tab === x ? 0 : -1}
              data-tab={x}
              onClick={() => selectTab(x, true)}
              onKeyDown={(e) => {
                const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
                if (e.key in keys) {
                  e.preventDefault();
                  selectTab(TABS[(i + keys[e.key] + TABS.length) % TABS.length], true);
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  selectTab(TABS[0], true);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  selectTab(TABS[TABS.length - 1], true);
                }
              }}
            >
              {t(`onboarding.tabs.${x}`)}
            </button>
          ))}
        </div>
        <div className={s.progress}>
          <span className={s.segs} data-progress-bar aria-hidden="true">
            {STEP_COUNTED.map((k, i) => <span key={k} className={i < counted ? `on ${s.on}` : undefined} />)}
          </span>
          <span data-progress-text aria-live="polite">{t('onboarding.progress', { done: counted, total: STEP_COUNTED.length })}</span>
        </div>
      </div>

      <ol className={s.steps} id={id('steps')} role="tabpanel" aria-labelledby={id(`tab-${tab}`)}>
        <Step {...step('prereq', 1, t('onboarding.prereq.title'))}>
          <div {...surface('cli')}>
            <p>{t('onboarding.prereq.cli')}</p>
            <CopyCommand command={cmd.installScript} label={t('onboarding.copyLabels.installScript')} />
            <p className={s.note}>{rich('onboarding.prereq.cliWindows', { command: cmd.installScriptWindows }, LINKS)}</p>
            <CopyCommand command={cmd.versionCheck} label={t('onboarding.copyLabels.versionCheck')} />
          </div>
          <div {...surface('desktop')}>
            <p>{rich('onboarding.prereq.desktop', {}, LINKS)}</p>
            <p>{rich('onboarding.prereq.desktopCli', {}, LINKS)}</p>
          </div>
          <div {...surface('ide')}>
            <p>{rich('onboarding.prereq.vscode', {}, LINKS)}</p>
            <p>{rich('onboarding.prereq.jetbrains', {}, LINKS)}</p>
          </div>
        </Step>

        <Step {...step('add', 2, t('onboarding.add.title'))}>
          <div {...surface('cli')}>
            <p>{t('onboarding.add.cli')}</p>
            <CopyCommand command={cmd.sessionAdd} label={t('onboarding.copyLabels.addMarketplace')} />
            <p className={s.note}>{rich('onboarding.add.cliShell', { command: cmd.shellAdd })}</p>
          </div>
          <div {...surface('desktop')}>
            <p>{t('onboarding.add.desktop')}</p>
            <CopyCommand command={cmd.shellAdd} label={t('onboarding.copyLabels.addMarketplace')} />
            <p className={s.note}>{t('onboarding.add.desktopNote')}</p>
          </div>
          <div {...surface('ide')}>
            <p>{rich('onboarding.add.vscode')}</p>
            <CopyCommand command={repo} label={t('onboarding.copyLabels.marketplaceRepo')} />
            <p className={s.note}>{rich('onboarding.add.jetbrains', { command: cmd.sessionAdd })}</p>
          </div>
          <p className={s.note}>{t('onboarding.add.private')}</p>
        </Step>

        <Step
          {...step('install', 3, installTitle, {
            titleNode: <span data-install-title>{installTitle}</span>,
            extra: <span className="tag tag-accent" data-context-note data-context-plugin hidden={!plugin}>{plugin}</span>,
            banner: (
              <div className={s.banner} data-add-first role="note" hidden={!plugin || done.includes('add')}>
                <InfoIcon />
                <span>{rich('onboarding.install.addFirst', { plugin: <span data-context-plugin>{plugin}</span> })}</span>
              </div>
            ),
          })}
        >
          <div {...surface('cli')}>
            <p>{rich('onboarding.install.cli')}</p>
            <CopyCommand command={cmd.sessionInstall} label={t('onboarding.copyLabels.install')} installCmd="session" />
            <p className={s.note}>{rich('onboarding.install.cliScope', { command: <code data-install-cmd="shell">{cmd.shellInstall}</code> })}</p>
          </div>
          <div {...surface('desktop')}>
            <p>{rich('onboarding.install.desktop')}</p>
            <p className={s.note}>{t('onboarding.install.desktopTerminal')}</p>
            <CopyCommand command={cmd.shellInstall} label={t('onboarding.copyLabels.install')} installCmd="shell" />
          </div>
          <div {...surface('ide')}>
            <p>{rich('onboarding.install.vscode')}</p>
            <p className={s.note}>{rich('onboarding.install.jetbrains')}</p>
            <CopyCommand command={cmd.sessionInstall} label={t('onboarding.copyLabels.install')} installCmd="session" />
          </div>
          <p className={s.note}>{rich('onboarding.install.components', {}, LINKS)}</p>
        </Step>

        <Step {...step('verify', 4, t('onboarding.verify.title'))}>
          <div {...surface('cli')}>
            <p>{rich('onboarding.verify.cli', { skillRef: '/<plugin>:<skill>' })}</p>
            <CopyCommand command={cmd.list} label={t('onboarding.copyLabels.list')} />
          </div>
          <div {...surface('desktop')}>
            <p>{rich('onboarding.verify.desktop')}</p>
          </div>
          <div {...surface('ide')}>
            <p>{rich('onboarding.verify.vscode')}</p>
            <p className={s.note}>{rich('onboarding.verify.jetbrains')}</p>
          </div>
        </Step>

        <Step {...step('update', 5, t('onboarding.update.title'))}>
          <p>{rich('onboarding.update.intro', { mp })}</p>
          <div {...surface('cli')}>
            <CopyCommand command={cmd.sessionUpdate} label={t('onboarding.copyLabels.update')} />
          </div>
          <div {...surface('desktop')}>
            <CopyCommand command={cmd.shellUpdate} label={t('onboarding.copyLabels.update')} />
          </div>
          <div {...surface('ide')}>
            <CopyCommand command={cmd.shellUpdate} label={t('onboarding.copyLabels.update')} />
          </div>
          <p className={s.note}>{rich('onboarding.update.note', {}, LINKS)}</p>
        </Step>

        <Step {...step('team', 6, t('onboarding.team.title'), { extra: <span className="tag tag-neutral">{t('onboarding.optional')}</span> })}>
          <p>{t('onboarding.team.intro')}</p>
          <CopyCommand command={teamSnippet} label={t('onboarding.copyLabels.teamSnippet')} filename=".claude/settings.json" />
          <p className={s.note}>{rich('onboarding.team.note', { addCommand: cmd.projectAdd, installCommand: cmd.projectInstall })}</p>
        </Step>

        <Step {...step('troubleshooting', 7, t('onboarding.troubleshooting.title'), { checkable: false })}>
          <p>{t('onboarding.troubleshooting.intro')}</p>
          <div className={s.faq} data-faq>
            <Faq question={t('onboarding.troubleshooting.authQuestion')}>
              <p>{rich('onboarding.troubleshooting.authAnswer', { command: cmd.lsRemote })}</p>
            </Faq>
            <Faq question={t('onboarding.troubleshooting.missingQuestion')}>
              <p>{rich('onboarding.troubleshooting.missingAnswer')}</p>
            </Faq>
            <Faq question={t('onboarding.troubleshooting.updateQuestion')}>
              <p>{rich('onboarding.troubleshooting.updateAnswer', { updateCommand: cmd.sessionUpdate, pluginUpdateCommand: cmd.pluginUpdate }, LINKS)}</p>
            </Faq>
            <Faq question={t('onboarding.troubleshooting.removeQuestion')}>
              <p>{rich('onboarding.troubleshooting.removeAnswer')}</p>
              <CopyCommand command={cmd.disableUninstall} label={t('onboarding.copyLabels.disableUninstall')} />
              <p>{rich('onboarding.troubleshooting.removeMarketplace', { command: cmd.removeMarketplace })}</p>
            </Faq>
          </div>
        </Step>
      </ol>
    </div>
  );
}

interface StepProps {
  stepKey: string;
  n: number;
  title: string;
  H: 'h2' | 'h3';
  idFor: (x: string) => string;
  done: boolean;
  checkable: boolean;
  titleNode?: ReactNode;
  extra?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}

function Step({ stepKey: key, n, title, H, idFor, done, checkable, titleNode, extra, banner, children }: StepProps) {
  return (
    <li className={`${s.step} ${done ? `done ${s.done}` : ''}`} data-step={key}>
      {checkable ? (
        <>
          <input type="checkbox" className={s.check} id={idFor(`check-${key}`)} data-step-check={key} checked={done} onChange={(e) => setStepDone(key, e.target.checked)} />
          <label className={s.box} htmlFor={idFor(`check-${key}`)}>
            <span className={s.num} aria-hidden="true">{n}</span>
            <CheckIcon size={14} className={s.tick} />
            <span className="visually-hidden">{t('onboarding.stepDone', { n, title })}</span>
          </label>
        </>
      ) : (
        <span className={`${s.box} ${s.boxStatic}`} aria-hidden="true"><span className={s.num}>{n}</span></span>
      )}
      <div className={s.body}>
        {banner}
        <div className={s.titleRow}>
          <H className={s.title}>{titleNode ?? title}</H>
          {extra}
        </div>
        {children}
      </div>
    </li>
  );
}

function Faq({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details>
      <summary>
        <span>{question}</span>
        <ChevronDownIcon />
      </summary>
      {children}
    </details>
  );
}
