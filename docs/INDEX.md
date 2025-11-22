# Documentation Index

Welcome to the SecondBrain documentation. Start here to understand the project structure and find what you need.

## Quick Start

**New to the project?** Start with:
1. [ARCHITECTURE.md](ARCHITECTURE.md) - System overview (5 min read)
2. [FRONTEND.md](FRONTEND.md) - Frontend setup (10 min read)
3. [API.md](API.md) - API setup (10 min read)

## Complete Documentation

### 📐 Architecture & Design
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - High-level system design, tech stack, data flow
  - Project structure overview
  - Technology stack comparison table
  - Key features and MVP status
  - Integration points
  - Entry points and setup

- **[PATTERNS.md](PATTERNS.md)** - Code standards, design patterns, best practices
  - Core principles (YAGNI, KISS, DRY, no magic numbers)
  - Frontend component patterns
  - API endpoint patterns
  - Type safety guidelines
  - Testing patterns
  - Performance optimization
  - Git & commit conventions
  - Code review checklist

### 💻 Frontend Development
- **[FRONTEND.md](FRONTEND.md)** - Next.js + React application documentation
  - Project structure (src/ organization)
  - Core components (Editor, Graph, Audio, Sidebar)
  - State management with Zustand
  - Type system and interfaces
  - Design system (spacing, colors, shadcn/ui)
  - Development setup
  - Scripts and build process
  - Key features checklist
  - Performance optimizations
  - Accessibility standards
  - Build information
  - Known limitations

### 🔌 Backend API
- **[API.md](API.md)** - Speech-to-Text API documentation
  - Endpoint reference (POST /speech-to-text)
  - Request/response examples
  - Setup and installation
  - Development workflow
  - Code structure
  - Implementation details
  - Dependencies and versions
  - Deployment options (local, Lambda, Docker)
  - Configuration and security
  - Troubleshooting guide

### 🔄 Integration
- **[INTEGRATION.md](INTEGRATION.md)** - Frontend-API connection guide
  - Architecture diagram
  - Step-by-step integration process
  - Environment variable setup
  - Code changes required
  - CORS configuration
  - Local testing procedure
  - Error handling examples
  - Production deployment
  - Performance considerations
  - Security checklist
  - Monitoring setup
  - Troubleshooting guide
  - Rollback plan

### 🚀 Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
  - Frontend deployment (Vercel)
  - API deployment (AWS Lambda)
  - Step-by-step instructions
  - Environment configuration
  - Testing deployments
  - Monitoring & debugging
  - Cost estimation
  - Scaling strategies
  - CI/CD pipeline setup
  - Rollback procedures
  - Security checklist
  - Post-deployment tasks

### 📋 Product & Specs
- **[SPECS.md](SPECS.md)** - Product specification and requirements
  - Problem statement
  - Solution overview
  - Target users
  - MVP features (MoSCoW prioritization)
  - Business model
  - Success metrics
  - Roadmap

### 🏗️ Architecture Decision Records
- **[adr/](adr/)** - Architectural decisions
  - Templates for documenting decisions
  - Rationale and consequences
  - Status tracking (Proposed, Accepted, Superseded)

## By Task

### "I want to..."

#### Set up development environment
1. Read: [ARCHITECTURE.md](ARCHITECTURE.md) - Overview
2. For Frontend: [FRONTEND.md](FRONTEND.md) - Setup section
3. For API: [API.md](API.md) - Setup section

#### Connect frontend to real API
1. Read: [INTEGRATION.md](INTEGRATION.md) - Complete guide
2. Implement: Follow Step-by-Step Integration
3. Test: Local testing procedure
4. Deploy: See [DEPLOYMENT.md](DEPLOYMENT.md)

#### Deploy to production
1. Read: [DEPLOYMENT.md](DEPLOYMENT.md)
2. Frontend: Vercel section
3. API: AWS Lambda section
4. Monitor: Post-deployment section

#### Understand code structure
1. Start: [PATTERNS.md](PATTERNS.md) - Principles
2. Frontend: [FRONTEND.md](FRONTEND.md) - Components
3. API: [API.md](API.md) - Code structure
4. Follow: Code organization section in PATTERNS.md

