/**
 * Smart Tree Tracker - Main Application
 * Handles QR scanning, form submission, and photo upload
 */

// ===== Configuration =====
const CONFIG = {
    useFirebase: false,        // Set to true to use Firebase instead of localStorage
    qrPrefix: 'TREE-',         // Expected QR code prefix
    photoMaxSizeMB: 2,         // Max photo size in MB
    debug: false               // Enable debug logging
};

// ===== State =====
let html5QrCode = null;
let currentTreeId = null;
let isSubmitting = false;

// ===== DOM References =====
const $ = (id) => document.getElementById(id);
const scannerSection = $('scanner-section');
const formSection = $('form-section');
const successMessage = $('success-message');
const treeIdDisplay = $('tree-id');
const treeForm = $('tree-form');
const startScanBtn = $('start-scan');
const stopScanBtn = $('stop-scan');
const cancelBtn = $('cancel-btn');
const scanAgainBtn = $('scan-again');
const submitBtn = $('submit-btn');
const readerEl = $('reader');

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

// ===== Scanner Functions =====
async function startScanner() {
    try {
        html5QrCode = new Html5Qrcode("reader");
        
        const config = {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0
        };

        readerEl.style.display = 'block';

        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        );

        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'inline-flex';
        if (CONFIG.debug) console.log('Scanner started successfully');
    } catch (err) {
        let message = 'ไม่สามารถเปิดกล้องได้';
        if (err.toString().includes('NotAllowedError')) {
            message = 'กรุณาอนุญาตให้เข้าถึงกล้องในการตั้งค่าบราวเซอร์';
        } else if (err.toString().includes('NotFoundError')) {
            message = 'ไม่พบกล้องในอุปกรณ์นี้';
        }
        showToast(message, 'error');
        startScanBtn.style.display = 'inline-flex';
        stopScanBtn.style.display = 'none';
        if (CONFIG.debug) console.error('Scanner error:', err);
    }
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop()
            .then(() => {
                readerEl.style.display = 'none';
                startScanBtn.style.display = 'inline-flex';
                stopScanBtn.style.display = 'none';
                if (CONFIG.debug) console.log('Scanner stopped');
            })
            .catch(err => {
                if (CONFIG.debug) console.error('Stop error:', err);
            });
    }
}

function onScanSuccess(decodedText) {
    // Stop scanning
    stopScanner();

    // Validate QR code format
    if (decodedText.startsWith(CONFIG.qrPrefix)) {
        currentTreeId = decodedText;
        showForm();
        showToast(`พบต้นไม้: ${decodedText}`, 'success');
    } else {
        showToast(`QR Code นี้ไม่ใช่รหัสต้นไม้ที่ถูกต้อง\nรูปแบบ: ${CONFIG.qrPrefix}XXX`, 'error');
        // Allow re-scanning
        setTimeout(() => {
            startScanBtn.style.display = 'inline-flex';
            stopScanBtn.style.display = 'none';
        }, 500);
    }
}

function onScanFailure(error) {
    // Silently continue scanning
    if (CONFIG.debug && !error.includes('No MultiFormat')) {
        console.warn('Scan failure:', error);
    }
}

// ===== Form Functions =====
function showForm() {
    scannerSection.style.display = 'none';
    formSection.style.display = 'block';
    successMessage.style.display = 'none';
    treeIdDisplay.textContent = currentTreeId;
    // Reset form
    treeForm.reset();
    // Clear file input (extra safety)
    $('photo').value = '';
}

function cancelForm() {
    formSection.style.display = 'none';
    scannerSection.style.display = 'block';
    successMessage.style.display = 'none';
    startScanBtn.style.display = 'inline-flex';
    stopScanBtn.style.display = 'none';
    currentTreeId = null;
    treeForm.reset();
}

function resetToScanner() {
    successMessage.style.display = 'none';
    scannerSection.style.display = 'block';
    formSection.style.display = 'none';
    startScanBtn.style.display = 'inline-flex';
    stopScanBtn.style.display = 'none';
    currentTreeId = null;
}

// ===== Photo Upload =====
function uploadPhoto(file) {
    return new Promise((resolve, reject) => {
        // Validate file size
        if (file.size > CONFIG.photoMaxSizeMB * 1024 * 1024) {
            reject(new Error(`รูปภาพมีขนาดใหญ่เกินไป (สูงสุด ${CONFIG.photoMaxSizeMB}MB)`));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // Base64 string
        reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
        reader.readAsDataURL(file);
    });
}

// ===== Form Submission =====
treeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> กำลังบันทึก...';

    try {
        const caretaker = $('caretaker').value.trim();
        const status = $('status').value;
        const action = $('action').value;
        const notes = $('notes').value.trim();
        const photoFile = $('photo').files[0];

        if (!caretaker) {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '💾 บันทึกข้อมูล';
            showToast('กรุณากรอกชื่อผู้ดูแล', 'error');
            return;
        }

        let photoUrl = null;

        // Upload photo if present
        if (photoFile) {
            try {
                photoUrl = await uploadPhoto(photoFile);
            } catch (err) {
                showToast(err.message, 'error');
                return;
            }
        }

        // Save record to database
        const recordData = {
            treeId: currentTreeId,
            caretaker,
            status,
            action,
            notes: notes || '',
            photoUrl
        };

        if (CONFIG.useFirebase && typeof firebase !== 'undefined') {
            // Firebase mode
            await firebase.database().ref('tree-records').push({
                ...recordData,
                timestamp: Date.now()
            });
        } else {
            // localStorage mode
            await db.addRecord(recordData);
        }

        // Show success
        formSection.style.display = 'none';
        successMessage.style.display = 'block';
        treeForm.reset();
        $('photo').value = '';
        showToast('✅ บันทึกข้อมูลสำเร็จ!', 'success');

    } catch (error) {
        showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        if (CONFIG.debug) console.error('Submit error:', error);
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '💾 บันทึกข้อมูล';
    }
});

// ===== Event Listeners =====
startScanBtn.addEventListener('click', startScanner);
stopScanBtn.addEventListener('click', stopScanner);
cancelBtn.addEventListener('click', cancelForm);
scanAgainBtn.addEventListener('click', resetToScanner);

// ===== Keyboard Support =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (formSection.style.display === 'block') cancelForm();
        if (successMessage.style.display === 'block') resetToScanner();
    }
});

// ===== Init =====
if (CONFIG.debug) console.log('Smart Tree Tracker initialized');
