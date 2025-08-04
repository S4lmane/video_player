// StreamHub JavaScript - Main Application Logic

// Global Variables
let videoLibrary = [
    {
        id: 1,
        title: "Lalo Salamanca",
        duration: "127:59",
        type: "MP4",
        url: "./videos/lalo_salamanca.mp4",
        thumbnail: "./videos/lalo_salamanca.jpg",
        subtitles: [
            { language: "English", url: "./subtitles/english.srt" },
            { language: "Spanish", url: "./subtitles/spanish.srt" }
        ]
    },
    {
        id: 2,
        title: "5 Second",
        duration: "1:45",
        type: "MP4",
        url: "./videos/5sec_vid.mp4",
        thumbnail: "./videos/5sec_vid.jpg",
        subtitles: null
    },
    {
        id: 3,
        title: "The Conjuring: Last Rites",
        duration: "3:20",
        type: "MP4",
        url: "./videos/theconjuring.mp4",
        thumbnail: "./videos/theconjuring.jpg",
        subtitles: null
    },
    {
        id: 4,
        title: "As Above, So Below",
        duration: "3:20",
        type: "MP4",
        url: "./videos/As Above So Below.mp4",
        thumbnail: "./videos/As Above So Below.jpg",
        subtitles: null
    },
    {
        id: 5,
        title: "Whiplash",
        duration: "3:20",
        type: "MP4",
        url: "./videos/Whiplash.mp4",
        thumbnail: "./videos/Whiplash.jpg",
        subtitles: [
            { language: "English", url: "./subtitles/[cc-eng] Whiplash.srt" }
        ]
    },
    {
        id: 6,
        title: "Whiplash",
        duration: "3:20",
        type: "MP4",
        url: "./videos/Whiplash.mp4",
        thumbnail: "./videos/Whiplash_2.jpg",
        subtitles: [
            { language: "English", url: "./subtitles/[cc-eng] Whiplash.srt" }
        ]
    },
    {
        id: 7,
        title: "The Night Manager",
        duration: "3:20",
        type: "MP4",
        url: "./videos/TNM - Ep1.mp4",
        thumbnail: "./videos/TNM.jpg",
        subtitles: [
            { language: "English", url: "./subtitles/TNM - Ep1.srt" }
        ]
    },
    {
        id: 8,
        title: "The Night Manager",
        duration: "3:20",
        type: "MP4",
        url: "./videos/TNM - Ep1.mp4",
        thumbnail: "./videos/TNM2.jpg",
        subtitles: [
            { language: "English", url: "./subtitles/TNM - Ep1.srt" }
        ]
    }
];

let currentVideo = null;
let controlsTimeout = null;
let cursorTimeout = null;
let progressData = {};
let currentSubtitles = [];
let currentSubtitleTrack = null;
let lastMousePosition = { x: 0, y: 0 };
let cursorMoving = false;
let volumeSliderTimeout = null;
let isMiniPlayerMode = false;
let miniPlayerUpdateInterval = null;
let selectedVideoId = null;
let isContextMenuOpen = false;
let isMoveMode = false;
let holdTimeout = null;
let isHolding = false;
let playbackMode = 'normal';
let deletedVideo = null;
let notificationTimeout = null;

let castModalVisible = false;
let miniPlayerCurrentX = 0;
let animationLocked = false;
let miniPlayerCurrentY = 0;

// Touch gesture variables
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

//drag vars
let miniPlayerDragMode = false;
let miniPlayerStartX = 0;
let miniPlayerStartY = 0;
let miniPlayerHoldTimeout = null;
let dragBlurOverlay = null;
let isDragging = false;
let dragStarted = false;
let lastTouchTime = 0;

// Performance metrics
let performanceMetrics = {
    videoLoadTime: 0,
    lastFrameTime: 0,
    frameCount: 0
};

