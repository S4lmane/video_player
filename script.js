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
        title: "Utopia - Soundtrack",
        duration: "3:20",
        type: "MP4",
        url: "./videos/Utopia_Soundtrack.mp4",
        thumbnail: "./videos/Utopia_Soundtrack.png",
        subtitles: null
    },
    {
        id: 6,
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
        id: 7,
        title: "5 Second",
        duration: "1:45",
        type: "MP4",
        url: "./videos/5sec_vid.mp4",
        thumbnail: "./videos/5sec_vid.jpg",
        subtitles: null
    },
    {
        id: 8,
        title: "The Conjuring: Last Rites",
        duration: "3:20",
        type: "MP4",
        url: "./videos/theconjuring.mp4",
        thumbnail: "./videos/theconjuring.jpg",
        subtitles: null
    },
    {
        id: 9,
        title: "As Above, So Below",
        duration: "3:20",
        type: "MP4",
        url: "./videos/As Above So Below.mp4",
        thumbnail: "./videos/As Above So Below.jpg",
        subtitles: null
    },
    {
        id: 10,
        title: "Utopia - Soundtrack",
        duration: "3:20",
        type: "MP4",
        url: "./videos/Utopia_Soundtrack.mp4",
        thumbnail: "./videos/Utopia_Soundtrack.png",
        subtitles: null
    },
    {
        id: 11,
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
        id: 12,
        title: "5 Second",
        duration: "1:45",
        type: "MP4",
        url: "./videos/5sec_vid.mp4",
        thumbnail: "./videos/5sec_vid.jpg",
        subtitles: null
    },
    {
        id: 13,
        title: "The Conjuring: Last Rites",
        duration: "3:20",
        type: "MP4",
        url: "./videos/theconjuring.mp4",
        thumbnail: "./videos/theconjuring.jpg",
        subtitles: null
    },
    {
        id: 14,
        title: "As Above, So Below",
        duration: "3:20",
        type: "MP4",
        url: "./videos/As Above So Below.mp4",
        thumbnail: "./videos/As Above So Below.jpg",
        subtitles: null
    },
    {
        id: 15,
        title: "Utopia - Soundtrack",
        duration: "3:20",
        type: "MP4",
        url: "./videos/Utopia_Soundtrack.mp4",
        thumbnail: "./videos/Utopia_Soundtrack.png",
        subtitles: null
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

    // Create a completely new video object with unique ID
    const newVideo = {
        id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
        title: videoTitle,
        duration: "Unknown",
        type: videoUrl.split('.').pop().toUpperCase(),
        url: videoUrl,
        thumbnail: null,
        subtitles: null
    };

    // Add to array using spread operator to avoid reference issues
    videoLibrary = [...videoLibrary, newVideo];

    input.value = '';
    loadLibrary();
    updateVideoCount();
    verifyArrayIntegrity(); // Debug check
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
    selectedVideoId = null;
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
            loadLibrary();
            updateVideoCount();

            if (isMiniPlayerMode && currentVideo && currentVideo.id === selectedVideoId) {
                const miniArtwork = document.getElementById('miniArtwork');
                miniArtwork.innerHTML = `<img src="${e.target.result}" alt="${video.title}">`;
                updateMiniInfo();
            }
            console.log('Thumbnail updated for video:', video.title);
            selectedVideoId = null;
        }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
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
    });

    player.addEventListener('pause', function() {
        console.log('Video paused');
        playPauseBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
        centerPlayBtn.classList.remove('hidden');
        document.getElementById('miniPlayBtn').innerHTML = '<span class="material-icons">play_arrow</span>';
        document.getElementById('miniArtwork').classList.remove('spinning');
        showActionFeedback('pause', 'Paused');
    });

    player.addEventListener('ended', function() {
        console.log('Video ended, handling next action');
        handleVideoEnd();
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
    if (player.paused) {
        console.log('Playing video');
        player.play();
    } else {
        console.log('Pausing video');
        player.pause();
    }
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
        return;
    }

    console.log('Enabling mini player for:', currentVideo.title);
    const player = document.getElementById('mainVideoPlayer');
    const wasPlaying = !player.paused;

    // Store current state to prevent interruption
    const playerState = {
        currentTime: player.currentTime,
        paused: player.paused,
        volume: player.volume,
        muted: player.muted
    };

    isMiniPlayerMode = true;
    const miniPlayer = document.getElementById('miniPlayer');
    const miniArtwork = document.getElementById('miniArtwork');
    const miniTitle = document.getElementById('miniTitle');

    miniTitle.textContent = currentVideo.title;

    if (currentVideo.thumbnail) {
        miniArtwork.innerHTML = `<img src="${currentVideo.thumbnail}" alt="${currentVideo.title}">`;
    } else {
        miniArtwork.innerHTML = '<span class="material-icons">movie</span>';
    }

    document.getElementById('playerPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';
    document.getElementById('mainPage').classList.add('with-mini-player');
    miniPlayer.classList.add('show');

    // Restore state without interruption
    setTimeout(() => {
        player.currentTime = playerState.currentTime;
        player.volume = playerState.volume;
        player.muted = playerState.muted;

        if (wasPlaying) {
            miniArtwork.classList.add('spinning');
            document.getElementById('miniPlayBtn').innerHTML = '<span class="material-icons">pause</span>';
        }

        // Drag is already setup globally, no need to call setupMiniPlayerDrag again
        console.log('Mini player enabled - drag system ready');
    }, 50);

    updateMiniPlayerProgress();
    startMiniPlayerUpdates();
    updateMiniInfo();
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

function expandMiniPlayer() {
    if (!currentVideo) {
        console.error('No current video to expand mini player');
        return;
    }

    console.log('Expanding mini player to full player');
    const player = document.getElementById('mainVideoPlayer');

    // Store current state to prevent interruption
    const playerState = {
        currentTime: player.currentTime,
        paused: player.paused,
        volume: player.volume,
        muted: player.muted,
        src: player.src
    };

    // Hide mini player and show full player
    document.getElementById('miniPlayer').classList.remove('show');
    document.getElementById('mainPage').classList.remove('with-mini-player');
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('playerPage').style.display = 'block';

    // Set up the player page
    document.getElementById('currentVideoTitle').textContent = currentVideo.title;
    const playerContainer = document.getElementById('playerContainer');
    if (currentVideo.thumbnail) {
        playerContainer.style.backgroundImage = `url(${currentVideo.thumbnail})`;
    } else {
        playerContainer.style.backgroundImage = 'none';
    }

    // Ensure the video source is correct and restore state
    if (player.src !== playerState.src) {
        player.src = playerState.src;
        player.load();

        player.addEventListener('loadedmetadata', function restoreState() {
            player.currentTime = playerState.currentTime;
            player.volume = playerState.volume;
            player.muted = playerState.muted;

            if (!playerState.paused) {
                player.play();
            }

            updateVolumeIcon();
            player.removeEventListener('loadedmetadata', restoreState);
        }, { once: true });
    } else {
        // If source is the same, just restore state
        setTimeout(() => {
            player.currentTime = playerState.currentTime;
            player.volume = playerState.volume;
            player.muted = playerState.muted;

            if (!playerState.paused) {
                player.play();
            }

            updateVolumeIcon();
        }, 50);
    }

    stopMiniPlayerUpdates();
    hideDragBlurOverlay(); // Ensure drag overlay is hidden
    isMiniPlayerMode = false;

    console.log('Mini player expanded successfully');
}

function toggleMiniPlay() {
    console.log('Toggling mini player play/pause');
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

// Subtitle Functions
function loadAvailableSubtitles() {
    console.log('Loading available subtitles for video:', currentVideo ? currentVideo.title : 'None');
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
        currentVideo.subtitles.forEach(sub => {
            console.log('Loading subtitle:', sub.language, sub.url);
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
                    if (!response.ok) throw new Error(`Failed to fetch subtitle: ${sub.url}`);
                    return response.text();
                })
                .then(data => {
                    console.log('Subtitle data fetched:', sub.language, data.slice(0, 50) + '...');
                    return parseSRT(data);
                })
                .then(parsed => {
                    console.log('Parsed subtitle entries:', sub.language, parsed.length);
                    currentSubtitles.push({ language: sub.language, entries: parsed });
                })
                .catch(err => {
                    console.error('Error loading subtitle:', sub.language, err);
                    handleSubtitleError(err, sub.language);
                });
        });
    } else {
        console.log('No subtitles available for this video');
    }
}

