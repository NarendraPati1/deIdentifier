// AVIALITY - ENHANCED PROCESSING WITH EXCEL STORAGE AND PII/PHI STRUCTURE
let selectedFiles = [];
let isProcessing = false;
let currentPage = 'home';
let isAuthenticated = false;
let currentUser = null;
let userApiKeys = [];
const API_BASE_URL = window.location.origin;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AVIALITY - Enhanced Platform with Excel Storage Loading...');
    checkAuthenticationStatus();
    showPage('home');
    setupEventListeners();
    initializeFileHandling();
    console.log('✅ Platform initialized successfully');
});

// Authentication Management
function checkAuthenticationStatus() {
    // Clear any previous authentication data on page load
    //localStorage.removeItem('aviality_user'); // Remove this line if you want to keep login sessions
    
    const savedUser = localStorage.getItem('aviality_user');
    if (savedUser) {
        try {
            isAuthenticated = true;
            currentUser = JSON.parse(savedUser);
            updateUIForAuthenticated();
            loadUserData();
            console.log('User authenticated:', currentUser.name);
        } catch (e) {
            console.error('Failed to parse user data:', e);
            localStorage.removeItem('aviality_user');
            updateUIForGuest();
        }
    } else {
        isAuthenticated = false;
        updateUIForGuest();
    }
}

function updateUIForAuthenticated() {
    const authActions = document.getElementById('authActions');
    const userMenu = document.getElementById('userMenu');
    if (authActions) authActions.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';

    // Update user info
    updateUserDisplayInfo();

    // Show authenticated nav links
    const authRequiredLinks = document.querySelectorAll('.nav-link[data-auth-required="true"]');
    authRequiredLinks.forEach(link => link.style.display = 'flex');
}

function updateUIForGuest() {
    const authActions = document.getElementById('authActions');
    const userMenu = document.getElementById('userMenu');
    if (authActions) authActions.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';

    // Hide authenticated nav links
    const authRequiredLinks = document.querySelectorAll('.nav-link[data-auth-required="true"]');
    authRequiredLinks.forEach(link => link.style.display = 'none');
}

function updateUserDisplayInfo() {
    if (!currentUser) return;

    const elements = {
        'userName': currentUser.name,
        'dropdownUserName': currentUser.name,
        'dropdownUserEmail': currentUser.email
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    // Update avatar
    const avatars = document.querySelectorAll('.user-avatar, .user-avatar-small, .profile-avatar-large');
    avatars.forEach(avatar => {
        const initial = currentUser.name.charAt(0).toUpperCase();
        if (avatar.querySelector('i')) {
            avatar.innerHTML = initial;
        } else {
            avatar.textContent = initial;
        }
    });
}

async function loadUserData() {
    if (!isAuthenticated || !currentUser) return;
    try {
        await loadUserApiKeys();
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// Page Navigation
function showPage(pageName) {
    console.log(`📄 Navigating to page: ${pageName}`);
    
    // Authentication check - REMOVED from deidentify page
    const protectedPages = ['profile'];
    if (protectedPages.includes(pageName) && !isAuthenticated) {
        showAuthModal('signin');
        showToast('warning', 'Please sign in to access this feature', 'Authentication Required');
        return;
    }

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show target page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
    }

    // Update nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    const activeNavLink = document.querySelector(`[onclick="showPage('${pageName}')"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }

    // Page-specific initialization
    if (pageName === 'profile') {
        loadProfilePage();
    }

    // Update page title
    const titles = {
        'home': 'Aviality - AI Healthcare Data Deidentification Platform',
        'deidentify': 'Process Files - Aviality',
        'profile': 'Profile & API Keys - Aviality'
    };
    document.title = titles[pageName] || 'Aviality';
}

function getStarted() {
    showPage('deidentify');
}

// File Handling - FIXED DOUBLE IMPORT ISSUE
function initializeFileHandling() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) return;

    // Drag and drop
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // File input change - FIXED: Don't clear input immediately
    fileInput.addEventListener('change', handleFileSelect);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
    // DON'T clear the input here - only clear after successful processing
}

function addFiles(files) {
    const validExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.zip'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const validFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(extension)) {
            showToast('warning', `${file.name}: Unsupported file type`, 'File Skipped');
            return false;
        }
        if (file.size > maxSize) {
            showToast('warning', `${file.name}: File too large (max 100MB)`, 'File Skipped');
            return false;
        }
        return true;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    displaySelectedFiles();
    updateFilesCount();
    
    if (validFiles.length > 0) {
        showToast('success', `Added ${validFiles.length} file(s)`, 'Files Selected');
    }
}