// Utility Functions
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showLoadingState(element, text = 'Loading...') {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoadingState(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

function showActionFeedback(icon, text) {
    const feedback = document.getElementById('actionFeedback');
    const feedbackIcon = document.getElementById('actionIcon');
    const feedbackText = document.getElementById('actionText');

    feedbackIcon.textContent = icon;
    feedbackText.textContent = text;

    feedback.classList.add('show');
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

// Data Management Functions
function loadProgressData() {
    try {
        const saved = localStorage.getItem('streamhub_progress');
        if (saved) {
            progressData = JSON.parse(saved);
            console.log('Progress data loaded:', progressData);
        }
    } catch (e) {
        console.error('Failed to load progress data:', e);
        progressData = {};
    }
}

function saveProgressData() {
    try {
        localStorage.setItem('streamhub_progress', JSON.stringify(progressData));
        console.log('Progress data saved:', progressData);
    } catch (e) {
        console.error('Failed to save progress data:', e);
    }
}

// Library Management
function loadLibrary() {
    console.log('=== LOAD LIBRARY DEBUG ===');
    console.log('videoLibrary.length:', videoLibrary.length);
    console.log('Current array order:');
    videoLibrary.forEach((video, index) => {
        console.log(`  ${index}: ${video.title} (ID: ${video.id})`);
    });

    const grid = document.getElementById('videoGrid');
    const emptyState = document.getElementById('emptyState');

    if (videoLibrary.length === 0) {
        grid.innerHTML = '';
        grid.appendChild(emptyState);
        return;
    }

    // FORCE clear the grid completely first
    grid.innerHTML = '';

    // Build the HTML string manually to ensure proper order
    let htmlContent = '';

    videoLibrary.forEach((video, index) => {
        const progress = progressData[video.id] || { currentTime: 0, duration: 0 };
        const progressPercent = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
        const displayDuration = progress.duration > 0 ? formatDuration(progress.duration) : video.duration;

        console.log(`Building card ${index} for: ${video.title} (ID: ${video.id})`);

        const cardHtml = `
            <div class="video-card"
                 data-video-id="${video.id}"
                 data-index="${index}"
                 data-title="${video.title.replace(/"/g, '&quot;')}"
                 onclick="handleVideoClick(${video.id})"
                 onmousedown="startHold(${video.id}, event)"
                 onmouseup="endHold()"
                 onmouseleave="endHold()"
                 ontouchstart="startHold(${video.id}, event)"
                 ontouchend="endHold()">
                <div class="video-thumbnail">
                    ${video.thumbnail ?
                        `<img src="${video.thumbnail}" alt="${video.title.replace(/"/g, '&quot;')}">` :
                        `<div class="video-placeholder">
                            <span class="material-icons">movie</span>
                        </div>`
                    }
                </div>
                <div class="video-overlay">
                    <div class="video-overlay-top"></div>
                    <div class="video-overlay-bottom">
                        <div class="video-info-left">
                            <div class="video-title">${video.title}</div>
                            <div class="video-duration">${displayDuration}</div>
                        </div>
                        <div class="video-type">${video.type}</div>
                    </div>
                </div>
                ${progressPercent > 1 ? `<div class="progress-indicator" style="width: ${progressPercent}%"></div>` : ''}
                <div class="move-indicator left" onclick="moveLeft(${index}, event)"></div>
                <div class="move-indicator right" onclick="moveRight(${index}, event)"></div>
            </div>
        `;

        htmlContent += cardHtml;
    });

    // Set the HTML all at once
    grid.innerHTML = htmlContent;

    // Force a reflow to ensure DOM is updated
    grid.offsetHeight;

    // Verify the rendered cards match our array
    const renderedCards = document.querySelectorAll('.video-card');
    console.log('=== RENDERED CARDS VERIFICATION ===');
    renderedCards.forEach((card, index) => {
        const cardVideoId = parseInt(card.dataset.videoId);
        const cardTitle = card.dataset.title;
        const expectedVideo = videoLibrary[index];

        console.log(`Card ${index}: ${cardTitle} (ID: ${cardVideoId})`);

        if (expectedVideo && cardVideoId === expectedVideo.id) {
            console.log(`  ✅ Matches expected: ${expectedVideo.title} (ID: ${expectedVideo.id})`);
        } else {
            console.error(`  ❌ MISMATCH! Expected: ${expectedVideo ? expectedVideo.title : 'undefined'} (ID: ${expectedVideo ? expectedVideo.id : 'undefined'})`);
        }
    });

    console.log('=== END LOAD LIBRARY DEBUG ===');
}

function verifyArrayIntegrity() {
    console.log('=== ARRAY INTEGRITY CHECK ===');

    // Check for duplicate IDs
    const ids = videoLibrary.map(v => v.id);
    const uniqueIds = [...new Set(ids)];

    if (ids.length !== uniqueIds.length) {
        console.error('❌ DUPLICATE IDs FOUND!');
        console.error('All IDs:', ids);
        console.error('Unique IDs:', uniqueIds);

        // Find duplicates
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        console.error('Duplicate IDs:', duplicates);
    } else {
        console.log('✅ All video IDs are unique');
    }

    // Check for object reference sharing
    const objectHashes = videoLibrary.map((v, i) => {
        return `${i}: ${v.title} (${v.id}) - ${JSON.stringify(v).substring(0, 50)}...`;
    });

    console.log('Video objects:', objectHashes);
    console.log('=== END INTEGRITY CHECK ===');
}

function addVideo() {
    const input = document.getElementById('videoInput');
    const value = input.value.trim();

    if (!value) {
        alert('Please enter a video title or URL');
        return;
    }

    let videoUrl = value;
    let videoTitle = value;

    if (value.startsWith('http') || value.includes('.mp4') || value.includes('.webm') || value.includes('.ogg')) {
        videoUrl = value;
        videoTitle = value.split('/').pop().split('.')[0].replace(/[-_]/g, ' ');
    } else {
        videoUrl = `./videos/${value.toLowerCase().replace(/\s+/g, '_')}.mp4`;
        videoTitle = value;
    }

    const newVideo = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: videoTitle,
        duration: "Unknown",
        type: videoUrl.split('.').pop().toUpperCase(),
        url: videoUrl,
        thumbnail: null,
        subtitles: null
    };

    videoLibrary = [...videoLibrary, newVideo];

    // Save thumbnails after adding video
    saveThumbnailData();

    input.value = '';
    loadLibrary();
    updateVideoCount();
    verifyArrayIntegrity();
    console.log('New video added:', newVideo.title);
}

function updateVideoCount() {
    const count = videoLibrary.length;
    document.getElementById('videoCount').textContent = `${count} video${count !== 1 ? 's' : ''}`;
}

// Context Menu Functions
function setupContextMenu() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideContextMenu();
            exitMoveMode();
        }
    });
}

function startHold(videoId, event) {
    console.log('=== START HOLD DEBUG ===');
    console.log('Raw videoId parameter:', videoId, typeof videoId);

    if (isMoveMode || isContextMenuOpen) {
        console.log('❌ Already in move mode or context menu open');
        return;
    }

    event.preventDefault();
    isHolding = true;

    // Ensure we have the correct video ID as a number
    selectedVideoId = parseInt(videoId);
    console.log('selectedVideoId set to:', selectedVideoId, typeof selectedVideoId);

    // Verify the video exists
    const video = videoLibrary.find(v => v.id === selectedVideoId);
    if (video) {
        console.log(`✅ Video found: ${video.title}`);
    } else {
        console.error('❌ Video not found in library!');
        console.error('Available IDs:', videoLibrary.map(v => v.id));
    }

    holdTimeout = setTimeout(() => {
        if (isHolding) {
            console.log('✅ Showing context menu for video ID:', selectedVideoId);
            showContextMenu(selectedVideoId, event);
        }
    }, 500);
}

function endHold() {
    isHolding = false;
    if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
    }
}

function handleVideoClick(videoId) {
    if (isContextMenuOpen || isMoveMode || isHolding) {
        console.log('Click ignored due to context menu or move mode');
        return;
    }

    console.log('Video clicked:', videoId);
    if (isMiniPlayerMode) {
        const wasPlaying = !document.getElementById('mainVideoPlayer').paused;
        switchVideoInMiniPlayer(videoId, wasPlaying);
        return;
    }

    playVideo(videoId);
}

function showContextMenu(videoId, event) {
    const contextMenu = document.getElementById('contextMenu');
    const blurOverlay = document.getElementById('blurOverlay');
    const videoCard = document.querySelector(`[data-video-id="${videoId}"]`);

    isContextMenuOpen = true;
    selectedVideoId = videoId;

    blurOverlay.classList.add('active');
    videoCard.classList.add('selected');

    const rect = videoCard.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 120;

    let left = rect.right + 20;
    let top = rect.top;

    if (left + menuWidth > window.innerWidth) {
        left = rect.left - menuWidth - 20;
    }
    if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 20;
    }

    contextMenu.style.left = left + 'px';
    contextMenu.style.top = top + 'px';
    contextMenu.classList.add('show');
    console.log('Context menu shown at:', { left, top });
}

function hideContextMenu() {
    if (!isContextMenuOpen) return;

    const contextMenu = document.getElementById('contextMenu');
    const blurOverlay = document.getElementById('blurOverlay');

    contextMenu.classList.remove('show');
    blurOverlay.classList.remove('active');

    document.querySelectorAll('.video-card').forEach(card => {
        card.classList.remove('selected');
    });

    isContextMenuOpen = false;
    // selectedVideoId = null; @fix this
    console.log('Context menu hidden');
}

function changeThumbnail() {
    console.log('Changing thumbnail for video ID:', selectedVideoId);
    document.getElementById('thumbnailInput').click();
    setTimeout(() => {
        hideContextMenu();
    }, 100);
}

function handleThumbnailUpload(event) {
    const file = event.target.files[0];
    console.log('Thumbnail upload - Selected video ID:', selectedVideoId);
    console.log('Thumbnail upload - File:', file);

    if (!file) {
        console.error('No file selected for thumbnail upload');
        return;
    }

    if (!selectedVideoId) {
        console.error('No video ID selected for thumbnail upload');
        const selectedCard = document.querySelector('.video-card.selected');
        if (selectedCard) {
            selectedVideoId = parseInt(selectedCard.dataset.videoId);
            console.log('Found selected video ID from card:', selectedVideoId);
        } else {
            alert('Please select a video first by right-clicking on it');
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const video = videoLibrary.find(v => v.id === selectedVideoId);
        if (video) {
            video.thumbnail = e.target.result;

            // Save thumbnails immediately after setting
            saveThumbnailData();

            loadLibrary();
            updateVideoCount();

            if (isMiniPlayerMode && currentVideo && currentVideo.id === selectedVideoId) {
                const miniArtwork = document.getElementById('miniArtwork');
                miniArtwork.innerHTML = `<img src="${e.target.result}" alt="${video.title}">`;
                updateMiniInfo();
            }

            console.log('Thumbnail updated and saved for video:', video.title);
            showActionFeedback('image', 'Thumbnail updated');
            selectedVideoId = null;
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function saveThumbnailData() {
    try {
        const thumbnailData = {};
        videoLibrary.forEach(video => {
            if (video.thumbnail && video.thumbnail.startsWith('data:')) {
                const videoKey = getVideoKey(video);
                thumbnailData[videoKey] = {
                    thumbnail: video.thumbnail,
                    title: video.title,
                    duration: video.duration,
                    type: video.type,
                    savedAt: Date.now()
                };
            }
        });
        localStorage.setItem('streamhub_thumbnails', JSON.stringify(thumbnailData));
        console.log('Thumbnails saved for', Object.keys(thumbnailData).length, 'videos');
    } catch (e) {
        console.error('Failed to save thumbnail data:', e);
        if (e.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, clearing old thumbnails');
            // Clear thumbnails older than 30 days
            clearOldThumbnails();
        }
    }
}

function loadThumbnailData() {
    try {
        const saved = localStorage.getItem('streamhub_thumbnails');
        if (saved) {
            const thumbnailData = JSON.parse(saved);
            console.log('Loading thumbnails for', Object.keys(thumbnailData).length, 'videos');

            videoLibrary.forEach(video => {
                const videoKey = getVideoKey(video);
                if (thumbnailData[videoKey]) {
                    video.thumbnail = thumbnailData[videoKey].thumbnail;
                    console.log('Loaded thumbnail for:', video.title);
                }
            });

            console.log('Thumbnails loaded successfully');
        }
    } catch (e) {
        console.error('Failed to load thumbnail data:', e);
        localStorage.removeItem('streamhub_thumbnails');
    }
}
function clearOldThumbnails() {
    try {
        const saved = localStorage.getItem('streamhub_thumbnails');
        if (saved) {
            const thumbnailData = JSON.parse(saved);
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

            const cleanedData = {};
            Object.keys(thumbnailData).forEach(key => {
                const data = thumbnailData[key];
                if (data.savedAt && data.savedAt > thirtyDaysAgo) {
                    cleanedData[key] = data;
                }
            });

            localStorage.setItem('streamhub_thumbnails', JSON.stringify(cleanedData));
            console.log('Cleaned old thumbnails, kept', Object.keys(cleanedData).length, 'thumbnails');
        }
    } catch (e) {
        console.error('Failed to clean old thumbnails:', e);
        localStorage.removeItem('streamhub_thumbnails');
    }
}

// Move Video Functions
function moveVideo() {
    console.log('Moving video for video ID:', selectedVideoId);
    if (!selectedVideoId) {
        console.error('No video selected for move mode');
        return;
    }

    const contextMenu = document.getElementById('contextMenu');
    const blurOverlay = document.getElementById('blurOverlay');
    contextMenu.classList.remove('show');
    blurOverlay.classList.remove('active');
    document.querySelectorAll('.video-card').forEach(card => {
        card.classList.remove('selected');
    });
    isContextMenuOpen = false;

    setTimeout(() => {
        enterMoveMode();
    }, 100);
}

function enterMoveMode() {
    if (!selectedVideoId) {
        console.error('No video selected for move mode');
        return;
    }

    // Double-check the video exists in the library
    const videoExists = videoLibrary.some(v => v.id === selectedVideoId);
    if (!videoExists) {
        console.error('Selected video ID not found in library:', selectedVideoId);
        selectedVideoId = null;
        return;
    }

    isMoveMode = true;
    const selectedCard = document.querySelector(`[data-video-id="${selectedVideoId}"]`);

    if (selectedCard) {
        selectedCard.classList.add('moving');
        updateMoveIndicators();
        console.log('Move mode entered for video ID:', selectedVideoId);
        console.log('Video title:', videoLibrary.find(v => v.id === selectedVideoId)?.title);
    } else {
        console.error('Selected video card not found for ID:', selectedVideoId);
        exitMoveMode();
        return;
    }

    document.addEventListener('click', handleMoveClick);
    document.addEventListener('keydown', handleMoveKeyboard);
}

function exitMoveMode() {
    if (!isMoveMode) return;

    console.log('Exiting move mode for video ID:', selectedVideoId);

    isMoveMode = false;

    // Remove visual indicators
    document.querySelectorAll('.video-card').forEach(card => {
        card.classList.remove('moving');
        // Reset any transform styles from animations
        card.style.transform = '';
        card.style.transition = '';
    });

    document.querySelectorAll('.move-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });

    // Remove event listeners
    document.removeEventListener('click', handleMoveClick);
    document.removeEventListener('keydown', handleMoveKeyboard);

    console.log('Move mode exited');

    // IMPORTANT: Don't clear selectedVideoId here if we want to preserve selection
    // selectedVideoId = null; // Remove this line to keep selection
}

function updateMoveIndicators() {
    console.log('Updating move indicators');
    document.querySelectorAll('.move-indicator').forEach(indicator => {
        indicator.classList.remove('active');
    });

    const cards = document.querySelectorAll('.video-card');
    cards.forEach((card, index) => {
        const leftIndicator = card.querySelector('.move-indicator.left');
        const rightIndicator = card.querySelector('.move-indicator.right');

        if (index > 0) {
            leftIndicator.classList.add('active');
        }
        if (index < cards.length - 1) {
            rightIndicator.classList.add('active');
        }
    });
}

function moveLeft(targetIndex, event) {
    event.stopPropagation();
    event.preventDefault();

    console.log('=== MOVE LEFT WITH DUAL METHOD ===');

    if (!isMoveMode || !selectedVideoId) {
        console.log('❌ Not in move mode or no video selected');
        return;
    }

    const currentIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
    if (currentIndex <= 0) {
        console.log('❌ Already at leftmost position');
        return;
    }

    const targetIdx = currentIndex - 1;
    console.log(`Moving from ${currentIndex} to ${targetIdx}`);

    // Try DOM method first
    moveVideoToPosition(currentIndex, targetIdx);

    // If that doesn't work, try fallback after a delay
    setTimeout(() => {
        const checkIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
        if (checkIndex === currentIndex) {
            console.log('🔄 DOM method failed, trying fallback...');
            moveVideoToPositionFallback(currentIndex, targetIdx);
        }
    }, 600);
}

function moveRight(targetIndex, event) {
    event.stopPropagation();
    event.preventDefault();

    console.log('=== MOVE RIGHT WITH DUAL METHOD ===');

    if (!isMoveMode || !selectedVideoId) {
        console.log('❌ Not in move mode or no video selected');
        return;
    }

    const currentIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
    if (currentIndex >= videoLibrary.length - 1) {
        console.log('❌ Already at rightmost position');
        return;
    }

    const targetIdx = currentIndex + 1;
    console.log(`Moving from ${currentIndex} to ${targetIdx}`);

    // Try DOM method first
    moveVideoToPosition(currentIndex, targetIdx);

    // If that doesn't work, try fallback after a delay
    setTimeout(() => {
        const checkIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
        if (checkIndex === currentIndex) {
            console.log('🔄 DOM method failed, trying fallback...');
            moveVideoToPositionFallback(currentIndex, targetIdx);
        }
    }, 600);
}

function testArraySwapping() {
    console.log('=== TESTING ARRAY SWAPPING ===');

    // Create a simple test array
    const testArray = [
        { id: 1, title: 'Video A' },
        { id: 2, title: 'Video B' },
        { id: 3, title: 'Video C' },
        { id: 4, title: 'Video D' }
    ];

    console.log('Original:', testArray.map((v, i) => `${i}: ${v.title}`));

    // Test moving index 1 (Video B) to index 2
    const fromIndex = 1;
    const toIndex = 2;

    const movingItem = testArray[fromIndex];
    const newArray = [];

    // Apply the same logic as our moveVideoToPosition
    if (fromIndex < toIndex) {
        for (let i = 0; i < fromIndex; i++) {
            newArray.push(testArray[i]);
        }
        for (let i = fromIndex + 1; i <= toIndex; i++) {
            newArray.push(testArray[i]);
        }
        newArray.push(movingItem);
        for (let i = toIndex + 1; i < testArray.length; i++) {
            newArray.push(testArray[i]);
        }
    }

    console.log('After move 1→2:', newArray.map((v, i) => `${i}: ${v.title}`));
    console.log('Expected: 0: Video A, 1: Video C, 2: Video B, 3: Video D');
    console.log('=== TEST COMPLETE ===');
}

function handleMoveClick(event) {
    const indicator = event.target.closest('.move-indicator');
    if (!indicator) {
        console.log('No move indicator clicked, exiting move mode');
        exitMoveMode();
        return;
    }
}

function handleMoveKeyboard(event) {
    if (!isMoveMode || isContextMenuOpen) return;

    console.log('🎹 Keyboard move:', event.key);

    const currentIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
    console.log(`Current position: ${currentIndex}`);

    if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        event.stopPropagation();
        console.log('⬅️ Moving left');
        moveLeft(currentIndex - 1, event);
    } else if (event.key === 'ArrowRight' && currentIndex < videoLibrary.length - 1) {
        event.preventDefault();
        event.stopPropagation();
        console.log('➡️ Moving right');
        moveRight(currentIndex + 1, event);
    } else if (event.key === 'Escape') {
        exitMoveMode();
    } else if (event.key === 't') {
        // Test key
        testBothMethods();
    }
}

function verifyMoveWorking() {
    console.log('=== TESTING BASIC MOVE FUNCTIONALITY ===');

    // Create a simple test
    const originalLength = videoLibrary.length;
    const originalFirstVideo = videoLibrary[0];
    const originalSecondVideo = videoLibrary[1];

    console.log(`Original first video: ${originalFirstVideo.title} (ID: ${originalFirstVideo.id})`);
    console.log(`Original second video: ${originalSecondVideo.title} (ID: ${originalSecondVideo.id})`);

    // Manually test the splice operations
    console.log('Testing manual splice...');
    const testArray = [...videoLibrary];
    const itemToMove = testArray[0];
    testArray.splice(0, 1); // Remove first item
    testArray.splice(1, 0, itemToMove); // Insert at position 1

    console.log('After manual splice:');
    console.log(`New first video: ${testArray[0].title} (ID: ${testArray[0].id})`);
    console.log(`New second video: ${testArray[1].title} (ID: ${testArray[1].id})`);

    if (testArray[1].id === originalFirstVideo.id) {
        console.log('✅ Manual splice works correctly');
    } else {
        console.log('❌ Manual splice failed');
    }
}

function enterMoveMode() {
    console.log('=== ENTERING MOVE MODE ===');
    console.log('selectedVideoId:', selectedVideoId);

    if (!selectedVideoId) {
        console.error('❌ No video selected for move mode');
        return;
    }

    // Find the video in the library
    const videoIndex = videoLibrary.findIndex(v => v.id === selectedVideoId);
    const video = videoLibrary[videoIndex];

    if (videoIndex === -1 || !video) {
        console.error('❌ Selected video not found in library');
        console.error('Available video IDs:', videoLibrary.map(v => v.id));
        return;
    }

    console.log(`✅ Found video: ${video.title} at index ${videoIndex}`);

    isMoveMode = true;
    const selectedCard = document.querySelector(`[data-video-id="${selectedVideoId}"]`);

    if (selectedCard) {
        selectedCard.classList.add('moving');
        updateMoveIndicators();
        console.log('✅ Move mode activated successfully');

        // Run verification test
        verifyMoveWorking();
    } else {
        console.error('❌ Could not find card element for selected video');
        exitMoveMode();
        return;
    }

    document.addEventListener('click', handleMoveClick);
    document.addEventListener('keydown', handleMoveKeyboard);

    console.log('✅ Event listeners added for move mode');
}

function moveVideoToPosition(fromIndex, toIndex) {
    console.log('=== MOVE WITH DIRECT DOM MANIPULATION ===');
    console.log(`Moving from index ${fromIndex} to index ${toIndex}`);
    console.log('Selected video ID:', selectedVideoId);

    // Ensure valid indices
    toIndex = Math.max(0, Math.min(toIndex, videoLibrary.length - 1));
    if (fromIndex === toIndex) {
        console.log('Same position, no move needed');
        return;
    }

    // Store original array state for comparison
    const originalArray = videoLibrary.map(v => ({ id: v.id, title: v.title }));
    console.log('Original array:', originalArray.map((v, i) => `${i}: ${v.title} (${v.id})`));

    // Get the video being moved
    const movingVideo = videoLibrary[fromIndex];
    console.log(`Moving video: ${movingVideo.title} (ID: ${movingVideo.id})`);

    // *** METHOD 1: Direct DOM manipulation first ***
    const grid = document.getElementById('videoGrid');
    const cards = Array.from(grid.children);
    const movingCard = cards[fromIndex];
    const targetCard = cards[toIndex];

    if (movingCard && targetCard) {
        console.log('🎬 Performing visual animation...');

        // Animate the moving card
        const direction = toIndex > fromIndex ? 'right' : 'left';
        const distance = Math.abs(toIndex - fromIndex);

        movingCard.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        if (direction === 'right') {
            movingCard.style.transform = `translateX(${distance * 100}%) scale(1.05)`;
        } else {
            movingCard.style.transform = `translateX(-${distance * 100}%) scale(1.05)`;
        }

        // Wait for animation to complete, then directly move DOM elements
        setTimeout(() => {
            console.log('🔧 Directly manipulating DOM...');

            // Remove the moving card from DOM
            movingCard.remove();

            // Insert it at the new position
            if (toIndex >= cards.length - 1) {
                // Insert at the end
                grid.appendChild(movingCard);
            } else {
                // Insert before the target position
                const referenceCard = cards[toIndex];
                if (fromIndex < toIndex) {
                    // Moving right: insert after the target
                    grid.insertBefore(movingCard, referenceCard.nextSibling);
                } else {
                    // Moving left: insert before the target
                    grid.insertBefore(movingCard, referenceCard);
                }
            }

            // Reset transform
            movingCard.style.transform = '';
            movingCard.style.transition = '';

            // Now update the data array to match the DOM
            console.log('📊 Updating data array...');

            // Create new array in the correct order by reading DOM
            const newVideoLibrary = [];
            const updatedCards = Array.from(grid.children);

            updatedCards.forEach((card, index) => {
                const videoId = parseInt(card.dataset.videoId);
                const video = videoLibrary.find(v => v.id === videoId);
                if (video) {
                    newVideoLibrary.push(video);
                    // Update the card's data-index
                    card.dataset.index = index;
                }
            });

            // Replace the global array
            videoLibrary.length = 0;
            videoLibrary.push(...newVideoLibrary);

            // Verify the change
            const newArray = videoLibrary.map(v => ({ id: v.id, title: v.title }));
            console.log('New array:', newArray.map((v, i) => `${i}: ${v.title} (${v.id})`));

            // Check if actually changed
            const arrayChanged = JSON.stringify(originalArray) !== JSON.stringify(newArray);
            console.log(arrayChanged ? '✅ Array successfully changed' : '❌ Array did not change');

            // Update move indicators
            updateMoveIndicators();

            // Restore move mode
            setTimeout(() => {
                if (selectedVideoId) {
                    const selectedCard = document.querySelector(`[data-video-id="${selectedVideoId}"]`);
                    if (selectedCard) {
                        selectedCard.classList.add('moving');
                        console.log(`✅ Move mode restored for video ID ${selectedVideoId}`);
                    }
                }
            }, 50);

        }, 400); // Wait for animation
    } else {
        console.error('❌ Could not find cards for DOM manipulation');
    }
}

function moveVideoToPositionFallback(fromIndex, toIndex) {
    console.log('=== FALLBACK ARRAY METHOD ===');

    // Force clear any cached references
    window.videoLibraryCache = null;

    // Create completely new array
    const newArray = [];

    // Copy all videos to new array
    for (let i = 0; i < videoLibrary.length; i++) {
        newArray.push({
            id: videoLibrary[i].id,
            title: videoLibrary[i].title,
            duration: videoLibrary[i].duration,
            type: videoLibrary[i].type,
            url: videoLibrary[i].url,
            thumbnail: videoLibrary[i].thumbnail,
            subtitles: videoLibrary[i].subtitles ? [...videoLibrary[i].subtitles] : null
        });
    }

    // Perform the move on new array
    const itemToMove = newArray.splice(fromIndex, 1)[0];
    newArray.splice(toIndex, 0, itemToMove);

    // Replace global array completely
    videoLibrary.splice(0, videoLibrary.length, ...newArray);

    console.log('Fallback array after move:');
    videoLibrary.forEach((v, i) => console.log(`  ${i}: ${v.title} (${v.id})`));

    // Force reload UI
    setTimeout(() => {
        loadLibrary();

        setTimeout(() => {
            if (selectedVideoId) {
                const selectedCard = document.querySelector(`[data-video-id="${selectedVideoId}"]`);
                if (selectedCard) {
                    selectedCard.classList.add('moving');
                    updateMoveIndicators();
                }
            }
        }, 50);
    }, 100);
}

function testBothMethods() {
    console.log('=== TESTING BOTH MOVE METHODS ===');

    if (videoLibrary.length < 3) {
        console.log('Need at least 3 videos to test');
        return;
    }

    const originalOrder = videoLibrary.map(v => v.id);
    console.log('Original order:', originalOrder);

    // Test method 1: Direct DOM manipulation
    console.log('Testing direct DOM method...');
    moveVideoToPosition(0, 1);

    setTimeout(() => {
        const afterMethod1 = videoLibrary.map(v => v.id);
        console.log('After DOM method:', afterMethod1);

        // Test method 2: Array manipulation
        console.log('Testing fallback array method...');
        moveVideoToPositionFallback(1, 0);

        setTimeout(() => {
            const afterMethod2 = videoLibrary.map(v => v.id);
            console.log('After array method:', afterMethod2);

            if (JSON.stringify(afterMethod2) === JSON.stringify(originalOrder)) {
                console.log('✅ Both methods work - back to original order');
            } else {
                console.log('❌ Methods have issues');
            }
        }, 500);
    }, 500);
}

function forceRefreshGrid() {
    console.log('🔄 FORCE REFRESHING GRID');

    // Clear the grid completely
    const grid = document.getElementById('videoGrid');
    const originalHTML = grid.innerHTML;

    grid.innerHTML = '';

    // Force a reflow
    grid.offsetHeight;

    // Reload the library
    loadLibrary();

    // Force another reflow
    grid.offsetHeight;

    console.log('✅ Grid force refresh complete');
}

function debugArrayVsDOM() {
    console.log('=== ARRAY VS DOM COMPARISON ===');

    console.log('Array order:');
    videoLibrary.forEach((video, index) => {
        console.log(`  Array[${index}]: ${video.title} (ID: ${video.id})`);
    });

    console.log('DOM order:');
    const cards = document.querySelectorAll('.video-card');
    cards.forEach((card, index) => {
        const videoId = card.dataset.videoId;
        const title = card.dataset.title;
        console.log(`  DOM[${index}]: ${title} (ID: ${videoId})`);
    });

    // Check for mismatches
    let mismatches = 0;
    cards.forEach((card, index) => {
        const domVideoId = parseInt(card.dataset.videoId);
        const arrayVideo = videoLibrary[index];

        if (!arrayVideo || domVideoId !== arrayVideo.id) {
            console.error(`❌ MISMATCH at index ${index}:`);
            console.error(`  DOM: ID ${domVideoId}`);
            console.error(`  Array: ID ${arrayVideo ? arrayVideo.id : 'undefined'}`);
            mismatches++;
        }
    });

    if (mismatches === 0) {
        console.log('✅ Array and DOM are in sync');
    } else {
        console.error(`❌ Found ${mismatches} mismatches between array and DOM`);
    }

    console.log('=== END COMPARISON ===');
}

// Delete Video and Notification System
function deleteVideo() {
    if (!selectedVideoId) {
        console.error('No video selected for deletion');
        return;
    }

    const video = videoLibrary.find(v => v.id === selectedVideoId);
    if (!video) {
        console.error('Video not found for deletion:', selectedVideoId);
        return;
    }

    deletedVideo = { ...video };

    if (isMiniPlayerMode && currentVideo && currentVideo.id === selectedVideoId) {
        closeMiniPlayer();
    }

    videoLibrary = videoLibrary.filter(v => v.id !== selectedVideoId);
    delete progressData[selectedVideoId];
    saveProgressData();

    hideContextMenu();
    loadLibrary();
    updateVideoCount();

    showNotification(video.title);
    console.log('Video deleted:', video.title);
}

function showNotification(title) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    const timerFill = document.getElementById('timerFill');

    notificationText.textContent = `"${title}" was deleted`;
    notification.classList.add('show');

    setTimeout(() => {
        timerFill.style.width = '100%';
    }, 100);

    notificationTimeout = setTimeout(() => {
        hideNotification();
        deletedVideo = null;
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    const timerFill = document.getElementById('timerFill');

    notification.classList.remove('show');
    timerFill.style.width = '0%';

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
}

function undoDelete() {
    if (deletedVideo) {
        videoLibrary.push(deletedVideo);
        loadLibrary();
        updateVideoCount();
        hideNotification();
        deletedVideo = null;
        console.log('Deletion undone');
    }
}

// Playback Mode Functions
function togglePlaybackMode() {
    const modes = ['normal', 'loop', 'shuffle', 'disabled'];
    const currentIndex = modes.indexOf(playbackMode);
    playbackMode = modes[(currentIndex + 1) % modes.length];

    console.log('Switching to mode:', playbackMode);

    updatePlaybackModeUI();
    showActionFeedback('repeat', getPlaybackModeText());
}

function updatePlaybackModeUI() {
    const btn = document.getElementById('playbackModeBtn');
    if (!btn) {
        console.error('Playback mode button not found!');
        return;
    }

    const icon = btn.querySelector('.material-icons');
    if (!icon) {
        console.error('Playback mode icon not found!');
        return;
    }

    btn.classList.remove('normal', 'loop', 'shuffle', 'disabled');

    switch(playbackMode) {
        case 'normal':
            icon.textContent = 'playlist_play';
            btn.classList.add('normal');
            break;
        case 'loop':
            icon.textContent = 'repeat_one';
            btn.classList.add('loop');
            break;
        case 'shuffle':
            icon.textContent = 'shuffle';
            btn.classList.add('shuffle');
            break;
        case 'disabled':
            icon.textContent = 'block';
            btn.classList.add('disabled');
            break;
    }

    console.log('Updated UI - Mode:', playbackMode, 'Icon:', icon.textContent, 'Classes:', btn.className);
}

function getPlaybackModeText() {
    switch(playbackMode) {
        case 'normal': return 'Normal Playback';
        case 'loop': return 'Loop Video';
        case 'shuffle': return 'Shuffle Mode';
        case 'disabled': return 'Auto-play Disabled';
        default: return 'Normal Playback';
    }
}

function setupPlaybackModeButton() {
    const playbackModeBtn = document.getElementById('playbackModeBtn');
    if (playbackModeBtn) {
        playbackModeBtn.removeEventListener('click', togglePlaybackMode);
        playbackModeBtn.addEventListener('click', togglePlaybackMode);
        console.log('Playback mode button setup complete');
    } else {
        console.error('Playback mode button not found during setup');
    }
}

// Video Player Functions
function playVideo(videoId) {
    currentVideo = videoLibrary.find(v => v.id === videoId);
    if (!currentVideo) {
        console.error('Video not found:', videoId);
        return;
    }

    checkForSavedSubtitles(currentVideo);

    console.log('Playing video:', currentVideo.title);
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('playerPage').style.display = 'block';
    document.getElementById('currentVideoTitle').textContent = currentVideo.title;

    const playerContainer = document.getElementById('playerContainer');
    if (currentVideo.thumbnail) {
        playerContainer.style.backgroundImage = `url(${currentVideo.thumbnail})`;
    } else {
        playerContainer.style.backgroundImage = 'none';
    }

    document.getElementById('loadingOverlay').classList.remove('hidden');

    const player = document.getElementById('mainVideoPlayer');
    player.src = currentVideo.url;
    player.load();

    const progress = progressData[currentVideo.id];
    if (progress && progress.currentTime > 5) {
        player.addEventListener('loadedmetadata', function() {
            console.log('Restoring video progress:', progress.currentTime);
            player.currentTime = progress.currentTime;
        }, { once: true });
    }

    document.getElementById('centerPlayBtn').classList.remove('hidden');
    loadAvailableSubtitles();
    isMiniPlayerMode = false;
    initializeVolumeControl(); // Initialize volume control when playing a new video
}

// Adaptive Volume Control with Background Detection
function detectVideoBackgroundBrightness() {
    const video = document.getElementById('mainVideoPlayer');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 100;
    canvas.height = 100;

    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            totalBrightness += brightness;
            pixelCount++;
        }

        const averageBrightness = totalBrightness / pixelCount;
        return averageBrightness > 128;
    } catch (error) {
        console.log('Could not analyze video brightness:', error);
        return false;
    }
}

function updateVolumeContainerBackground() {
    const volumeContainer = document.getElementById('volumeSliderContainer');
    if (!volumeContainer) return;

    const isLightBackground = detectVideoBackgroundBrightness();

    if (isLightBackground) {
        volumeContainer.classList.add('light-bg');
    } else {
        volumeContainer.classList.remove('light-bg');
    }
}

function updateVolumeIcon() {
    const player = document.getElementById('mainVideoPlayer');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeNumber = document.getElementById('volumeNumber');
    const volumeProgressFill = document.getElementById('volumeProgressFill');
    const volumeThumb = document.getElementById('volumeThumb');

    const currentVolume = player.muted ? 0 : Math.round(player.volume * 100);

    if (volumeSlider) volumeSlider.value = currentVolume;
    if (volumeNumber) volumeNumber.textContent = currentVolume;

    if (volumeProgressFill) {
        volumeProgressFill.style.height = currentVolume + '%';
    }

    if (volumeThumb) {
        const thumbPosition = 100 - currentVolume;
        volumeThumb.style.top = thumbPosition + '%';
    }

    if (muteBtn) {
        const iconElement = muteBtn.querySelector('.material-icons');
        if (iconElement) {
            if (player.muted || player.volume === 0) {
                iconElement.textContent = 'volume_off';
                muteBtn.style.color = 'var(--disabled-color)';
            } else if (player.volume < 0.3) {
                iconElement.textContent = 'volume_down';
                muteBtn.style.color = 'var(--text-primary)';
            } else if (player.volume < 0.7) {
                iconElement.textContent = 'volume_up';
                muteBtn.style.color = 'var(--text-primary)';
            } else {
                iconElement.textContent = 'volume_up';
                muteBtn.style.color = 'var(--secondary)';
            }
        }
    }

    updateVolumeContainerBackground();
}

function setupVolumeSlider() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeBtn = document.getElementById('muteBtn');
    const volumeSliderContainer = document.getElementById('volumeSliderContainer');
    const player = document.getElementById('mainVideoPlayer');

    if (!volumeSlider || !volumeBtn || !volumeSliderContainer || !player) {
        console.warn('Volume control elements not found');
        return;
    }

    volumeSlider.addEventListener('input', function() {
        const volume = volumeSlider.value / 100;
        player.volume = volume;
        player.muted = false;
        updateVolumeIcon();
        console.log('Volume changed to:', volume);
    });

    volumeBtn.addEventListener('mouseenter', function() {
        clearTimeout(volumeSliderTimeout);
        volumeSliderContainer.classList.add('show');
        updateVolumeContainerBackground();
    });

    volumeBtn.addEventListener('mouseleave', function() {
        volumeSliderTimeout = setTimeout(() => {
            if (!volumeSliderContainer.matches(':hover')) {
                volumeSliderContainer.classList.remove('show');
            }
        }, 200);
    });

    volumeSliderContainer.addEventListener('mouseenter', function() {
        clearTimeout(volumeSliderTimeout);
    });

    volumeSliderContainer.addEventListener('mouseleave', function() {
        volumeSliderTimeout = setTimeout(() => {
            volumeSliderContainer.classList.remove('show');
        }, 200);
    });

    volumeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMute();
    });

    player.addEventListener('timeupdate', function() {
        if (Math.floor(player.currentTime) % 2 === 0) {
            updateVolumeContainerBackground();
        }
    });

    updateVolumeIcon();
}

function toggleMute() {
    const player = document.getElementById('mainVideoPlayer');
    if (!player) return;

    player.muted = !player.muted;
    updateVolumeIcon();
    showActionFeedback(player.muted ? 'volume_off' : 'volume_up', player.muted ? 'Muted' : 'Unmuted');
    console.log('Mute toggled:', player.muted);
}

function initializeVolumeControl() {
    setupVolumeSlider();
}

function setupVideoPlayer() {
    console.log('Setting up video player');
    const player = document.getElementById('mainVideoPlayer');
    const progressBar = document.getElementById('progressBar');
    const progressFilled = document.getElementById('progressFilled');
    const progressHover = document.getElementById('progressHover');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const centerPlayBtn = document.getElementById('centerPlayBtn');
    const playerContainer = document.getElementById('playerContainer');
    const customControls = document.getElementById('customControls');
    const playerHeader = document.getElementById('playerHeader');

    player.addEventListener('loadedmetadata', function() {
        console.log('Video metadata loaded, duration:', player.duration);
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('timeInfo').textContent = `0:00 / ${formatDuration(player.duration)}`;
        if (currentVideo) {
            progressData[currentVideo.id] = progressData[currentVideo.id] || { currentTime: 0, duration: player.duration };
            saveProgressData();
        }
        // Smart Skip integration
        if (window.smartSkipFunctions) {
            window.smartSkipFunctions.onVideoLoaded();
        }
    });

    player.addEventListener('timeupdate', function() {
        const currentTime = player.currentTime;
        const duration = player.duration || 0;
        const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

        progressFilled.style.width = `${progressPercent}%`;
        document.getElementById('timeInfo').textContent = `${formatDuration(currentTime)} / ${formatDuration(duration)}`;

        if (currentVideo) {
            progressData[currentVideo.id] = { currentTime, duration };
            saveProgressData();
        }

        updateSubtitles(currentTime);
    });

    player.addEventListener('play', function() {
        console.log('Video playing');
        playPauseBtn.innerHTML = '<span class="material-icons">pause</span>';
        centerPlayBtn.classList.add('hidden');
        document.getElementById('miniPlayBtn').innerHTML = '<span class="material-icons">pause</span>';
        document.getElementById('miniArtwork').classList.add('spinning');
        showActionFeedback('play_arrow', 'Playing');
        requestAnimationFrame(trackPerformance);
        // Smart Skip integration
        if (window.smartSkipFunctions) {
            window.smartSkipFunctions.onVideoPlay();
        }
    });

    player.addEventListener('pause', function() {
        console.log('Video paused');
        playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        centerPlayBtn.classList.remove('hidden');
        document.getElementById('miniPlayBtn').innerHTML = '<span class="material-icons">play_arrow</span>';
        document.getElementById('miniArtwork').classList.remove('spinning');
        showActionFeedback('pause', 'Paused');
         // Smart Skip integration
        if (window.smartSkipFunctions) {
            window.smartSkipFunctions.onVideoPause();
        }
    });

    player.addEventListener('ended', function() {
        console.log('Video ended, handling next action');
        handleVideoEnd();
         // Smart Skip integration
        if (window.smartSkipFunctions) {
            window.smartSkipFunctions.onVideoEnded();
        }
    });

    player.addEventListener('error', function(e) {
        console.error('Video error:', e);
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.innerHTML = `
            <div style="text-align: center; color: var(--text-primary);">
                <span class="material-icons" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">error</span>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">Error loading video</div>
                <div style="font-size: 0.9rem; opacity: 0.7;">The video file could not be loaded</div>
            </div>
        `;
        loadingOverlay.classList.remove('hidden');
    });

    player.addEventListener('dblclick', function() {
        toggleFullscreen();
    });

    player.addEventListener('click', function() {
        togglePlayPause();
    });

    player.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    progressBar.addEventListener('click', function(e) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        player.currentTime = pos * player.duration;
        console.log('Progress bar clicked, new time:', player.currentTime);
    });

    progressBar.addEventListener('mousemove', function(e) {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const time = pos * player.duration;
        progressHover.style.left = `${e.clientX - rect.left}px`;
        progressHover.textContent = formatDuration(time);
        progressHover.classList.add('show');
    });

    progressBar.addEventListener('mouseleave', function() {
        progressHover.classList.remove('show');
    });

    playPauseBtn.addEventListener('click', function() {
        togglePlayPause();
    });

    centerPlayBtn.addEventListener('click', function() {
        togglePlayPause();
    });

    playerContainer.addEventListener('mousemove', function(e) {
        cursorMoving = true;
        lastMousePosition = { x: e.clientX, y: e.clientY };
        playerContainer.classList.add('show-cursor');
        customControls.classList.add('show');
        playerHeader.classList.add('show');

        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(() => {
            if (!cursorMoving && !player.paused && !document.getElementById('volumeSliderContainer').classList.contains('show')) {
                playerContainer.classList.remove('show-cursor');
                customControls.classList.remove('show');
                playerHeader.classList.remove('show');
            }
        }, 3000);
    });

    playerContainer.addEventListener('mouseleave', function() {
        cursorMoving = false;
        playerContainer.classList.remove('show-cursor');
        customControls.classList.remove('show');
        playerHeader.classList.remove('show');
    });

    playerContainer.addEventListener('mousemove', function(e) {
        if (Math.abs(e.clientX - lastMousePosition.x) > 5 || Math.abs(e.clientY - lastMousePosition.y) > 5) {
            cursorMoving = true;
        } else {
            cursorMoving = false;
        }
    });

    initializeVolumeControl();
}

function togglePlayPause() {
    const player = document.getElementById('mainVideoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const centerPlayBtn = document.getElementById('centerPlayBtn');

    if (player.paused) {
        console.log('▶️ Playing video');
        player.play();

        // Update full player UI
        if (playPauseBtn) playPauseBtn.innerHTML = '<span class="material-icons">pause</span>';
        if (centerPlayBtn) centerPlayBtn.classList.add('hidden');

        // Update mini player UI if active
        if (isMiniPlayerMode) {
            const miniPlayBtn = document.getElementById('miniPlayBtn');
            const miniArtwork = document.getElementById('miniArtwork');
            if (miniPlayBtn) miniPlayBtn.innerHTML = '<span class="material-icons">pause</span>';
            if (miniArtwork) miniArtwork.classList.add('spinning');
        }
    } else {
        console.log('⏸️ Pausing video');
        player.pause();

        // Update full player UI
        if (playPauseBtn) playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        if (centerPlayBtn) centerPlayBtn.classList.remove('hidden');

        // Update mini player UI if active
        if (isMiniPlayerMode) {
            const miniPlayBtn = document.getElementById('miniPlayBtn');
            const miniArtwork = document.getElementById('miniArtwork');
            if (miniPlayBtn) miniPlayBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
            if (miniArtwork) miniArtwork.classList.remove('spinning');
        }
    }
}

function debugAudioState(action) {
    const player = document.getElementById('mainVideoPlayer');
    console.log(`=== AUDIO DEBUG: ${action} ===`);
    console.log('Current time:', player.currentTime);
    console.log('Duration:', player.duration);
    console.log('Paused:', player.paused);
    console.log('Volume:', player.volume);
    console.log('Muted:', player.muted);
    console.log('Source:', player.src);
    console.log('Ready state:', player.readyState);
    console.log('Network state:', player.networkState);
    console.log('=== END AUDIO DEBUG ===');
}

function skip(seconds) {
    const player = document.getElementById('mainVideoPlayer');
    player.currentTime += seconds;
    showActionFeedback(seconds > 0 ? 'forward_10' : 'replay_10', `${seconds > 0 ? '+' : '-'}${Math.abs(seconds)}s`);
    console.log('Skipped', seconds, 'seconds');
}

function handleVideoEnd() {
    const player = document.getElementById('mainVideoPlayer');

    console.log('Handling video end, playback mode:', playbackMode);

    if (isMiniPlayerMode) {
        console.log('Triggering mini player effect for mode:', playbackMode);
        showMiniPlayerEffect(playbackMode);
    }

    if (playbackMode === 'loop') {
        player.currentTime = 0;
        player.play();
    } else if (playbackMode === 'shuffle') {
        const nextVideo = videoLibrary[Math.floor(Math.random() * videoLibrary.length)];
        if (isMiniPlayerMode) {
            switchVideoInMiniPlayer(nextVideo.id, true);
        } else {
            playVideo(nextVideo.id);
            player.play();
        }
    } else if (playbackMode === 'normal') {
        const currentIndex = videoLibrary.findIndex(v => v.id === currentVideo.id);
        if (currentIndex < videoLibrary.length - 1) {
            const nextVideo = videoLibrary[currentIndex + 1];
            if (isMiniPlayerMode) {
                switchVideoInMiniPlayer(nextVideo.id, true);
            } else {
                playVideo(nextVideo.id);
                player.play();
            }
        }
    }
}

function toggleFullscreen() {
    const playerContainer = document.getElementById('playerContainer');
    if (!document.fullscreenElement) {
        playerContainer.requestFullscreen().catch(err => {
            console.error(`Error enabling fullscreen: ${err.message}`);
        });
        showActionFeedback('fullscreen', 'Fullscreen');
    } else {
        document.exitFullscreen();
        showActionFeedback('fullscreen_exit', 'Exit Fullscreen');
    }
}

function goBack() {
    console.log('Going back to main page');
    const player = document.getElementById('mainVideoPlayer');

    if (document.fullscreenElement) {
        document.exitFullscreen();
    }

    if (currentVideo && player.duration && player.currentTime) {
        progressData[currentVideo.id] = {
            currentTime: player.currentTime,
            duration: player.duration
        };
        saveProgressData();
    }

    player.pause();
    document.getElementById('playerPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    currentVideo = null;
    hideSubtitleModal();
}

// Mini Player Functions
function enableMiniPlayer() {
    if (!currentVideo) {
        console.error('No current video to enable mini player');
        showActionFeedback('error', 'No video to minimize');
        return;
    }

    console.log('🖥️→📱 Enabling mini player (seamless)');

    // *** CRITICAL: Don't touch the video element at all - just change UI ***
    const player = document.getElementById('mainVideoPlayer');

    // Set mini player mode flag first
    isMiniPlayerMode = true;

    // Get UI elements
    const miniPlayer = document.getElementById('miniPlayer');
    const miniArtwork = document.getElementById('miniArtwork');
    const miniTitle = document.getElementById('miniTitle');
    const miniPlayBtn = document.getElementById('miniPlayBtn');

    // Set mini player content
    miniTitle.textContent = currentVideo.title;

    if (currentVideo.thumbnail) {
        miniArtwork.innerHTML = `<img src="${currentVideo.thumbnail}" alt="${currentVideo.title}">`;
    } else {
        miniArtwork.innerHTML = '<span class="material-icons">movie</span>';
    }

    // Hide full player and show mini player
    document.getElementById('playerPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('mainPage').classList.add('with-mini-player');
    miniPlayer.classList.add('show');

    // *** NO VIDEO STATE CHANGES - just sync UI to match current video state ***
    setTimeout(() => {
        // Sync mini player UI with actual video state
        if (player.paused) {
            miniPlayBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
            miniArtwork.classList.remove('spinning');
        } else {
            miniPlayBtn.innerHTML = '<span class="material-icons">pause</span>';
            miniArtwork.classList.add('spinning');
        }

        // Start mini player updates
        updateMiniPlayerProgress();
        startMiniPlayerUpdates();
        updateMiniInfo();
    }, 10);

    console.log('✅ Mini player enabled seamlessly - no audio interruption');
}

function switchVideoInMiniPlayer(newVideoId, shouldAutoPlay = false) {
    console.log('Switching video in mini player:', newVideoId, 'Auto-play:', shouldAutoPlay);
    const currentPlayer = document.getElementById('mainVideoPlayer');

    if (currentVideo && currentPlayer.duration && currentPlayer.currentTime) {
        progressData[currentVideo.id] = {
            currentTime: currentPlayer.currentTime,
            duration: currentPlayer.duration
        };
        saveProgressData();
    }

    currentVideo = videoLibrary.find(v => v.id === newVideoId);
    if (!currentVideo) {
        console.error('Video not found:', newVideoId);
        return;
    }

    document.getElementById('miniTitle').textContent = currentVideo.title;
    const miniArtwork = document.getElementById('miniArtwork');

    if (currentVideo.thumbnail) {
        miniArtwork.innerHTML = `<img src="${currentVideo.thumbnail}" alt="${currentVideo.title}">`;
    } else {
        miniArtwork.innerHTML = '<span class="material-icons">movie</span>';
    }

    currentPlayer.src = currentVideo.url;
    currentPlayer.load();

    const progress = progressData[currentVideo.id];
    if (progress && progress.currentTime > 5) {
        currentPlayer.addEventListener('loadedmetadata', function() {
            console.log('Restoring progress time:', progress.currentTime);
            currentPlayer.currentTime = progress.currentTime;
            if (shouldAutoPlay) {
                currentPlayer.play();
            }
        }, { once: true });
    } else if (shouldAutoPlay) {
        currentPlayer.addEventListener('canplay', function() {
            console.log('Starting playback for new video');
            currentPlayer.play();
        }, { once: true });
    }

    loadAvailableSubtitles();
    updateMiniInfo();
}

function closeMiniPlayer() {
    console.log('Closing mini player');
    const player = document.getElementById('mainVideoPlayer');
    if (currentVideo && player.duration && player.currentTime) {
        progressData[currentVideo.id] = {
            currentTime: player.currentTime,
            duration: player.duration
        };
        saveProgressData();
    }

    player.pause();
    player.src = '';
    currentVideo = null;
    isMiniPlayerMode = false;

    document.getElementById('miniPlayer').classList.remove('show');
    document.getElementById('mainPage').classList.remove('with-mini-player');
    document.getElementById('miniArtwork').classList.remove('spinning');
    stopMiniPlayerUpdates();
    hideMiniInfo();
}

// function expandMiniPlayer() {
//     if (!currentVideo) {
//         console.error('No current video to expand mini player');
//         return;
//     }

//     console.log('Expanding mini player to full player');
//     const player = document.getElementById('mainVideoPlayer');

//     // Store current state to prevent interruption
//     const playerState = {
//         currentTime: player.currentTime,
//         paused: player.paused,
//         volume: player.volume,
//         muted: player.muted,
//         src: player.src
//     };

//     // Hide mini player and show full player
//     document.getElementById('miniPlayer').classList.remove('show');
//     document.getElementById('mainPage').classList.remove('with-mini-player');
//     document.getElementById('mainPage').style.display = 'none';
//     document.getElementById('playerPage').style.display = 'block';

//     // Set up the player page
//     document.getElementById('currentVideoTitle').textContent = currentVideo.title;
//     const playerContainer = document.getElementById('playerContainer');
//     if (currentVideo.thumbnail) {
//         playerContainer.style.backgroundImage = `url(${currentVideo.thumbnail})`;
//     } else {
//         playerContainer.style.backgroundImage = 'none';
//     }

//     // Ensure the video source is correct and restore state
//     if (player.src !== playerState.src) {
//         player.src = playerState.src;
//         player.load();

//         player.addEventListener('loadedmetadata', function restoreState() {
//             player.currentTime = playerState.currentTime;
//             player.volume = playerState.volume;
//             player.muted = playerState.muted;

//             if (!playerState.paused) {
//                 player.play();
//             }

//             updateVolumeIcon();
//             player.removeEventListener('loadedmetadata', restoreState);
//         }, { once: true });
//     } else {
//         // If source is the same, just restore state
//         setTimeout(() => {
//             player.currentTime = playerState.currentTime;
//             player.volume = playerState.volume;
//             player.muted = playerState.muted;

//             if (!playerState.paused) {
//                 player.play();
//             }

//             updateVolumeIcon();
//         }, 50);
//     }

//     stopMiniPlayerUpdates();
//     hideDragBlurOverlay(); // Ensure drag overlay is hidden
//     isMiniPlayerMode = false;

//     console.log('Mini player expanded successfully');
// }

function expandMiniPlayer() {
    if (!currentVideo) {
        console.error('No current video to expand mini player');
        showActionFeedback('error', 'No video to expand');
        return;
    }

    console.log('📱→🖥️ Expanding mini player to full player (seamless)');

    // *** CRITICAL: Don't touch the video element at all - just change UI ***
    const player = document.getElementById('mainVideoPlayer');

    // Hide mini player instantly
    document.getElementById('miniPlayer').classList.remove('show');
    document.getElementById('mainPage').classList.remove('with-mini-player');
    document.getElementById('mainPage').style.display = 'none';

    // Show full player instantly
    document.getElementById('playerPage').style.display = 'block';

    // Set up the player page UI (but don't touch video element)
    document.getElementById('currentVideoTitle').textContent = currentVideo.title;
    const playerContainer = document.getElementById('playerContainer');
    if (currentVideo.thumbnail) {
        playerContainer.style.backgroundImage = `url(${currentVideo.thumbnail})`;
    } else {
        playerContainer.style.backgroundImage = 'none';
    }

    // *** NO VIDEO SOURCE CHANGES - just sync UI state ***
    setTimeout(() => {
        // Update volume UI to match current state
        updateVolumeIcon();

        // Update play/pause button to match current state
        const playPauseBtn = document.getElementById('playPauseBtn');
        const centerPlayBtn = document.getElementById('centerPlayBtn');

        if (player.paused) {
            if (playPauseBtn) playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
            if (centerPlayBtn) centerPlayBtn.classList.remove('hidden');
        } else {
            if (playPauseBtn) playPauseBtn.innerHTML = '<span class="material-icons">pause</span>';
            if (centerPlayBtn) centerPlayBtn.classList.add('hidden');
        }

        // Update time display
        const timeInfo = document.getElementById('timeInfo');
        if (timeInfo && player.duration) {
            timeInfo.textContent = `${formatDuration(player.currentTime)} / ${formatDuration(player.duration)}`;
        }

        // Update progress bar
        const progressFilled = document.getElementById('progressFilled');
        if (progressFilled && player.duration) {
            const progressPercent = (player.currentTime / player.duration) * 100;
            progressFilled.style.width = `${progressPercent}%`;
        }
    }, 10);

    // Clean up mini player state
    stopMiniPlayerUpdates();
    hideDragBlurOverlay();
    isMiniPlayerMode = false;

    console.log('✅ Mini player expanded seamlessly - no audio interruption');
}

function toggleMiniPlay() {
    console.log('🎵 Toggling mini player play/pause');
    const player = document.getElementById('mainVideoPlayer');
    const playBtn = document.getElementById('miniPlayBtn');
    const miniArtwork = document.getElementById('miniArtwork');

    if (player.paused) {
        player.play();
        playBtn.innerHTML = '<span class="material-icons">pause</span>';
        miniArtwork.classList.add('spinning');
        showActionFeedback('play_arrow', 'Playing');
    } else {
        player.pause();
        playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        miniArtwork.classList.remove('spinning');
        showActionFeedback('pause', 'Paused');
    }
}

function startMiniPlayerUpdates() {
    console.log('Starting mini player updates');
    stopMiniPlayerUpdates();
    miniPlayerUpdateInterval = setInterval(updateMiniPlayerProgress, 1000);
}

function stopMiniPlayerUpdates() {
    if (miniPlayerUpdateInterval) {
        console.log('Stopping mini player updates');
        clearInterval(miniPlayerUpdateInterval);
        miniPlayerUpdateInterval = null;
    }
}

function updateMiniPlayerProgress() {
    const player = document.getElementById('mainVideoPlayer');
    if (!player || !currentVideo) {
        console.error('No player or current video for mini player update');
        return;
    }

    const currentTime = player.currentTime;
    const duration = player.duration || 0;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    document.getElementById('miniProgressFill').style.width = `${progressPercent}%`;
    document.getElementById('miniTime').textContent = `${formatDuration(currentTime)} / ${formatDuration(duration)}`;
    updateMiniInfo();
}

function updateMiniInfo() {
    if (!currentVideo) {
        console.error('No current video for mini info update');
        return;
    }

    console.log('Updating mini info for:', currentVideo.title);
    const player = document.getElementById('mainVideoPlayer');
    const miniInfoTitle = document.getElementById('miniInfoTitle');
    const miniInfoType = document.getElementById('miniInfoType');
    const miniInfoDuration = document.getElementById('miniInfoDuration');
    const miniInfoProgress = document.getElementById('miniInfoProgress');
    const miniInfoArtwork = document.getElementById('miniInfoArtwork');

    miniInfoTitle.textContent = currentVideo.title;
    miniInfoType.textContent = currentVideo.type;
    miniInfoDuration.textContent = formatDuration(player.duration || 0);
    const progressPercent = player.duration > 0 ? Math.round((player.currentTime / player.duration) * 100) : 0;
    miniInfoProgress.textContent = `${progressPercent}%`;

    if (currentVideo.thumbnail) {
        miniInfoArtwork.innerHTML = `<img src="${currentVideo.thumbnail}" alt="${currentVideo.title}">`;
    } else {
        miniInfoArtwork.innerHTML = '<span class="material-icons">movie</span>';
    }
}

function toggleMiniInfo() {
    console.log('Toggling mini info modal');
    const modal = document.getElementById('miniInfoModal');
    if (modal.classList.contains('show')) {
        hideMiniInfo();
    } else {
        modal.classList.add('show');
        updateMiniInfo();
    }
}

function hideMiniInfo() {
    console.log('Hiding mini info modal');
    document.getElementById('miniInfoModal').classList.remove('show');
}

// Enhanced subtitle loading with full format support
function loadAvailableSubtitles() {
    console.log('🎬 Loading subtitles with comprehensive format support...');
    const subtitleOptions = document.getElementById('subtitleOptions');
    subtitleOptions.innerHTML = `
        <div class="subtitle-option active" onclick="selectSubtitle(null)">
            <span class="subtitle-option-text">Off</span>
            <span class="subtitle-check material-icons">check</span>
        </div>
    `;
    currentSubtitles = [];
    currentSubtitleTrack = null;

    if (currentVideo && currentVideo.subtitles) {
        console.log(`📂 Loading ${currentVideo.subtitles.length} subtitle tracks`);

        currentVideo.subtitles.forEach((sub, index) => {
            console.log(`📝 Loading ${sub.language} from ${sub.url}`);

            const option = document.createElement('div');
            option.className = 'subtitle-option';
            option.innerHTML = `
                <span class="subtitle-option-text">${sub.language}</span>
                <span class="subtitle-check material-icons hidden">check</span>
            `;
            option.onclick = () => selectSubtitle(sub);
            subtitleOptions.appendChild(option);

            fetch(sub.url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.text();
                })
                .then(data => {
                    console.log(`📄 Processing ${sub.language} (${data.length} chars)`);

                    const parsed = parseSRT(data);
                    console.log(`✅ ${sub.language}: ${parsed.length} entries parsed`);

                    if (parsed.length === 0) {
                        throw new Error('No valid subtitle entries found');
                    }

                    currentSubtitles.push({
                        language: sub.language,
                        entries: parsed,
                        stats: validateSubtitles(parsed)
                    });

                    showActionFeedback('subtitles', `${sub.language} loaded (${parsed.length} entries)`);

                    // Show format info for formatted subtitles
                    const formattedCount = parsed.filter(e => e.hasFormatting).length;
                    if (formattedCount > 0) {
                        console.log(`🎨 ${sub.language} has ${formattedCount} formatted entries`);
                    }
                })
                .catch(err => {
                    console.error(`❌ Failed to load ${sub.language}:`, err);
                    handleSubtitleError(err, sub.language);
                    option.remove();
                });
        });
    } else {
        console.log('📭 No subtitles available for this video');
    }
}

function applySubtitlePositioning(overlay, position) {
    if (!position) {
        // Reset to default positioning
        overlay.style.left = '50%';
        overlay.style.right = 'auto';
        overlay.style.top = 'auto';
        overlay.style.bottom = '120px';
        overlay.style.transform = 'translateX(-50%)';
        return;
    }

    // Apply custom positioning based on X1, X2, Y1, Y2 values
    const playerContainer = document.getElementById('playerContainer');
    const containerRect = playerContainer.getBoundingClientRect();

    if (position.x1 !== undefined && position.x2 !== undefined) {
        const leftPercent = (position.x1 / containerRect.width) * 100;
        const widthPercent = ((position.x2 - position.x1) / containerRect.width) * 100;

        overlay.style.left = `${leftPercent}%`;
        overlay.style.width = `${widthPercent}%`;
        overlay.style.transform = 'none';
    }

    if (position.y1 !== undefined && position.y2 !== undefined) {
        const topPercent = (position.y1 / containerRect.height) * 100;

        overlay.style.top = `${topPercent}%`;
        overlay.style.bottom = 'auto';
    }
}

function validateSubtitles(entries) {
    let issueCount = 0;
    let overlaps = [];

    for (let i = 0; i < entries.length - 1; i++) {
        const current = entries[i];
        const next = entries[i + 1];

        // Check for overlaps
        if (current.endTime > next.startTime) {
            const overlap = {
                current: current.index,
                next: next.index,
                overlapTime: current.endTime - next.startTime
            };
            overlaps.push(overlap);
            console.warn(`⚠️ Subtitle overlap: ${current.index} → ${next.index} (${overlap.overlapTime.toFixed(2)}s)`);
            issueCount++;
        }

        // Check for very short durations
        if (current.duration < 0.5) {
            console.warn(`⚠️ Very short subtitle: ${current.index} (${current.duration.toFixed(2)}s)`);
        }

        // Check for very long durations
        if (current.duration > 30) {
            console.warn(`⚠️ Very long subtitle: ${current.index} (${current.duration.toFixed(2)}s)`);
        }
    }

    // Summary report
    const formattedCount = entries.filter(e => e.hasFormatting).length;
    const positionedCount = entries.filter(e => e.position).length;

    console.log(`📊 Subtitle Analysis:`);
    console.log(`  • Total entries: ${entries.length}`);
    console.log(`  • With HTML formatting: ${formattedCount}`);
    console.log(`  • With positioning: ${positionedCount}`);
    console.log(`  • Timing issues: ${issueCount}`);
    console.log(`  • Overlaps: ${overlaps.length}`);

    return {
        totalEntries: entries.length,
        formattedEntries: formattedCount,
        positionedEntries: positionedCount,
        issues: issueCount,
        overlaps: overlaps
    };
}


// Enhanced SRT Parser supporting all HTML tags, colors, positioning, and formatting
function parseSRT(data) {
    console.log('🎬 Parsing SRT data with comprehensive format support...');
    const entries = [];

    // Clean up the data first
    const cleanData = data
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\r/g, '\n')    // Handle old Mac line endings
        .replace(/^\uFEFF/, '')  // Remove BOM if present
        .trim();

    // Split by double newlines (subtitle blocks)
    const blocks = cleanData.split(/\n\s*\n/);
    console.log(`📝 Found ${blocks.length} subtitle blocks`);

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i].trim();
        if (!block) continue;

        const lines = block.split('\n');
        if (lines.length < 3) {
            console.warn(`⚠️ Block ${i + 1} has insufficient lines:`, lines.length);
            continue;
        }

        try {
            const entry = parseSubtitleBlock(lines, i + 1);
            if (entry) {
                entries.push(entry);
            }
        } catch (error) {
            console.error(`❌ Error parsing block ${i + 1}:`, error);
            continue;
        }
    }

    console.log(`✅ Successfully parsed ${entries.length} subtitle entries`);

    // Sort by start time and validate
    entries.sort((a, b) => a.startTime - b.startTime);
    validateSubtitles(entries);

    return entries;
}

function parseTime(timeStr) {
    const parts = timeStr.split(':');
    const secondsParts = parts[2].split(',');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]);

    const time = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    return time;
}

function selectSubtitle(subtitle) {
    console.log('Selecting subtitle:', subtitle ? subtitle.language : 'Off');

    if (subtitle) {
        currentSubtitleTrack = currentSubtitles.find(s => s.language === subtitle.language);
        if (!currentSubtitleTrack) {
            console.error('Subtitle track not found:', subtitle.language);
            return;
        }
    } else {
        currentSubtitleTrack = null;
    }

    const subtitleOptions = document.querySelectorAll('.subtitle-option');
    subtitleOptions.forEach(option => {
        const optionText = option.querySelector('.subtitle-option-text').textContent;
        const checkmark = option.querySelector('.subtitle-check');
        if ((subtitle && optionText === subtitle.language) || (!subtitle && optionText === 'Off')) {
            option.classList.add('active');
            checkmark.classList.remove('hidden');
        } else {
            option.classList.remove('active');
            checkmark.classList.add('hidden');
        }
    });

    const player = document.getElementById('mainVideoPlayer');
    if (player) {
        updateSubtitles(player.currentTime);
    }
    hideSubtitleModal();
    showActionFeedback('subtitles', subtitle ? `${subtitle.language} Subtitles` : 'Subtitles Off');
}

function parseSubtitleBlock(lines, blockNumber) {
    // Parse subtitle number
    const indexLine = lines[0].trim();
    const index = parseInt(indexLine);
    if (isNaN(index)) {
        console.warn(`❌ Invalid subtitle index in block ${blockNumber}:`, indexLine);
        return null;
    }

    // Parse timing line with position support
    const timeLine = lines[1].trim();
    const { startTime, endTime, position } = parseTimingLine(timeLine, blockNumber);

    if (startTime === null || endTime === null) {
        return null;
    }

    // Get subtitle text (everything after the timing line)
    let rawText = lines.slice(2).join('\n').trim();

    // Parse and process the text with full HTML support
    const processedText = processSubtitleText(rawText);

    return {
        index,
        startTime,
        endTime,
        duration: endTime - startTime,
        rawText,
        text: processedText.plainText,
        html: processedText.html,
        styles: processedText.styles,
        position: position,
        hasFormatting: processedText.hasFormatting
    };
}

function parseTimingLine(timeLine, blockNumber) {
    // Support both SRT and position formats
    // Examples:
    // 00:00:01,000 --> 00:00:03,000
    // 00:00:01,000 --> 00:00:03,000 X1:40 X2:600 Y1:20 Y2:50

    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})(.*)/);

    if (!timeMatch) {
        console.warn(`❌ Invalid timing format in block ${blockNumber}:`, timeLine);
        return { startTime: null, endTime: null, position: null };
    }

    const startTimeStr = timeMatch[1];
    const endTimeStr = timeMatch[2];
    const positionStr = timeMatch[3] ? timeMatch[3].trim() : '';

    const startTime = parseTimeWithFallback(startTimeStr);
    const endTime = parseTimeWithFallback(endTimeStr);
    const position = parsePosition(positionStr);

    if (startTime === null || endTime === null) {
        console.warn(`❌ Failed to parse times in block ${blockNumber}:`, startTimeStr, endTimeStr);
        return { startTime: null, endTime: null, position: null };
    }

    if (startTime >= endTime) {
        console.warn(`❌ Invalid time range in block ${blockNumber}: start >= end`);
        return { startTime: null, endTime: null, position: null };
    }

    return { startTime, endTime, position };
}

function parseTimeWithFallback(timeStr) {
    try {
        // Handle both comma and dot as decimal separator
        const normalizedTime = timeStr.replace(',', '.');
        const parts = normalizedTime.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid time format: expected HH:MM:SS.mmm');
        }

        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const secondsParts = parts[2].split('.');
        const seconds = parseInt(secondsParts[0]);
        const milliseconds = parseInt((secondsParts[1] || '0').padEnd(3, '0').slice(0, 3));

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
            throw new Error('Invalid numeric values in time');
        }

        if (minutes >= 60 || seconds >= 60 || milliseconds >= 1000) {
            throw new Error('Time values out of range');
        }

        const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        return totalSeconds;

    } catch (error) {
        console.error('⏰ Time parsing error:', error, 'for:', timeStr);
        return null;
    }
}

function parsePosition(positionStr) {
    if (!positionStr) return null;

    const position = {};

    // Parse X1:40 X2:600 Y1:20 Y2:50 format
    const xMatch = positionStr.match(/X1:(\d+)\s+X2:(\d+)/);
    const yMatch = positionStr.match(/Y1:(\d+)\s+Y2:(\d+)/);

    if (xMatch) {
        position.x1 = parseInt(xMatch[1]);
        position.x2 = parseInt(xMatch[2]);
    }

    if (yMatch) {
        position.y1 = parseInt(yMatch[1]);
        position.y2 = parseInt(yMatch[2]);
    }

    return Object.keys(position).length > 0 ? position : null;
}

// Create unique key for video identification
function getVideoKey(video) {
    // Use title + duration + type as unique identifier
    const cleanTitle = video.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDuration = video.duration.replace(/[^0-9:]/g, '');
    return `${cleanTitle}_${cleanDuration}_${video.type.toLowerCase()}`;
}

// Enhanced subtitle display with HTML support
// function updateSubtitles(currentTime) {
//     const subtitleOverlay = document.getElementById('subtitleOverlay');
//     const subtitleText = document.getElementById('subtitleText');

//     if (!currentSubtitleTrack || !currentSubtitleTrack.entries) {
//         subtitleOverlay.classList.remove('show');
//         return;
//     }

//     const currentEntry = currentSubtitleTrack.entries.find(
//         entry => currentTime >= entry.startTime && currentTime <= entry.endTime
//     );

//     if (currentEntry) {
//         // Use HTML content if available and has formatting, otherwise use plain text
//         if (currentEntry.hasFormatting && currentEntry.html) {
//             subtitleText.innerHTML = currentEntry.html;
//         } else {
//             subtitleText.textContent = currentEntry.text;
//         }

//         // Apply positioning if available
//         applySubtitlePositioning(subtitleOverlay, currentEntry.position);

//         subtitleOverlay.classList.add('show');
//     } else {
//         subtitleOverlay.classList.remove('show');
//     }
// }
function updateSubtitles(currentTime) {
    const subtitleOverlay = document.getElementById('subtitleOverlay');
    const subtitleText = document.getElementById('subtitleText');

    if (!currentSubtitleTrack || !currentSubtitleTrack.entries) {
        subtitleOverlay.classList.remove('show');
        return;
    }

    // Apply sync offset
    const adjustedTime = currentTime - (subtitleSettings.syncOffset || 0);

    const currentEntry = currentSubtitleTrack.entries.find(
        entry => adjustedTime >= entry.startTime && adjustedTime <= entry.endTime
    );

    if (currentEntry) {
        // Use HTML content if available and has formatting, otherwise use plain text
        if (currentEntry.hasFormatting && currentEntry.html) {
            subtitleText.innerHTML = currentEntry.html;
        } else {
            subtitleText.textContent = currentEntry.text;
        }

        // Apply current subtitle styles EVERY TIME
        const text = document.getElementById('subtitleText');
        if (text && subtitleSettings) {
            text.style.fontSize = subtitleSettings.fontSize + 'px';
            text.style.color = subtitleSettings.color;

            const opacityHex = Math.round(subtitleSettings.backgroundOpacity * 2.55).toString(16).padStart(2, '0');
            text.style.backgroundColor = subtitleSettings.backgroundColor + opacityHex;
        }

        // Apply positioning EVERY TIME
        applySubtitlePosition(subtitleOverlay, subtitleSettings.position);

        subtitleOverlay.classList.add('show');
    } else {
        subtitleOverlay.classList.remove('show');
    }
}

function processSubtitleText(rawText) {
    let hasFormatting = false;
    let html = rawText;
    let styles = {};

    // Remove common prefixes like [spanish], [english], etc.
    html = html.replace(/^\s*\[[^\]]+\]\s*/gm, '');

    // Check if there's any HTML formatting
    const htmlTagPattern = /<[^>]+>/;
    if (htmlTagPattern.test(html)) {
        hasFormatting = true;
    }

    // Process and convert HTML tags to proper format
    html = processHTMLTags(html, styles);

    // Get plain text version (no HTML tags)
    const plainText = html.replace(/<[^>]*>/g, '').trim();

    // Clean up whitespace
    html = html.replace(/\s+/g, ' ').trim();

    return {
        plainText,
        html,
        styles,
        hasFormatting
    };
}

function processHTMLTags(text, styles) {
    let processed = text;

    // Process all supported HTML tags

    // 1. Bold tags: <b>, <strong>
    processed = processed.replace(/<(b|strong)(\s[^>]*)?>([^<]*)<\/(b|strong)>/gi, '<strong>$3</strong>');

    // 2. Italic tags: <i>, <em>
    processed = processed.replace(/<(i|em)(\s[^>]*)?>([^<]*)<\/(i|em)>/gi, '<em>$3</em>');

    // 3. Underline tags
    processed = processed.replace(/<u(\s[^>]*)?>([^<]*)<\/u>/gi, '<u>$2</u>');

    // 4. Font color tags: <font color="#FF0000">, <font color="red">
    processed = processed.replace(/<font\s+color=["']?([^"'>]+)["']?(\s[^>]*)?>([^<]*)<\/font>/gi,
        '<span style="color: $1">$3</span>');

    // 5. Font size tags
    processed = processed.replace(/<font\s+size=["']?([^"'>]+)["']?(\s[^>]*)?>([^<]*)<\/font>/gi,
        '<span style="font-size: $1">$3</span>');

    // 6. Font face tags
    processed = processed.replace(/<font\s+face=["']?([^"'>]+)["']?(\s[^>]*)?>([^<]*)<\/font>/gi,
        '<span style="font-family: $1">$3</span>');

    // 7. Complex font tags with multiple attributes
    processed = processed.replace(/<font([^>]*)>([^<]*)<\/font>/gi, (match, attrs, content) => {
        const styleAttrs = [];

        const colorMatch = attrs.match(/color=["']?([^"'>]+)["']?/i);
        if (colorMatch) styleAttrs.push(`color: ${colorMatch[1]}`);

        const sizeMatch = attrs.match(/size=["']?([^"'>]+)["']?/i);
        if (sizeMatch) styleAttrs.push(`font-size: ${sizeMatch[1]}`);

        const faceMatch = attrs.match(/face=["']?([^"'>]+)["']?/i);
        if (faceMatch) styleAttrs.push(`font-family: ${faceMatch[1]}`);

        return styleAttrs.length > 0 ?
            `<span style="${styleAttrs.join('; ')}">${content}</span>` :
            content;
    });

    // 8. Style tags (direct CSS)
    processed = processed.replace(/<span\s+style=["']([^"'>]+)["'](\s[^>]*)?>([^<]*)<\/span>/gi,
        '<span style="$1">$3</span>');

    // 9. Ruby text support (Japanese annotations)
    // Keep ruby tags as-is, they're supported by modern browsers

    // 10. Line breaks
    processed = processed.replace(/<br\s*\/?>/gi, '<br>');

    // 11. Clean up any remaining unsupported tags while preserving their content
    processed = processed.replace(/<(?!\/?(strong|em|u|span|br|ruby|rt|rp)\b)[^>]*>([^<]*)<\/[^>]*>/gi, '$2');

    // 12. Handle nested tags properly
    processed = cleanupNestedTags(processed);

    return processed;
}

function cleanupNestedTags(html) {
    // Handle nested bold/italic combinations
    html = html.replace(/<strong><em>([^<]*)<\/em><\/strong>/gi, '<strong><em>$1</em></strong>');
    html = html.replace(/<em><strong>([^<]*)<\/strong><\/em>/gi, '<strong><em>$1</em></strong>');

    // Clean up empty tags
    html = html.replace(/<(strong|em|u|span)[^>]*><\/(strong|em|u|span)>/gi, '');

    // Remove extra whitespace
    html = html.replace(/\s+/g, ' ');

    return html;
}

function toggleSubtitleModal() {
    console.log('Toggling subtitle modal');
    const modal = document.getElementById('subtitleModal');
    if (modal.classList.contains('show')) {
        hideSubtitleModal();
    } else {
        modal.classList.add('show');
    }
}

function hideSubtitleModal() {
    console.log('Hiding subtitle modal');
    document.getElementById('subtitleModal').classList.remove('show');
}

function handleSubtitleUpload(event) {
    const file = event.target.files[0];
    if (!file || !currentVideo) {
        console.error('No file or current video for subtitle upload');
        return;
    }

    console.log('Uploading subtitle file:', file.name);
    const reader = new FileReader();
    reader.onload = function(e) {
        const subtitleContent = e.target.result;
        const parsed = parseSRT(subtitleContent);
        const language = file.name.split('.')[0];

        if (!currentVideo.subtitles) {
            currentVideo.subtitles = [];
        }

        // Save subtitle content to localStorage
        const subtitleData = {
            language: language,
            content: subtitleContent,
            videoId: currentVideo.id,
            fileName: file.name,
            uploadedAt: Date.now()
        };

        saveSubtitleToStorage(subtitleData);

        // Create blob URL for the subtitle
        const blob = new Blob([subtitleContent], { type: 'text/plain' });
        const subtitleUrl = URL.createObjectURL(blob);

        currentVideo.subtitles.push({ language, url: subtitleUrl });
        currentSubtitles.push({ language, entries: parsed });

        // Update the UI
        const subtitleOptions = document.getElementById('subtitleOptions');
        const option = document.createElement('div');
        option.className = 'subtitle-option';
        option.innerHTML = `
            <span class="subtitle-option-text">${language}</span>
            <span class="subtitle-check material-icons hidden">check</span>
        `;
        option.onclick = () => selectSubtitle({ language });
        subtitleOptions.appendChild(option);

        selectSubtitle({ language });
        event.target.value = '';

        showActionFeedback('subtitles', `${language} subtitle uploaded and saved`);
        console.log('Subtitle uploaded, parsed, and saved:', language);
    };
    reader.readAsText(file);
}

// Save subtitle to localStorage
function saveSubtitleToStorage(subtitleData) {
    try {
        const key = `subtitle_${subtitleData.videoId}_${subtitleData.language}`;
        localStorage.setItem(key, JSON.stringify(subtitleData));

        // Also maintain a list of all subtitle keys for cleanup
        const subtitlesList = JSON.parse(localStorage.getItem('streamhub_subtitles_list') || '[]');
        if (!subtitlesList.includes(key)) {
            subtitlesList.push(key);
            localStorage.setItem('streamhub_subtitles_list', JSON.stringify(subtitlesList));
        }

        console.log('Subtitle saved to storage:', key);
    } catch (e) {
        console.error('Failed to save subtitle to storage:', e);
        if (e.name === 'QuotaExceededError') {
            cleanupOldSubtitles();
        }
    }
}

// Load subtitles from localStorage
function loadSubtitlesFromStorage(videoId) {
    try {
        const subtitlesList = JSON.parse(localStorage.getItem('streamhub_subtitles_list') || '[]');
        const videoSubtitles = [];

        subtitlesList.forEach(key => {
            if (key.includes(`subtitle_${videoId}_`)) {
                const subtitleData = localStorage.getItem(key);
                if (subtitleData) {
                    const parsed = JSON.parse(subtitleData);

                    // Create blob URL from saved content
                    const blob = new Blob([parsed.content], { type: 'text/plain' });
                    const subtitleUrl = URL.createObjectURL(blob);

                    videoSubtitles.push({
                        language: parsed.language,
                        url: subtitleUrl
                    });

                    console.log('Loaded subtitle from storage:', parsed.language);
                }
            }
        });

        return videoSubtitles;
    } catch (e) {
        console.error('Failed to load subtitles from storage:', e);
        return [];
    }
}

// Clean up old subtitles to free space
function cleanupOldSubtitles() {
    try {
        const subtitlesList = JSON.parse(localStorage.getItem('streamhub_subtitles_list') || '[]');
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        const validKeys = [];

        subtitlesList.forEach(key => {
            const subtitleData = localStorage.getItem(key);
            if (subtitleData) {
                const parsed = JSON.parse(subtitleData);
                if (parsed.uploadedAt && parsed.uploadedAt > thirtyDaysAgo) {
                    validKeys.push(key);
                } else {
                    localStorage.removeItem(key);
                }
            }
        });

        localStorage.setItem('streamhub_subtitles_list', JSON.stringify(validKeys));
        console.log('Cleaned up old subtitles, kept', validKeys.length, 'subtitle files');
    } catch (e) {
        console.error('Failed to cleanup old subtitles:', e);
    }
}

// Check and restore subtitles for a video
function checkForSavedSubtitles(video) {
    const savedSubtitles = loadSubtitlesFromStorage(video.id);

    if (savedSubtitles.length > 0) {
        if (!video.subtitles) {
            video.subtitles = [];
        }

        // Add saved subtitles to the video
        savedSubtitles.forEach(savedSub => {
            // Check if this subtitle is already in the video's subtitles
            const exists = video.subtitles.find(sub => sub.language === savedSub.language);
            if (!exists) {
                video.subtitles.push(savedSub);
                console.log('Restored subtitle:', savedSub.language, 'for video:', video.title);
            }
        });
    }
}

function handleSubtitleError(error, language) {
    console.error(`Failed to load ${language} subtitles:`, error);
    showActionFeedback('error', `Failed to load ${language} subtitles`);
}

// Mini Player Effect Functions
function showMiniPlayerEffect(mode) {
    const effect = document.getElementById('miniPlayerEffect');
    const miniPlayer = document.getElementById('miniPlayer');

    if (!effect || !miniPlayer) {
        console.error('Mini player effect elements not found');
        return;
    }

    // Prevent overlapping animations
    if (animationLocked) {
        console.log('Animation already in progress, skipping');
        return;
    }

    console.log(`Showing mini player effect: ${mode}`);
    animationLocked = true;

    // Clear any existing classes and reset
    effect.className = 'mini-player-effect';
    effect.style.opacity = '0';

    // Force reflow
    effect.offsetHeight;

    // Add the specific mode class
    effect.classList.add(mode);
    effect.style.opacity = '1';

    miniPlayer.style.transform = 'translateY(-8px) scale(1.1)';
    miniPlayer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    createCornerIndicator(mode);

    // Lock the animation for full duration
    setTimeout(() => {
        effect.style.opacity = '0';
        miniPlayer.style.transform = '';
        miniPlayer.style.transition = '';
        removeCornerIndicator();

        // Unlock after complete fade out
        setTimeout(() => {
            animationLocked = false;
        }, 500);
    }, 2000);
}

// mini player drag feature functions @@@@
function createDragBlurOverlay() {
    if (!dragBlurOverlay) {
        dragBlurOverlay = document.createElement('div');
        dragBlurOverlay.id = 'dragBlurOverlay';
        dragBlurOverlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(15px);
            z-index: 1400;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(dragBlurOverlay);
    }
    return dragBlurOverlay;
}

function showDragBlurOverlay() {
    const overlay = createDragBlurOverlay();
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
}

function hideDragBlurOverlay() {
    if (dragBlurOverlay) {
        dragBlurOverlay.style.opacity = '0';
        dragBlurOverlay.style.pointerEvents = 'none';
    }
}

// function setupMiniPlayerDrag() {
//     const miniPlayer = document.getElementById('miniPlayer');
//     if (!miniPlayer) return;

//     // Remove existing listeners to prevent duplicates
//     miniPlayer.removeEventListener('mousedown', startMiniPlayerHold);
//     miniPlayer.removeEventListener('touchstart', startMiniPlayerHold);
//     document.removeEventListener('mouseup', endMiniPlayerHold);
//     document.removeEventListener('touchend', endMiniPlayerHold);
//     document.removeEventListener('mousemove', dragMiniPlayer);
//     document.removeEventListener('touchmove', dragMiniPlayer);

//     // Add fresh listeners
//     miniPlayer.addEventListener('mousedown', startMiniPlayerHold, { passive: false });
//     miniPlayer.addEventListener('touchstart', startMiniPlayerHold, { passive: false });
//     document.addEventListener('mouseup', endMiniPlayerHold, { passive: false });
//     document.addEventListener('touchend', endMiniPlayerHold, { passive: false });
//     document.addEventListener('mousemove', dragMiniPlayer, { passive: false });
//     document.addEventListener('touchmove', dragMiniPlayer, { passive: false });

//     console.log('Mini player drag setup completed');
// }

function setupMiniPlayerDrag() {
    console.log('Setting up mini player drag handlers...');

    // Use event delegation instead of direct element binding
    // This ensures it works even if mini player is created later

    // Remove any existing delegation handlers first
    document.removeEventListener('mousedown', handleMiniPlayerMouseDown);
    document.removeEventListener('touchstart', handleMiniPlayerTouchStart);
    document.removeEventListener('mouseup', endMiniPlayerHold);
    document.removeEventListener('touchend', endMiniPlayerHold);
    document.removeEventListener('mousemove', dragMiniPlayer);
    document.removeEventListener('touchmove', dragMiniPlayer);

    // Add new delegation handlers
    document.addEventListener('mousedown', handleMiniPlayerMouseDown, { passive: false });
    document.addEventListener('touchstart', handleMiniPlayerTouchStart, { passive: false });
    document.addEventListener('mouseup', endMiniPlayerHold, { passive: false });
    document.addEventListener('touchend', endMiniPlayerHold, { passive: false });
    document.addEventListener('mousemove', dragMiniPlayer, { passive: false });
    document.addEventListener('touchmove', dragMiniPlayer, { passive: false });

    console.log('Mini player drag handlers setup complete');
}

function handleMiniPlayerMouseDown(event) {
    // Check if the event target is within mini player
    const miniPlayer = event.target.closest('#miniPlayer');
    if (!miniPlayer) return;

    // Call the original start function
    startMiniPlayerHold(event);
}

function handleMiniPlayerTouchStart(event) {
    // Check if the event target is within mini player
    const miniPlayer = event.target.closest('#miniPlayer');
    if (!miniPlayer) return;

    // Call the original start function
    startMiniPlayerHold(event);
}


function startMiniPlayerHold(event) {
    const miniPlayer = document.getElementById('miniPlayer');
    if (!miniPlayer || !miniPlayer.classList.contains('show')) {
        return; // Exit if mini player doesn't exist or isn't visible
    }

    // Don't start drag on control buttons or artwork
    if (event.target.closest('.mini-control-btn') ||
        event.target.closest('.mini-close-btn') ||
        event.target.closest('.mini-artwork')) {
        return;
    }

    // Prevent default to avoid text selection and other conflicts
    event.preventDefault();
    event.stopPropagation();

    const now = Date.now();
    // Prevent multiple rapid touches
    if (now - lastTouchTime < 100) return;
    lastTouchTime = now;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    miniPlayerStartX = clientX;
    miniPlayerStartY = clientY;
    isDragging = false;
    dragStarted = false;

    console.log('Hold started at:', { x: clientX, y: clientY });

    // Clear any existing timeout
    if (miniPlayerHoldTimeout) {
        clearTimeout(miniPlayerHoldTimeout);
    }

    miniPlayerHoldTimeout = setTimeout(() => {
        // Double-check mini player still exists and is visible
        const currentMiniPlayer = document.getElementById('miniPlayer');
        if (!currentMiniPlayer || !currentMiniPlayer.classList.contains('show')) {
            return;
        }

        if (!dragStarted) {
            miniPlayerDragMode = true;
            dragStarted = true;

            console.log('Drag mode activated');

            // Show visual feedback
            showDragBlurOverlay();
            currentMiniPlayer.classList.add('dragging');
            currentMiniPlayer.style.transition = 'none';
            currentMiniPlayer.style.zIndex = '1500';

            showActionFeedback('open_with', 'Drag to reposition');
        }
    }, 500);
}

function dragMiniPlayer(event) {
    if (!miniPlayerDragMode || !dragStarted) return;

    event.preventDefault();
    event.stopPropagation();

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    // Mark that we're actively dragging
    isDragging = true;

    const deltaX = clientX - miniPlayerStartX;
    const deltaY = clientY - miniPlayerStartY;

    const miniPlayer = document.getElementById('miniPlayer');
    const currentStyle = window.getComputedStyle(miniPlayer);

    // Get current position, handling both left/right and top/bottom positioning
    let currentLeft = miniPlayer.offsetLeft;
    let currentTop = miniPlayer.offsetTop;

    // Calculate new position
    const newX = currentLeft + deltaX;
    const newY = currentTop + deltaY;

    // Constrain to viewport
    const maxX = window.innerWidth - miniPlayer.offsetWidth - 20;
    const maxY = window.innerHeight - miniPlayer.offsetHeight - 20;

    const constrainedX = Math.max(20, Math.min(maxX, newX));
    const constrainedY = Math.max(20, Math.min(maxY, newY));

    // Apply position
    miniPlayer.style.left = constrainedX + 'px';
    miniPlayer.style.top = constrainedY + 'px';
    miniPlayer.style.right = 'auto';
    miniPlayer.style.bottom = 'auto';

    // Update start position for next movement
    miniPlayerStartX = clientX;
    miniPlayerStartY = clientY;

    console.log('Dragging to:', { x: constrainedX, y: constrainedY });
}

function endMiniPlayerHold(event) {
    // Clear timeout
    if (miniPlayerHoldTimeout) {
        clearTimeout(miniPlayerHoldTimeout);
        miniPlayerHoldTimeout = null;
    }

    if (miniPlayerDragMode && dragStarted) {
        console.log('Ending drag mode');

        const miniPlayer = document.getElementById('miniPlayer');

        // Get final position
        const rect = miniPlayer.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const playerWidth = rect.width;
        const playerHeight = rect.height;

        // Determine final position - snap to sides
        let finalX, finalY;
        const centerX = rect.left + playerWidth / 2;

        if (centerX < windowWidth / 2) {
            // Snap to left
            finalX = 20;
        } else {
            // Snap to right
            finalX = windowWidth - playerWidth - 20;
        }

        // Keep Y position but ensure it's within bounds
        finalY = Math.max(20, Math.min(windowHeight - playerHeight - 20, rect.top));

        // Apply final position with smooth transition
        miniPlayer.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        miniPlayer.style.left = finalX + 'px';
        miniPlayer.style.top = finalY + 'px';
        miniPlayer.style.right = 'auto';
        miniPlayer.style.bottom = 'auto';

        // Reset drag state and visual effects
        setTimeout(() => {
            miniPlayer.classList.remove('dragging');
            miniPlayer.style.zIndex = '';
            hideDragBlurOverlay();

            // Reset all drag state
            miniPlayerDragMode = false;
            isDragging = false;
            dragStarted = false;

            console.log('Drag completed, final position:', { x: finalX, y: finalY });
            showActionFeedback('check', 'Position saved');
        }, 100);
    } else {
        // Reset state even if drag didn't activate
        miniPlayerDragMode = false;
        isDragging = false;
        dragStarted = false;
    }
}

// end drag mode @@@

function createCornerIndicator(mode) {
    removeCornerIndicator();

    const miniPlayer = document.getElementById('miniPlayer');
    if (!miniPlayer) return;

    const indicator = document.createElement('div');
    indicator.id = 'cornerIndicator';

    let color, shadowColor;
    switch(mode) {
        case 'loop':
            color = '#4ade80';
            shadowColor = 'rgba(74, 222, 128, 0.8)';
            break;
        case 'shuffle':
            color = '#60a5fa';
            shadowColor = 'rgba(96, 165, 250, 0.8)';
            break;
        case 'normal':
            color = '#fbbf24';
            shadowColor = 'rgba(251, 191, 36, 0.8)';
            break;
        default:
            color = '#ffffff';
            shadowColor = 'rgba(255, 255, 255, 0.8)';
    }

    indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 20px ${shadowColor};
        z-index: 10;
        pointer-events: none;
        animation: cornerPulse 2s ease-out;
    `;

    miniPlayer.appendChild(indicator);
}

function removeCornerIndicator() {
    const existing = document.getElementById('cornerIndicator');
    if (existing) {
        existing.remove();
    }
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    console.log('Setting up keyboard shortcuts');
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return;

        const player = document.getElementById('mainVideoPlayer');
        const playerPageVisible = document.getElementById('playerPage').style.display !== 'none';

        // Handle move mode keys separately and prevent conflicts
        if (isMoveMode) {
            handleMoveKeyboard(e);
            return;
        }

        // *** GLOBAL SPACE BAR - works in both mini player and full player ***
        if (e.key === ' ') {
            e.preventDefault();
            handleSpaceBarToggle();
            return;
        }

        // Handle P key globally - works from both mini player and full player
        if (e.key.toLowerCase() === 'p') {
            e.preventDefault();
            handlePKeyToggle();
            return;
        }

        // Only handle video control keys when video player is visible and NOT in move mode
        if (playerPageVisible && !isMoveMode && !isContextMenuOpen) {
            switch(e.key.toLowerCase()) {
                case 'arrowleft':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    skip(10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    player.volume = Math.min(player.volume + 0.05, 1);
                    updateVolumeIcon();
                    showActionFeedback('volume_up', `Volume: ${Math.round(player.volume * 100)}%`);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    player.volume = Math.max(player.volume - 0.05, 0);
                    updateVolumeIcon();
                    showActionFeedback('volume_down', `Volume: ${Math.round(player.volume * 100)}%`);
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 's':
                    toggleSubtitleModal();
                    break;
                case 'l':
                    togglePlaybackMode();
                    break;
            }
        }

        // Global shortcuts that work regardless of player state
        switch(e.key.toLowerCase()) {
            case 'c':
                e.preventDefault();
                handleCastToggle();
                break;
            case 'k':
                if (e.metaKey) { // Cmd + K (Mac)
                    e.preventDefault();
                    if (window.smartSkipFunctions) {
                        window.smartSkipFunctions.toggle();
                    }
                } else if (e.shiftKey) { // Shift + K
                    e.preventDefault();
                    if (window.smartSkipFunctions) {
                        window.smartSkipFunctions.quickAdd();
                    }
                } else if (!e.ctrlKey && !e.metaKey && !e.altKey) { // Just K
                    e.preventDefault();
                    toggleSmartSkipModal();
                }
                break;
            case 'escape':
                if (isContextMenuOpen) {
                    hideContextMenu();
                } else if (isMoveMode) {
                    exitMoveMode();
                } else if (castModalVisible) {
                    handleCastClose();
                } else if (isMiniPlayerMode) {
                    closeMiniPlayer();
                } else if (playerPageVisible) {
                    goBack();
                }
                break;
            case 'b':
                if (e.metaKey || e.ctrlKey) {
                    e.preventDefault();
                    if (document.getElementById('playerPage').style.display !== 'none') {
                        goBack();
                    }
                }
                break;
        }
    });
}

function handleSpaceBarToggle() {
    console.log('=== SPACE BAR TOGGLE ===');
    console.log('isMiniPlayerMode:', isMiniPlayerMode);
    console.log('currentVideo:', currentVideo ? currentVideo.title : 'None');

    const player = document.getElementById('mainVideoPlayer');
    const playerPageVisible = document.getElementById('playerPage').style.display !== 'none';

    if (currentVideo && player) {
        if (player.paused) {
            console.log('▶️ Playing video (Space bar)');
            player.play();
            showActionFeedback('play_arrow', 'Playing');

            // Update mini player UI if in mini mode
            if (isMiniPlayerMode) {
                const miniPlayBtn = document.getElementById('miniPlayBtn');
                const miniArtwork = document.getElementById('miniArtwork');
                if (miniPlayBtn) miniPlayBtn.innerHTML = '<span class="material-icons">pause</span>';
                if (miniArtwork) miniArtwork.classList.add('spinning');
            }
        } else {
            console.log('⏸️ Pausing video (Space bar)');
            player.pause();
            showActionFeedback('pause', 'Paused');

            // Update mini player UI if in mini mode
            if (isMiniPlayerMode) {
                const miniPlayBtn = document.getElementById('miniPlayBtn');
                const miniArtwork = document.getElementById('miniArtwork');
                if (miniPlayBtn) miniPlayBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
                if (miniArtwork) miniArtwork.classList.remove('spinning');
            }
        }
    } else {
        console.log('❌ No video available for space bar control');
        showActionFeedback('error', 'No video available');
    }
}

function handlePKeyToggle() {
    const playerPageVisible = document.getElementById('playerPage').style.display !== 'none';
    const wasFullscreen = !!document.fullscreenElement;

    if (isMiniPlayerMode) {
        // Expanding to full player - restore fullscreen if it was active
        expandMiniPlayer();
        if (wasFullscreen) {
            setTimeout(() => {
                const playerContainer = document.getElementById('playerContainer');
                playerContainer.requestFullscreen().catch(err => {
                    console.error('Failed to restore fullscreen:', err);
                });
            }, 100);
        }
    } else if (playerPageVisible && currentVideo) {
        // Exit fullscreen before enabling mini player
        if (document.fullscreenElement) {
            document.exitFullscreen().then(() => {
                setTimeout(() => {
                    enableMiniPlayer();
                }, 100);
            });
        } else {
            enableMiniPlayer();
        }
    }
}

function handleCastToggle() {
    const castModal = document.getElementById('castModal');

    if (castModal && castModal.classList.contains('show')) {
        handleCastClose();
    } else {
        // Use the toggleCast function from cast-script.js
        if (typeof toggleCast === 'function') {
            toggleCast();
            // Update our tracking variable
            setTimeout(() => {
                const modal = document.getElementById('castModal');
                castModalVisible = modal && modal.classList.contains('show');
            }, 100);
        } else {
            console.error('toggleCast function not found - ensure cast-script.js is loaded');
        }
    }
}

function handleCastClose() {
    // Use the hideCastModal function from cast-script.js if available
    if (typeof hideCastModal === 'function') {
        hideCastModal();
    } else {
        // Fallback
        const castModal = document.getElementById('castModal');
        if (castModal) {
            castModal.classList.remove('show');
        }
        const blurOverlay = document.getElementById('blurOverlay');
        if (blurOverlay && !isContextMenuOpen) {
            blurOverlay.classList.remove('active');
        }
    }
    castModalVisible = false;
}

// Shortcuts Modal
function showShortcuts() {
    console.log('Showing shortcuts modal');
    document.getElementById('shortcutsModal').style.display = 'flex';
    document.getElementById('blurOverlay').classList.add('active');
}

function hideShortcuts(event) {
    if (event && event.target.closest('.shortcuts-content')) return;
    console.log('Hiding shortcuts modal');
    document.getElementById('shortcutsModal').style.display = 'none';
    document.getElementById('blurOverlay').classList.remove('active');
}

// Touch Gestures Setup
function setupTouchGestures() {
    const playerContainer = document.getElementById('playerContainer');

    playerContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    });

    playerContainer.addEventListener('touchend', function(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = touchEndTime - touchStartTime;

        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
            togglePlayPause();
        }
        else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                skip(10);
            } else {
                skip(-10);
            }
        }
        else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            const player = document.getElementById('mainVideoPlayer');
            if (deltaY < 0) {
                player.volume = Math.min(player.volume + 0.1, 1);
            } else {
                player.volume = Math.max(player.volume - 0.1, 0);
            }
            updateVolumeIcon();
        }
    });
}

