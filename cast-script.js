// cast-script.js
// Real Cast functionality with device discovery
let castDevices = [];
let currentCastDevice = null;
let isCasting = false;
let castSession = null;

// Initialize real casting APIs
async function initializeCasting() {
    console.log('Initializing real casting capabilities...');

    // Try to initialize different casting technologies
    await Promise.allSettled([
        initializeWebRTC(),
        initializeChromecast(),
        initializeAirPlay(),
        initializeScreenShare()
    ]);
}

// WebRTC Screen Sharing (for direct browser-to-browser casting)
async function initializeWebRTC() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.log('Screen sharing not supported');
        return;
    }

    castDevices.push({
        id: 'screen_share',
        name: 'Share Screen',
        type: 'Screen Share',
        status: 'available',
        icon: 'screen_share',
        technology: 'webrtc'
    });
}

// Google Chromecast detection
async function initializeChromecast() {
    if (window.chrome && window.chrome.cast) {
        return new Promise((resolve) => {
            const initializeApi = () => {
                const sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
                const apiConfig = new chrome.cast.ApiConfig(sessionRequest, sessionListener, receiverListener);
                chrome.cast.initialize(apiConfig, () => {
                    console.log('Chromecast API initialized');
                    scanForChromecastDevices();
                    resolve();
                }, (error) => {
                    console.log('Chromecast initialization failed:', error);
                    resolve();
                });
            };

            if (chrome.cast && chrome.cast.isAvailable) {
                initializeApi();
            } else {
                window['__onGCastApiAvailable'] = (isAvailable) => {
                    if (isAvailable) {
                        initializeApi();
                    }
                };
            }
        });
    } else {
        // Load Chromecast SDK if not available
        loadChromecastSDK();
    }
}

function loadChromecastSDK() {
    if (document.querySelector('script[src*="cast_sender.js"]')) return;

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.onload = () => {
        setTimeout(() => {
            initializeChromecast();
        }, 1000);
    };
    document.head.appendChild(script);
}

function scanForChromecastDevices() {
    chrome.cast.requestSession(
        (session) => {
            console.log('Found Chromecast session:', session);
            addCastDevice({
                id: session.sessionId,
                name: session.receiver.friendlyName,
                type: 'Chromecast',
                status: 'available',
                icon: 'cast',
                technology: 'chromecast',
                session: session
            });
        },
        (error) => {
            if (error.code !== 'cancel') {
                console.log('Chromecast scan error:', error);
            }
        }
    );
}

// AirPlay detection (limited to Safari/Apple devices)
async function initializeAirPlay() {
    if (window.WebKitPlaybackTargetAvailabilityEvent) {
        const video = document.getElementById('mainVideoPlayer');
        video.addEventListener('webkitplaybacktargetavailabilitychanged', (event) => {
            if (event.availability === 'available') {
                addCastDevice({
                    id: 'airplay_device',
                    name: 'AirPlay Device',
                    type: 'AirPlay',
                    status: 'available',
                    icon: 'airplay',
                    technology: 'airplay'
                });
            }
        });

        // Enable AirPlay
        video.webkitShowPlaybackTargetPicker = true;
    }
}

// Screen Share capability
async function initializeScreenShare() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        castDevices.push({
            id: 'screen_capture',
            name: 'Capture & Share Screen',
            type: 'Screen Capture',
            status: 'available',
            icon: 'videocam',
            technology: 'screenshare'
        });
    }
}

// Add discovered device to list
function addCastDevice(device) {
    const existing = castDevices.findIndex(d => d.id === device.id);
    if (existing >= 0) {
        castDevices[existing] = device;
    } else {
        castDevices.push(device);
    }

    // Update UI if cast modal is open
    const modal = document.getElementById('castModal');
    if (modal && modal.classList.contains('show')) {
        updateCastDeviceList();
    }
}

// Main toggle cast function
async function toggleCast() {
    if (isCasting) {
        stopCasting();
    } else {
        await scanForDevices();
        showCastModal();
    }
}

// Scan for all available devices
async function scanForDevices() {
    showActionFeedback('search', 'Scanning for devices...');

    // Clear previous devices (except always-available ones)
    castDevices = castDevices.filter(d =>
        d.technology === 'webrtc' || d.technology === 'screenshare'
    );

    // Re-scan for devices
    await initializeCasting();

    console.log('Found devices:', castDevices);
}

