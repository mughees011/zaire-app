import React from 'react';

function buildArchiveMessageItems(session) {
  const messages = Array.isArray(session?.messages) ? session.messages : [];
  const signatureCounts = new Map();

  return messages.map((message) => {
    const signature = [
      message?.id || '',
      message?.timestamp || message?.createdAt || '',
      message?.role || 'assistant',
      String(message?.content || '').trim()
    ].join('::');
    const duplicateCount = (signatureCounts.get(signature) || 0) + 1;
    signatureCounts.set(signature, duplicateCount);

    return {
      message,
      messageKey: `${signature}::${duplicateCount}`
    };
  });
}

export default function ArchiveConversation({ session }) {
  const archiveItems = buildArchiveMessageItems(session);

  if (!archiveItems.length) {
    return <div className="archives-empty-state">Select and load a session to preview full transcript.</div>;
  }

  return archiveItems.map(({ message, messageKey }, index) => {
    const isUser = message.role === 'user';
    return (
      <div key={messageKey} className={`archive-message ${isUser ? 'user' : 'zaire'}`}>
        <div className="archive-message-head">
          <span className="archive-message-role">{isUser ? 'USER' : 'ZAIRE'}</span>
          <span className="archive-message-index">#{index + 1}</span>
        </div>
        <div className="archive-message-body">{message.content}</div>
      </div>
    );
  });
}