// Drag and Drop Setup
function setupDragAndDrop() {
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const fileType = file.type;

            if (fileType.startsWith('video/')) {
                const videoUrl = URL.createObjectURL(file);
                const newVideo = {
                    id: Date.now(),
                    title: file.name.split('.')[0],
                    duration: "Unknown",
                    type: file.name.split('.').pop().toUpperCase(),
                    url: videoUrl,
                    thumbnail: null,
                    subtitles: null
                };

                videoLibrary.push(newVideo);
                loadLibrary();
                updateVideoCount();
                console.log('Video dropped and added:', newVideo.title);
            }
            else if (fileType.startsWith('image/')) {
                if (selectedVideoId) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const video = videoLibrary.find(v => v.id === selectedVideoId);
                        if (video) {
                            video.thumbnail = e.target.result;
                            loadLibrary();
                            updateVideoCount();
                            console.log('Thumbnail updated via drag and drop');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
            else if (file.name.endsWith('.srt')) {
                if (currentVideo) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const parsed = parseSRT(e.target.result);
                        const language = file.name.split('.')[0];

                        if (!currentVideo.subtitles) {
                            currentVideo.subtitles = [];
                        }

                        const subtitleUrl = URL.createObjectURL(file);
                        currentVideo.subtitles.push({ language, url: subtitleUrl });
                        currentSubtitles.push({ language, entries: parsed });

                        loadAvailableSubtitles();
                        console.log('Subtitle dropped and added:', language);
                    };
                    reader.readAsText(file);
                }
            }
        }
    });
}

