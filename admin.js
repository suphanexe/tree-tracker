/**
 * Smart Tree Tracker - Admin Dashboard
 * Live search, filter, CSV export, and record management
 */

// ===== State =====
let allRecords = [];
let unsubscribe = null;

// ===== DOM References =====
const $ = (id) => document.getElementById(id);
const statsContainer = $('stats-container');
const recordsContainer = $('records-container');
const loadingEl = $('loading');
const filterStatus = $('filter-status');
const searchInput = $('search-input');
const exportBtn = $('export-btn');
const clearBtn = $('clear-btn');

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = $('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ===== Status Helpers =====
function getStatusBadgeClass(status) {
    const map = {
        'normal': 'normal',
        'needs-water': 'needs-water',
        'disease': 'disease',
        'pest': 'pest',
        'wilted': 'wilted'
    };
    return map[status] || '';
}

// ===== Load & Display Records =====
async function loadRecords() {
    loadingEl.style.display = 'block';
    recordsContainer.innerHTML = '';

    try {
        // Check if Firebase is configured
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && firebase.database) {
            // Firebase mode - realtime listener
            const recordsRef = firebase.database().ref('tree-records');
            if (unsubscribe) {
                recordsRef.off('value', unsubscribe);
            }
            unsubscribe = recordsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                allRecords = data
                    ? Object.values(data).sort((a, b) => b.timestamp - a.timestamp)
                    : [];
                renderDashboard();
            });
        } else {
            // localStorage mode - with realtime updates
            allRecords = await db.getAllRecords();
            renderDashboard();

            // Listen for db changes (same tab via callback)
            const unsub = db.onUpdate(async () => {
                allRecords = await db.getAllRecords();
                renderDashboard();
            });

            // Listen for localStorage changes (cross-tab)
            window.addEventListener('storage', async (e) => {
                if (e.key === db.storageKey) {
                    allRecords = await db.getAllRecords();
                    renderDashboard();
                }
            });

            // Cleanup on page unload
            window.addEventListener('beforeunload', unsub);
        }
    } catch (error) {
        console.error('Load error:', error);
        loadingEl.innerHTML = '<p style="color: var(--danger);">❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
    }
}

// ===== Render Dashboard =====
function renderDashboard() {
    loadingEl.style.display = 'none';

    if (!allRecords || allRecords.length === 0) {
        recordsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌳</div>
                <h3>ยังไม่มีข้อมูล</h3>
                <p>สแกน QR Code เพื่อเริ่มบันทึกข้อมูลการดูแลต้นไม้</p>
                <a href="index.html" class="btn btn-primary mt-4">📷 ไปสแกน QR Code</a>
            </div>
        `;
        updateStats([]);
        return;
    }

    updateStats(allRecords);
    renderRecords();
}

// ===== Update Stats =====
function updateStats(records) {
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

    // Animate count
    animateCounter('total-trees', uniqueTrees.size);
    animateCounter('normal-count', normalCount);
    animateCounter('issue-count', uniqueTrees.size - normalCount);
    animateCounter('caretaker-count', uniqueCaretakers.size);
}

function animateCounter(id, target) {
    const el = $(id);
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    let start = current;
    const duration = 500;
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(start + (target - start) * eased);
        el.textContent = value;
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ===== Render Records =====
function renderRecords() {
    const statusFilter = filterStatus.value;
    const searchQuery = searchInput.value.trim().toLowerCase();

    let filtered = [...allRecords];

    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Apply search
    if (searchQuery) {
        filtered = filtered.filter(r =>
            r.treeId.toLowerCase().includes(searchQuery) ||
            r.caretaker.toLowerCase().includes(searchQuery) ||
            (r.notes && r.notes.toLowerCase().includes(searchQuery))
        );
    }

    if (filtered.length === 0) {
        recordsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>ไม่พบข้อมูล</h3>
                <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
        `;
        return;
    }

    recordsContainer.innerHTML = filtered.map(record => `
        <div class="record-card status-${record.status}">
            <div class="record-header">
                <h3>🌳 ต้นไม้: <strong>${escapeHtml(record.treeId)}</strong>
                    <span class="status-badge ${getStatusBadgeClass(record.status)}">
                        ${db.getStatusText(record.status)}
                    </span>
                </h3>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="timestamp">${formatDate(record.timestamp)}</span>
                    <button class="btn-delete" onclick="deleteRecord('${record.id}')" 
                            title="ลบบันทึกนี้">✕</button>
                </div>
            </div>
            <div class="record-body">
                <div class="detail-item">
                    <span class="detail-label">👨‍🌾 ผู้ดูแล:</span>
                    <span class="detail-value">${escapeHtml(record.caretaker)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">🔧 การกระทำ:</span>
                    <span class="detail-value">${db.getActionText(record.action)}</span>
                </div>
                ${record.notes ? `
                <div class="notes-full">
                    📝 ${escapeHtml(record.notes)}
                </div>` : ''}
                ${record.photoUrl ? `
                <div class="photo-link">
                    <a href="${record.photoUrl}" target="_blank" rel="noopener">
                        📷 ดูรูปภาพ
                    </a>
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== Delete Record =====
async function deleteRecord(id) {
    if (!confirm('ยืนยันการลบบันทึกนี้?')) return;

    try {
        await db.deleteRecord(id);
        allRecords = allRecords.filter(r => r.id !== id);
        renderDashboard();
        showToast('🗑️ ลบบันทึกสำเร็จ', 'success');
    } catch (error) {
        showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
}

// ===== Clear All Data =====
async function clearAllData() {
    const cleared = await db.clearAll();
    if (cleared) {
        allRecords = [];
        renderDashboard();
        showToast('🗑️ ลบข้อมูลทั้งหมดสำเร็จ', 'success');
    }
}

// ===== Export CSV =====
function exportCSV() {
    if (!allRecords || allRecords.length === 0) {
        showToast('ไม่มีข้อมูลที่จะส่งออก', 'error');
        return;
    }

    // BOM for Thai characters in Excel
    const BOM = '\uFEFF';
    const headers = ['รหัสต้นไม้', 'ผู้ดูแล', 'สถานะ', 'การกระทำ', 'บันทึก', 'วันที่', 'มีรูปภาพ'];
    const rows = allRecords.map(r => [
        r.treeId,
        r.caretaker,
        db.getStatusText(r.status),
        db.getActionText(r.action),
        r.notes || '',
        formatDate(r.timestamp),
        r.photoUrl ? 'ใช่' : 'ไม่'
    ]);

    const csv = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tree-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📥 ส่งออกข้อมูลสำเร็จ', 'success');
}

// ===== Utility Functions =====
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const d = new Date(timestamp);
    return d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Event Listeners =====
filterStatus.addEventListener('change', renderRecords);
searchInput.addEventListener('input', debounce(renderRecords, 300));
exportBtn.addEventListener('click', exportCSV);
clearBtn.addEventListener('click', clearAllData);

// ===== Debounce =====
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', loadRecords);
