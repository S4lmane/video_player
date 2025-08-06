// StreamHub Audio System - Custom Audio Track Replacement
// This module allows users to replace video audio with custom audio tracks

// Audio System Variables
let audioTracks = [];
let currentAudioTrack = null;
let originalVideoVolume = 1;
let customAudioElement = null;
let audioSyncOffset = 0;
let audioModalVisible = false;
let isAudioSyncMode = false;
let audioVisualizerActive = false;
let audioContext = null;
let audioAnalyser = null;
let audioDataArray = null;

// Audio Storage Keys
const AUDIO_STORAGE_KEY = 'streamhub_audio_tracks';
const AUDIO_SETTINGS_KEY = 'streamhub_audio_settings';

// Audio Settings
let audioSettings = {
    customVolume: 100,
    fadeInDuration: 2,
    fadeOutDuration: 2,
    syncOffset: 0,
    enableVisualization: false,
    replacementMode: 'replace' // 'replace', 'mix', 'overlay'
};

// Initialize Audio System
function initializeAudioSystem() {
    console.log('🎵 Initializing StreamHub Audio System...');

    loadAudioSettings();
    loadAudioTracks();
    setupAudioEventListeners();

    console.log('✅ Audio System initialized successfully');
}

// Load audio settings from localStorage
function loadAudioSettings() {
    try {
        const saved = localStorage.getItem(AUDIO_SETTINGS_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            audioSettings = { ...audioSettings, ...settings };
        }

        // Update UI elements
        updateAudioSettingsUI();

        console.log('Audio settings loaded:', audioSettings);
    } catch (error) {
        console.error('Failed to load audio settings:', error);
    }
}

// Save audio settings to localStorage
function saveAudioSettings() {
    try {
        localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(audioSettings));
        console.log('Audio settings saved:', audioSettings);
    } catch (error) {
        console.error('Failed to save audio settings:', error);
    }
}

// Enhanced loading with large file handling
function loadAudioTracks() {
    try {
        const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
        if (saved) {
            const tracks = JSON.parse(saved);
            audioTracks = tracks.filter(track => {
                // Verify track data is still valid
                if (!track.id || !track.title || !track.videoId) {
                    return false;
                }

                // Handle large files that need re-upload
                if (track.isLargeFile && track.needsReupload) {
                    track.status = 'needs-reupload';
                    track.url = null;
                }

                return true;
            });
        }

        console.log(`Loaded ${audioTracks.length} audio tracks from storage`);

        // Check for tracks that need re-upload
        const needReupload = audioTracks.filter(t => t.needsReupload);
        if (needReupload.length > 0) {
            console.log(`${needReupload.length} large audio files need to be re-uploaded`);
        }

        updateAudioTracksUI();
    } catch (error) {
        console.error('Failed to load audio tracks:', error);
        audioTracks = [];
    }
}

// Enhanced save function with compression for large files
function saveAudioTracks() {
    try {
        // For large files, don't save the blob URL data to localStorage
        // Instead, save metadata and recreate blob URLs on load
        const tracksToSave = audioTracks.map(track => {
            const trackData = {
                id: track.id,
                title: track.title,
                fileName: track.fileName,
                fileSize: track.fileSize,
                duration: track.duration,
                format: track.format,
                videoId: track.videoId,
                videoTitle: track.videoTitle,
                uploadedAt: track.uploadedAt,
                isCustom: track.isCustom
            };

            // Only save small audio data to localStorage
            if (track.fileSize < 10 * 1024 * 1024) { // 10MB threshold
                trackData.url = track.url;
            } else {
                // For large files, we'll need to re-upload them each session
                trackData.isLargeFile = true;
                trackData.needsReupload = true;
            }

            return trackData;
        });

        localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(tracksToSave));
        console.log(`Saved ${audioTracks.length} audio tracks to storage`);

        // Show warning for large files
        const largeFiles = tracksToSave.filter(t => t.isLargeFile);
        if (largeFiles.length > 0) {
            console.warn(`${largeFiles.length} large audio files will need to be re-uploaded next session`);
        }

    } catch (error) {
        console.error('Failed to save audio tracks:', error);

        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded with large files');
            // Try saving without large file data
            const smallTracksOnly = audioTracks.filter(track => track.fileSize < 10 * 1024 * 1024);
            try {
                localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(smallTracksOnly));
                showActionFeedback('warning', 'Large audio files saved for session only');
            } catch (e) {
                console.error('Failed to save even small tracks:', e);
                cleanupOldAudioTracks();
            }
        }
    }
}

