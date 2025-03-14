# Architecture Documentation

## Overview

This application is a full-stack web application built with a React frontend and Node.js Express backend. It appears to be a financial analysis tool that allows users to analyze financial statements according to different accounting standards (IFRS, US GAAP, UK GAAP) with AI assistance. The application features user authentication via Firebase, subscription management through Stripe, and persistent data storage using PostgreSQL with Drizzle ORM.

## System Architecture

The application follows a client-server architecture with clear separation between frontend and backend components:

```
├── client/                  # Frontend React application
├── server/                  # Backend Express application
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic services
│   └── public/              # Static assets
├── shared/                  # Shared code between client and server
│   └── schema.ts            # Database schema definitions
└── migrations/              # Database migration files
```

### Key Technologies

- **Frontend**: React with TypeScript, using Shadcn UI components (based on Radix UI primitives)
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication
- **Payment Processing**: Stripe
- **AI Integration**: Google Generative AI and/or OpenAI
- **Build Tools**: Vite, ESBuild
- **Styling**: TailwindCSS

## Key Components

### Frontend Architecture

The frontend is a React application built with Vite and TypeScript. It uses:

1. **UI Framework**: Shadcn UI components built on Radix UI primitives
2. **State Management**: React Query for server state
3. **Form Handling**: React Hook Form with Zod validation
4. **Styling**: TailwindCSS with a custom theme configuration

The frontend communicates with the backend through a RESTful API and possibly WebSockets for real-time features.

### Backend Architecture

The backend is an Express.js application with TypeScript that provides:

1. **API Routes**: Organized in the `server/routes` directory
2. **Authentication Middleware**: Firebase authentication verification
3. **Business Logic Services**: Located in `server/services`
4. **Database Abstraction**: Drizzle ORM with a storage interface

The server follows a layered architecture:
- **Routes Layer**: Handles HTTP requests/responses
- **Service Layer**: Contains business logic 
- **Data Access Layer**: Abstracts database operations

### Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM with the following key entities:

1. **Users**: Store user information including Firebase UID, name, email, and subscription status
2. **Subscriptions**: Track user subscription details including Stripe subscription IDs
3. **Analyses**: Store financial analysis data including file content and accounting standard
4. **Messages**: Store chat messages between users and AI
5. **Analytics**: Various tables for tracking user activity (page views, sessions, actions)
6. **Feedback**: Store user feedback
7. **Contact Messages**: Store messages from the contact form

### Authentication & Authorization

The application uses Firebase Authentication:

1. **Client-Side**: Firebase JS SDK for user authentication
2. **Server-Side**: Firebase Admin SDK for token verification
3. **Authorization**: Role-based access with an `isAdmin` flag for administrative functions

### API Structure

The API is RESTful and organized by resource types:

1. **Auth API**: User registration, login, profile management
2. **Analysis API**: Create, retrieve, update financial analyses
3. **Chat API**: Interactive AI chat for financial analysis
4. **Analytics API**: Track user interactions and sessions
5. **Feedback API**: Submit and retrieve user feedback
6. **Contact API**: Handle contact form submissions

## Data Flow

### Authentication Flow

1. User authenticates through Firebase Authentication (client-side)
2. Firebase returns an ID token
3. Token is sent with requests to the backend
4. Backend verifies the token and identifies the user
5. User data is retrieved from the database and attached to the request

### Financial Analysis Flow

1. User uploads a financial statement
2. Server processes the document and extracts text
3. Financial data is analyzed using AI services (OpenAI or Google Generative AI)
4. Analysis results are stored in the database
5. User can interact with the analysis through a chat interface

### Subscription Flow

1. User initiates subscription process
2. Application creates a Stripe checkout session
3. User completes payment on Stripe-hosted page
4. Stripe webhook notifies the server of successful payment
5. Server updates the user's subscription status in the database

## External Dependencies

### Third-Party Services

1. **Firebase**: User authentication and authorization
2. **Stripe**: Subscription management and payment processing
3. **OpenAI/Google Generative AI**: AI-powered financial analysis
4. **Neon Database**: PostgreSQL hosting via serverless connection
5. **BigQuery** (planned): Advanced analytics (currently disabled)

### Key Libraries

1. **Drizzle ORM**: Database ORM with TypeScript support
2. **Radix UI/Shadcn**: Component library for the UI
3. **React Query**: Data fetching and cache management
4. **Zod**: Schema validation
5. **TailwindCSS**: Utility-first CSS framework

## Deployment Strategy

The application is configured for deployment on Replit:

1. **Development**: `npm run dev` serves the Vite dev server with HMR
2. **Build Process**: 
   - Frontend: Vite builds static assets to `dist/public`
   - Backend: ESBuild bundles the server code to `dist/index.js`
3. **Production**: Node.js serves the static assets and API endpoints

The deployment configuration in `.replit` sets up:
- **Target**: Google Cloud (GCE)
- **Build Command**: `npm run build`
- **Run Command**: `PORT=8080 NODE_ENV=production node dist/index.js`
- **Port Mapping**: Internal ports mapped to external accessible ports

### Environment Variables

The application requires several environment variables:
- Database connection strings
- Firebase credentials (both client and server)
- Stripe API keys
- AI service API keys

## Development Practices

1. **Type Safety**: TypeScript is used throughout the codebase
2. **Schema Validation**: Zod schemas validate data at runtime
3. **Code Sharing**: Common code is shared between frontend and backend
4. **Error Handling**: Structured error responses with appropriate status codes

## Future Considerations

1. **BigQuery Integration**: The codebase has placeholders for BigQuery integration (currently disabled)
2. **Metabase Analytics**: Setup script for Metabase suggests plans for advanced analytics dashboarding

## Conclusion

The architecture follows modern best practices for full-stack TypeScript applications with a clear separation of concerns. The use of Firebase for authentication, Stripe for payments, and AI services for analysis enables complex functionality with relatively low operational overhead. The application is designed to be deployable on Replit with connections to external services for persistent data storage and third-party integrations.