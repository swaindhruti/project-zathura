# Project WebCrafters - Game Server

A real-time multiplayer game server built with Bun, Express, Socket.IO, and Prisma, supporting multiple game types including Math Challenge, Word Scramble, and Hectoc Game with competitive gameplay.

## Technologies

- **Runtime**: [Bun](https://bun.sh) v1.1.33 - A fast all-in-one JavaScript runtime
- **Framework**: Express.js - Web application framework
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Communication**: Socket.IO v4.7
- **Authentication**: JWT-based auth with refresh tokens
- **Validation**: Zod schema validation
- **TypeScript**: Strict type checking for better code quality

## Architecture

The server follows a modular architecture with clear separation of concerns:

```
server/
├── prisma/           # Database schema and migrations
├── src/
│   ├── controllers/  # Business logic for different resources
│   ├── middlewares/  # Request processing middleware (auth, error handling)
│   ├── routes/       # API route definitions
│   ├── socket/       # Real-time socket.io handlers
│   └── index.ts      # Application entry point
```

## Core Features

### 1. Multiplayer Game System

The server implements a robust game matchmaking and real-time gameplay system:

- **Matchmaking Queue**: Players are matched based on game type and difficulty
- **Game Session Management**: Full lifecycle management of game sessions
- **Real-time Updates**: Live score and progress tracking between players
- **Socket.IO Rooms**: Isolated communication channels for each game session

### 2. Game Types

Three distinct game types are supported:

- **Math Challenge**: Arithmetic problems with varying complexity
- **Word Scramble**: Unscramble jumbled letters to form words
- **Hectoc Game**: Math puzzle where players create expressions using provided digits to reach a target number

### 3. Authentication & Authorization

- JWT-based authentication with access and refresh tokens
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- Protected routes with middleware validation

### 4. Data Persistence

The server uses Prisma ORM with PostgreSQL to store:

- User accounts and authentication data
- Player game statistics and history
- Game session records for analytics

## Game Mechanics

### Hectoc Game Implementation

The Hectoc Game is a mathematical puzzle with the following mechanics:

1. **Challenge Generation**:

   - 6 random digits (1-9) are generated
   - A target number is provided based on difficulty level
   - Easy: 10-30, Medium: 30-70, Hard: 70-100

2. **Answer Validation**:

   - Validates that players only use the provided digits
   - Verifies mathematical correctness of expressions
   - Checks if the expression equals the target number

3. **Scoring System**:
   - Base scores: Easy (20 pts), Medium (40 pts), Hard (60 pts)
   - Time bonus: Up to 5 additional points for quick answers
   - Progressive difficulty increases point potential

### Real-time Multiplayer Implementation

The multiplayer system is implemented using Socket.IO with:

1. **Connection Management**:

   - Namespace isolation for game-specific events
   - Room-based grouping for game sessions
   - Heartbeat monitoring for connection stability

2. **Game State Synchronization**:

   - Real-time progress updates between players
   - Score broadcasting to create competitive tension
   - Answer feedback with visual indicators

3. **End Game Conditions**:
   - Time limit expiration (default: 3 minutes)
   - All questions completed by both players
   - Player disconnection handling with grace periods

## API Routes

### Authentication Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and get tokens
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Invalidate tokens

### Game Endpoints

- `GET /api/games/types` - List available game types and difficulties
- `GET /api/games/practice` - Generate practice questions
- `GET /api/games/history` - Get user game history

### User Endpoints

- `GET /api/users` - Admin only: list all users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

## Socket.IO Events

### Client → Server Events

- `join_queue` - Join matchmaking queue
- `player_ready` - Signal readiness to start game
- `submit_answer` - Submit answer to current question
- `leave_game` - Voluntarily leave current game

### Server → Client Events

- `in_queue` - Player is in matchmaking queue
- `game_ready` - Game match found, waiting for players
- `game_start` - Game has started with questions
- `game_progress` - Game state update (scores, progress)
- `game_over` - Game has ended with results
- `player_left` - Opponent has left the game

## Configuration

The server uses environment variables for configuration:

- `PORT` - Server port (default: 4000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - Token expiration in seconds
- `JWT_COOKIE_EXPIRES_IN` - Cookie expiration in days

## Installation & Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- PostgreSQL database

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/project-webcrafters.git
cd project-webcrafters/server

# Install dependencies
bun install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
bun run prepare

# Start development server
bun run dev
```

### Database Setup

```bash
# Run migrations
bunx prisma migrate dev

# Seed database (if available)
bunx prisma db seed
```

## Testing

The server includes a test client for multiplayer game testing:

1. Start the server with `bun run dev`
2. Open `/client-test/test-client.html` in two browser tabs
3. Connect both clients and join the same game type/difficulty
4. Test real-time gameplay between the two clients

## Deployment

For production deployment:

```bash
# Build the server
bun run build

# Start production server
bun run start
```

## License

MIT License
