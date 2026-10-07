import { Component, type ReactNode } from 'react';
export default class WorldBoundary extends Component<{ children: ReactNode; onReady: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady(); }
  render() {
    return this.state.failed ? <div className="world world-fallback"><img src="/art/becoming.webp" alt="A sculptural silver form emerging from darkness" /></div> : this.props.children;
  }
}
