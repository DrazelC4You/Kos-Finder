/**
 * GradientCard — KosFinder native gradient card component
 * Inspired by 21st.dev GradientCard visual style.
 * Uses framer-motion for spring hover animations.
 */
import React from 'react';
import { motion } from 'framer-motion';

// ─── Decorative SVG Backgrounds ───────────────────────────────────────────────
// Each card gets its own thematic decorative motif rendered as inline SVG.
// They sit behind content and are marked aria-hidden for accessibility.

function DecorativeShieldCheck() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -right-6 -bottom-6 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none"
    >
      {/* Outer shield */}
      <path
        d="M60 8 L100 24 L100 58 C100 82 80 98 60 110 C40 98 20 82 20 58 L20 24 Z"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Inner shield */}
      <path
        d="M60 20 L88 32 L88 58 C88 76 74 88 60 98 C46 88 32 76 32 58 L32 32 Z"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Check mark */}
      <path
        d="M44 60 L55 72 L78 48"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.40"
      />
      {/* Sparkle dots */}
      <circle cx="100" cy="20" r="4" fill="currentColor" opacity="0.20" />
      <circle cx="18" cy="96" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="108" cy="88" r="2.5" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

function DecorativeChatBubble() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -right-4 -bottom-4 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none"
    >
      {/* Back bubble */}
      <rect
        x="28" y="36" width="74" height="52" rx="14"
        fill="currentColor" opacity="0.14"
      />
      {/* Tail back */}
      <path d="M54 88 L48 104 L66 92" fill="currentColor" opacity="0.12" />

      {/* Front bubble */}
      <rect
        x="16" y="20" width="66" height="46" rx="12"
        fill="currentColor" opacity="0.20"
      />
      {/* Tail front */}
      <path d="M36 66 L30 80 L50 72" fill="currentColor" opacity="0.18" />

      {/* Chat dots */}
      <circle cx="31" cy="43" r="3.5" fill="currentColor" opacity="0.40" />
      <circle cx="42" cy="43" r="3.5" fill="currentColor" opacity="0.40" />
      <circle cx="53" cy="43" r="3.5" fill="currentColor" opacity="0.40" />

      {/* Accent circle */}
      <circle cx="102" cy="18" r="5" fill="currentColor" opacity="0.18" />
      <circle cx="110" cy="96" r="3" fill="currentColor" opacity="0.14" />
    </svg>
  );
}

function DecorativeStar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -right-6 -bottom-4 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none"
    >
      {/* Large background star */}
      <path
        d="M60 10 L70 42 L104 42 L78 62 L88 94 L60 74 L32 94 L42 62 L16 42 L50 42 Z"
        fill="currentColor"
        opacity="0.15"
      />
      {/* Smaller foreground star */}
      <path
        d="M88 8 L92 20 L104 20 L95 27 L98 39 L88 32 L78 39 L81 27 L72 20 L84 20 Z"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Tiny star */}
      <path
        d="M20 72 L22 78 L28 78 L23 82 L25 88 L20 84 L15 88 L17 82 L12 78 L18 78 Z"
        fill="currentColor"
        opacity="0.20"
      />
      {/* Sparkle rings */}
      <circle cx="104" cy="90" r="4" stroke="currentColor" strokeWidth="2" opacity="0.18" />
    </svg>
  );
}

function DecorativeHandshake() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -right-6 -bottom-6 w-36 h-36 sm:w-44 sm:h-44 pointer-events-none select-none"
    >
      {/* Coin / badge background */}
      <circle cx="72" cy="68" r="38" fill="currentColor" opacity="0.13" />
      <circle cx="72" cy="68" r="28" stroke="currentColor" strokeWidth="2" opacity="0.16" />

      {/* Price tag */}
      <path
        d="M56 52 L88 52 L88 84 L72 98 L56 84 Z"
        fill="currentColor" opacity="0.18"
      />
      {/* Rupiah symbol-like strokes */}
      <path
        d="M66 62 L78 62 M64 68 L80 68 M70 74 L70 88"
        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.40"
      />

      {/* Small coin accent */}
      <circle cx="20" cy="30" r="10" fill="currentColor" opacity="0.14" />
      <circle cx="20" cy="30" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.18" />

      {/* Dots */}
      <circle cx="108" cy="22" r="4" fill="currentColor" opacity="0.18" />
      <circle cx="14" cy="94" r="3" fill="currentColor" opacity="0.14" />
    </svg>
  );
}

const DECORATIVE_COMPONENTS = {
  shield: DecorativeShieldCheck,
  chat: DecorativeChatBubble,
  star: DecorativeStar,
  price: DecorativeHandshake,
};

// ─── GradientCard Component ────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {React.ComponentType} props.icon           - Lucide icon component
 * @param {string}             props.title          - Card title text
 * @param {string}             props.description    - Card description
 * @param {'shield'|'chat'|'star'|'price'} props.decorative - Decorative motif
 * @param {string}             props.gradient       - Tailwind gradient classes for background
 * @param {string}             props.accentColor    - Tailwind text color for icon & decorative
 * @param {string}             props.iconBg         - Tailwind bg class for icon wrapper
 * @param {string}             props.borderColor    - Tailwind border class
 * @param {string}             [props.badgeLabel]   - Optional small badge label
 * @param {string}             [props.badgeBg]      - Optional badge bg class
 * @param {string}             [props.cta]          - Optional CTA label (purely decorative/display)
 */
export function GradientCard({
  icon: Icon,
  title,
  description,
  decorative = 'shield',
  gradient,
  accentColor,
  iconBg,
  borderColor,
  badgeLabel,
  badgeBg,
  cta,
}) {
  const Decorative = DECORATIVE_COMPONENTS[decorative] ?? DecorativeShieldCheck;

  return (
    <motion.div
      className={[
        'relative overflow-hidden rounded-2xl p-5 sm:p-6',
        'border shadow-sm',
        gradient,
        borderColor,
        'flex flex-col gap-3',
        // Ensure consistent minimum height
        'min-h-[190px]',
      ].join(' ')}
      initial={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.025, y: -4 }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 20,
        mass: 0.8,
      }}
    >
      {/* ── Decorative background motif ── */}
      <motion.div
        className={`${accentColor}`}
        whileHover={{ scale: 1.08, rotate: 3 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <Decorative />
      </motion.div>

      {/* ── Content ── (z-index above the decorative) */}
      <div className="relative z-10 flex flex-col h-full gap-3">

        {/* Badge (optional) */}
        {badgeLabel && (
          <span
            className={[
              'self-start inline-flex items-center gap-1.5 px-2.5 py-1',
              'rounded-full text-[11px] font-semibold',
              badgeBg,
            ].join(' ')}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${accentColor.replace('text-', 'bg-')}`}
            />
            {badgeLabel}
          </span>
        )}

        {/* Icon badge */}
        <div
          className={[
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            iconBg,
            accentColor,
          ].join(' ')}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed flex-1">
          {description}
        </p>

        {/* CTA row */}
        {cta && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold mt-1 select-none">
            <span className={accentColor}>{cta}</span>
            <svg
              aria-hidden="true"
              className={`w-3.5 h-3.5 ${accentColor}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
    </motion.div>
  );
}