// Clean up old audio tracks to free storage space
function cleanupOldAudioTracks() {
    try {
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        audioTracks = audioTracks.filter(track => {
            return track.uploadedAt && track.uploadedAt > oneMonthAgo;
        });

        saveAudioTracks();
        updateAudioTracksUI();

        console.log(`Cleaned up old audio tracks, ${audioTracks.length} remaining`);
    } catch (error) {
        console.error('Failed to cleanup old audio tracks:', error);
    }
}

// Show Audio Modal
function showAudioModal() {
    if (!currentVideo) {
        showActionFeedback('error', 'No video loaded');
        return;
    }

    const modal = document.getElementById('audioModal');
    modal.classList.add('show');
    audioModalVisible = true;

    // Load current video's audio tracks
    loadVideoAudioTracks();
    updateAudioTracksUI();
    updateAudioSettingsUI();

    console.log('Audio modal opened for:', currentVideo.title);
}

// Hide Audio Modal
function hideAudioModal() {
    const modal = document.getElementById('audioModal');
    modal.classList.remove('show');
    audioModalVisible = false;

    // Stop any preview audio
    stopAudioPreview();

    console.log('Audio modal closed');
}

// Load audio tracks for current video
function loadVideoAudioTracks() {
    if (!currentVideo) return;

    // Filter tracks for current video
    const videoTracks = audioTracks.filter(track => track.videoId === currentVideo.id);

    console.log(`Found ${videoTracks.length} audio tracks for "${currentVideo.title}"`);
    return videoTracks;
}

// Handle audio file upload
function handleAudioUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        console.error('No audio file selected');
        return;
    }

    if (!currentVideo) {
        showActionFeedback('error', 'No video loaded');
        return;
    }

    console.log('Processing audio upload:', file.name);

    // Enhanced file type validation (MIME type can be unreliable)
    const fileName = file.name.toLowerCase();
    const fileExtension = file.name.toLowerCase().split('.').pop();
    //const fileExtension = fileName.split('.').pop();
    const validExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'];
    const validMimeTypes = [
        'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/wave',
        'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/flac',
        'audio/x-wav', 'audio/vnd.wav', 'application/ogg'
    ];

    console.log('File type validation:', {
        fileName: file.name,
        mimeType: file.type,
        extension: fileExtension,
        size: file.size
    });

    // Check both extension and MIME type (extension takes priority)
    const hasValidExtension = validExtensions.includes(fileExtension);
    const hasValidMimeType = file.type && validMimeTypes.some(type =>
        file.type.toLowerCase().includes(type.toLowerCase().split('/')[1]) ||
        file.type.toLowerCase() === type.toLowerCase()
    );

    // Accept if either extension is valid OR MIME type is valid (or MIME type is empty/unknown)
    if (!hasValidExtension && file.type && !hasValidMimeType) {
        console.error('Invalid audio format detected:', {
            extension: fileExtension,
            mimeType: file.type,
            validExtensions,
            validMimeTypes
        });
        showActionFeedback('error', `Invalid audio format: ${fileExtension.toUpperCase()}. Use MP3, WAV, OGG, AAC, M4A, FLAC, or WMA`);
        return;
    }

    // Log successful validation
    if (hasValidExtension) {
        console.log(`✅ Audio file validated by extension: .${fileExtension}`);
    }
    if (hasValidMimeType || !file.type) {
        console.log(`✅ Audio file MIME type: ${file.type || 'unknown (accepted)'}`);
    }

    // Check file size (max 200MB for large audio files)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
        showActionFeedback('error', 'Audio file too large (max 200MB)');
        return;
    }

    // Show warning for large files
    if (file.size > 100 * 1024 * 1024) {
        const proceed = confirm(`This is a large audio file (${formatFileSize(file.size)}). It may take longer to load and use more memory. Continue?`);
        if (!proceed) {
            return;
        }
    }

    // Create blob URL for the audio
    const audioUrl = URL.createObjectURL(file);

    // Extract audio information with better format detection
    //const fileExtension = file.name.toLowerCase().split('.').pop();
    const audioTrack = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: file.name.split('.')[0],
        fileName: file.name,
        fileSize: file.size,
        duration: 0, // Will be determined when audio loads
        format: fileExtension.toUpperCase(),
        mimeType: file.type || `audio/${fileExtension}`, // Fallback MIME type
        url: audioUrl,
        videoId: currentVideo.id,
        videoTitle: currentVideo.title,
        uploadedAt: Date.now(),
        isCustom: true
    };

    // Load audio to get duration with better error handling
    const tempAudio = new Audio(audioUrl);

    // Set up success handler
    tempAudio.addEventListener('loadedmetadata', function() {
        audioTrack.duration = tempAudio.duration;

        console.log('✅ Audio file loaded successfully:', {
            title: audioTrack.title,
            duration: tempAudio.duration,
            format: audioTrack.format,
            size: formatFileSize(audioTrack.fileSize)
        });

        // Add to tracks array
        audioTracks.push(audioTrack);

        // Save to storage
        saveAudioTracks();

        // Update UI
        updateAudioTracksUI();

        // Auto-select if it's the first track
        if (audioTracks.filter(t => t.videoId === currentVideo.id).length === 1) {
            selectAudioTrack(audioTrack);
        }

        showActionFeedback('audiotrack', `Audio "${audioTrack.title}" added successfully`);
        console.log('Audio track added:', {
            id: audioTrack.id,
            title: audioTrack.title,
            format: audioTrack.format,
            duration: formatDuration(audioTrack.duration)
        });
    });

    // Set up error handler with detailed logging
    tempAudio.addEventListener('error', function(e) {
        console.error('❌ Failed to load audio file:', {
            error: e,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            audioUrl: audioUrl
        });

        // Clean up blob URL
        URL.revokeObjectURL(audioUrl);

        // Try to provide helpful error message
        let errorMessage = 'Failed to load audio file';
        if (e.target && e.target.error) {
            switch(e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Audio loading was aborted';
                    break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error while loading audio';
                    break;
                case e.target.error.MEDIA_ERR_DECODE:
                    errorMessage = 'Audio file is corrupted or unsupported format';
                    break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Audio format not supported by browser';
                    break;
                default:
                    errorMessage = 'Unknown audio loading error';
            }
        }

        showActionFeedback('error', errorMessage);
        console.error('Audio loading error details:', errorMessage);
    });

    // Set crossOrigin to anonymous to avoid CORS issues
    tempAudio.crossOrigin = 'anonymous';

    // Try to load the audio
    try {
        tempAudio.load();
    } catch (loadError) {
        console.error('❌ Error during audio load attempt:', loadError);
        URL.revokeObjectURL(audioUrl);
        showActionFeedback('error', 'Failed to load audio file');
    }

    // Clear file input
    event.target.value = '';
}