function displaySelectedFiles() {
    const filesDisplay = document.getElementById('filesDisplay');
    const filesList = document.getElementById('filesList');
    
    if (!filesDisplay || !filesList) return;

    if (selectedFiles.length === 0) {
        filesDisplay.style.display = 'none';
        return;
    }

    filesDisplay.style.display = 'block';
    filesList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const extension = file.name.split('.').pop().toLowerCase();
        const fileType = getFileType(extension);
        const icon = getFileIcon(extension);
        const size = formatFileSize(file.size);

        fileItem.innerHTML = `
            <div class="file-icon ${extension}">
                <i class="${icon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-details">
                    <span class="file-size">${size}</span>
                    <span class="file-type">${fileType}</span>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile(${index})" title="Remove file">
                <i class="fas fa-times"></i>
            </button>
        `;

        filesList.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    displaySelectedFiles();
    updateFilesCount();
    
    // Clear file input when all files are removed
    if (selectedFiles.length === 0) {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    showToast('info', 'File removed successfully', 'File Removed');
}

function clearAllFiles() {
    selectedFiles = [];
    displaySelectedFiles();
    updateFilesCount();
    
    // Clear file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }
    
    showToast('info', 'All files cleared', 'Files Cleared');
}

function updateFilesCount() {
    const countElement = document.getElementById('filesCount');
    if (countElement) {
        countElement.textContent = selectedFiles.length;
    }

    const processBtn = document.getElementById('processBtn');
    if (processBtn) {
        processBtn.disabled = selectedFiles.length === 0 || isProcessing;
    }
}

// ENHANCED FILE PROCESSING WITH STRUCTURED PII/PHI DATA FOR EXCEL
async function processFiles() {
    if (selectedFiles.length === 0) {
        showToast('warning', 'Please select files to process', 'No Files Selected');
        return;
    }

    if (isProcessing) return;

    isProcessing = true;
    
    // Show processing UI
    hideElement('uploadSection');
    showElement('processingSection');
    updateProcessingProgress(0, 'Initializing Excel-based processing...');

    try {
        const formData = new FormData();
        
        // Add all selected files
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // Add user ID if authenticated
        if (currentUser && currentUser.id) {
            formData.append('userId', currentUser.id);
        }

        console.log('📄 Processing files with Excel storage and structured PII/PHI output');

        // Simulate progress updates
        updateProcessingProgress(20, 'Uploading files...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        updateProcessingProgress(50, 'Detecting PII and PHI data with AI...');
        
        const response = await fetch('/api/process-files', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.detail || 'Processing failed');
        }

        updateProcessingProgress(80, 'Structuring data for Excel export...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Complete progress
        updateProcessingProgress(100, 'Processing completed with Excel storage!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show results with structured data
        displayResults(data.results);
        
        // Clear file input after successful processing
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        console.log('✅ Processing completed with Excel backend');
        showToast('success', `Successfully processed ${data.results.filesProcessed} files with Excel storage`, 'Processing Complete');

    } catch (error) {
        console.error('⚠️ Processing failed:', error);
        showToast('error', error.message || 'Processing failed. Please try again.', 'Processing Failed');
        
        // Show upload section again on error
        hideElement('processingSection');
        showElement('uploadSection');
    } finally {
        isProcessing = false;
        updateFilesCount();
    }
}

// ENHANCED RESULTS DISPLAY WITH PII/PHI STRUCTURE INFO
function displayResults(results) {
    hideElement('processingSection');
    showElement('resultsSection');

    // Animate success
    const successAnimation = document.querySelector('.success-animation');
    if (successAnimation) {
        successAnimation.style.animation = 'none';
        successAnimation.offsetHeight; // trigger reflow
        successAnimation.style.animation = 'success-bounce 0.6s ease-out';
    }

    // Update result numbers with animation
    animateNumber(document.getElementById('filesProcessedCount'), results.filesProcessed);
    animateNumber(document.getElementById('piiItemsCount'), results.piiItemsRemoved);
    animateNumber(document.getElementById('phiItemsCount'), results.phiItemsDetected);

    // Update processing time
    const processingTimeElement = document.getElementById('processingTime');
    if (processingTimeElement) {
        processingTimeElement.textContent = results.processingTime;
    }

    // Store enhanced results for download with structured PII/PHI data
    window.lastProcessingResults = {
        ...results,
        timestamp: new Date().toISOString(),
        // Store the structured data correctly for Excel download
        piiPhiData: results.piiPhiData || []
    };

    console.log('Results stored for download:', window.lastProcessingResults.piiPhiData?.length || 0, 'rows');

    // Show data structure preview
    if (results.piiPhiData && results.piiPhiData.length > 0) {
        displayDataPreview(results.piiPhiData);
    }

    console.log('📊 Results displayed with structured PII/PHI data:', results);
}

// NEW FUNCTION: Display preview of structured data
function displayDataPreview(piiPhiData) {
    const previewContainer = document.getElementById('dataPreview');
    if (!previewContainer) return;

    const sampleRow = piiPhiData[0]; // Use first row as example
    const piiColumns = Object.keys(sampleRow).filter(key => key.startsWith('PII_'));
    const phiColumns = Object.keys(sampleRow).filter(key => key.startsWith('PHI_'));

    previewContainer.innerHTML = `
        <div class="data-structure-info">
            <h4>📋 Excel Structure Preview</h4>
            <div class="structure-grid">
                <div class="structure-section">
                    <h5>🔒 PII Columns (${piiColumns.length})</h5>
                    <ul class="column-list">
                        ${piiColumns.map(col => `<li>${col.replace('PII_', '').replace('_', ' ')}</li>`).join('')}
                    </ul>
                </div>
                <div class="structure-section">
                    <h5>🏥 PHI Columns (${phiColumns.length})</h5>
                    <ul class="column-list">
                        ${phiColumns.map(col => `<li>${col.replace('PHI_', '').replace('_', ' ')}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div class="preview-note">
                <i class="fas fa-info-circle"></i>
                Each file becomes one row with PII and PHI data as separate columns
            </div>
        </div>
    `;
}

function animateNumber(element, targetValue) {
    if (!element) return;

    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);
        
        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// STRUCTURED EXCEL DOWNLOAD WITH PII/PHI AS COLUMNS
async function downloadResults() {
    console.log('Download attempt - checking data:', window.lastProcessingResults);
    
    if (!window.lastProcessingResults) {
        showToast('warning', 'No processing results found. Please process files first.', 'Download Failed');
        return;
    }

    // Check for the correct data key
    const dataToDownload = window.lastProcessingResults.piiPhiData || window.lastProcessingResults.results?.piiPhiData;
    
    if (!dataToDownload || dataToDownload.length === 0) {
        console.error('No PII/PHI data found:', window.lastProcessingResults);
        showToast('warning', 'No structured data available for download. Please process files first.', 'Download Failed');
        return;
    }

    try {
        showToast('info', 'Preparing structured Excel report with PII/PHI columns...', 'Download Started');

        const response = await fetch('/api/download-results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                piiPhiData: dataToDownload // Send structured data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Download failed with response:', errorData);
            throw new Error(errorData.detail || 'Download failed');
        }

        const blob = await response.blob();
        console.log('Excel blob received, size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PII_PHI_Structured_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        const dataCount = dataToDownload.length;
        const sampleRow = dataToDownload[0] || {};
        const columnCount = Object.keys(sampleRow).length;

        showToast('success', 
            `Excel downloaded: ${dataCount} rows × ${columnCount} columns with structured PII/PHI data!`, 
            'Download Complete'
        );

    } catch (error) {
        console.error('Download failed:', error);
        showToast('error', error.message || 'Failed to download results. Please try again.', 'Download Failed');
    }
}

function updateProcessingProgress(percentage, message) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-info .progress-message');
    const progressPercent = document.querySelector('.progress-info .progress-percent');

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = message;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${percentage}%`;
    }
}

function processAgain() {
    selectedFiles = [];
    window.lastProcessingResults = null;
    
    hideElement('resultsSection');
    showElement('uploadSection');
    
    displaySelectedFiles();
    updateFilesCount();
    
    showToast('info', 'Ready to process new files', 'Reset Complete');
}

// API KEY GENERATION - SIMPLIFIED FOR EXCEL STORAGE
function showGenerateKeyModal() {
    if (!isAuthenticated) {
        showToast('warning', 'Please sign in to generate API keys', 'Authentication Required');
        return;
    }
    
    const modal = document.getElementById('generateKeyModal');
    if (modal) {
        modal.style.display = 'flex';
        // Clear previous input and focus
        const nameInput = document.getElementById('newKeyName');
        if (nameInput) {
            nameInput.value = '';
            nameInput.focus();
            nameInput.classList.remove('error');
        }
        
        // Reset button state
        const generateBtn = document.getElementById('generateKeyBtn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate API Key';
        }
    }
}

function closeGenerateKeyModal() {
    const modal = document.getElementById('generateKeyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function generateNewApiKey() {
    const nameInput = document.getElementById('newKeyName');
    const generateBtn = document.getElementById('generateKeyBtn');
    
    if (!nameInput || !generateBtn) return;
    
    const keyName = nameInput.value.trim();
    
    // Enhanced validation
    if (!keyName) {
        nameInput.classList.add('error');
        nameInput.focus();
        showToast('warning', 'Please enter a name for the API key', 'Name Required');
        return;
    }
    
    if (keyName.length < 3) {
        nameInput.classList.add('error');
        nameInput.focus();
        showToast('warning', 'API key name must be at least 3 characters', 'Name Too Short');
        return;
    }
    
    if (!currentUser) {
        showToast('error', 'User information not found', 'Error');
        return;
    }

    // Update button state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    nameInput.classList.remove('error');

    try {
        const response = await fetch('/api/generate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                keyName: keyName
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.detail || 'Failed to generate API key');
        }

        closeGenerateKeyModal();
        showToast('success', `API key "${keyName}" generated and saved to Excel!`, 'Key Generated');
        
        // Reload API keys list
        await loadUserApiKeys();
        displayApiKeys();

    } catch (error) {
        console.error('⚠️ API key generation failed:', error);
        showToast('error', error.message || 'Failed to generate API key', 'Generation Failed');
    } finally {
        // Reset button state
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-plus"></i> Generate API Key';
    }
}

// Utility functions
function getFileType(extension) {
    const types = {
        'pdf': 'PDF Document',
        'docx': 'Word Document',
        'doc': 'Word Document',
        'xlsx': 'Excel Spreadsheet',
        'xls': 'Excel Spreadsheet',
        'png': 'PNG Image',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'zip': 'Archive'
    };
    return types[extension] || 'Unknown';
}

function getFileIcon(extension) {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'docx': 'fas fa-file-word',
        'doc': 'fas fa-file-word',
        'xlsx': 'fas fa-file-excel',
        'xls': 'fas fa-file-excel',
        'png': 'fas fa-file-image',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'zip': 'fas fa-file-archive'
    };
    return icons[extension] || 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// UI Helper functions
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
        element.classList.add('active');
    }
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
        element.classList.remove('active');
    }
}

