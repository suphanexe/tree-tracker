#!/bin/bash
# Smart Tree Tracker - One-command MariaDB Setup
# Run: bash server/setup.sh
# Or:  sudo bash server/setup.sh (if your user needs sudo for mysql)

set -e

echo "🌳 Smart Tree Tracker - Database Setup"
echo "======================================"
echo ""

# Detect if we need sudo
if command -v mysql &> /dev/null; then
  MYSQL_CMD="mysql"
  # Test if we can connect
  if ! mysql -u root -e "SELECT 1;" &> /dev/null; then
    echo "ℹ️  Need sudo for MariaDB root access..."
    MYSQL_CMD="sudo mysql"
  fi
else
  echo "❌ MariaDB client not found. Please install: sudo apt install mariadb-client"
  exit 1
fi

# Run setup
echo "📦 Creating database 'tree_tracker'..."
echo "👤 Creating user 'tracker'@'localhost'..."
echo "📊 Creating table 'tree_records'..."

$MYSQL_CMD < "$(dirname "$0")/setup-db.sql"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Database:    tree_tracker"
echo "👤 User:        tracker@localhost"
echo "🔑 Password:    tracker_pass"
echo ""
echo "▶️  To start the API server:"
echo "   cd server && npm install && npm start"
echo ""
echo "🌐 API will be at: http://YOUR_SERVER_IP:3000"