// Select audio track for current video
function selectAudioTrack(track) {
    if (!track) {
        // Restore original video audio
        restoreOriginalAudio();
        return;
    }

    console.log('Selecting audio track:', track.title);

    currentAudioTrack = track;

    // Create or update custom audio element
    if (customAudioElement) {
        customAudioElement.src = track.url;
    } else {
        customAudioElement = new Audio(track.url);
        setupCustomAudioElement();
    }

    // Apply audio replacement
    applyAudioReplacement();

    // Update UI
    updateAudioTracksUI();

    showActionFeedback('audiotrack', `Audio track: ${track.title}`);
}

// Setup custom audio element with event listeners
function setupCustomAudioElement() {
    if (!customAudioElement) return;

    customAudioElement.addEventListener('loadedmetadata', function() {
        console.log('Custom audio loaded, duration:', customAudioElement.duration);

        // Sync with video if video is loaded
        const videoPlayer = document.getElementById('mainVideoPlayer');
        if (videoPlayer && !videoPlayer.paused) {
            customAudioElement.currentTime = videoPlayer.currentTime + audioSettings.syncOffset;
        }
    });

    customAudioElement.addEventListener('error', function(e) {
        console.error('Custom audio error:', e);
        showActionFeedback('error', 'Audio playback error');
        restoreOriginalAudio();
    });

    customAudioElement.addEventListener('ended', function() {
        console.log('Custom audio ended');

        // Handle audio ending based on video state
        const videoPlayer = document.getElementById('mainVideoPlayer');
        if (videoPlayer && !videoPlayer.ended) {
            // Loop audio if video is still playing
            customAudioElement.currentTime = 0;
            customAudioElement.play();
        }
    });

    // Apply audio settings
    customAudioElement.volume = audioSettings.customVolume / 100;

    console.log('Custom audio element setup complete');
}