// Toast notifications
function showToast(type, message, title = '') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);

    return toast;
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Event listeners setup
function setupEventListeners() {
    console.log('📡 Event listeners configured for Excel storage');
    
    // Auth form event listeners
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    
    if (signInForm) {
        signInForm.addEventListener('submit', handleSignIn);
    }
    
    if (signUpForm) {
        signUpForm.addEventListener('submit', handleSignUp);
    }
    
    // Close modal on overlay click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeAuthModal();
            closeGenerateKeyModal();
        }
    });
}

// Auth Modal Functions
function showAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        if (mode === 'signup') {
            switchToSignUp();
        } else {
            switchToSignIn();
        }
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        clearAuthForms();
    }
}

function clearAuthForms() {
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    
    if (signInForm) signInForm.reset();
    if (signUpForm) signUpForm.reset();
    
    // Remove any error states
    const errorInputs = document.querySelectorAll('.form-input.error');
    errorInputs.forEach(input => input.classList.remove('error'));
}

function switchToSignIn() {
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const toggleButtons = document.querySelectorAll('.auth-toggle-btn');
    const title = document.getElementById('authModalTitle');
    
    if (signInForm) signInForm.style.display = 'block';
    if (signUpForm) signUpForm.style.display = 'none';
    if (title) title.textContent = 'Welcome Back';
    
    toggleButtons.forEach((btn, index) => {
        btn.classList.remove('active');
        if (index === 0) btn.classList.add('active');
    });
}

