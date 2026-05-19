# SafeLink: A Graph-Based Public Safety Incident Mapping System

## Project Context
SafeLink is a modern public safety incident mapping system designed to record and visualize the complex relationships between incidents, people, locations, and responders. Unlike traditional relational databases, SafeLink leverages **Neo4j**, a graph database, to treat relationships as first-class citizens. This allows for deep traversal and discovery of patterns that are often hidden in disconnected data silos, such as identifying high-risk locations or tracking recurring suspects across multiple incidents.

## Chosen Domain
**Public Safety and Security**

## Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** Neo4j (Graph Database)
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **QR Integration:** qrcode (Base64 generation)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Plain JS)
- **Tools:** dotenv, morgan, uuid, nodemon

## Neo4j Graph Model

### Nodes
- **Incident:** Represents a public safety event (Title, Type, Description, Status, Severity, Date).
- **Location:** Physical area where incidents occur (Name, Address, Type, Risk Level, Coordinates).
- **Person:** Individuals involved (FirstName, LastName, Role, Contact, Notes).
- **Responder:** Emergency personnel (Name, Agency, Role, Status).
- **User:** System accounts for authentication.

### Relationships
- `(:Incident)-[:OCCURRED_AT]->(:Location)`
- `(:Person)-[:INVOLVED_IN]->(:Incident)`
- `(:Person)-[:WITNESSED]->(:Incident)`
- `(:Person)-[:SUSPECTED_IN]->(:Incident)`
- `(:Responder)-[:RESPONDED_TO]->(:Incident)`

## Features
- **User Authentication:** Secure registration and login with JWT.
- **Incident Management:** Full CRUD operations for incidents and connected entities.
- **Graph Visualization:** Detail view showing all connections for a specific incident.
- **Advanced Search:** Filter incidents by keyword, status, severity, and connected entities (Location/Person/Responder).
- **Dashboard Metrics:** Real-time stats on system activity and high-risk area identification.
- **QR Code Integration:** Generate and download QR codes for specific incidents for easy mobile access.
- **JSON Backup:** One-click export of the entire graph database to a portable JSON format.
- **Seed Data:** Automated script to populate a realistic demo environment.

## Setup Instructions

### 1. Neo4j Configuration
1. Ensure you have **Neo4j Desktop** or a local Neo4j instance running.
2. Create a new database.
3. Keep your username and password ready (default is usually `neo4j` / `password`).

### 2. Backend Installation
```bash
# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
PORT=5000
JWT_SECRET=safelink_secret_key_123
```

### 4. Seeding Demo Data
```bash
npm run seed
```

### 5. Running the Application
```bash
# Start development server
npm run dev

# Or start production server
npm start
```
The application will be available at `http://localhost:5000`.

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Protected)

### Incidents (All Protected)
- `GET /api/incidents` - Get all incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id/graph` - Get incident with its graph relationships
- `POST /api/incidents/:id/location/:locId` - Connect location
- `POST /api/incidents/:id/persons/:perId` - Connect person (WITNESSED/INVOLVED_IN/SUSPECTED_IN)
- `POST /api/incidents/:id/responders/:resId` - Connect responder

### Search & Dashboard (Protected)
- `GET /api/search?query=...` - Search with multiple filters
- `GET /api/dashboard` - Get system metrics

### Tools (Protected)
- `GET /api/backup` - Download JSON export
- `GET /api/incidents/:id/qrcode` - Generate base64 QR code

## Demo Flow
1. **Login/Register:** Start by creating an account and logging in.
2. **Explore Dashboard:** View the summary cards and identifying high-risk locations.
3. **Incident Browsing:** Navigate to "Incidents" to see the seeded data.
4. **Graph Detail:** Click "View Graph" on an incident like "Bicycle Theft" to see how it connects to "Maria Santos" (Victim) and "Parking Area B" (Location).
5. **Search:** Use the search bar to find all incidents at the "Main Gate".
6. **QR Code:** Click the QR button on an incident to show how field responders can quickly access data via mobile.
7. **Backup:** Export the current state of the database to JSON.

## Screenshots Placeholder
*(Add your screenshots here for the final presentation)*
- [Dashboard View]
- [Incident List]
- [Graph Connection Detail]
- [Search Results]
- [QR Code Modal]

---
Developed for ITD110: Graph-Based Web Application Development.