// Apply audio replacement to video
function applyAudioReplacement() {
    if (!currentAudioTrack || !customAudioElement) return;

    const videoPlayer = document.getElementById('mainVideoPlayer');
    if (!videoPlayer) return;

    console.log('Applying audio replacement mode:', audioSettings.replacementMode);

    switch (audioSettings.replacementMode) {
        case 'replace':
            // Mute video, play custom audio
            originalVideoVolume = videoPlayer.volume;
            videoPlayer.volume = 0;
            break;

        case 'mix':
            // Lower video volume, play custom audio
            originalVideoVolume = videoPlayer.volume;
            videoPlayer.volume = videoPlayer.volume * 0.3;
            break;

        case 'overlay':
            // Keep video audio, add custom audio on top
            // Video volume unchanged
            break;
    }

    // Sync custom audio with video
    syncAudioWithVideo();
}

// Sync custom audio with video playback
function syncAudioWithVideo() {
    if (!customAudioElement) return;

    const videoPlayer = document.getElementById('mainVideoPlayer');
    if (!videoPlayer) return;

    // Apply sync offset
    const targetTime = Math.max(0, videoPlayer.currentTime + audioSettings.syncOffset);

    if (Math.abs(customAudioElement.currentTime - targetTime) > 0.5) {
        customAudioElement.currentTime = targetTime;
    }

    // Match playback state
    if (videoPlayer.paused) {
        customAudioElement.pause();
    } else {
        customAudioElement.play().catch(e => {
            console.warn('Custom audio play failed:', e);
        });
    }
}

// Restore original video audio
function restoreOriginalAudio() {
    console.log('Restoring original video audio');

    const videoPlayer = document.getElementById('mainVideoPlayer');
    if (videoPlayer && originalVideoVolume !== null) {
        videoPlayer.volume = originalVideoVolume;
    }

    if (customAudioElement) {
        customAudioElement.pause();
        customAudioElement.currentTime = 0;
    }

    currentAudioTrack = null;
    updateAudioTracksUI();

    showActionFeedback('volume_up', 'Original audio restored');
}

// Remove audio track
function removeAudioTrack(trackId) {
    console.log('Removing audio track:', trackId);

    const trackIndex = audioTracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) {
        console.error('Audio track not found:', trackId);
        return;
    }

    const track = audioTracks[trackIndex];

    // Stop if currently playing
    if (currentAudioTrack && currentAudioTrack.id === trackId) {
        restoreOriginalAudio();
    }

    // Revoke blob URL to free memory
    if (track.url && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
    }

    // Remove from array
    audioTracks.splice(trackIndex, 1);

    // Save changes
    saveAudioTracks();

    // Update UI
    updateAudioTracksUI();

    showActionFeedback('delete', `Audio "${track.title}" removed`);
}

// Preview audio track
function previewAudioTrack(track) {
    console.log('Previewing audio track:', track.title);

    // Stop any existing preview
    stopAudioPreview();

    // Create preview audio element
    const previewAudio = new Audio(track.url);
    previewAudio.volume = 0.7;
    previewAudio.currentTime = 10; // Start 10 seconds in

    previewAudio.play().then(() => {
        // Stop preview after 10 seconds
        setTimeout(() => {
            previewAudio.pause();
            previewAudio.currentTime = 0;
        }, 10000);

        showActionFeedback('play_arrow', `Previewing: ${track.title}`);
    }).catch(e => {
        console.error('Preview playback failed:', e);
        showActionFeedback('error', 'Preview failed');
    });

    // Store reference for cleanup
    window.currentPreviewAudio = previewAudio;
}

// Stop audio preview
function stopAudioPreview() {
    if (window.currentPreviewAudio) {
        window.currentPreviewAudio.pause();
        window.currentPreviewAudio.currentTime = 0;
        window.currentPreviewAudio = null;
    }
}