// Performance Monitoring
function trackPerformance() {
    const now = performance.now();
    if (performanceMetrics.lastFrameTime) {
        const frameTime = now - performanceMetrics.lastFrameTime;
        performanceMetrics.frameCount++;

        if (frameTime > 50) {
            console.warn('Performance warning: Frame time', frameTime + 'ms');
        }
    }
    performanceMetrics.lastFrameTime = now;

    if (document.getElementById('playerPage').style.display !== 'none') {
        requestAnimationFrame(trackPerformance);
    }
}

// Cast Modal Functions
function hideCastModal() {
    // This will work with your existing cast-script.js
    const castModal = document.getElementById('castModal');
    const blurOverlay = document.getElementById('blurOverlay');

    if (castModal) {
        castModal.classList.remove('show');
    }
    if (blurOverlay && !isContextMenuOpen) {
        blurOverlay.classList.remove('active');
    }

    castModalVisible = false;
    console.log('Cast modal hidden');
}


// Debug Functions
function debugPlaybackModes() {
    console.log('=== PLAYBACK MODE DEBUG ===');
    console.log('Current mode:', playbackMode);

    const btn = document.getElementById('playbackModeBtn');
    console.log('Button found:', !!btn);
    if (btn) {
        console.log('Button classes:', btn.className);
        const icon = btn.querySelector('.material-icons');
        console.log('Icon found:', !!icon);
        if (icon) {
            console.log('Icon text:', icon.textContent);
        }
    }

    const modes = ['normal', 'loop', 'shuffle', 'disabled'];
    console.log('Available modes:', modes);
    console.log('Current index:', modes.indexOf(playbackMode));
}
// === SMART SKIP SYSTEM ===

