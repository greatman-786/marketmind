🧠 MarketMind

An AI-powered marketing intelligence platform that helps businesses create 
data-driven marketing strategies, analyse competitors, and generate compelling 
marketing content — built and deployed on Vercel.

🌐 **Live Demo:** https://marketmind-gray.vercel.app

---

## 🚀 Features

- 🧠 **AI-generated marketing strategies** tailored to your business
- 🔍 **Competitor analysis** powered by AI insights
- ✍️ **Marketing copy generation** for any channel
- 📊 **Campaign planning** with actionable recommendations
- 🎯 **Target audience identification** and segmentation
- 📱 **Fully responsive** — works on desktop and mobile

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js / React | Frontend framework |
| Vercel | Deployment and hosting |
| Anthropic Claude / Gemini | AI strategy and content generation |
| Tailwind CSS | Styling and UI |

---

## 🔄 How It Works
User Enters Business Details

↓

AI Analyses Market & Competitors

↓

Target Audience Identified

↓

Marketing Strategy Generated

↓

Actionable Campaign Plan Delivered

---

## ⚙️ Setup & Installation

1. Clone the repository
```bash
git clone https://github.com/greatman-786/marketmind.git
cd marketmind
```

2. Install dependencies
```bash
npm install
```

3. Add environment variables
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run locally
```bash
npm run dev
```

5. Open `http://localhost:3000`

---

## 📁 Project Structure
marketmind/

│

├── pages/          # Next.js pages

├── components/     # Reusable UI components

├── styles/         # Tailwind CSS styles

├── lib/            # AI integration logic

└── README.md       # Project documentation

---

## 🧠 AI Integration

The AI layer powers the entire marketing intelligence engine:
- **Analyses business details** and identifies market opportunities
- **Generates complete marketing strategies** with clear action steps
- **Writes marketing copy** for social media, email and ads
- **Identifies target audiences** and suggests positioning
- **Provides competitor insights** to find gaps in the market
- Works with both **Anthropic Claude** and **Google Gemini**

---

## ⚡ Challenges & How I Solved Them

### 1. 🔑 API Credit Exhaustion
**Problem:** The Anthropic API key ran out of credits during testing, 
completely blocking all AI marketing strategy generation.  
**Solution:** Switched to **Google Gemini** (free tier) as a drop-in 
replacement and configured the API key properly in **Vercel environment 
variables** for secure management across environments.

### 2. 🎯 Generating Actionable vs Generic Strategies
**Problem:** Early AI outputs produced very generic marketing advice that 
wasn't specific enough to be useful for real businesses.  
**Solution:** Heavily refined the prompt engineering — instructing the AI to 
ask for **specific industry, budget, and target location** before generating 
strategies, producing much more relevant and actionable recommendations.

### 3. 📊 Structuring Complex Marketing Output
**Problem:** AI-generated marketing strategies were returned as large blocks 
of unstructured text — hard to read and difficult to act on.  
**Solution:** Built a **structured output UI** that organises strategy into 
clear sections — target audience, key messages, channel recommendations, 
and campaign ideas — making it immediately actionable for business owners.

### 4. 🚀 Vercel Deployment Issues
**Problem:** Long AI requests for detailed marketing strategies exceeded 
Vercel's serverless function timeout limits during deployment.  
**Solution:** Implemented **streaming responses** so strategy content 
appears progressively as it is generated — keeping users engaged and 
staying within serverless time limits.

---

## 💡 Use Cases

- Startups building their first marketing strategy
- Small businesses competing against larger brands
- Marketing agencies generating strategies for clients
- Entrepreneurs launching new products or services

---

## 🙋‍♂️ Author

**Asad** — Software Engineer  
Building AI-powered web applications for real-world use cases
