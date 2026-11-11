import type { CSSProperties } from 'react';

export type Example = {
  name: string;
  title: string;
  emoji: string;
  bg: string;
  fg: string;
  statLine: string;
  roast: string;
  messages: string;
  share: string;
  rank: number;
};

const INK = '#1B1535';

/** A web copy of the app's member card (src/components/MemberCard.tsx), sized with container units. */
export function ExampleCard({ card, style }: { card: Example; style?: CSSProperties }) {
  const dark = card.fg !== INK;
  const vars = {
    '--card-bg': card.bg,
    '--card-fg': card.fg,
    '--strip-bg': dark ? '#FFB627' : INK,
    '--strip-fg': dark ? INK : '#FFF6E6',
    '--tile-bg': dark ? 'rgba(255,255,255,0.12)' : 'rgba(27,21,53,0.1)',
    ...style,
  } as CSSProperties;

  return (
    <div className="card-wrap" style={vars}>
      <div className="card">
        <div className="card-top">
          <span>Weekend Plans</span>
          <span>2026</span>
        </div>
        <div className="card-main">
          <div className="sticker" aria-hidden="true">{card.emoji}</div>
          <div className="card-name">{card.name} is</div>
          <div className="card-title">{card.title}</div>
          <div className="card-strip">{card.statLine}</div>
          <div className="card-bubble">
            {card.roast}
            <span className="ticks">✓✓</span>
          </div>
        </div>
        <div className="card-tiles">
          <div><b>{card.messages}</b><span>messages</span></div>
          <div><b>{card.share}</b><span>of the chat</span></div>
          <div><b>#{card.rank}</b><span>most active</span></div>
        </div>
        <div className="card-wm">yapcard</div>
      </div>
    </div>
  );
}