// Start casting to selected device
async function selectCastDevice(deviceId) {
    const device = castDevices.find(d => d.id === deviceId);
    if (!device || device.status !== 'available') {
        showActionFeedback('error', 'Device not available');
        return;
    }

    if (!currentVideo) {
        showActionFeedback('error', 'No video to cast');
        return;
    }

    try {
        await startCasting(device);
    } catch (error) {
        showActionFeedback('error', 'Failed to connect to device');
        console.error('Casting error:', error);
    }
}

// Start casting implementation
async function startCasting(device) {
    currentCastDevice = device;
    isCasting = true;

    showCastingAnimation();

    switch (device.technology) {
        case 'chromecast':
            await startChromecastSession(device);
            break;
        case 'airplay':
            await startAirPlaySession(device);
            break;
        case 'screenshare':
            await startScreenShare(device);
            break;
        case 'webrtc':
            await startWebRTCCast(device);
            break;
        default:
            throw new Error('Unsupported casting technology');
    }

    // Update UI
    updateCastingUI(device);
}

// Chromecast session
async function startChromecastSession(device) {
    if (!device.session) {
        const session = await new Promise((resolve, reject) => {
            chrome.cast.requestSession(resolve, reject);
        });
        device.session = session;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(currentVideo.url, 'video/mp4');
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.title = currentVideo.title;
    mediaInfo.metadata.images = currentVideo.thumbnail ?
        [new chrome.cast.Image(currentVideo.thumbnail)] : [];

    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.currentTime = document.getElementById('mainVideoPlayer').currentTime;

    castSession = await new Promise((resolve, reject) => {
        device.session.loadMedia(request, resolve, reject);
    });
}

// AirPlay session
async function startAirPlaySession(device) {
    const video = document.getElementById('mainVideoPlayer');
    if (video.webkitShowPlaybackTargetPicker) {
        video.webkitShowPlaybackTargetPicker();
    }
}

// Screen sharing
async function startScreenShare(device) {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { mediaSource: 'screen' },
            audio: true
        });

        // Create a new video element for the shared screen
        const sharedVideo = document.createElement('video');
        sharedVideo.srcObject = stream;
        sharedVideo.autoplay = true;
        sharedVideo.muted = true;
        sharedVideo.style.display = 'none';
        document.body.appendChild(sharedVideo);

        console.log('Screen sharing started:', stream);
        showActionFeedback('cast_connected', 'Screen sharing active');

        stream.getVideoTracks()[0].addEventListener('ended', () => {
            stopCasting();
            document.body.removeChild(sharedVideo);
        });

    } catch (error) {
        throw new Error('Screen sharing failed: ' + error.message);
    }
}

// WebRTC casting
async function startWebRTCCast(device) {
    console.log('WebRTC casting would be implemented here');
    showActionFeedback('info', 'WebRTC casting - feature in development');
}

// Update UI when casting starts
function updateCastingUI(device) {
    setTimeout(() => {
        if (document.getElementById('castControls')) {
            document.getElementById('castControls').style.display = 'block';
        }
        if (document.getElementById('castStatusText')) {
            document.getElementById('castStatusText').textContent = `Casting to ${device.name}`;
        }
        updateCastDeviceList();

        const castBtn = document.getElementById('castBtn');
        if (castBtn) {
            castBtn.innerHTML = '<span class="material-icons">cast_connected</span>';
            castBtn.style.color = 'var(--loop-color)';
        }

        showActionFeedback('cast_connected', `Casting to ${device.name}`);
        console.log(`Started casting to ${device.name}`);
    }, 2000);
}

// Show cast modal
function showCastModal() {
    let castModal = document.getElementById('castModal');
    if (!castModal) {
        createCastModal();
        castModal = document.getElementById('castModal');
    }

    updateCastDeviceList();
    castModal.classList.add('show');
    document.getElementById('blurOverlay').classList.add('active');
    showActionFeedback('cast', 'Cast devices');
}