#### Add new feature
1. Read: [PATTERNS.md](PATTERNS.md) - Component patterns
2. Check: [ARCHITECTURE.md](ARCHITECTURE.md) - Integration points
3. Implement: Follow code standards
4. Test: See PATTERNS.md testing section
5. Deploy: See [DEPLOYMENT.md](DEPLOYMENT.md)

#### Debug an issue
1. For Frontend: [FRONTEND.md](FRONTEND.md) - Known limitations
2. For API: [API.md](API.md) - Troubleshooting
3. For Integration: [INTEGRATION.md](INTEGRATION.md) - Troubleshooting
4. Logs: [DEPLOYMENT.md](DEPLOYMENT.md) - Monitoring

#### Optimize performance
1. Read: [PATTERNS.md](PATTERNS.md) - Performance patterns
2. Frontend: [FRONTEND.md](FRONTEND.md) - Performance optimization
3. API: [API.md](API.md) - Scaling
4. Monitor: [DEPLOYMENT.md](DEPLOYMENT.md) - Monitoring

#### Write tests
1. Read: [PATTERNS.md](PATTERNS.md) - Testing patterns
2. Setup: [FRONTEND.md](FRONTEND.md) - Testing section
3. Standards: Follow code review checklist

---

## Technology Stack at a Glance

| Layer | Technology | Docs |
|-------|-----------|------|
| **Frontend Framework** | Next.js 15 | [FRONTEND.md](FRONTEND.md) |
| **UI Library** | React 19 | [FRONTEND.md](FRONTEND.md) |
| **State Management** | Zustand 5 | [FRONTEND.md](FRONTEND.md) |
| **Styling** | Tailwind CSS 4 | [PATTERNS.md](PATTERNS.md) |
| **Components** | shadcn/ui | [FRONTEND.md](FRONTEND.md) |
| **Editor** | Monaco Editor 4.7 | [FRONTEND.md](FRONTEND.md) |
| **Language** | TypeScript 5.9 | [PATTERNS.md](PATTERNS.md) |
| **API Framework** | FastAPI 0.110+ | [API.md](API.md) |
| **ASGI Server** | Uvicorn 0.24+ | [API.md](API.md) |
| **Serverless** | AWS Lambda | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Frontend Hosting** | Vercel | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **AI Service** | OpenAI Whisper | [API.md](API.md) |

---

## Key Information

### Entry Points

| Component | Command | URL |
|-----------|---------|-----|
| Frontend Dev | `npm run dev` (in fe-webapp) | http://localhost:3000 |
| API Dev | `./dev.sh` (in api-sst) | http://localhost:8000 |
| API Docs | - | http://localhost:8000/docs |

### Core Files

| Purpose | Path |
|---------|------|
| Frontend State | `apps/fe-webapp/src/stores/pkmStore.ts` |
| API Endpoint | `apis/api-sst/main.py` |
| Design System | `apps/fe-webapp/src/constants/` |
| Types | `apps/fe-webapp/src/types/note.ts` |
| Components | `apps/fe-webapp/src/components/` |

### Environment Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `.env.local` (fe-webapp) |
| `OPENAI_API_KEY` | OpenAI secret key | `.env` (api-sst) |

---

## Documentation Standards

All documentation follows these principles:

- **LLM-Friendly**: Structured, scannable, clear hierarchy
- **Token-Optimized**: Concise, no unnecessary words
- **Comprehensive**: Covers all aspects without being verbose
- **Practical**: Examples, code snippets, step-by-step guides
- **Organized**: Clear sections, tables, checklists
- **Linked**: Cross-references between documents
- **Searchable**: Good use of headers and keywords

---

## Feedback & Updates

Found an issue or want to suggest improvements?

- **For code issues**: See project README
- **For documentation**: Update relevant .md file in docs/
- **For architecture decisions**: Create ADR in docs/adr/

---

## Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| ARCHITECTURE.md | 1.0 | 2025-11-22 |
| API.md | 1.0 | 2025-11-22 |
| FRONTEND.md | 1.0 | 2025-11-22 |
| INTEGRATION.md | 1.0 | 2025-11-22 |
| PATTERNS.md | 1.0 | 2025-11-22 |
| DEPLOYMENT.md | 1.0 | 2025-11-22 |
| SPECS.md | 1.0 | (existing) |

---

**Next Step**: Read [ARCHITECTURE.md](ARCHITECTURE.md) to get started!
