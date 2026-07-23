/**
 * Smart Tree Tracker - Database Layer
 * localStorage-backed with Firebase-ready structure
 * No cloud setup needed - works completely offline!
 */

class TreeTrackerDB {
    constructor() {
        this.storageKey = 'smart-tree-tracker';
        this.firebaseEnabled = false;
        this.listeners = [];
        this._init();
    }

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

    async addRecord(record) {
        const data = this._getData();
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        record.id = id;
        record.timestamp = Date.now();
        data.records.push(record);
        this._saveData(data);
        return record;
    }

    async getAllRecords() {
        const data = this._getData();
        return [...data.records].sort((a, b) => b.timestamp - a.timestamp);
    }

    async getTreeStats() {
        const records = (await this.getAllRecords());
        const uniqueTrees = new Set(records.map(r => r.treeId));
        const uniqueCaretakers = new Set(records.map(r => r.caretaker));

        // Get latest status per tree
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
        const data = this._getData();
        return data.records.filter(r => r.treeId === treeId).sort((a, b) => b.timestamp - a.timestamp);
    }

    async searchRecords(query) {
        const data = this._getData();
        const q = query.toLowerCase();
        return data.records.filter(r =>
            r.treeId.toLowerCase().includes(q) ||
            r.caretaker.toLowerCase().includes(q) ||
            (r.notes && r.notes.toLowerCase().includes(q))
        ).sort((a, b) => b.timestamp - a.timestamp);
    }

    async deleteRecord(id) {
        const data = this._getData();
        data.records = data.records.filter(r => r.id !== id);
        this._saveData(data);
    }

    async clearAll() {
        if (confirm('\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e27\u0e48\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14?')) {
            localStorage.setItem(this.storageKey, JSON.stringify({ records: [], metadata: { version: '2.0', created: Date.now() } }));
            this._notifyListeners();
            return true;
        }
        return false;
    }

    getStatusText(status) {
        const map = {
            'normal': '\u2705 \u0e1b\u0e01\u0e15\u0e34',
            'needs-water': '\u{1F4A7} \u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e19\u0e49\u0e33',
            'disease': '\u{1F9A0} \u0e40\u0e1b\u0e47\u0e19\u0e42\u0e23\u0e04',
            'pest': '\u{1F41B} \u0e21\u0e35\u0e28\u0e31\u0e15\u0e23\u0e39\u0e1e\u0e34\u0e0a',
            'wilted': '\u{1F9C0} \u0e40\u0e2b\u0e35\u0e48\u0e22\u0e27\u0e40\u0e09\u0e32'
        };
        return map[status] || status;
    }

    getActionText(action) {
        const map = {
            'watered': '\u0e23\u0e14\u0e19\u0e49\u0e33',
            'fertilized': '\u0e43\u0e2a\u0e48\u0e1b\u0e38\u0e4b\u0e22',
            'pruned': '\u0e15\u0e31\u0e14\u0e41\u0e15\u0e48\u0e07',
            'sprayed': '\u0e09\u0e35\u0e14\u0e22\u0e32',
            'inspected': '\u0e15\u0e23\u0e27\u0e08\u0e2a\u0e2d\u0e1a'
        };
        return map[action] || action;
    }
}

// Global instance
const db = new TreeTrackerDB();