// Create cast modal
function createCastModal() {
    const modalHTML = `
        <div class="cast-modal" id="castModal">
            <div class="cast-modal-content">
                <div class="cast-modal-header">
                    <h3 class="cast-modal-title">Cast to Device</h3>
                    <button class="cast-close-btn" onclick="hideCastModal()">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="cast-current-video" id="castCurrentVideo">
                    <div class="cast-video-info">
                        <div class="cast-video-thumbnail" id="castVideoThumbnail">
                            <span class="material-icons">movie</span>
                        </div>
                        <div class="cast-video-details">
                            <div class="cast-video-title" id="castVideoTitle">No video selected</div>
                            <div class="cast-video-duration" id="castVideoDuration">0:00</div>
                        </div>
                    </div>
                </div>
                <div class="cast-devices-section">
                    <h4 class="cast-section-title">Available Devices</h4>
                    <div class="cast-devices-list" id="castDevicesList">
                        <div class="cast-device-placeholder">
                            <span class="material-icons">search</span>
                            <span>Scanning for devices...</span>
                        </div>
                    </div>
                </div>
                <div class="cast-controls" id="castControls" style="display: none;">
                    <div class="cast-status">
                        <span class="material-icons cast-status-icon">cast_connected</span>
                        <span class="cast-status-text" id="castStatusText">Casting to Device</span>
                    </div>
                    <div class="cast-actions">
                        <button class="cast-action-btn" onclick="pauseCasting()">
                            <span class="material-icons">pause</span>
                            Pause
                        </button>
                        <button class="cast-action-btn danger" onclick="stopCasting()">
                            <span class="material-icons">stop</span>
                            Stop Casting
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Update cast device list
function updateCastDeviceList() {
    const devicesList = document.getElementById('castDevicesList');
    const currentVideoInfo = document.getElementById('castCurrentVideo');

    // Update current video info
    if (currentVideo) {
        document.getElementById('castVideoTitle').textContent = currentVideo.title;
        document.getElementById('castVideoDuration').textContent = formatDuration(document.getElementById('mainVideoPlayer').duration || 0);

        const thumbnail = document.getElementById('castVideoThumbnail');
        if (currentVideo.thumbnail) {
            thumbnail.innerHTML = `<img src="${currentVideo.thumbnail}" alt="${currentVideo.title}">`;
        } else {
            thumbnail.innerHTML = '<span class="material-icons">movie</span>';
        }
        currentVideoInfo.style.display = 'block';
    } else {
        currentVideoInfo.style.display = 'none';
    }

    // Populate devices list
    if (castDevices.length === 0) {
        devicesList.innerHTML = `
            <div class="cast-device-placeholder">
                <span class="material-icons">devices_other</span>
                <span>No devices found</span>
            </div>
        `;
        return;
    }

    devicesList.innerHTML = castDevices.map(device => `
        <div class="cast-device ${device.status}" onclick="selectCastDevice('${device.id}')">
            <div class="cast-device-icon">
                <span class="material-icons">${device.icon}</span>
            </div>
            <div class="cast-device-info">
                <div class="cast-device-name">${device.name}</div>
                <div class="cast-device-type">${device.type} • ${device.status}</div>
            </div>
            <div class="cast-device-action">
                ${device.status === 'available' ?
                    '<span class="material-icons">cast</span>' :
                    '<span class="material-icons">schedule</span>'
                }
            </div>
        </div>
    `).join('');
}

// Show casting animation
function showCastingAnimation() {
    const modal = document.getElementById('castModal');
    if (modal) {
        modal.classList.add('casting-animation');

        setTimeout(() => {
            modal.classList.remove('casting-animation');
        }, 2000);
    }
}

// Pause casting
function pauseCasting() {
    if (!isCasting) return;

    const player = document.getElementById('mainVideoPlayer');
    if (player.paused) {
        player.play();
        showActionFeedback('play_arrow', 'Resumed casting');
    } else {
        player.pause();
        showActionFeedback('pause', 'Paused casting');
    }
}

// Stop casting
function stopCasting() {
    if (!isCasting) return;

    isCasting = false;

    // Update device status
    if (currentCastDevice) {
        currentCastDevice.status = 'available';
        currentCastDevice = null;
    }

    // Stop any active sessions
    if (castSession) {
        try {
            castSession.stop();
        } catch (error) {
            console.log('Error stopping cast session:', error);
        }
        castSession = null;
    }

    // Update UI
    if (document.getElementById('castControls')) {
        document.getElementById('castControls').style.display = 'none';
    }
    updateCastDeviceList();

    // Reset cast button
    const castBtn = document.getElementById('castBtn');
    if (castBtn) {
        castBtn.innerHTML = '<span class="material-icons">cast</span>';
        castBtn.style.color = '';
    }

    hideCastModal();
    showActionFeedback('cast', 'Casting stopped');
    console.log('Stopped casting');
}

// Hide cast modal
function hideCastModal() {
    const modal = document.getElementById('castModal');
    if (modal) {
        modal.classList.remove('show');
    }
    if (document.getElementById('blurOverlay')) {
        document.getElementById('blurOverlay').classList.remove('active');
    }
}

// Session listeners for Chromecast
function sessionListener(session) {
    console.log('New Chromecast session:', session);
    castSession = session;
}

function receiverListener(availability) {
    console.log('Chromecast receiver availability:', availability);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCasting);
} else {
    initializeCasting();
}
