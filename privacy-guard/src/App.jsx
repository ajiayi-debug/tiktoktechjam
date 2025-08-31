// ---------- Types ----------
/** @typedef {Object} AgentOutput
 * @property {string} id
 * @property {('soft-hints'|'media pii'|'web research')} agent
 * @property {string} summary
 * @property {number} risk // 0-100
 * @property {{label: string, url?: string}[]} artifacts // downloadable outputs
 * @property {('queued'|'running'|'done'|'error')} status
 */

/** @typedef {Object} Submission
 * @property {string} id
 * @property {string} text
 * @property {File[]} photos
 * @property {File[]} videos
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UploadPage from './UploadPage';
import ResultsPage from './ResultsPage';

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#0f0f0f' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 'clamp(360px, 92vw, 900px)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2a',
              background: '#0f0f0f',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #25F4EE, #FE2C55)',
                }}
              />
              <div style={{ fontWeight: 700, color: '#ffffff' }}>Privacy Guard</div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
