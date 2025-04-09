from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import json
import re
import random
import datetime

app = Flask(__name__)
CORS(app)

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

lemmatizer = WordNetLemmatizer()

def load_intents():
    return {
        "intents": [
            {
                "tag": "greeting",
                "patterns": ["hi", "hello", "hey", "good morning", "good evening", "hey there"],
                "responses": [
                    "Welcome to QuickCart! I'm your virtual shopping assistant. How may I assist you today?",
                    "Hello! I'm here to help make your shopping experience better. What can I do for you?",
                    "Welcome! I'm QuickCart's AI assistant. Would you like help with registration, product search, or shopping information?"
                ]
            },
            {
                "tag": "registration",
                "patterns": ["how to register", "sign up", "create account", "registration process", "make account"],
                "responses": [
                    "To register on QuickCart:\n1. Click the 'Sign Up' button in the top right\n2. Enter your email and create a password\n3. Verify your email\n4. Complete your profile\n\nWould you like me to guide you through the process?"
                ]
            },
            {
                "tag": "product_search",
                "patterns": ["find product", "search for", "looking for", "where can i find", "do you have"],
                "responses": [
                    "I can help you find products! What are you looking for? You can:\n- Type the product name\n- Describe the category\n- Or ask about specific features"
                ]
            },
            {
                "tag": "order_tracking",
                "patterns": ["track order", "where is my order", "order status", "delivery status"],
                "responses": [
                    "To track your order:\n1. Go to 'My Orders' in your account\n2. Click on the specific order\n3. You'll see real-time tracking information\n\nWould you like me to check any specific order for you?"
                ]
            },
            {
                "tag": "shipping",
                "patterns": ["shipping time", "delivery time", "when will i receive", "shipping cost", "delivery fee"],
                "responses": [
                    "Our shipping services:\n- Standard: 3-5 business days\n- Express: 1-2 business days\n- Free shipping on orders above $50\n\nWould you like to know more about shipping to your location?"
                ]
            },
            {
                "tag": "return_policy",
                "patterns": ["return policy", "can i return", "how to return", "refund policy"],
                "responses": [
                    "Our return policy:\n- 30-day return window\n- Free returns\n- Full refund or store credit\n\nWould you like me to explain the return process?"
                ]
            },
            {
                "tag": "payment_methods",
                "patterns": ["payment methods", "how to pay", "payment options", "do you accept"],
                "responses": [
                    "We accept:\n- Credit/Debit cards\n- PayPal\n- Apple Pay\n- Google Pay\n\nAll payments are secure and encrypted. Need more details about any payment method?"
                ]
            },
            {
                "tag": "help",
                "patterns": ["help", "support", "customer service", "contact"],
                "responses": [
                    "I can help you with:\n1. Product Search\n2. Registration\n3. Order Tracking\n4. Shipping Info\n5. Returns\n6. Payment Methods\n\nWhat would you like to know more about?"
                ]
            }
        ]
    }

def preprocess_message(message):
    # Tokenize the message
    tokens = word_tokenize(message.lower())
    
    # Remove stopwords and lemmatize
    stop_words = set(stopwords.words('english'))
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stop_words and token.isalnum()]
    
    return tokens

def get_response(message, intents):
    preprocessed_message = preprocess_message(message)
    
    best_match = None
    highest_score = 0
    
    for intent in intents["intents"]:
        for pattern in intent["patterns"]:
            pattern_tokens = preprocess_message(pattern)
            
            # Calculate similarity score
            score = sum(1 for token in preprocessed_message if token in pattern_tokens)
            
            if score > highest_score:
                highest_score = score
                best_match = intent
    
    if best_match and highest_score > 0:
        return random.choice(best_match["responses"])
    return "I'm not sure I understand. Could you please rephrase that?"

def save_message(user_message, bot_response):
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute("INSERT INTO messages (user_message, bot_response) VALUES (?, ?)",
              (user_message, bot_response))
    conn.commit()
    conn.close()

@app.route('/chat/search_products', methods=['POST'])
def search_products():
    data = request.get_json()
    query = data.get('query', '').lower()
    
    # Connect to your MongoDB database
    try:
        # Use your existing product model/schema
        from models.Product import Product
        
        # Search products in your database
        products = Product.find({
            'name': {'$regex': query, '$options': 'i'}
        }).limit(4)  # Limit to 4 products for display
        
        product_list = [{
            'id': str(product._id),
            'name': product.name,
            'price': product.price,
            'image': product.image,
            'url': f'/product/{str(product._id)}'
        } for product in products]
        
        return jsonify({
            'products': product_list,
            'message': f"I found {len(product_list)} products matching your search."
        })
    except Exception as e:
        print(f"Error searching products: {e}")
        return jsonify({
            'products': [],
            'message': "Sorry, I couldn't find any products matching your search."
        })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Get response from chatbot
    intents = load_intents()
    response_data = get_response(user_message, intents)
    
    return jsonify(response_data)

@app.route('/history', methods=['GET'])
def get_history():
    conn = sqlite3.connect('chatbot.db')
    c = conn.cursor()
    c.execute("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50")
    messages = c.fetchall()
    conn.close()
    
    return jsonify([{
        'id': msg[0],
        'user_message': msg[1],
        'bot_response': msg[2],
        'timestamp': msg[3]
    } for msg in messages])

if __name__ == '__main__':
    app.run(debug=True, port=5000)