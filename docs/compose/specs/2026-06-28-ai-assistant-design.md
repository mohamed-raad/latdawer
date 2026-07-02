# AI Assistant Feature - Design Spec

## [S1] Problem
Store owners need help managing inventory. They describe items in Iraqi dialect but have no easy way to add them to the system with photos and details. The platform needs an AI assistant specialized for automotive spare parts that understands Iraqi terminology.

## [S2] Solution Overview
Multi-provider AI system with admin-managed providers/models, subscription-based access, and a specialized chat assistant for store owners that searches for product photos and guides inventory creation.

## [S3] AI Provider Management (Admin)

### Database Tables
- `ai_providers`: id, name, slug, apiEndpoint, apiKey (encrypted), enabled, config JSON, createdAt
- `ai_models`: id, providerId, modelId, name, maxTokens, costPer1kTokens, enabled
- `ai_usage`: id, userId, modelId, tokensUsed, requestCount, period (daily/monthly), createdAt

### Admin Panel (/admin/ai)
- List all providers (Gemini, NVIDIA NIM, GroqCloud, Mistral)
- Add/edit/delete provider API keys (encrypted)
- Enable/disable providers
- List all models per provider
- Enable/disable models per provider
- Set usage limits per subscription level
- View usage statistics

## [S4] Subscription-based AI Access

### Extended Subscription Plans
- `aiModels`: array of model IDs allowed
- `aiDailyLimit`: max AI requests per day
- `aiMonthlyTokens`: max tokens per month

### Levels
- Basic: 1 model (GroqCloud Llama), 50 requests/day
- Premium: 3 models (Groq + Mistral + Gemini Flash), 200 requests/day
- Enterprise: All models, unlimited

## [S5] Store Owner AI Assistant

### Database Tables
- `ai_conversations`: id, storeId, userId, title, createdAt, updatedAt
- `ai_messages`: id, conversationId, role, content, metadata JSON, createdAt
- `ai_photo_suggestions`: id, messageId, imageUrl, source, searchTerm, status (pending/accepted/rejected), createdAt

### Chat Page (/dashboard/ai)
- Conversation list (past chats)
- New chat button
- Chat interface with message history
- Text input with send button
- Voice input button (STT)
- Photo suggestion cards with accept/reject buttons

### AI System Prompt
Specialized for automotive spare parts in Iraqi dialect:
- لايت = light, بولي = pulley, قايش = belt, كشن = seat cushion
- كير = transmission, سلف = starter, راديتر = radiator
- فلتر = filter, برمجة = ECU, اكسل = differential
- سايق = driver, دينمو = alternator, شن = shock absorber

### Chat Flow
1. Owner describes items in Iraqi dialect
2. AI identifies parts and searches internet for photos (SearXNG)
3. Owner accepts/rejects photos
4. AI asks for details: quantity, condition (جديد/مستعمل/تفصيخ), price (IQD), part number, brand, compatible vehicles
5. Owner provides details
6. AI adds items to inventory with photos

### Learning System
- AI asks admin about unknown terminology
- AI asks users about unfamiliar item names
- Builds knowledge base over time

## [S6] Internet Search (SearXNG)
- Cloudflare Worker proxy for SearXNG
- Image search for product photos
- Fallback to text search if image search fails
- Cache search results to reduce API calls