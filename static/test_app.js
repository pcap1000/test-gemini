
class SpeechRecognitionHandler {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.initialize();
    }

    initialize() {
        const SpeechRecognition = window.SpeechRecognition || 
                                 window.webkitSpeechRecognition || 
                                 window.mozSpeechRecognition || 
                                 window.msSpeechRecognition;

        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.setupRecognition();
        }
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onerror = (event) => {
            console.error('Speech Recognition Error:', event.error);
            this.handleError(event.error);
            this.isListening = false;
            this.updateUI();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateUI();
        };
    }

    handleError(error) {
        let errorMessage = 'An error occurred with speech recognition.';
        
        switch (error) {
            case 'network':
                errorMessage = 'Network error occurred. Please check your connection.';
                break;
            case 'no-speech':
                errorMessage = 'No speech was detected. Please try again.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access was denied. Please allow microphone access.';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech recognition service is not allowed. Please try again later.';
                break;
        }
        
        alert(errorMessage);
    }

    updateUI() {
        const speechBtn = document.getElementById('speech-btn');
        if (speechBtn) {
            speechBtn.textContent = this.isListening ? '🔴' : '🎤';
            speechBtn.classList.toggle('listening', this.isListening);
        }
    }

    startListening(onResultCallback) {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.');
            return;
        }

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (onResultCallback) {
                onResultCallback(transcript);
            }
        };

        try {
            this.recognition.start();
            this.isListening = true;
            this.updateUI();
        } catch (error) {
            console.error('Speech Recognition Start Error:', error);
            this.handleError('start-error');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI();
        }
    }
}

class TextToSpeechHandler {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.initializeAvatar();
    }

    initializeAvatar() {
        const avatarContainer = document.getElementById('ai-avatar');
        avatarContainer.innerHTML = `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- Face Background -->
                <circle cx="100" cy="100" r="80" fill="#FFB6C1"/>
                
                <!-- Hair -->
                <path d="M40 50 Q100 20 160 50 C180 70 190 100 170 130 C150 160 50 160 30 130 C10 100 20 70 40 50" 
                      fill="#8B4513"/>
                
                <!-- Face Shape -->
                <ellipse cx="100" cy="120" rx="60" ry="70" fill="#FFA07A"/>
                
                <!-- Eyes -->
                <g id="eyes">
                    <ellipse cx="70" cy="100" rx="8" ry="10" fill="#000000"/>
                    <ellipse cx="130" cy="100" rx="8" ry="10" fill="#000000"/>
                    
                    <!-- Eyelashes -->
                    <path d="M62 90 Q70 85 78 90" stroke="#000000" stroke-width="2" fill="none"/>
                    <path d="M122 90 Q130 85 138 90" stroke="#000000" stroke-width="2" fill="none"/>
                </g>
                
                <!-- Eyebrows -->
                <path d="M55 80 Q70 70 85 80" stroke="#000000" stroke-width="2" fill="none"/>
                <path d="M115 80 Q130 70 145 80" stroke="#000000" stroke-width="2" fill="none"/>
                
                <!-- Nose -->
                <path d="M100 110 Q105 120 100 130" stroke="#000000" stroke-width="2" fill="none"/>
                
                <!-- Mouth -->
                <path id="mouth" d="M80 150 Q100 160 120 150" 
                      stroke="#000000" stroke-width="2" fill="none">
                    <animate id="speak"
                            attributeName="d"
                            dur="0.2s"
                            repeatCount="indefinite"
                            values="M80 150 Q100 160 120 150;M80 150 Q100 155 120 150;M80 150 Q100 160 120 150"
                            begin="indefinite"/>
                </path>
            </svg>
        `;
    }

    speak(text) {
        if (this.isSpeaking) {
            this.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Select a female voice
        const voices = this.synthesis.getVoices();
        const femaleVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman')
        );

        // Prefer a female English voice
        const femaleEnglishVoice = femaleVoices.find(voice => 
            voice.lang.startsWith('en-')
        );

        // Use the first found female voice, or fallback to default
        if (femaleEnglishVoice) {
            utterance.voice = femaleEnglishVoice;
        } else if (femaleVoices.length > 0) {
            utterance.voice = femaleVoices[0];
        }

        const mouthAnimation = document.querySelector('#speak');

        utterance.onstart = () => {
            this.isSpeaking = true;
            if (mouthAnimation) {
                mouthAnimation.beginElement();
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            if (mouthAnimation) {
                mouthAnimation.endElement();
            }
        };

        this.synthesis.speak(utterance);
    }

    cancel() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            const mouthAnimation = document.querySelector('#speak');
            if (mouthAnimation) {
                mouthAnimation.endElement();
            }
        }
    }
}

// Main Application
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const conversationHistory = document.getElementById('conversation-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const speechBtn = document.getElementById('speech-btn');
    const endConversationBtn = document.getElementById('end-conversation-btn');
    const conversationReport = document.getElementById('conversation-report');
    const reportText = document.getElementById('report-text');

    // Initialize Handlers
    const speechHandler = new SpeechRecognitionHandler();
    const textToSpeechHandler = new TextToSpeechHandler();

    // Session Management
    let sessionId = generateSessionId();

    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    // Message History Management
    function addMessageToHistory(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender.toLowerCase()}-message`);
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        
        // Only add speaker icon for AI messages
        if (sender === 'AI') {
            const speakerIcon = document.createElement('span');
            speakerIcon.innerHTML = '🔊';
            speakerIcon.classList.add('speaker-icon');
            speakerIcon.addEventListener('click', () => {
                textToSpeechHandler.speak(message);
            });
            messageElement.appendChild(speakerIcon);
        }
        
        conversationHistory.appendChild(messageElement);
        conversationHistory.scrollTop = conversationHistory.scrollHeight;
    }

    // Message Handling
    async function sendMessage(message) {
        if (!message.trim()) return;

        // Add user message to history
        addMessageToHistory('User', message);
        userInput.value = '';

        try {
            const response = await fetch('/api/generate-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userInput: message,
                    sessionId: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Add AI response to history
            addMessageToHistory('AI', data.text);
            
            // Automatically speak the AI response
            textToSpeechHandler.speak(data.text);
        } catch (error) {
            console.error('Error:', error);
            addMessageToHistory('AI', 'Sorry, I encountered an error processing your message.');
        }
    }

    // Rest of the code remains the same...
    // (Report Generation and Event Listeners)
    async function generateReport() {
        const messages = Array.from(conversationHistory.children)
            .map(el => el.textContent)
            .join('\n');

        try {
            const response = await fetch('/api/conversation-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationText: messages
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Display conversation report
            reportText.textContent = data.text;
            conversationReport.classList.remove('hidden');

            // Reset conversation
            conversationHistory.innerHTML = '';
            sessionId = generateSessionId();
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error generating conversation report. Please try again.');
        }
    }

    // Event Listeners
    sendBtn.addEventListener('click', () => sendMessage(userInput.value));
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(userInput.value);
        }
    });

    speechBtn.addEventListener('click', () => {
        if (speechHandler.isListening) {
            speechHandler.stopListening();
        } else {
            speechHandler.startListening((transcript) => {
                userInput.value = transcript;
                sendMessage(transcript);
            });
        }
    });

    endConversationBtn.addEventListener('click', generateReport);

    // Initial focus
    userInput.focus();
});