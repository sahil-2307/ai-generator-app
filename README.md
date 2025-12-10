# TheAIVault - Premium AI Content Creation Platform

A sophisticated AI-powered content creation platform built with Next.js 15, featuring video generation (Google Veo 3), image generation (DALL-E 3), and text generation (GPT-4o). Premium tier with credit-based system, Supabase database, and Cashfree payment integration.

![TheAIVault Premium](https://img.shields.io/badge/TheAIVault-Premium-violet?style=for-the-badge&logo=nextdotjs)

## Features

### 🔤 Text Generation
- **OpenAI Integration**: GPT-4o, GPT-4o Mini, o1-mini, and GPT-4 Turbo models
- **Vision Support**: Upload images for context with vision-capable models
- **Clean Output**: Well-formatted text generation results

### 🎬 Video Generation
- **Google Veo 3**: Text-to-video generation with Veo-3-Ultra and Veo-3-Lite models
- **Story Types**: Cinematic, vlog, product showcase, emotional, and playful styles
- **Duration Control**: 5, 10, or 20-second video generation
- **Download Support**: Direct video download functionality

### 📁 Media Upload
- **Drag & Drop**: Intuitive file upload interface
- **Multi-format Support**: Images (JPG, PNG, GIF) and videos (MP4, MOV, AVI)
- **Context Integration**: Use uploaded media for enhanced generation

### 🎨 Design
- **NotebookLM-inspired UI**: Clean, card-based layout with soft shadows
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern Styling**: TailwindCSS with custom design system

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS
- **APIs**: OpenAI Chat Completions & Vision, Google Veo 3
- **Runtime**: Node.js

## Quick Start

### Prerequisites
- Node.js 18.20+ or 20.9+
- npm or yarn
- OpenAI API key
- Google Veo 3 API key (when available)

### Installation

1. **Clone & Navigate**
   ```bash
   cd ai-generator-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   VEO_API_KEY=your_veo_api_key_here
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ai-generator-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-text/route.ts    # OpenAI text generation
│   │   │   └── generate-video/route.ts   # Veo 3 video generation
│   │   ├── globals.css                   # Global styles & CSS variables
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Main application page
│   ├── components/
│   │   ├── TabNavigation.tsx             # Navigation tabs
│   │   ├── TextGeneration.tsx            # Text generation interface
│   │   ├── VideoGeneration.tsx           # Video generation interface
│   │   └── MediaUpload.tsx               # File upload component
│   └── types/
│       └── index.ts                      # TypeScript type definitions
├── public/                               # Static assets
├── .env.local                           # Environment variables
└── package.json                         # Dependencies & scripts
```

## Usage

### Text Generation
1. Switch to the **Text Generation** tab
2. Enter your prompt in the text area
3. Select your preferred OpenAI model
4. Optionally upload an image for vision models
5. Click **Generate Text**
6. View results in the output panel

### Video Generation
1. Switch to the **Video Generation** tab
2. Enter a descriptive video prompt
3. Choose story type and duration
4. Select Veo model (Ultra or Lite)
5. Click **Generate Video**
6. Watch and download your generated video

### Media Upload
1. Switch to the **Media Upload** tab
2. Drag & drop files or click to browse
3. Preview uploaded files
4. Use **Process Files** to prepare media for generation

## API Configuration

### OpenAI Setup
1. Get API key: [platform.openai.com](https://platform.openai.com/)
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Supported models: GPT-4o, GPT-4o Mini, o1-mini, GPT-4 Turbo

### Google Veo 3 Setup
1. Access Google AI Studio or Vertex AI
2. Enable Veo 3 API access
3. Add to `.env.local`: `VEO_API_KEY=your_key`
4. Configure billing and quotas

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Customization
- **Styling**: Modify `tailwind.config.js` and `globals.css`
- **Models**: Update model arrays in components
- **API Routes**: Extend `/api` routes for additional functionality

## Demo Mode

The app includes demo mode for testing without API keys:
- Text generation returns mock responses
- Video generation provides sample video links
- All UI interactions work normally

## Production Deployment

### Vercel (Recommended)
1. Push to GitHub repository
2. Connect to Vercel
3. Set environment variables in dashboard
4. Deploy automatically

### Other Platforms
- Configure build command: `npm run build`
- Set start command: `npm start`
- Ensure Node.js 20.9+ runtime

## Troubleshooting

**API Key Issues**
- Verify keys are correctly set in `.env.local`
- Restart development server after changes
- Check API key permissions and quotas

**Build Errors**
- Ensure Node.js version compatibility
- Clear `.next` folder and reinstall dependencies
- Check TypeScript errors: `npm run build`

**Styling Issues**
- Restart server after TailwindCSS changes
- Verify class names in components
- Check browser developer tools for CSS conflicts

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Next.js, OpenAI, and Google Veo 3**