# JSCAD LLM Generator

A web application that generates 3D models using Large Language Models and JSCAD (JavaScript Computer Aided Design).

## Features

- **AI-Powered 3D Generation**: Describe 3D models in natural language and get JSCAD code
- **Real-time 3D Viewer**: Interactive 3D visualization using Three.js and React Three Fiber
- **Chat Interface**: Intuitive chat-based interaction for model generation
- **JSCAD Integration**: Generates and executes JSCAD code for precise 3D modeling

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js with React Three Fiber
- **3D Modeling**: JSCAD (JavaScript Computer Aided Design)
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure LLM API (Optional)**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## LLM Integration

The app supports multiple LLM providers:

### Supported Providers

- **OpenAI GPT-4** (recommended)
- **Anthropic Claude** 
- **Google Gemini**
- **Simulation Mode** (default, no API key required)

### Configuration

1. Copy `.env.example` to `.env`
2. Add your API key(s) for the provider(s) you want to use
3. Set `VITE_LLM_PROVIDER` to your preferred provider:
   - `openai` for OpenAI GPT
   - `anthropic` for Claude
   - `google` for Gemini
   - `simulation` for local simulation

### API Keys

- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
- **Anthropic**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **Google**: Get from [makersuite.google.com](https://makersuite.google.com/app/apikey)

### Custom Prompts

The app uses a sophisticated system prompt optimized for JSCAD code generation. The prompt includes:

- JSCAD syntax and structure guidance
- Available primitives and operations
- Code formatting requirements
- Error handling best practices

## Usage

1. Type a description of the 3D model you want to create in the chat input
2. Examples:
   - "Create a cube"
   - "Make a sphere with radius 10"
   - "Generate a cylinder"
3. The AI will generate JSCAD code and display the 3D model in the viewer
4. You can interact with the 3D model using mouse controls (rotate, zoom, pan)

## Project Structure

```
src/
├── components/          # React components
│   ├── Chat.tsx        # Chat interface component
│   └── ModelViewer.tsx # 3D model viewer component
├── utils/              # Utility functions
│   └── jscadExecutor.ts # JSCAD code execution and geometry conversion
├── types/              # TypeScript type definitions
│   └── index.ts        # Type definitions for the app
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Future Enhancements

- Integration with real LLM APIs (OpenAI, Claude, etc.)
- Model export functionality (STL, OBJ formats)
- Model history and saving
- Advanced JSCAD features and operations
- Real-time collaboration
- Custom material and lighting options 