// Enhanced UI update with large file status
function updateAudioTracksUI() {
    const container = document.getElementById('audioTracksList');
    const countElement = document.getElementById('audioTracksCount');

    if (!container || !currentVideo) return;

    const videoTracks = audioTracks.filter(track => track.videoId === currentVideo.id);

    if (countElement) {
        countElement.textContent = `(${videoTracks.length})`;
    }

    if (videoTracks.length === 0) {
        container.innerHTML = `
            <div class="no-audio-tracks">
                <div class="no-audio-icon">🎵</div>
                <div class="no-audio-title">No custom audio tracks</div>
                <div class="no-audio-subtitle">Upload an audio file to replace the video's audio</div>
            </div>
        `;
        return;
    }

    container.innerHTML = videoTracks.map(track => {
        const isActive = currentAudioTrack && currentAudioTrack.id === track.id;
        const duration = formatDuration(track.duration);
        const fileSize = formatFileSize(track.fileSize);
        const needsReupload = track.needsReupload && !track.url;
        const isLargeFile = track.fileSize > 100 * 1024 * 1024;

        let statusIndicator = '';
        if (needsReupload) {
            statusIndicator = '<span class="audio-status-badge needs-reupload">Needs Re-upload</span>';
        } else if (isLargeFile) {
            statusIndicator = '<span class="audio-status-badge large-file">Large File</span>';
        }

        return `
            <div class="audio-track-item ${isActive ? 'active' : ''} ${needsReupload ? 'needs-reupload' : ''}" data-track-id="${track.id}">
                <div class="audio-track-info">
                    <div class="audio-track-title">
                        ${track.title}
                        ${statusIndicator}
                    </div>
                    <div class="audio-track-meta">
                        <span class="audio-track-format">${track.format}</span>
                        <span class="audio-track-duration">${duration}</span>
                        <span class="audio-track-size ${isLargeFile ? 'large-size' : ''}">${fileSize}</span>
                    </div>
                </div>
                <div class="audio-track-actions">
                    ${needsReupload ? `
                        <button class="audio-action-btn reupload" onclick="reuploadAudioTrack(${track.id})" title="Re-upload file">
                            <span class="material-icons">cloud_upload</span>
                        </button>
                    ` : `
                        <button class="audio-action-btn" onclick="previewAudioTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})" title="Preview (10s)">
                            <span class="material-icons">play_circle</span>
                        </button>
                        <button class="audio-action-btn ${isActive ? 'active' : ''}" onclick="selectAudioTrack(${JSON.stringify(track).replace(/"/g, '&quot;')})" title="${isActive ? 'Currently active' : 'Use this audio'}">
                            <span class="material-icons">${isActive ? 'volume_up' : 'audiotrack'}</span>
                        </button>
                    `}
                    <button class="audio-action-btn delete" onclick="removeAudioTrack(${track.id})" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle re-upload for large files
function reuploadAudioTrack(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    console.log('Re-uploading large audio track:', track.title);

    // Create file input for re-upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp3,.wav,.ogg,.aac,.m4a,audio/*';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Verify it's the same file (or at least same name/size)
        if (file.name !== track.fileName) {
            const proceed = confirm(`File name doesn't match. Original: "${track.fileName}", Selected: "${file.name}". Continue anyway?`);
            if (!proceed) return;
        }

        // Update track with new blob URL
        const audioUrl = URL.createObjectURL(file);
        track.url = audioUrl;
        track.needsReupload = false;
        track.status = 'ready';

        // Update storage
        saveAudioTracks();
        updateAudioTracksUI();

        showActionFeedback('cloud_done', `${track.title} re-uploaded successfully`);
        console.log('Large audio track re-uploaded:', track.title);
    };

    input.click();
}

// Update audio settings UI
function updateAudioSettingsUI() {
    const volumeInput = document.getElementById('audioCustomVolume');
    const modeSelect = document.getElementById('audioReplacementMode');
    const syncOffsetDisplay = document.getElementById('audioSyncOffset');

    if (volumeInput) volumeInput.value = audioSettings.customVolume;
    if (modeSelect) modeSelect.value = audioSettings.replacementMode;
    if (syncOffsetDisplay) syncOffsetDisplay.textContent = audioSettings.syncOffset.toFixed(1) + 's';
}

// Adjust audio volume
function adjustAudioVolume(change) {
    audioSettings.customVolume = Math.max(0, Math.min(100, audioSettings.customVolume + change));

    // Apply to custom audio element
    if (customAudioElement) {
        customAudioElement.volume = audioSettings.customVolume / 100;
    }

    // Update UI
    updateAudioSettingsUI();
    saveAudioSettings();

    showActionFeedback('volume_up', `Audio Volume: ${audioSettings.customVolume}%`);
}

// Change replacement mode
function changeReplacementMode(mode) {
    audioSettings.replacementMode = mode;

    // Re-apply audio replacement with new mode
    if (currentAudioTrack) {
        applyAudioReplacement();
    }

    // Update UI
    updateAudioSettingsUI();
    saveAudioSettings();

    const modeLabels = {
        'replace': 'Replace Original',
        'mix': 'Mix with Original',
        'overlay': 'Overlay on Original'
    };

    showActionFeedback('tune', `Mode: ${modeLabels[mode]}`);
}