// Smart Skip Variables
let smartSkipRanges = [];
let smartSkipHistory = [];
let smartSkipStats = {
    totalTimeSaved: 0,
    sessionSkips: 0
};
let smartSkipModalVisible = false;
let isSkipInProgress = false;
let skipCheckInterval = null;

// Smart Skip Modal Functions
function toggleSmartSkipModal() {
    const modal = document.getElementById('smartSkipModal');

    if (smartSkipModalVisible) {
        hideSmartSkipModal();
    } else {
        showSmartSkipModal();
    }
}

function showSmartSkipModal() {
    if (!currentVideo) {
        showActionFeedback('error', 'No video loaded');
        return;
    }

    const modal = document.getElementById('smartSkipModal');
    modal.classList.add('show');
    smartSkipModalVisible = true;

    // Load existing data for current video
    loadSmartSkipData();
    updateSmartSkipUI();

    // Focus first input
    setTimeout(() => {
        document.getElementById('skipFromTime').focus();
    }, 100);

    console.log('Smart Skip modal opened');
}

function hideSmartSkipModal() {
    const modal = document.getElementById('smartSkipModal');
    modal.classList.remove('show');
    smartSkipModalVisible = false;

    // Clear any error states
    clearTimeInputErrors();

    console.log('Smart Skip modal closed');
}

