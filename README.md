# GRE Vocabulary Learning Platform

A comprehensive vocabulary learning application built with Flask backend and React frontend, designed specifically for GRE preparation and vocabulary enhancement.

## 🚀 Latest Features (v2.0)

### 🔍 **Google Search Integration**
- **One-click Google Search**: Click any word in the library, homepage, or flashcards to instantly search it on Google
- **Smart Search Queries**: Automatically includes "meaning definition" for better search results
- **Universal Access**: Available across all pages - Library, Homepage, Learn (Flashcards)

### 🎴 **Enhanced Flashcard Experience**
- **3D Flip Animation**: Smooth card flipping animation with CSS transforms
- **Interactive Design**: Hover effects and visual feedback
- **Google Search Integration**: Search words directly from flashcards

### 🤖 **AI-Powered Story Generation**
- **Google Gemini API Integration**: Advanced AI story generation
- **Customizable Options**: Control tone, length, character, and scenario
- **Fallback System**: Works with or without API key
- **Smart Word Integration**: Naturally incorporates vocabulary words into stories

### 🔎 **Advanced Search & Recommendations**
- **Library Search**: Real-time search across all word properties
- **Dynamic Recommendations**: AI-powered word suggestions from your library
- **Word of the Day**: Daily vocabulary with pronunciation and Google search
- **Smart Filtering**: Search by word, meaning, synonyms, antonyms, examples

## Features

### Core Functionality
- **User Authentication**: Secure login and registration system
- **Library Management**: Create and manage multiple vocabulary libraries
- **Word Management**: Add, edit, delete, and organize vocabulary words
- **CSV Import/Export**: Bulk import words from CSV files and export libraries
- **Flashcard Learning**: Interactive flashcard system with 3D animations
- **Story Builder**: AI-powered story creation using selected vocabulary words
- **Quiz System**: Test your knowledge with various quiz formats
- **Progress Tracking**: Monitor learning progress and statistics

### Advanced Features
- **Master Library**: Automatic aggregation of all words from user libraries
- **Word Status Tracking**: Mark words as learned/unlearned
- **Google Search Integration**: One-click word lookup across all pages
- **Real-time Search**: Instant search across libraries with debouncing
- **AI Story Generation**: Google Gemini API integration for creative stories
- **Text-to-Speech**: Word pronunciation with browser TTS
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Dynamic content updates without page refresh

## Technology Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM with advanced querying
- **Flask-JWT-Extended**: JWT authentication
- **SQLite**: Database (easily configurable for other databases)
- **Marshmallow**: Data serialization and validation
- **CORS Support**: Cross-origin resource sharing

### Frontend
- **React 18**: Modern React with hooks and TypeScript
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: High-quality UI components
- **React Router**: Client-side routing
- **Sonner**: Toast notifications
- **CSS Animations**: 3D transforms and smooth transitions

### AI Integration
- **Google Gemini API**: Advanced language model for story generation
- **Configurable API**: Easy setup with environment variables
- **Fallback System**: Works without API key using template-based generation

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Google Gemini API key (optional, for AI features)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gre-vocabulary-platform
   ```

2. Create and activate virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python init_db.py
   ```

5. Run the backend server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   # Edit .env and add your Google Gemini API key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:8082`

## 🔧 Configuration

### Google Gemini API Setup (Optional)
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file in the frontend directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the frontend development server

**Note**: The application works perfectly without the API key using a fallback story generator.

## Usage

### Getting Started
1. Register a new account or login with existing credentials
2. Create your first vocabulary library
3. Add words manually or import from CSV
4. Start learning with flashcards or create AI-powered stories

### New Features Guide

#### Google Search Integration
- **In Library**: Click any word in table or card view to search on Google
- **On Homepage**: Click words in recommendations or word of the day
- **In Flashcards**: Click words on front or back of cards
- **Search Button**: Use the Google search icon for quick access

#### Enhanced Flashcards
- **Flip Animation**: Click cards to see smooth 3D flip animation
- **Interactive Elements**: Hover for visual feedback
- **Multiple Actions**: Pronounce, search, or navigate between cards

#### AI Story Generation
- **Word Selection**: Use enhanced search to find and select words
- **Customization**: Choose genre, tone, length, character, and scenario
- **AI Generation**: Let Gemini AI create engaging stories with your words
- **Fallback Mode**: Template-based generation when API is not configured

#### Advanced Search
- **Library Search**: Real-time search across all word properties
- **Recommendations**: Get personalized word suggestions
- **Word of the Day**: Daily vocabulary with full integration

## 🎯 Key Improvements

### User Experience
- **One-click Google Search**: Instant word lookup from anywhere
- **Smooth Animations**: 3D card flips and hover effects
- **Real-time Search**: Instant results as you type
- **Smart Recommendations**: Personalized word suggestions

### Performance
- **Debounced Search**: Optimized API calls
- **Efficient Caching**: Reduced server load
- **Responsive Design**: Fast loading on all devices

### AI Integration
- **Google Gemini API**: State-of-the-art language model
- **Graceful Fallback**: Works without API configuration
- **Customizable Generation**: Full control over story parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.
