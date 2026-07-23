/**
 * Smart Tree Tracker - Database Layer
 * 
 * Modes:
 *   1. localStorage (default) - Works offline, no setup needed
 *   2. MariaDB API - Set apiBaseUrl to your backend URL
 *   3. Firebase - Set useFirebase = true in app.js
 */

class TreeTrackerDB {
    constructor() {
        this.storageKey = 'smart-tree-tracker';
        this.firebaseEnabled = false;
        this.listeners = [];
        this._mode = 'local'; // 'local' | 'api' | 'firebase'
        this._apiBase = null;
        this._init();
    }

    // Configure to use MariaDB backend API
    setApiBackend(baseUrl) {
        this._mode = 'api';
        this._apiBase = baseUrl.replace(/\/+$/, '');
        console.log(`[DB] Using MariaDB API: ${this._apiBase}`);
    }

    // Configure to use Firebase
    setFirebase() {
        this._mode = 'firebase';
        console.log('[DB] Using Firebase');
    }

    get mode() {
        return this._mode;
    }

    // ===== Local Storage Helpers =====
    _init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({ records: [], metadata: { version: '2.0', created: Date.now() } }));
        }
    }

    _getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || { records: [] };
        } catch {
            return { records: [] };
        }
    }

    _saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this._notifyListeners();
    }

    _notifyListeners() {
        this.listeners.forEach(fn => {
            try { fn(); } catch {}
        });
    }

    onUpdate(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(fn => fn !== callback);
        };
    }

    // ===== API Helpers =====
    async _apiFetch(path, options = {}) {
        const url = `${this._apiBase}${path}`;
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `HTTP ${response.status}`);
        }
        return response.json();
    }

    // ===== Record operations (all modes) =====
    async addRecord(record) {
        if (this._mode === 'api') {
            const result = await this._apiFetch('/api/records', {
                method: 'POST',
                body: JSON.stringify(record)
            });
            this._notifyListeners();
            return result;
        }
        // localStorage mode
        const data = this._getData();
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        record.id = id;
        record.timestamp = Date.now();
        data.records.push(record);
        this._saveData(data);
        return record;
    }

    async getAllRecords() {
        if (this._mode === 'api') {
            const records = await this._apiFetch('/api/records');
            // Normalize snake_case from DB to camelCase for frontend
            return records.map(r => ({
                id: r.id,
                treeId: r.tree_id,
                caretaker: r.caretaker,
                status: r.status,
                action: r.action,
                notes: r.notes || '',
                photoUrl: r.photo_url || null,
                timestamp: r.timestamp
            }));
        }
        // localStorage mode
        const data = this._getData();
        return [...data.records].sort((a, b) => b.timestamp - a.timestamp);
    }

    async getTreeStats() {
        if (this._mode === 'api') {
            return this._apiFetch('/api/records/stats');
        }
        // localStorage mode
        const records = (await this.getAllRecords());
        const uniqueTrees = new Set(records.map(r => r.treeId));
        const uniqueCaretakers = new Set(records.map(r => r.caretaker));

        const latestStatus = {};
        records.forEach(r => {
            if (!latestStatus[r.treeId] || r.timestamp > latestStatus[r.treeId].timestamp) {
                latestStatus[r.treeId] = r;
            }
        });

        const normalCount = Object.values(latestStatus).filter(r => r.status === 'normal').length;
        const treesWithIssues = Object.values(latestStatus).filter(r => r.status !== 'normal');

        return {
            totalTrees: uniqueTrees.size,
            totalRecords: records.length,
            normalCount,
            issueCount: uniqueTrees.size - normalCount,
            caretakerCount: uniqueCaretakers.size,
            trees: latestStatus,
            treesWithIssues
        };
    }

    async getRecordsByTreeId(treeId) {
        if (this._mode === 'api') {
            const records = await this._apiFetch(`/api/records/tree/${encodeURIComponent(treeId)}`);
            return records.map(r => ({
                id: r.id, treeId: r.tree_id, caretaker: r.caretaker,
                status: r.status, action: r.action, notes: r.notes || '',
                photoUrl: r.photo_url, timestamp: r.timestamp
            }));
        }
        const data = this._getData();
        return data.records.filter(r => r.treeId === treeId).sort((a, b) => b.timestamp - a.timestamp);
    }

    async searchRecords(query) {
        if (this._mode === 'api') {
            const records = await this._apiFetch(`/api/records/search?q=${encodeURIComponent(query)}`);
            return records.map(r => ({
                id: r.id, treeId: r.tree_id, caretaker: r.caretaker,
                status: r.status, action: r.action, notes: r.notes || '',
                photoUrl: r.photo_url, timestamp: r.timestamp
            }));
        }
        const data = this._getData();
        const q = query.toLowerCase();
        return data.records.filter(r =>
            r.treeId.toLowerCase().includes(q) ||
            r.caretaker.toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q))
        ).sort((a, b) => b.timestamp - a.timestamp);
    }

    async deleteRecord(id) {
        if (this._mode === 'api') {
            await this._apiFetch(`/api/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
            this._notifyListeners();
            return;
        }
        const data = this._getData();
        data.records = data.records.filter(r => r.id !== id);
        this._saveData(data);
    }

    async clearAll() {
        if (this._mode === 'api') {
            if (confirm('ยืนยันต้องการลบข้อมูลทั้งหมด?')) {
                await this._apiFetch('/api/records', { method: 'DELETE' });
                this._notifyListeners();
                return true;
            }
            return false;
        }
        if (confirm('ยืนยันต้องการลบข้อมูลทั้งหมด?')) {
            localStorage.setItem(this.storageKey, JSON.stringify({ records: [], metadata: { version: '2.0', created: Date.now() } }));
            this._notifyListeners();
            return true;
        }
        return false;
    }

    // ===== Status/Action Text Helpers =====
    getStatusText(status) {
        const map = {
            'normal': '✅ ปกติ',
            'needs-water': '💧 ต้องการน้ำ',
            'disease': '🦠 เป็นโรค',
            'pest': '🐛 มีศัตรูพืช',
            'wilted': '🥀 เหี่ยวเฉา'
        };
        return map[status] || status;
    }

    getActionText(action) {
        const map = {
            'watered': 'รดน้ำ',
            'fertilized': 'ใส่ปุ๋ย',
            'pruned': 'ตัดแต่ง',
            'sprayed': 'ฉีดยา',
            'inspected': 'ตรวจสอบ'
        };
        return map[action] || action;
    }
}

// Global instance
const db = new TreeTrackerDB();
