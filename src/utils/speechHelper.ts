// Speech helper for Telugu and English audio interactions

export function speakTeluguText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[LocalPulse AI] Speech synthesis not supported in this browser.');
    onError?.('Speech synthesis not supported');
    return { stop: () => {} };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // slightly slower for maximum clarity in mandi environment
  utterance.pitch = 1.0;

  // Try to find a Telugu voice or Indian English / local voice
  const voices = window.speechSynthesis.getVoices();
  const teluguVoice = voices.find(
    (v) => v.lang.startsWith('te') || v.lang.includes('te-IN') || v.name.toLowerCase().includes('telugu')
  );
  const indianVoice = voices.find(
    (v) => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india')
  );

  if (teluguVoice) {
    utterance.voice = teluguVoice;
    utterance.lang = teluguVoice.lang;
  } else if (indianVoice) {
    utterance.voice = indianVoice;
    utterance.lang = 'te-IN';
  } else {
    utterance.lang = 'te-IN';
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('[LocalPulse AI] Speech synthesis error:', e);
    onError?.(e);
  };

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => {
      window.speechSynthesis.cancel();
      onEnd?.();
    }
  };
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Browser Speech Recognition wrapper
export function createSpeechRecognizer(
  lang: 'te-IN' | 'en-IN' = 'te-IN',
  onResult: (transcript: string) => void,
  onError: (error: string) => void,
  onEnd: () => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      onError(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (err: any) {
    console.error('[LocalPulse AI] Failed to initialize SpeechRecognition:', err);
    return null;
  }
}