// Time Input Validation and Formatting
function formatTimeInput(input) {
    let value = input.value.replace(/[^\d:]/g, '');

    // Auto-format as user types
    if (value.length === 2 && !value.includes(':')) {
        value = value + ':';
    } else if (value.length === 4 && value.split(':').length === 2) {
        const parts = value.split(':');
        if (parts[1].length === 2) {
            value = parts[0] + ':' + parts[1];
        }
    }

    input.value = value;
    validateTimeInput(input);
}

function validateTimeInput(input) {
    const value = input.value;
    const timeRegex = /^(\d{1,2}):([0-5]\d)$/;
    const match = value.match(timeRegex);

    if (value && !match) {
        input.classList.add('error');
        return false;
    } else {
        input.classList.remove('error');
        return true;
    }
}

function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;

    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);

    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
}

function formatSecondsToTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function clearTimeInputErrors() {
    document.querySelectorAll('.time-input').forEach(input => {
        input.classList.remove('error');
    });

    const errorMsg = document.querySelector('.skip-error-message');
    if (errorMsg) {
        errorMsg.remove();
    }
}

// Smart Skip Range Management
function addSkipRange() {
    const fromInput = document.getElementById('skipFromTime');
    const toInput = document.getElementById('skipToTime');

    // Validate inputs
    if (!validateTimeInput(fromInput) || !validateTimeInput(toInput)) {
        showSkipError('Please enter valid time format (mm:ss)');
        return;
    }

    if (!fromInput.value || !toInput.value) {
        showSkipError('Please fill in both time fields');
        return;
    }

    const fromSeconds = parseTimeToSeconds(fromInput.value);
    const toSeconds = parseTimeToSeconds(toInput.value);
    const player = document.getElementById('mainVideoPlayer');

    // Validation checks
    if (fromSeconds >= toSeconds) {
        showSkipError('End time must be after start time');
        return;
    }

    if (toSeconds > player.duration) {
        showSkipError('End time cannot exceed video duration');
        return;
    }

    // Check for overlapping ranges
    const overlapping = smartSkipRanges.find(range =>
        (fromSeconds >= range.from && fromSeconds < range.to) ||
        (toSeconds > range.from && toSeconds <= range.to) ||
        (fromSeconds <= range.from && toSeconds >= range.to)
    );

    if (overlapping) {
        showSkipError('This range overlaps with an existing skip');
        return;
    }

    // Add the range
    const skipRange = {
        id: Date.now(),
        from: fromSeconds,
        to: toSeconds,
        duration: toSeconds - fromSeconds,
        fromFormatted: fromInput.value,
        toFormatted: toInput.value
    };

    smartSkipRanges.push(skipRange);
    smartSkipRanges.sort((a, b) => a.from - b.from);

    // Clear inputs
    fromInput.value = '';
    toInput.value = '';

    // Update UI
    updateSmartSkipUI();
    saveSmartSkipData();

    showActionFeedback('add', `Skip range added: ${skipRange.fromFormatted} - ${skipRange.toFormatted}`);
    console.log('Added skip range:', skipRange);
}

function removeSkipRange(id) {
    smartSkipRanges = smartSkipRanges.filter(range => range.id !== id);
    updateSmartSkipUI();
    saveSmartSkipData();
    showActionFeedback('remove', 'Skip range removed');
}

function clearAllSkips() {
    if (smartSkipRanges.length === 0) return;

    smartSkipRanges = [];
    updateSmartSkipUI();
    saveSmartSkipData();
    showActionFeedback('clear_all', 'All skip ranges cleared');
}

function jumpToSkipRange(range) {
    const player = document.getElementById('mainVideoPlayer');
    player.currentTime = range.from;
    showActionFeedback('skip_next', `Jumped to ${range.fromFormatted}`);
}

// Smart Skip Execution
function checkForSkips() {
    if (!currentVideo || smartSkipRanges.length === 0 || isSkipInProgress) return;

    const player = document.getElementById('mainVideoPlayer');
    const currentTime = player.currentTime;

    const activeRange = smartSkipRanges.find(range =>
        currentTime >= range.from && currentTime < range.to
    );

    if (activeRange) {
        executeSkip(activeRange);
    }
}

function executeSkip(range) {
    if (isSkipInProgress) return;

    isSkipInProgress = true;
    const player = document.getElementById('mainVideoPlayer');

    // Add skip to history
    addToSkipHistory(range);

    // Update stats
    smartSkipStats.sessionSkips++;
    smartSkipStats.totalTimeSaved += range.duration;

    // Jump to end of skip range
    player.currentTime = range.to;

    // Visual feedback
    showSkipPulse();
    showActionFeedback('fast_forward', `Skipped ${formatSecondsToTime(range.duration)}`);

    // Update UI if modal is open
    if (smartSkipModalVisible) {
        updateSmartSkipUI();
    }

    console.log('Executed skip:', range);

    // Reset skip flag after a brief delay
    setTimeout(() => {
        isSkipInProgress = false;
    }, 500);
}

function showSkipPulse() {
    const btn = document.getElementById('smartSkipBtn');
    btn.classList.add('skipping');

    setTimeout(() => {
        btn.classList.remove('skipping');
    }, 300);
}

// Smart Skip History
function addToSkipHistory(range) {
    const historyItem = {
        id: Date.now(),
        range: range,
        timestamp: new Date(),
        videoTitle: currentVideo.title,
        timeSaved: range.duration
    };

    smartSkipHistory.unshift(historyItem);

    // Keep only last 50 items
    if (smartSkipHistory.length > 50) {
        smartSkipHistory = smartSkipHistory.slice(0, 50);
    }

    saveSmartSkipData();
}

function clearSkipHistory() {
    if (smartSkipHistory.length === 0) return;

    smartSkipHistory = [];
    updateSmartSkipUI();
    saveSmartSkipData();
    showActionFeedback('history_toggle_off', 'Skip history cleared');
}

// UI Updates
function updateSmartSkipUI() {
    updateSkipRangesList();
    updateSkipStats();
    updateSkipHistory();
    updateSmartSkipButton();
}

