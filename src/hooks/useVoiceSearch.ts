import { useState, useRef, useEffect, useCallback } from 'react';

export function useVoiceSearch(onCommand: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
       recognitionRef.current = new SpeechRecognition();
       recognitionRef.current.lang = 'bn-BD';
       recognitionRef.current.continuous = true;
       recognitionRef.current.interimResults = false;
       recognitionRef.current.maxAlternatives = 1;
       
       // Try auto-starting if possible, maybe we don't automatically start everywhere to avoid multiple captures
       // We can export start/stop
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };
  }, []);

  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      const currentResultPattern = event.results[event.results.length - 1];
      if (currentResultPattern.isFinal) {
          const transcript = currentResultPattern[0].transcript;
          setVoiceFeedback(transcript);
          onCommandRef.current(transcript);
          setTimeout(() => setVoiceFeedback(null), 3000);
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
          try { recognitionRef.current.start(); } catch(e) {}
      }
    };

    recognitionRef.current.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.error("Speech recognition error:", e.error);
      }
      setIsListening(false);
    };
  }, [isListening]);

  const toggleVoiceSearch = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch(e) {}
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setIsListening(true);
    try { recognitionRef.current.start(); } catch(e) {}
  }, [isListening]);

  return {
    isListening,
    voiceFeedback,
    toggleVoiceSearch,
    startListening,
  };
}
