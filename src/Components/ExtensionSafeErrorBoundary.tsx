"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

// ── Known DOM-mutation error patterns (caused by browser extensions) ─────────
const EXTENSION_ERROR_PATTERNS = [
  /Failed to execute 'removeChild'/i,
  /Failed to execute 'insertBefore'/i,
  /Failed to execute 'appendChild'/i,
  /Failed to execute 'replaceChild'/i,
  /not a child of this node/i,
  /the node before which the new node/i,
  /the node to be removed/i,
  /NotFoundError/i,
];

function isExtensionDOMError(error: Error): boolean {
  const text = error.message + (error.stack || "");
  return EXTENSION_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

// ── Props & State ────────────────────────────────────────────────────────────
interface Props {
  children: ReactNode;
  /** Optional fallback to show for genuine (non-extension) errors. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isExtensionError: boolean;
  retryCount: number;
}

const MAX_AUTO_RETRIES = 3;

/**
 * Error boundary that automatically recovers from browser-extension DOM
 * corruption errors.
 *
 * When a caught error matches known extension patterns (removeChild /
 * insertBefore NotFoundError), the boundary clears its error state and
 * re-renders the children — effectively healing the React tree.
 *
 * Genuine application errors are shown with a friendly fallback UI.
 */
class ExtensionSafeErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    isExtensionError: false,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      isExtensionError: isExtensionDOMError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isExtensionDOMError(error)) {
      console.warn(
        "[Pixovo] Browser extension caused a React rendering error. Auto-recovering…",
        { error: error.message, componentStack: info.componentStack }
      );

      // Auto-recover: reset the error state after a micro-task so React
      // re-renders the children from scratch.
      if (this.state.retryCount < MAX_AUTO_RETRIES) {
        setTimeout(() => {
          this.setState((prev) => ({
            hasError: false,
            isExtensionError: false,
            retryCount: prev.retryCount + 1,
          }));
        }, 100 * (this.state.retryCount + 1)); // progressive delay
      }
    } else {
      // Genuine app error — log it for monitoring
      console.error("[Pixovo] Application error caught by error boundary:", error, info);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, isExtensionError: false, retryCount: 0 });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Extension error that exceeded max auto-retries
    if (this.state.isExtensionError) {
      return (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <h2 style={{ color: "#333", marginBottom: "16px", fontSize: "1.25rem" }}>
            Browser Extension Conflict Detected
          </h2>
          <p style={{ color: "#666", maxWidth: "480px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            A browser extension is interfering with this page. Try disabling extensions
            (especially ad-blockers, Grammarly, or translation tools) and reload.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: "10px 28px",
              backgroundColor: "#E91E63",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    // Genuine application error
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <h2 style={{ color: "#333", marginBottom: "16px", fontSize: "1.25rem" }}>
          Something went wrong
        </h2>
        <p style={{ color: "#666", maxWidth: "480px", margin: "0 auto 24px", lineHeight: 1.6 }}>
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={this.handleRetry}
          style={{
            padding: "10px 28px",
            backgroundColor: "#E91E63",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
}

export default ExtensionSafeErrorBoundary;