function updateSkipRangesList() {
    const container = document.getElementById('skipRangesList');
    const countElement = document.getElementById('skipCount');

    countElement.textContent = `(${smartSkipRanges.length})`;

    if (smartSkipRanges.length === 0) {
        container.innerHTML = '<div class="no-skips-message">No skip ranges set</div>';
        return;
    }

    const player = document.getElementById('mainVideoPlayer');
    const currentTime = player ? player.currentTime : 0;

    container.innerHTML = smartSkipRanges.map(range => {
        const isActive = currentTime >= range.from && currentTime < range.to;
        const duration = formatSecondsToTime(range.duration);

        return `
            <div class="skip-range-item ${isActive ? 'active' : ''}" data-id="${range.id}">
                <div class="skip-range-info">
                    <div class="skip-range-time">${range.fromFormatted} → ${range.toFormatted}</div>
                    <div class="skip-range-duration">Saves ${duration}</div>
                </div>
                <div class="skip-range-actions">
                    <button class="skip-action-btn" onclick="jumpToSkipRange({
                        id: ${range.id},
                        from: ${range.from},
                        to: ${range.to},
                        fromFormatted: '${range.fromFormatted}',
                        toFormatted: '${range.toFormatted}'
                    })" title="Jump to skip (2s before)">
                        <span class="material-icons">skip_next</span>
                    </button>
                    <button class="skip-action-btn delete" onclick="removeSkipRange(${range.id})" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateSkipStats() {
    const totalSaved = smartSkipRanges.reduce((total, range) => total + range.duration, 0);
    const player = document.getElementById('mainVideoPlayer');
    const originalDuration = player ? player.duration : 0;
    const newDuration = Math.max(0, originalDuration - totalSaved);

    document.getElementById('totalTimeSaved').textContent = formatSecondsToTime(totalSaved);
    document.getElementById('newDuration').textContent = formatSecondsToTime(newDuration);
    document.getElementById('sessionSkips').textContent = smartSkipStats.sessionSkips;
}

function updateSkipHistory() {
    const container = document.getElementById('skipHistoryList');

    if (smartSkipHistory.length === 0) {
        container.innerHTML = '<div class="no-history-message">No skips performed yet</div>';
        return;
    }

    container.innerHTML = smartSkipHistory.slice(0, 10).map(item => {
        const timeStr = `${item.range.fromFormatted} → ${item.range.toFormatted}`;
        const timestamp = item.timestamp.toLocaleTimeString();
        const saved = formatSecondsToTime(item.timeSaved);

        return `
            <div class="skip-history-item">
                <div class="skip-history-info">
                    <div class="skip-history-time">${timeStr}</div>
                    <div class="skip-history-timestamp">${timestamp}</div>
                </div>
                <div class="skip-history-saved">-${saved}</div>
            </div>
        `;
    }).join('');
}

function updateSmartSkipButton() {
    const btn = document.getElementById('smartSkipBtn');
    if (smartSkipRanges.length > 0) {
        btn.classList.add('active');
        btn.title = `Smart Skip (${smartSkipRanges.length} ranges)`;
    } else {
        btn.classList.remove('active');
        btn.title = 'Smart Skip';
    }
}

// Preset Functions
function setCurrentTimeAsFrom() {
    const player = document.getElementById('mainVideoPlayer');
    if (!player) return;

    const currentTime = Math.floor(player.currentTime);
    const formattedTime = formatSecondsToTime(currentTime);
    document.getElementById('skipFromTime').value = formattedTime;
    validateTimeInput(document.getElementById('skipFromTime'));
    showActionFeedback('schedule', `Set from time: ${formattedTime}`);
}

function setCurrentTimeAsTo() {
    const player = document.getElementById('mainVideoPlayer');
    if (!player) return;

    const currentTime = Math.floor(player.currentTime);
    const formattedTime = formatSecondsToTime(currentTime);
    document.getElementById('skipToTime').value = formattedTime;
    validateTimeInput(document.getElementById('skipToTime'));
    showActionFeedback('schedule', `Set to time: ${formattedTime}`);
}

// Error Handling
function showSkipError(message) {
    clearTimeInputErrors();

    const container = document.querySelector('.skip-time-inputs');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'skip-error-message';
    errorDiv.innerHTML = `
        <span class="material-icons" style="font-size: 0.75rem;">error</span>
        ${message}
    `;

    container.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 3000);
}

// Data Persistence
function saveSmartSkipData() {
    if (!currentVideo) return;

    try {
        const skipData = {
            ranges: smartSkipRanges,
            history: smartSkipHistory,
            stats: smartSkipStats
        };

        const key = `smartSkip_${currentVideo.id}`;
        localStorage.setItem(key, JSON.stringify(skipData));

        // Also save global history and stats
        localStorage.setItem('smartSkip_globalHistory', JSON.stringify(smartSkipHistory));
        localStorage.setItem('smartSkip_globalStats', JSON.stringify(smartSkipStats));

        console.log('Smart skip data saved for video:', currentVideo.title);
    } catch (error) {
        console.error('Failed to save smart skip data:', error);
    }
}

function loadSmartSkipData() {
    if (!currentVideo) return;

    try {
        // Load video-specific data
        const key = `smartSkip_${currentVideo.id}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            const data = JSON.parse(saved);
            smartSkipRanges = data.ranges || [];
            console.log(`Loaded ${smartSkipRanges.length} skip ranges for "${currentVideo.title}"`);
        } else {
            smartSkipRanges = [];
            console.log(`No saved skip ranges found for "${currentVideo.title}"`);
        }

        // Load global history and stats
        const globalHistory = localStorage.getItem('smartSkip_globalHistory');
        const globalStats = localStorage.getItem('smartSkip_globalStats');

        if (globalHistory) {
            smartSkipHistory = JSON.parse(globalHistory);
            // Filter out old entries (keep last 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            smartSkipHistory = smartSkipHistory.filter(item =>
                new Date(item.timestamp) > thirtyDaysAgo
            );
        } else {
            smartSkipHistory = [];
        }

        if (globalStats) {
            smartSkipStats = JSON.parse(globalStats);
        } else {
            smartSkipStats = { totalTimeSaved: 0, sessionSkips: 0 };
        }

        console.log('Smart skip data loaded:', {
            video: currentVideo.title,
            ranges: smartSkipRanges.length,
            historyItems: smartSkipHistory.length,
            sessionSkips: smartSkipStats.sessionSkips
        });

    } catch (error) {
        console.error('Failed to load smart skip data:', error);
        smartSkipRanges = [];
        smartSkipHistory = [];
        smartSkipStats = { totalTimeSaved: 0, sessionSkips: 0 };
    }
}

// Smart Skip Initialization and Control
function initializeSmartSkip() {
    console.log('Initializing Smart Skip system...');

    // Set up time input formatters
    const timeInputs = document.querySelectorAll('.time-input');
    timeInputs.forEach(input => {
        input.addEventListener('input', function() {
            formatTimeInput(this);
        });

        input.addEventListener('keydown', function(e) {
            // Allow only numbers, colon, backspace, delete, tab, escape, enter, and arrow keys
            const allowedKeys = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
            ];

            if (allowedKeys.includes(e.key) ||
                (e.key >= '0' && e.key <= '9') ||
                e.key === ':' ||
                (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) {
                return;
            }

            e.preventDefault();
        });

        input.addEventListener('paste', function(e) {
            setTimeout(() => formatTimeInput(this), 0);
        });
    });

    // Set up keyboard shortcuts
    setupSmartSkipShortcuts();

    console.log('Smart Skip system initialized');
}

function startSmartSkipMonitoring() {
    if (skipCheckInterval) {
        clearInterval(skipCheckInterval);
    }

    skipCheckInterval = setInterval(checkForSkips, 100); // Check every 100ms for precise skipping
    console.log('Smart skip monitoring started');
}

function stopSmartSkipMonitoring() {
    if (skipCheckInterval) {
        clearInterval(skipCheckInterval);
        skipCheckInterval = null;
    }
    console.log('Smart skip monitoring stopped');
}

// Keyboard Shortcuts for Smart Skip
function setupSmartSkipShortcuts() {
    // These will be integrated into the main keyboard handler
    console.log('Smart Skip keyboard shortcuts registered');
}

// Integration with Video Player Events
function onVideoLoadedSmartSkip() {
    loadSmartSkipData();
    updateSmartSkipUI();
    startSmartSkipMonitoring();
}

function onVideoEndedSmartSkip() {
    stopSmartSkipMonitoring();
}

function onVideoPlaySmartSkip() {
    startSmartSkipMonitoring();
}

function onVideoPauseSmartSkip() {
    // Keep monitoring even when paused for UI updates
}

// Smart Skip Quick Actions (for shortcuts)
function quickAddSkip() {
    const player = document.getElementById('mainVideoPlayer');
    if (!player || !currentVideo) {
        showActionFeedback('error', 'No video loaded');
        return;
    }

    const currentTime = Math.floor(player.currentTime);
    const endTime = Math.min(currentTime + 30, Math.floor(player.duration)); // Default 30-second skip

    if (endTime <= currentTime) {
        showActionFeedback('error', 'Cannot create skip at end of video');
        return;
    }

    const skipRange = {
        id: Date.now(),
        from: currentTime,
        to: endTime,
        duration: endTime - currentTime,
        fromFormatted: formatSecondsToTime(currentTime),
        toFormatted: formatSecondsToTime(endTime)
    };

    smartSkipRanges.push(skipRange);
    smartSkipRanges.sort((a, b) => a.from - b.from);

    updateSmartSkipUI();
    saveSmartSkipData();

    showActionFeedback('add', `Quick skip added: 30s from ${skipRange.fromFormatted}`);
}

function toggleSmartSkipEnabled() {
    // Toggle smart skip monitoring on/off
    if (skipCheckInterval) {
        stopSmartSkipMonitoring();
        showActionFeedback('pause', 'Smart Skip disabled');
    } else {
        startSmartSkipMonitoring();
        showActionFeedback('play_arrow', 'Smart Skip enabled');
    }
}

// Smart Skip Modal Click Outside to Close
function handleSmartSkipOutsideClick(event) {
    const modal = document.getElementById('smartSkipModal');
    const btn = document.getElementById('smartSkipBtn');

    if (smartSkipModalVisible &&
        !modal.contains(event.target) &&
        !btn.contains(event.target)) {
        hideSmartSkipModal();
    }
}

// Export functions for integration
window.smartSkipFunctions = {
    initialize: initializeSmartSkip,
    onVideoLoaded: onVideoLoadedSmartSkip,
    onVideoEnded: onVideoEndedSmartSkip,
    onVideoPlay: onVideoPlaySmartSkip,
    onVideoPause: onVideoPauseSmartSkip,
    quickAdd: quickAddSkip,
    toggle: toggleSmartSkipEnabled,
    handleOutsideClick: handleSmartSkipOutsideClick
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other systems to initialize
    setTimeout(() => {
        initializeSmartSkip();
    }, 100);
});

///////////////////////////// SMART SKIP END /////////////////////////:
function testplayerani(type, duration = 1) {
    console.log('=== MINI PLAYER ANIMATION TEST ===');

    const miniPlayer = document.getElementById('miniPlayer');
    if (!miniPlayer) {
        console.error('❌ Mini player not found! Make sure mini player is enabled first.');
        console.log('💡 Tip: Play a video and press "P" to enable mini player, then try again.');
        return;
    }

    if (!miniPlayer.classList.contains('show')) {
        console.warn('⚠️ Mini player is not visible. Showing it first...');
        if (!currentVideo && videoLibrary.length > 0) {
            console.log('🎬 Creating temporary video session for testing...');
            currentVideo = videoLibrary[0];
            isMiniPlayerMode = true;
            miniPlayer.classList.add('show');
            document.getElementById('miniTitle').textContent = currentVideo.title;
            console.log('✅ Mini player enabled for testing');
        } else if (!currentVideo) {
            console.error('❌ No videos available for testing. Add a video first.');
            return;
        } else {
            miniPlayer.classList.add('show');
        }
    }

    const validTypes = ['normal', 'loop', 'shuffle', 'disabled'];
    if (!validTypes.includes(type)) {
        console.error(`❌ Invalid animation type: "${type}"`);
        console.log('📝 Valid types:', validTypes.join(', '));
        return;
    }

    let animationDuration = 2000;
    let isLocked = false;
    let shouldLoop = false;
    let repeatCount = 1;

    if (typeof duration === 'string') {
        if (duration.toLowerCase() === 'lock') {
            isLocked = true;
            animationDuration = -1;
            console.log('🔒 Animation will be locked (stays visible until cleared)');
        } else if (duration.toLowerCase() === 'loopall') {
            shouldLoop = true;
            repeatCount = validTypes.length;
            console.log('🔄 Will loop through all animation types');
        }
    } else if (typeof duration === 'number' && duration > 0) {
        if (duration < 10) {
            animationDuration = duration * 1000;
        } else {
            animationDuration = duration;
        }
        console.log(`⏱️ Animation duration set to: ${animationDuration}ms`);
    }

    console.log(`🎭 Testing "${type}" animation...`);

    function runAnimation(animationType, index = 0, total = 1) {
        if (shouldLoop && index < total) {
            const currentType = validTypes[index];
            console.log(`🎬 Running animation ${index + 1}/${total}: ${currentType}`);

            showMiniPlayerEffect(currentType);

            if (index + 1 < total) {
                setTimeout(() => {
                    runAnimation(animationType, index + 1, total);
                }, 3000);
            } else {
                console.log('✅ All animations completed!');
            }
            return;
        }

        showMiniPlayerEffect(animationType);

        const effect = document.getElementById('miniPlayerEffect');
        if (effect) {
            console.log('🎨 Animation details:');
            console.log('  - Type:', animationType);
            console.log('  - Element classes:', effect.className);
            console.log('  - Duration:', isLocked ? 'Locked' : `${animationDuration}ms`);

            if (isLocked) {
                setTimeout(() => {
                    effect.style.opacity = '1';
                    effect.classList.add(animationType);
                    console.log('🔒 Animation locked! Use clearTestAnimation() to clear it.');
                }, 100);
            }
        }
    }

    if (shouldLoop) {
        runAnimation(type, 0, validTypes.length);
    } else {
        runAnimation(type);
    }

    window.clearTestAnimation = function() {
        const effect = document.getElementById('miniPlayerEffect');
        if (effect) {
            effect.style.opacity = '0';
            effect.className = 'mini-player-effect';
            console.log('🧹 Animation cleared!');
        }
    };

    window.testAllAnimations = function(durationPerAnimation = 3) {
        console.log('🎪 Testing all animations...');
        testplayerani('normal', 'loopall');
    };
}

function clearTestAnimation() {
    const effect = document.getElementById('miniPlayerEffect');
    if (effect) {
        effect.style.opacity = '0';
        effect.className = 'mini-player-effect';
        console.log('🧹 Animation cleared!');
    }
}

function testAllAnimations() {
    console.log('🎪 Testing all animations...');
    testplayerani('normal', 'loopall');
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        performSearch(e.target.value);
        selectedSearchIndex = 0;
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing StreamHub...');

    // susbtitle start
    loadSubtitleSettings();

    // Set up subtitle input event listeners
    setTimeout(() => {
        const fontSizeInput = document.getElementById('subtitleFontSize');
        const colorInput = document.getElementById('subtitleColor');
        const bgColorInput = document.getElementById('subtitleBgColor');
        const opacityInput = document.getElementById('subtitleBgOpacity');

        if (fontSizeInput) {
            fontSizeInput.addEventListener('input', onSubtitleInputChange);
            fontSizeInput.addEventListener('change', onSubtitleInputChange);
        }
        if (colorInput) {
            colorInput.addEventListener('change', onSubtitleInputChange);
        }
        if (bgColorInput) {
            bgColorInput.addEventListener('change', onSubtitleInputChange);
        }
        if (opacityInput) {
            opacityInput.addEventListener('input', onSubtitleInputChange);
            opacityInput.addEventListener('change', onSubtitleInputChange);
        }

        console.log('Subtitle input event listeners set up');
    }, 200);
    // susbtitle end

    initializeSearchSystem();
    setupSearchKeyboardShortcuts();
    loadProgressData();
    loadLibrary();
    updateVideoCount();
    setupVideoPlayer();
    setupKeyboardShortcuts();
    setupContextMenu();
    setupTouchGestures();
    setupDragAndDrop();
    updatePlaybackModeUI();
    setupMiniPlayerDrag();

    videoLibrary.forEach(video => {
        checkForSavedSubtitles(video);
    });

    // Clean up old subtitles on startup
    setTimeout(cleanupOldSubtitles, 1000);

    setupPlaybackModeButton();
    loadThumbnailData();
    observeCastModal();
    initializePictureInPicture();
    setTimeout(() => {
        initializeSmartSkip();
    }, 100);

    document.getElementById('videoInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addVideo();
    });

    if (typeof initializeCasting === 'function') {
        initializeCasting();
    } else {
        initializePictureInPicture();
    }

    initializeMiniPlayerDrag();

    // Setup cast modal observer
    observeCastModal();

    const castModalObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const castModal = document.getElementById('castModal');
                if (castModal) {
                    castModalVisible = castModal.classList.contains('show');
                }
            }
        });
    });

function initializeMiniPlayerDrag() {
    console.log('Initializing mini player drag...');

    // Simply setup drag immediately - no attempts needed
    setupMiniPlayerDrag();

    // Also setup a mutation observer to handle when mini player is dynamically created
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const miniPlayer = node.querySelector ? node.querySelector('#miniPlayer') :
                                     (node.id === 'miniPlayer' ? node : null);
                    if (miniPlayer) {
                        setupMiniPlayerDrag();
                        console.log('Mini player detected and drag setup applied');
                    }
                }
            });
        });
    });

    // Observe document body for dynamically added elements
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Mini player drag initialization complete with dynamic detection');
}

    const checkForCastModal = setInterval(() => {
        const castModal = document.getElementById('castModal');
        if (castModal) {
            castModalObserver.observe(castModal, { attributes: true });
            clearInterval(checkForCastModal);
        }
    }, 100);

    const observeCastModal = () => {
        const checkForCastModal = setInterval(() => {
            const castModal = document.getElementById('castModal');
            if (castModal) {
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            castModalVisible = castModal.classList.contains('show');
                        }
                    });
                });
                observer.observe(castModal, { attributes: true });
                clearInterval(checkForCastModal);
            }
        }, 100);
    };


    document.addEventListener('click', function(e) {
        if (!e.target.closest('.context-menu') && !e.target.closest('.video-card')) {
            hideContextMenu();
        }
        if (!e.target.closest('.mini-info-modal') && !e.target.closest('.mini-artwork')) {
            hideMiniInfo();
        }
        if (!e.target.closest('.subtitle-modal') && !e.target.closest('#subtitleBtn')) {
            hideSubtitleModal();
        }

        if (window.smartSkipFunctions) {
            window.smartSkipFunctions.handleOutsideClick(e);
        }

        // Handle cast modal clicks
        if (!e.target.closest('.cast-modal') && !e.target.closest('#castBtn')) {
            const castModal = document.getElementById('castModal');
            if (castModal && castModal.classList.contains('show')) {
                handleCastClose();
            }
        }

        // Handle blur overlay clicks
        if (e.target.id === 'blurOverlay' || e.target.id === 'dragBlurOverlay') {
            if (isContextMenuOpen) {
                hideContextMenu();
            }
            if (isMoveMode) {
                exitMoveMode();
            }
            if (castModalVisible) {
                handleCastClose();
            }
            if (miniPlayerDragMode) {
                endMiniPlayerHold();
            }
        }
    });
});

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// Subtitle settings variables
let subtitleSettings = {
    fontSize: 24,
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 80,
    position: 'bottom-center',
    syncOffset: 0
};

function toggleSubtitleSettings() {
    const settings = document.getElementById('subtitleSettings');
    if (settings.classList.contains('show')) {
        settings.classList.remove('show');
    } else {
        settings.classList.add('show');
        loadSubtitleSettings();
    }
}

