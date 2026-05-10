window.PomoshnikMultimedia = {
  mediaRecorder: null,
  recordingChunks: [],
  isRecording: false,

  startVoiceRecording: async function() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordingChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.recordingChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.onRecordingComplete(audioUrl, audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  stopVoiceRecording: function() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      return { success: true };
    }
    return { success: false };
  },

  transcribeAudio: async function(audioBlob) {
    try {
      const text = await this.speechToText(audioBlob);
      return { success: true, text: text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  speechToText: async function(audioBlob) {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      return new Promise((resolve, reject) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          resolve(transcript);
        };

        recognition.onerror = (event) => {
          reject(new Error('Ошибка распознавания речи: ' + event.error));
        };

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio();
        audio.src = audioUrl;
        audio.onended = () => {
          recognition.stop();
        };
        audio.play();
        recognition.start();
      });
    } else {
      return Promise.reject(new Error('Speech Recognition API не поддерживается'));
    }
  },

  capturePhoto: async function() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('Камера не найдена');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);

          stream.getTracks().forEach(track => track.stop());

          canvas.toBlob((blob) => {
            resolve({
              success: true,
              blob: blob,
              data: canvas.toDataURL('image/jpeg')
            });
          }, 'image/jpeg', 0.9);
        };
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  textToSpeech: async function(text) {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        return new Promise((resolve, reject) => {
          utterance.onend = () => resolve({ success: true });
          utterance.onerror = (event) => reject(new Error(event.error));
          
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        });
      } else {
        return { success: false, error: 'Text-to-Speech не поддерживается' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  shareMessage: async function(title, text, url = '') {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
        return { success: true };
      } else {
        const message = `${title}\n\n${text}\n\n${url}`;
        await navigator.clipboard.writeText(message);
        return { success: true, copied: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  startRealtimeVoiceRecognition: async function(onTranscript, onError, onEnd) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      if (onError) onError('Голосовой ввод не поддерживается в вашем браузере');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';
    let silenceTimeout;
    const SILENCE_DURATION = 350;
    this.currentRecognition = recognition;
    this.isRecognizing = true;

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        if (finalTranscript.trim()) {
          if (onEnd) {
            onEnd(finalTranscript.trim());
          }
          this.stopRealtimeVoiceRecognition();
        }
      }, SILENCE_DURATION);
    };

    recognition.onstart = () => {
      finalTranscript = '';
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          resetSilenceTimer();
        } else {
          interimTranscript += transcript;
        }
      }

      if (onTranscript) {
        onTranscript(finalTranscript + interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        return;
      }
      if (onError) {
        onError('Не расслышал. Попробуйте говорить чуть медленнее');
      }
    };

    recognition.onend = () => {
      this.isRecognizing = false;
      clearTimeout(silenceTimeout);
    };

    recognition.start();
  },

  stopRealtimeVoiceRecognition: function() {
    if (this.currentRecognition) {
      this.currentRecognition.stop();
      this.currentRecognition = null;
    }
  },

  onRecordingComplete: function(audioUrl, audioBlob) {
    if (window.pomoshnikApp) {
      window.pomoshnikApp.onVoiceRecorded(audioUrl, audioBlob);
    }
  }
};