function switchToSignUp() {
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const toggleButtons = document.querySelectorAll('.auth-toggle-btn');
    const title = document.getElementById('authModalTitle');
    
    if (signInForm) signInForm.style.display = 'none';
    if (signUpForm) signUpForm.style.display = 'block';
    if (title) title.textContent = 'Create Account';
    
    toggleButtons.forEach((btn, index) => {
        btn.classList.remove('active');
        if (index === 1) btn.classList.add('active');
    });
}

// Form Handlers with Excel Storage Integration
async function handleSignUp(event) {
    event.preventDefault();
    
    const form = document.getElementById('signUpForm');
    const formData = new FormData(form);
    
    const signUpData = {
        name: formData.get('name')?.trim() || '',
        email: formData.get('email')?.trim().toLowerCase() || '',
        organization: formData.get('organization')?.trim() || 'Hospital',
        department: formData.get('department')?.trim() || '',
        password: formData.get('password') || ''
    };

    // Enhanced validation
    if (!signUpData.name || signUpData.name.length < 2) {
        showToast('error', 'Name must be at least 2 characters long', 'Validation Error');
        return;
    }

    if (!signUpData.email || !isValidEmail(signUpData.email)) {
        showToast('error', 'Please enter a valid email address', 'Validation Error');
        return;
    }

    if (!signUpData.password || signUpData.password.length < 6) {
        showToast('error', 'Password must be at least 6 characters long', 'Validation Error');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signUpData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.detail || 'Registration failed');
        }

        // Store user data
        currentUser = data.user;
        localStorage.setItem('aviality_user', JSON.stringify(currentUser));
        
        isAuthenticated = true;
        updateUIForAuthenticated();
        closeAuthModal();

        showToast('success', 'Account created and stored in Excel! You can now generate API keys.', 'Welcome to Aviality');
        await loadUserData();

    } catch (error) {
        showToast('error', error.message, 'Registration Failed');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function handleSignIn(event) {
    event.preventDefault();
    
    const form = document.getElementById('signInForm');
    const formData = new FormData(form);
    
    const signInData = {
        email: formData.get('email')?.trim().toLowerCase() || '',
        password: formData.get('password') || ''
    };

    // Enhanced validation
    if (!signInData.email || !isValidEmail(signInData.email)) {
        showToast('error', 'Please enter a valid email address', 'Validation Error');
        return;
    }

    if (!signInData.password) {
        showToast('error', 'Password is required', 'Validation Error');
        return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signInData)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.detail || 'Login failed');
        }

        // Store user data
        currentUser = data.user;
        userApiKeys = data.apiKeys || [];
        localStorage.setItem('aviality_user', JSON.stringify(currentUser));
        
        isAuthenticated = true;
        updateUIForAuthenticated();
        closeAuthModal();

        showToast('success', 'Signed in successfully! Data loaded from Excel storage.', 'Welcome Back');

    } catch (error) {
        showToast('error', error.message, 'Sign In Failed');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// API Key Management with Excel Storage
async function loadUserApiKeys() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/keys/${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            userApiKeys = data.apiKeys;
            console.log('API keys loaded from Excel storage:', userApiKeys.length);
        }
    } catch (error) {
        console.error('Failed to load API keys from Excel:', error);
    }
}

