// Central theme for the Pixie chat widget. Every color and the gradient
// used throughout AIOrderChat.module.css derives from this file — edit the
// values below to re-color the whole widget; no CSS digging required.

import type { CSSProperties } from "react";

export interface PixieTheme {
  /** Gradient start color — buttons, launcher, header avatar, user bubbles. */
  primary: string;
  /** Gradient mid color — most borders, chips, and hover accents. */
  secondary: string;
  /** Gradient end color — also used for the subtle background glow. */
  accent: string;
  /** Bright highlight used for the "online" ping, price tags, and header sheen. */
  highlight: string;
  /** "Pixie is online" status dot. */
  success: string;
  /** Panel/launcher background. */
  background: string;
  /** Primary text color — bot bubbles, headings, body copy. */
  text: string;
  /** Secondary/muted text color — header status, hints, placeholders, labels. */
  muted: string;
  /**
   * Base color for soft-fill surfaces — bot bubbles, chip pills, the combo/upload
   * boxes, and the input footer bar. Rendered as a low-opacity tint, so pick a
   * color with good contrast against `background` (dark for a light theme,
   * light for a dark theme).
   */
  surface: string;
  /** Base color for hairline borders/dividers throughout the panel (same tint logic as `surface`). */
  border: string;
  /** Welcome-screen subtitle ("Your Pixovo photo-album assistant…") — independent of `muted`. */
  welcomeSubtitleText: string;
  /** Welcome-screen "Hi, I'm Pixie" heading — independent of `text`, edit this to re-color just the heading. */
  welcomeTitleText: string;
  /**
   * Text/icon color for anything sitting ON the gradient itself — the
   * launcher icon, header avatar glyph, your own sent message bubbles,
   * and every gradient-filled button (Start Creating, Send, action CTAs).
   * Keep this high-contrast against `primary`/`secondary`/`accent`.
   */
  onGradientText: string;
  /** Gradient angle in degrees. */
  gradientAngle: number;
  /**
   * Image URL shown as the bot's avatar inside chat message bubbles.
   * Leave empty ("") to keep the default "✦" glyph.
   */
  avatarIcon: string;
}

// Pixovo brand palette (matched from the marketing site: coral CTA buttons,
// warm-yellow highlights, teal, and the dark-teal "Our Story" section).
export const PIXIE_THEME: PixieTheme = {
  
  primary: "#4a8577",
  secondary: "#4a8577",
  accent: "#4a8577",
  highlight: "#4a8577",
  success: "#22c55e",
  background: "#faf6ef",
  text: "#1f2d28",
  muted: "#6b7d75",
  surface: "#1f2d28",
  border: "#1f2d28",
  welcomeSubtitleText: "#1f2d28",
  welcomeTitleText: "#1f2d28",
  onGradientText: "#ffffff",
  gradientAngle: 135,
  avatarIcon: "/images/chatbot_new_icon.svg",
};

/** "#463764" -> "139, 92, 246", for rgba() shadows/borders that need alpha. */
function hexToRgbChannels(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return "255, 255, 255";
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

/** Builds the inline CSS custom properties the widget's stylesheet reads. */
export function themeToCssVars(theme: PixieTheme = PIXIE_THEME): CSSProperties {
  return {
    ["--pix-primary" as any]: theme.primary,
    ["--pix-primary-rgb" as any]: hexToRgbChannels(theme.primary),
    ["--pix-secondary" as any]: theme.secondary,
    ["--pix-secondary-rgb" as any]: hexToRgbChannels(theme.secondary),
    ["--pix-accent" as any]: theme.accent,
    ["--pix-accent-rgb" as any]: hexToRgbChannels(theme.accent),
    ["--pix-highlight" as any]: theme.highlight,
    ["--pix-highlight-rgb" as any]: hexToRgbChannels(theme.highlight),
    ["--pix-success" as any]: theme.success,
    ["--pix-bg" as any]: theme.background,
    ["--pix-text" as any]: theme.text,
    ["--pix-text-rgb" as any]: hexToRgbChannels(theme.text),
    ["--pix-muted" as any]: theme.muted,
    ["--pix-bg-soft" as any]: `rgba(${hexToRgbChannels(theme.surface)}, 0.045)`,
    ["--pix-border" as any]: `rgba(${hexToRgbChannels(theme.border)}, 0.12)`,
    ["--pix-welcome-subtitle" as any]: theme.welcomeSubtitleText,
    ["--pix-welcome-title" as any]: theme.welcomeTitleText,
    ["--pix-on-grad" as any]: theme.onGradientText,
    ["--pix-grad-angle" as any]: `${theme.gradientAngle}deg`,
  } as CSSProperties;
}
