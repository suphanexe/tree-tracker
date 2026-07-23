# Smart Tree Tracker - MariaDB Backend

## Quick Setup

### 1. Set up MariaDB database
```bash
# This creates the 'tree_tracker' database, 'tracker' user, and 'tree_records' table
sudo mysql < server/setup-db.sql
```

### 2. Install dependencies & start
```bash
cd server
npm install
cp .env.example .env   # Edit .env if your MariaDB config differs
npm start               # Runs on port 3000
```

### 3. Configure the frontend
In `index.html` (scanner page), uncomment/set the `apiUrl` in the inline config:
```javascript
const CONFIG = {
    apiUrl: 'http://192.168.2.45:3000',  // Your server IP:port
    debug: false
};
```

Do the same in `admin.html` (admin dashboard).

### 4. Verify it works
```bash
curl http://localhost:3000/api/health
# → {"status":"ok","database":"connected","timestamp":"..."}
```

## Auto-start with systemd (recommended for servers)

```bash
sudo cp server/smart-tree-tracker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable smart-tree-tracker
sudo systemctl start smart-tree-tracker
sudo systemctl status smart-tree-tracker
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/records` | Get all records |
| GET | `/api/records/stats` | Get statistics |
| GET | `/api/records/search?q=...` | Search records |
| GET | `/api/records/tree/:treeId` | Get records by tree |
| POST | `/api/records` | Create a record |
| DELETE | `/api/records/:id` | Delete a record |
| DELETE | `/api/records` | Clear all records |

## Data Flow

```
Browser (index.html)
  └─ db.js (frontend) ──fetch()──▶ http://SERVER:3000/api/records
                                       └─ Express ──▶ MariaDB
```

Set `apiUrl` to `null` to fall back to localStorage (offline mode).