function displayApiKeys() {
    const apiKeysList = document.getElementById('apiKeysList');
    if (!apiKeysList) return;

    if (!userApiKeys || userApiKeys.length === 0) {
        apiKeysList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-key"></i>
                <h3>No API Keys Found</h3>
                <p>Generate your first API key to get started</p>
                <p><small>Keys are stored in Excel for easy management</small></p>
            </div>
        `;
        return;
    }

    apiKeysList.innerHTML = userApiKeys.map(key => `
        <div class="api-key-item">
            <div class="api-key-header">
                <div class="api-key-name">${key.name}</div>
                <div class="api-key-actions">
                    <button class="btn btn-secondary btn-sm" onclick="copyApiKey('${key.apiKey}')">
                        <i class="fas fa-copy"></i>
                        Copy
                    </button>
                    <button class="btn btn-error btn-sm" onclick="revokeApiKey('${key.id}')">
                        <i class="fas fa-trash"></i>
                        Revoke
                    </button>
                </div>
            </div>
            <div class="api-key-details">
                <code class="api-key-value">${key.apiKey}</code>
                <div class="api-key-meta">
                    <span>Created: ${new Date(key.createdAt).toLocaleDateString()}</span>
                    <span>Usage: ${key.usageCount || 0} calls</span>
                    <span class="excel-indicator">📊 Stored in Excel</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function copyApiKey(apiKey) {
    try {
        await navigator.clipboard.writeText(apiKey);
        showToast('success', 'API key copied to clipboard', 'Copied');
    } catch (error) {
        console.error('Failed to copy API key:', error);
        showToast('error', 'Failed to copy API key', 'Copy Failed');
    }
}

async function revokeApiKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone and will remove it from Excel storage.')) {
        return;
    }

    try {
        const response = await fetch(`/api/keys/${keyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.detail || 'Failed to revoke API key');
        }

        showToast('success', 'API key revoked and removed from Excel storage', 'Key Revoked');
        
        // Reload API keys list
        await loadUserApiKeys();
        displayApiKeys();

    } catch (error) {
        console.error('API key revocation failed:', error);
        showToast('error', error.message || 'Failed to revoke API key', 'Revocation Failed');
    }
}

// Profile Management
function loadProfilePage() {
    console.log('Loading profile page with Excel data');
    if (currentUser) {
        // Update profile fields with actual user data
        const profileName = document.getElementById('profileName');
        const profileEmailInput = document.getElementById('profileEmailInput');
        const profileCreatedAt = document.getElementById('profileCreatedAt');
        const profileUserName = document.getElementById('profileUserName');
        const profileUserEmail = document.getElementById('profileUserEmail');
        const profileJoinDate = document.getElementById('profileJoinDate');
        
        if (profileName) profileName.value = currentUser.name;
        if (profileEmailInput) profileEmailInput.value = currentUser.email;
        if (profileUserName) profileUserName.textContent = currentUser.name;
        if (profileUserEmail) profileUserEmail.textContent = currentUser.email;
        
        // Format the creation date properly
        if (profileCreatedAt && currentUser.createdAt) {
            const createdDate = new Date(currentUser.createdAt);
            profileCreatedAt.value = createdDate.toLocaleDateString();
        }
        
        if (profileJoinDate && currentUser.createdAt) {
            const createdDate = new Date(currentUser.createdAt);
            profileJoinDate.textContent = createdDate.toLocaleDateString();
        }
        
        showProfileTab('account');
        
        // Load and display API keys from Excel
        displayApiKeys();
    }
}

function showProfileTab(tabName) {
    // Hide all tab contents first
    const tabContents = document.querySelectorAll('.profile-tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    const targetContent = document.getElementById(tabName + 'Tab');
    if (targetContent) {
        targetContent.classList.add('active');
        targetContent.style.display = 'block';
    }
    
    // Add active class to selected tab button
    const targetTab = document.querySelector(`[onclick="showProfileTab('${tabName}')"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    console.log(`Switched to tab: ${tabName}`);
}

function signOut() {
    localStorage.removeItem('aviality_user');
    isAuthenticated = false;
    currentUser = null;
    userApiKeys = [];
    
    updateUIForGuest();
    showPage('home');
    showToast('success', 'Signed out successfully. Excel data preserved.', 'Goodbye');
}

console.log('Excel Storage System Script Loaded Successfully');



let uploadMode = 'files'; // Track current upload mode

function switchUploadMode(mode) {
    uploadMode = mode;
    
    // Update toggle buttons
    document.querySelectorAll('.upload-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update UI text
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadSubtitle = document.getElementById('uploadSubtitle');
    
    if (mode === 'folder') {
        uploadTitle.textContent = 'Select Folder to Process';
        uploadSubtitle.textContent = 'All supported files in the folder will be processed';
    } else {
        uploadTitle.textContent = 'Drag & Drop Files Here';
        uploadSubtitle.textContent = 'Or click to browse and select files';
    }
}

// Modify initializeFileHandling function
function initializeFileHandling() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const folderInput = document.getElementById('folderInput');
    
    if (!uploadArea || !fileInput || !folderInput) return;

    // Drag and drop
    uploadArea.addEventListener('click', () => {
        if (uploadMode === 'folder') {
            folderInput.click();
        } else {
            fileInput.click();
        }
    });
    
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // File input changes
    fileInput.addEventListener('change', handleFileSelect);
    folderInput.addEventListener('change', handleFolderSelect);
}

function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    console.log(`Selected folder with ${files.length} files`);
    addFiles(files);
}