// Adjust audio sync offset
function adjustAudioSync(offset) {
    audioSettings.syncOffset += offset;

    // Apply sync immediately if audio is playing
    if (currentAudioTrack && customAudioElement) {
        syncAudioWithVideo();
    }

    // Update UI
    updateAudioSettingsUI();
    saveAudioSettings();

    showActionFeedback('sync', `Audio Sync: ${audioSettings.syncOffset >= 0 ? '+' : ''}${audioSettings.syncOffset.toFixed(1)}s`);
}

// Setup audio event listeners
function setupAudioEventListeners() {
    // Listen for video player events
    const videoPlayer = document.getElementById('mainVideoPlayer');
    if (videoPlayer) {
        videoPlayer.addEventListener('play', onVideoPlay);
        videoPlayer.addEventListener('pause', onVideoPause);
        videoPlayer.addEventListener('seeked', onVideoSeeked);
        videoPlayer.addEventListener('timeupdate', onVideoTimeUpdate);
        videoPlayer.addEventListener('ended', onVideoEnded);
        videoPlayer.addEventListener('loadstart', onVideoLoadStart);
    }

    console.log('Audio system event listeners setup complete');
}

// Video event handlers
function onVideoPlay() {
    if (currentAudioTrack && customAudioElement) {
        syncAudioWithVideo();
    }
}

function onVideoPause() {
    if (customAudioElement) {
        customAudioElement.pause();
    }
}

function onVideoSeeked() {
    if (currentAudioTrack && customAudioElement) {
        setTimeout(() => syncAudioWithVideo(), 100);
    }
}

function onVideoTimeUpdate() {
    // Periodic sync check
    if (currentAudioTrack && customAudioElement) {
        const videoPlayer = document.getElementById('mainVideoPlayer');
        if (videoPlayer && !videoPlayer.paused) {
            const timeDiff = Math.abs(customAudioElement.currentTime - (videoPlayer.currentTime + audioSettings.syncOffset));

            // Re-sync if drift is more than 0.5 seconds
            if (timeDiff > 0.5) {
                syncAudioWithVideo();
            }
        }
    }
}

function onVideoEnded() {
    if (customAudioElement) {
        customAudioElement.pause();
        customAudioElement.currentTime = 0;
    }
}

function onVideoLoadStart() {
    // Video is changing, check if we need to load audio for new video
    setTimeout(() => {
        if (currentVideo) {
            loadVideoAudioTracks();

            // Auto-load audio if there's only one track
            const videoTracks = audioTracks.filter(track => track.videoId === currentVideo.id);
            if (videoTracks.length === 1) {
                selectAudioTrack(videoTracks[0]);
            }
        }
    }, 100);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Keyboard shortcuts for audio system
function setupAudioKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (audioModalVisible) {
            switch(e.key.toLowerCase()) {
                case 'escape':
                    hideAudioModal();
                    break;
            }
        }

        // Global audio shortcuts (when video is playing)
        if (document.getElementById('playerPage').style.display !== 'none') {
            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 'a':
                        e.preventDefault();
                        showAudioModal();
                        break;
                    case 'r':
                        e.preventDefault();
                        restoreOriginalAudio();
                        break;
                    case 'arrowup':
                        e.preventDefault();
                        adjustAudioVolume(5);
                        break;
                    case 'arrowdown':
                        e.preventDefault();
                        adjustAudioVolume(-5);
                        break;
                    case 'arrowleft':
                        e.preventDefault();
                        adjustAudioSync(-0.1);
                        break;
                    case 'arrowright':
                        e.preventDefault();
                        adjustAudioSync(0.1);
                        break;
                }
            }
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeAudioSystem();
        setupAudioKeyboardShortcuts();
    }, 200);
});

// Export functions for global access
window.audioSystemFunctions = {
    showModal: showAudioModal,
    hideModal: hideAudioModal,
    uploadAudio: handleAudioUpload,
    selectTrack: selectAudioTrack,
    removeTrack: removeAudioTrack,
    previewTrack: previewAudioTrack,
    adjustVolume: adjustAudioVolume,
    changeMode: changeReplacementMode,
    adjustSync: adjustAudioSync,
    restoreOriginal: restoreOriginalAudio
};

console.log('🎵 StreamHub Audio System loaded successfully');
