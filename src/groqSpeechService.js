const GROQ_API_KEY = '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';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LLM_MODEL = 'llama-3.1-8b-instant';

class GroqSpeechService {
  constructor(onTranscript, onInterim, onError) {
    this.onTranscript = onTranscript;
    this.onInterim = onInterim;
    this.onError = onError;
    this.isRecording = false;
    this.recognition = null;
    this.lastTranscript = '';
    this.audioChunks = [];
  }

  async start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.onError?.('Browser speech not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    
    const browserLang = (navigator.language || 'en').substring(0, 2);
    const langMap = { 'ur': 'ur-PK', 'hi': 'hi-IN', 'ar': 'ar-SA', 'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR' };
    this.recognition.lang = langMap[browserLang] || 'en-US';

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      
      if (interim) {
        this.onInterim?.(interim);
      }
      if (final.trim()) {
        this.lastTranscript = final.trim();
        this.onTranscript?.(final.trim());
        this.processWithLLM(final.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      if (event.error !== 'no-speech') {
        this.onError?.(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try { this.recognition.start(); } catch(e) {}
      }
    };

    this.recognition.start();
    this.isRecording = true;
    
    console.log('Groq service: Browser speech started with lang:', this.recognition.lang);
    return true;
  }

  stop() {
    this.isRecording = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e) {}
      this.recognition = null;
    }
  }

  async processWithLLM(transcript) {
    try {
      const response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: 'You are J.A.R.V.I.S. Respond concisely.' },
            { role: 'user', content: transcript }
          ],
          temperature: 0.7,
          max_tokens: 128
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          console.log('J.A.R.V.I.S.:', data.choices[0].message.content);
        }
      }
    } catch (error) {
      console.log('LLM:', error.message);
    }
  }

  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

export default GroqSpeechService;