import React from 'react';

export default function ApiSlot({ slot, status, provider, purpose, model, apiKey, baseUrl, empty = false, onChange, mask }) {
  const baseId = `api-slot-${slot}`;
  return (
    <div className="api-slot">
      <div className="api-slot-header">
        <span className="api-provider">SLOT {slot}</span>
        <span className={`api-status ${empty ? 'empty' : status === 'PENDING' ? 'pending' : 'connected'}`}>
          {status}
        </span>
      </div>
      <select
        id={`${baseId}-provider`}
        name={`${baseId}-provider`}
        className="api-provider-select"
        value={provider}
        onChange={(e) => onChange({ provider: e.target.value })}
        style={{ width: '100%', marginBottom: 6 }}
      >
        <option>OpenAI</option>
        <option>OpenRouter</option>
        <option>Groq</option>
        <option>Anthropic</option>
        <option>Google Gemini</option>
        <option>DeepSeek</option>
        <option>Azure OpenAI</option>
        <option>Cohere</option>
        <option>Mistral</option>
        <option>SiliconFlow</option>
        <option>Empty</option>
      </select>
      <input
        id={`${baseId}-key`}
        name={`${baseId}-key`}
        className="api-key-input"
        type="password"
        value={apiKey || ''}
        onChange={(e) => onChange({ apiKey: e.target.value, hasKey: Boolean(e.target.value), mask: '' })}
        placeholder={mask ? `Stored securely: ${mask}` : (empty ? 'Paste provider key...' : 'Paste provider key...')}
      />
      <input
        id={`${baseId}-base-url`}
        name={`${baseId}-base-url`}
        className="api-key-input"
        type="text"
        value={baseUrl || ''}
        onChange={(e) => onChange({ baseUrl: e.target.value })}
        placeholder="Optional custom base URL (OpenAI-compatible)"
      />
      <input
        id={`${baseId}-model`}
        name={`${baseId}-model`}
        className="api-key-input"
        type="text"
        value={model || ''}
        onChange={(e) => onChange({ model: e.target.value })}
        placeholder="Optional exact model ID from your provider account"
      />
      <div className="api-row">
        <select id={`${baseId}-purpose`} name={`${baseId}-purpose`} className="api-purpose" value={purpose} onChange={(e) => onChange({ purpose: e.target.value })}>
          <option>Primary</option>
          <option>Coding</option>
          <option>Research</option>
          <option>Vision</option>
          <option>Fallback</option>
        </select>
        <button type="button" className="api-test-btn" onClick={() => onChange({ enabled: provider !== 'Empty' })}>SET</button>
      </div>
    </div>
  );
}
