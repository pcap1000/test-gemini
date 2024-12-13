# app.py
import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure GenAI API
genai.configure(api_key=('AIzaSyC8osUGScSbHj3S_glMdMfnftfjGfuCEaY'))
model = genai.GenerativeModel("gemini-1.5-flash")

# Conversation management class
class ConversationManager:
    def __init__(self):
        self.conversations = {}

    def add_message(self, session_id, sender, message):
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        self.conversations[session_id].append({
            'sender': sender,
            'text': message
        })

    def get_conversation(self, session_id):
        return self.conversations.get(session_id, [])

    def clear_conversation(self, session_id):
        if session_id in self.conversations:
            del self.conversations[session_id]

# Initialize conversation manager
conversation_manager = ConversationManager()

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/generate-response', methods=['POST'])
def generate_response():
    """Generate AI response based on conversation context"""
    data = request.json
    user_input = data.get('userInput', '')
    session_id = data.get('sessionId', 'default')
    
    # Add user input to conversation history
    conversation_manager.add_message(session_id, 'User', user_input)
    
    # Prepare conversation history for prompt
    conversation_history = conversation_manager.get_conversation(session_id)
    history_text = "\n".join([f"{msg['sender']}: {msg['text']}" for msg in conversation_history])
    
    # Generate AI response
    try:
        prompt = (
                    "Continue the conversation naturally by responding to the user and asking "
                    "a follow-up question to keep the discussion interesting. Try to know about the person\n\n"
                    f"Conversation so far:\n{history_text}\n\n"
                    "AI:"
                )
        response = model.generate_content(prompt)
        ai_response = response.text.strip()
        
        # Add AI response to conversation history
        conversation_manager.add_message(session_id, 'AI', ai_response)
        
        return jsonify({
            'text': ai_response,
            'sessionId': session_id
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'text': "I'm sorry, but I'm having trouble generating a response right now."
        }), 500

@app.route('/api/conversation-report', methods=['POST'])
def generate_conversation_report():
    """Generate a language skills report for the conversation"""
    data = request.json
    conversation_text = data.get('conversationText', '')
    
    try:
        # Generate conversation analysis
        report_prompt = (
            "Analyze the following conversation for the user's English and grammar skills. "
            "Provide Simple feedback on their grammar, vocabulary, and fluency, and suggest not more than 30 words "
            "specific areas for improvement:\n\n"
            f"{conversation_text}\n\n"
            "Simple Report:"
        )
        
        response = model.generate_content(report_prompt)
        report = response.text.strip()
        
        return jsonify({
            'text': report
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'text': "Unable to generate conversation report at this time."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