function parseSRT(data) {
    console.log('Parsing SRT data');
    const entries = [];
    const blocks = data.split(/\n\s*\n/);

    for (let block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length < 3) continue;

        const index = parseInt(lines[0]);
        if (isNaN(index)) continue;

        const timeLine = lines[1];

        if (timeLine.includes(' --> ')) {
            const timeParts = timeLine.split(' --> ');
            if (timeParts.length === 2) {
                const startTime = parseTime(timeParts[0].trim());
                const endTime = parseTime(timeParts[1].trim());
                const text = lines.slice(2).join('\n').replace(/<[^>]*>/g, '');

                entries.push({ index, startTime, endTime, text });
            }
        }
    }
    console.log('SRT parsed, entries:', entries.length);
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

function updateSubtitles(currentTime) {
    const subtitleOverlay = document.getElementById('subtitleOverlay');
    const subtitleText = document.getElementById('subtitleText');

    if (!currentSubtitleTrack || !currentSubtitleTrack.entries) {
        subtitleOverlay.classList.remove('show');
        return;
    }

    const currentEntry = currentSubtitleTrack.entries.find(
        entry => currentTime >= entry.startTime && currentTime <= entry.endTime
    );

    if (currentEntry) {
        subtitleText.textContent = currentEntry.text;
        subtitleOverlay.classList.add('show');
    } else {
        subtitleOverlay.classList.remove('show');
    }
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
        const parsed = parseSRT(e.target.result);
        const language = file.name.split('.')[0];

        if (!currentVideo.subtitles) {
            currentVideo.subtitles = [];
        }

        const subtitleUrl = URL.createObjectURL(file);
        currentVideo.subtitles.push({ language, url: subtitleUrl });
        currentSubtitles.push({ language, entries: parsed });

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
        console.log('Subtitle uploaded and selected:', language);
    };
    reader.readAsText(file);
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

        // Handle P key globally - works from both mini player and full player
        if (e.key.toLowerCase() === 'p') {
            e.preventDefault();
            handlePKeyToggle();
            return; // Exit early to prevent other processing
        }

        // Only handle video control keys when video player is visible and NOT in move mode
        if (playerPageVisible && !isMoveMode && !isContextMenuOpen) {
            switch(e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    togglePlayPause();
                    break;
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

function handlePKeyToggle() {
    console.log('=== P KEY TOGGLE ===');
    console.log('isMiniPlayerMode:', isMiniPlayerMode);
    console.log('currentVideo:', currentVideo ? currentVideo.title : 'None');

    const playerPageVisible = document.getElementById('playerPage').style.display !== 'none';
    console.log('playerPageVisible:', playerPageVisible);

    if (isMiniPlayerMode) {
        // Currently in mini player mode - expand to full player
        console.log('📱→🖥️ Expanding mini player to full player');
        expandMiniPlayer();
        showActionFeedback('open_in_full', 'Expanded to Full Player');
    } else if (playerPageVisible && currentVideo) {
        // Currently in full player mode - minimize to mini player
        console.log('🖥️→📱 Minimizing to mini player');
        enableMiniPlayer();
        showActionFeedback('widgets', 'Minimized to Mini Player');
    } else if (currentVideo) {
        // Video exists but not in player mode - go to full player
        console.log('📂→🖥️ Opening video in full player');
        playVideo(currentVideo.id);
        showActionFeedback('play_circle', 'Opened in Full Player');
    } else {
        // No video available
        console.log('❌ No video available to toggle');
        showActionFeedback('error', 'No video available');
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

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing StreamHub...');
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
    setupPlaybackModeButton();
    observeCastModal();
    initializePictureInPicture();

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

console.log('StreamHub JavaScript loaded successfully');