function loadSubtitleSettings() {
    // Load from localStorage if available
    try {
        const saved = localStorage.getItem('streamhub_subtitle_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            subtitleSettings = { ...subtitleSettings, ...settings };
        }
    } catch (e) {
        console.error('Failed to load subtitle settings:', e);
    }

    // Update UI elements
    const fontSizeInput = document.getElementById('subtitleFontSize');
    const colorInput = document.getElementById('subtitleColor');
    const bgColorInput = document.getElementById('subtitleBgColor');
    const opacityInput = document.getElementById('subtitleBgOpacity');
    const offsetDisplay = document.getElementById('subtitleOffset');

    if (fontSizeInput) fontSizeInput.value = subtitleSettings.fontSize;
    if (colorInput) colorInput.value = subtitleSettings.color;
    if (bgColorInput) bgColorInput.value = subtitleSettings.backgroundColor;
    if (opacityInput) opacityInput.value = subtitleSettings.backgroundOpacity;
    if (offsetDisplay) offsetDisplay.textContent = subtitleSettings.syncOffset.toFixed(1) + 's';

    // Update position buttons
    document.querySelectorAll('.subtitle-position-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.position === subtitleSettings.position) {
            btn.classList.add('active');
        }
    });
}

function adjustSubtitleSize(change) {
    console.log('Adjusting font size by:', change);

    const input = document.getElementById('subtitleFontSize');
    if (!input) {
        console.error('Font size input not found');
        return;
    }

    const currentValue = parseInt(input.value) || 24;
    const newValue = Math.max(12, Math.min(48, currentValue + change));

    console.log('Font size change:', currentValue, '->', newValue);

    input.value = newValue;
    subtitleSettings.fontSize = newValue;

    // Apply immediately and save
    updateSubtitleStyle();
    saveSubtitleSettings();

    showActionFeedback('text_fields', `Font size: ${newValue}px`);
}

function adjustSubtitleSync(offset) {
    console.log('Adjusting subtitle sync by:', offset);

    subtitleSettings.syncOffset += offset;

    console.log('New sync offset:', subtitleSettings.syncOffset);

    const offsetDisplay = document.getElementById('subtitleOffset');
    if (offsetDisplay) {
        offsetDisplay.textContent = subtitleSettings.syncOffset.toFixed(1) + 's';
    }

    saveSubtitleSettings();
    showActionFeedback('sync', `Sync: ${subtitleSettings.syncOffset >= 0 ? '+' : ''}${subtitleSettings.syncOffset.toFixed(1)}s`);
}

function setSubtitlePosition(position) {
    console.log('Setting subtitle position to:', position);

    subtitleSettings.position = position;

    // Update button states immediately
    document.querySelectorAll('.subtitle-position-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.position === position) {
            btn.classList.add('active');
        }
    });

    // Apply position immediately and save
    updateSubtitleStyle();
    saveSubtitleSettings();

    showActionFeedback('subtitles', `Position: ${position.replace('-', ' ')}`);
}

function updateSubtitleStyle() {
    const overlay = document.getElementById('subtitleOverlay');
    const text = document.getElementById('subtitleText');

    if (!overlay || !text) return;

    // Get values from inputs if they exist
    const fontSizeInput = document.getElementById('subtitleFontSize');
    const colorInput = document.getElementById('subtitleColor');
    const bgColorInput = document.getElementById('subtitleBgColor');
    const opacityInput = document.getElementById('subtitleBgOpacity');

    if (fontSizeInput && fontSizeInput.value) {
        subtitleSettings.fontSize = parseInt(fontSizeInput.value);
    }
    if (colorInput && colorInput.value) {
        subtitleSettings.color = colorInput.value;
    }
    if (bgColorInput && bgColorInput.value) {
        subtitleSettings.backgroundColor = bgColorInput.value;
    }
    if (opacityInput && opacityInput.value) {
        subtitleSettings.backgroundOpacity = parseInt(opacityInput.value);
    }

    // Apply styles to text element
    text.style.fontSize = subtitleSettings.fontSize + 'px';
    text.style.color = subtitleSettings.color;

    // Convert opacity to hex
    const opacityHex = Math.round(subtitleSettings.backgroundOpacity * 2.55).toString(16).padStart(2, '0');
    text.style.backgroundColor = subtitleSettings.backgroundColor + opacityHex;

    // Apply positioning with persistence
    applySubtitlePosition(overlay, subtitleSettings.position);

    console.log('Subtitle style updated:', subtitleSettings);
}

function applySubtitlePosition(overlay, position) {
    // Reset all positioning
    overlay.style.left = '';
    overlay.style.right = '';
    overlay.style.top = '';
    overlay.style.bottom = '';
    overlay.style.transform = '';
    overlay.style.maxWidth = '80%';

    // Apply positioning with subtle offsets that don't interfere with video
    switch(position) {
        case 'top-left':
            overlay.style.top = '80px';        // ← CHANGE THIS: Distance from top
            overlay.style.left = '60px';       // ← CHANGE THIS: Distance from left
            overlay.style.transform = 'none';
            break;

        case 'top-center':
            overlay.style.top = '80px';        // ← CHANGE THIS: Distance from top
            overlay.style.left = '50%';
            overlay.style.transform = 'translateX(-50%)';
            break;

        case 'top-right':
            overlay.style.top = '80px';        // ← CHANGE THIS: Distance from top
            overlay.style.right = '60px';      // ← CHANGE THIS: Distance from right
            overlay.style.transform = 'none';
            break;

        case 'center-left':
            overlay.style.top = '50%';
            overlay.style.left = '60px';       // ← CHANGE THIS: Distance from left
            overlay.style.transform = 'translateY(-50%)';
            break;

        case 'center-right':
            overlay.style.top = '50%';
            overlay.style.right = '60px';      // ← CHANGE THIS: Distance from right
            overlay.style.transform = 'translateY(-50%)';
            break;

        default: // bottom-center and any other case
            overlay.style.bottom = '90px';    // ← CHANGE THIS: Distance from bottom
            overlay.style.left = '50%';
            overlay.style.transform = 'translateX(-50%)';
            break;
    }

    console.log('Applied subtitle position:', position);
}

function saveSubtitleSettings() {
    try {
        localStorage.setItem('streamhub_subtitle_settings', JSON.stringify(subtitleSettings));
        console.log('Subtitle settings saved:', subtitleSettings);
    } catch (e) {
        console.error('Failed to save subtitle settings:', e);
    }
}

// Input change handler
function onSubtitleInputChange() {
    console.log('Subtitle input changed');
    updateSubtitleStyle();
    saveSubtitleSettings();
}
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// Search System Variables
let searchResults = [];
let selectedSearchIndex = 0;
let searchQuery = '';

// Initialize search system
function initializeSearchSystem() {
    // Detect OS for keyboard shortcut display
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutElement = document.getElementById('searchShortcut');
    if (shortcutElement) {
        shortcutElement.textContent = isMac ? '⌘⇧K' : 'Ctrl+Shift+K';
    }
}

// Show search modal
function showSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');

    modal.classList.add('show');
    setTimeout(() => {
        input.focus();
    }, 100);

    // Load initial results (show all videos)
    performSearch('');
}

// Hide search modal
function hideSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchInput');

    modal.classList.remove('show');
    input.value = '';
    searchQuery = '';
    selectedSearchIndex = 0;
}

// Perform smart search
function performSearch(query) {
    searchQuery = query.toLowerCase().trim();
    searchResults = [];

    if (searchQuery === '') {
        // Show all videos when no query
        searchResults = videoLibrary.map((video, index) => ({
            type: 'video',
            video: video,
            index: index,
            score: 0,
            matchType: 'all'
        }));
    } else {
        // Search through video library
        videoLibrary.forEach((video, index) => {
            const titleMatch = video.title.toLowerCase().includes(searchQuery);
            const typeMatch = video.type.toLowerCase().includes(searchQuery);
            const durationMatch = video.duration.includes(searchQuery);

            if (titleMatch || typeMatch || durationMatch) {
                let score = 0;
                let matchType = '';

                if (video.title.toLowerCase().startsWith(searchQuery)) {
                    score += 100;
                    matchType = 'title-start';
                } else if (titleMatch) {
                    score += 50;
                    matchType = 'title';
                } else if (typeMatch) {
                    score += 25;
                    matchType = 'type';
                } else if (durationMatch) {
                    score += 10;
                    matchType = 'duration';
                }

                searchResults.push({
                    type: 'video',
                    video: video,
                    index: index,
                    score: score,
                    matchType: matchType
                });
            }
        });

        // Sort by relevance score
        searchResults.sort((a, b) => b.score - a.score);

        // Add "Add new video" option if query doesn't match exactly
        const exactMatch = videoLibrary.find(v =>
            v.title.toLowerCase() === searchQuery
        );

        if (!exactMatch && searchQuery.length > 0) {
            searchResults.unshift({
                type: 'add',
                query: query,
                score: 1000,
                matchType: 'add'
            });
        }
    }

    renderSearchResults();
}

// Render search results
function renderSearchResults() {
    const container = document.getElementById('searchResults');
    const actionsContainer = document.getElementById('searchActions');

    if (searchResults.length === 0) {
        container.innerHTML = `
            <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <div class="search-empty-title">No results found</div>
                <div>Try searching with different keywords</div>
                <div class="search-shortcuts">
                    <span class="search-shortcut-item">Enter</span>
                    <span>to add as new video</span>
                </div>
            </div>
        `;
        actionsContainer.style.display = searchQuery ? 'flex' : 'none';
        return;
    }

    let html = '';

    // Group results by type
    const videoResults = searchResults.filter(r => r.type === 'video');
    const addResults = searchResults.filter(r => r.type === 'add');

    // Add new video section
    if (addResults.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title">
                    <span class="material-icons">add</span>
                    Add New
                </div>
                <div class="search-results">
        `;

        addResults.forEach((result, index) => {
            const isSelected = index === selectedSearchIndex;
            html += `
                <div class="search-result-item ${isSelected ? 'selected' : ''}"
                     onclick="selectSearchResult(${index})"
                     data-index="${index}">
                    <div class="search-result-thumbnail">
                        <span class="material-icons">add</span>
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-title">Add "${highlightMatch(result.query, searchQuery)}"</div>
                        <div class="search-result-meta">
                            <span class="search-result-badge">New Video</span>
                            <span>Add to your library</span>
                        </div>
                    </div>
                    <div class="search-result-action">
                        <span class="material-icons">arrow_forward</span>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    // Video results section
    if (videoResults.length > 0) {
        html += `
            <div class="search-section">
                <div class="search-section-title">
                    <span class="material-icons">movie</span>
                    Your Library (${videoResults.length})
                </div>
                <div class="search-results">
        `;

        videoResults.forEach((result, index) => {
            const actualIndex = addResults.length + index;
            const isSelected = actualIndex === selectedSearchIndex;
            const video = result.video;

            html += `
                <div class="search-result-item ${isSelected ? 'selected' : ''}"
                     onclick="selectSearchResult(${actualIndex})"
                     data-index="${actualIndex}">
                    <div class="search-result-thumbnail">
                        ${video.thumbnail ?
                          `<img src="${video.thumbnail}" alt="${video.title}">` :
                          `<span class="material-icons">movie</span>`
                        }
                    </div>
                    <div class="search-result-info">
                        <div class="search-result-title">${highlightMatch(video.title, searchQuery)}</div>
                        <div class="search-result-meta">
                            <span class="search-result-badge">${video.type}</span>
                            <span>${video.duration}</span>
                            <span>${getMatchTypeLabel(result.matchType)}</span>
                        </div>
                    </div>
                    <div class="search-result-action">
                        <span class="material-icons">play_arrow</span>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
    }

    container.innerHTML = html;
    actionsContainer.style.display = 'none';
}

// Highlight matching text
function highlightMatch(text, query) {
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get match type label
function getMatchTypeLabel(matchType) {
    switch(matchType) {
        case 'title-start': return 'Title match';
        case 'title': return 'In title';
        case 'type': return 'File type';
        case 'duration': return 'Duration';
        default: return '';
    }
}

// Select search result
function selectSearchResult(index) {
    selectedSearchIndex = index;
    updateSearchSelection();
}

// Update search selection visual
function updateSearchSelection() {
    document.querySelectorAll('.search-result-item').forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSearchIndex);
    });
}

// Execute selected search result
function executeSearchResult() {
    if (searchResults.length === 0) {
        if (searchQuery.trim()) {
            addVideoFromSearch();
        }
        return;
    }

    const result = searchResults[selectedSearchIndex];

    if (result.type === 'add') {
        addVideoFromSearch();
    } else if (result.type === 'video') {
        hideSearchModal();
        playVideo(result.video.id);
    }
}

// Add video from search
function addVideoFromSearch() {
    const query = searchQuery || document.getElementById('searchInput').value.trim();

    if (!query) return;

    let videoUrl = query;
    let videoTitle = query;

    if (query.startsWith('http') || query.includes('.mp4') || query.includes('.webm') || query.includes('.ogg')) {
        videoUrl = query;
        videoTitle = query.split('/').pop().split('.')[0].replace(/[-_]/g, ' ');
    } else {
        videoUrl = `./videos/${query.toLowerCase().replace(/\s+/g, '_')}.mp4`;
        videoTitle = query;
    }

    const newVideo = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: videoTitle,
        duration: "Unknown",
        type: videoUrl.split('.').pop().toUpperCase(),
        url: videoUrl,
        thumbnail: null,
        subtitles: null
    };

    videoLibrary = [...videoLibrary, newVideo];
    loadLibrary();
    updateVideoCount();
    hideSearchModal();

    showActionFeedback('add', `Added "${videoTitle}"`);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    performSearch('');
    selectedSearchIndex = 0;
}

// Enhanced keyboard shortcuts for search
function setupSearchKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Open search modal with Cmd+Shift+K (Mac) or Ctrl+Shift+K (Windows/Linux)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            showSearchModal();
            return;
        }

        // Handle search modal navigation
        const searchModal = document.getElementById('searchModal');
        if (searchModal.classList.contains('show')) {
            switch(e.key) {
                case 'Escape':
                    e.preventDefault();
                    hideSearchModal();
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    selectedSearchIndex = Math.min(selectedSearchIndex + 1, searchResults.length - 1);
                    updateSearchSelection();
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
                    updateSearchSelection();
                    break;

                case 'Enter':
                    e.preventDefault();
                    executeSearchResult();
                    break;

                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
                    } else {
                        selectedSearchIndex = Math.min(selectedSearchIndex + 1, searchResults.length - 1);
                    }
                    updateSearchSelection();
                    break;
            }
        }
    });

    // Search input event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            performSearch(e.target.value);
            selectedSearchIndex = 0;
        });
    }
}

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

// Event Listeners
document.addEventListener('fullscreenchange', function() {
    const playerContainer = document.getElementById('playerContainer');
    if (document.fullscreenElement) {
        console.log('Entered fullscreen');
        playerContainer.classList.add('fullscreen');
    } else {
        console.log('Exited fullscreen');
        playerContainer.classList.remove('fullscreen');
    }
});

document.addEventListener('visibilitychange', function() {
    const player = document.getElementById('mainVideoPlayer');
    if (document.hidden) {
        if (!player.paused && !isMiniPlayerMode) {
            player.pause();
            console.log('Page hidden, video paused');
        }
    }
});

window.addEventListener('resize', function() {
    if (isMiniPlayerMode) {
        const miniPlayer = document.getElementById('miniPlayer');
        const rect = miniPlayer.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            miniPlayer.style.right = '20px';
        }
    }
});

window.addEventListener('beforeunload', function() {
    const player = document.getElementById('mainVideoPlayer');
    if (currentVideo && player.duration && player.currentTime) {
        progressData[currentVideo.id] = {
            currentTime: player.currentTime,
            duration: player.duration
        };
        saveProgressData();
    }
});

window.testMove = function(from, to) {
    console.log(`Testing manual move from ${from} to ${to}`);
    moveVideoToPosition(from, to);
};

window.testMoveFallback = function(from, to) {
    console.log(`Testing fallback move from ${from} to ${to}`);
    moveVideoToPositionFallback(from, to);
};

window.debugVideoLibrary = function() {
    console.log('=== VIDEO LIBRARY DEBUG ===');
    console.log('Array length:', videoLibrary.length);
    console.log('Array contents:');
    videoLibrary.forEach((v, i) => {
        console.log(`  ${i}: ${v.title} (ID: ${v.id})`);
    });

    const cards = document.querySelectorAll('.video-card');
    console.log('DOM cards count:', cards.length);
    console.log('DOM contents:');
    cards.forEach((card, i) => {
        console.log(`  ${i}: ${card.dataset.title} (ID: ${card.dataset.videoId})`);
    });
};

// Debug function for subtitle testing
window.debugSubtitleParsing = function(srtContent) {
    console.log('🔍 Testing SRT parsing...');
    const parsed = parseSRT(srtContent);
    console.log('Parsed entries:', parsed);

    parsed.forEach((entry, i) => {
        if (i < 5) { // Show first 5 entries
            console.log(`Entry ${entry.index}:`, {
                time: `${formatSecondsToTime(entry.startTime)} → ${formatSecondsToTime(entry.endTime)}`,
                text: entry.text,
                html: entry.html,
                hasFormatting: entry.hasFormatting,
                position: entry.position
            });
        }
    });

    return parsed;
};

// Debug function to check what's stored
window.debugThumbnails = function() {
    const saved = localStorage.getItem('streamhub_thumbnails');
    if (saved) {
        const data = JSON.parse(saved);
        console.log('Stored thumbnails:', Object.keys(data));
        Object.keys(data).forEach(key => {
            const thumb = data[key];
            console.log(`${key}:`, {
                title: thumb.title,
                duration: thumb.duration,
                type: thumb.type,
                hasData: thumb.thumbnail ? 'Yes' : 'No',
                size: thumb.thumbnail ? Math.round(thumb.thumbnail.length / 1024) + 'KB' : '0KB'
            });
        });
    } else {
        console.log('No thumbnails stored');
    }
};

// Test with your Spanish subtitle content
window.testSpanishSubtitles = function() {
    const testContent = `1
00:00:01,769 --> 00:00:03,936
<font color="red">[spanish]</font> Kim: I have a case in Tucumcari.

2
00:00:03,938 --> 00:00:05,587
<i>And there's something I want to discuss with you.</i>

3
00:00:05,589 --> 00:00:07,197
<b>I'm not representing Mesa Verde.</b>`;

    return debugSubtitleParsing(testContent);
};

// Add this function to test the subtitle controls
window.testSubtitleControls = function() {
    console.log('Testing subtitle controls...');

    // Test font size
    console.log('Testing font size buttons...');
    adjustSubtitleSize(4);
    setTimeout(() => adjustSubtitleSize(-4), 1000);

    // Test sync
    setTimeout(() => {
        console.log('Testing sync buttons...');
        adjustSubtitleSync(1.0);
    }, 2000);

    setTimeout(() => adjustSubtitleSync(-1.0), 3000);

    // Test position
    setTimeout(() => {
        console.log('Testing position buttons...');
        setSubtitlePosition('top-center');
    }, 4000);

    setTimeout(() => setSubtitlePosition('bottom-center'), 5000);

    console.log('All tests scheduled. Watch the console and subtitle display.');
};

// Debug function to see what subtitles are saved
window.debugSavedSubtitles = function() {
    const subtitlesList = JSON.parse(localStorage.getItem('streamhub_subtitles_list') || '[]');
    console.log('=== SAVED SUBTITLES DEBUG ===');
    console.log('Total saved subtitle files:', subtitlesList.length);

    subtitlesList.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            console.log(`${key}:`, {
                language: parsed.language,
                videoId: parsed.videoId,
                fileName: parsed.fileName,
                uploadedAt: new Date(parsed.uploadedAt).toLocaleString(),
                contentSize: Math.round(parsed.content.length / 1024) + 'KB'
            });
        }
    });
};


console.log('StreamHub JavaScript loaded successfully');
