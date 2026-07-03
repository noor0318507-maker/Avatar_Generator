// Dom Selectors
const avatarImg = document.getElementById('avatarImg');
const styleSelect = document.getElementById('styleSelect');
const seedInput = document.getElementById('seedInput');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const randomBtn = document.getElementById('randomBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const historyGrid = document.getElementById('historyGrid');
const favoritesGrid = document.getElementById('favoritesGrid');

// Visibility Toggles Selectors
const toggleFavsBtn = document.getElementById('toggleFavsBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const favoritesSection = document.getElementById('favoritesSection');
const historySection = document.getElementById('historySection');

// App States
let currentStyle = styleSelect.value;
let currentSeed = seedInput.value;
let exportSize = sizeSlider.value;
let historyList = [];
let favoritesList = JSON.parse(localStorage.getItem('avatar_favorites')) || [];

// Initial Load Setup
renderFavorites();

// Helper function to build Dicebear URL string (Transparent Background default)
function generateAvatarUrl(style, seed) {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

// Triggers visual bounce when avatar changes
function updateAvatarUI(url) {
    avatarImg.classList.add('avatar-pop');
    avatarImg.src = url;
    setTimeout(() => {
        avatarImg.classList.remove('avatar-pop');
    }, 100);
}

// Real-Time Update Function
function handleInputChange() {
    currentStyle = styleSelect.value;
    currentSeed = seedInput.value;
    
    const newUrl = generateAvatarUrl(currentStyle, currentSeed);
    updateAvatarUI(newUrl);
}

// Event Listeners
styleSelect.addEventListener('change', handleInputChange);
seedInput.addEventListener('input', handleInputChange);

sizeSlider.addEventListener('input', (e) => {
    exportSize = e.target.value;
    sizeValue.textContent = `${exportSize} × ${exportSize} px`;
});

// Toggle Buttons Setup
toggleFavsBtn.addEventListener('click', () => {
    favoritesSection.classList.toggle('hidden');
    toggleFavsBtn.classList.toggle('active');
    toggleFavsBtn.textContent = favoritesSection.classList.contains('hidden') ? "Show Favorites ⭐" : "Hide Favorites ✖";
});

toggleHistoryBtn.addEventListener('click', () => {
    historySection.classList.toggle('hidden');
    toggleHistoryBtn.classList.toggle('active');
    toggleHistoryBtn.textContent = historySection.classList.contains('hidden') ? "Show Recents ⏳" : "Hide Recents ✖";
});

// Randomizer implementation
randomBtn.addEventListener('click', () => {
    // Add current selection configuration to history stack
    addToHistory(currentStyle, currentSeed);

    randomBtn.classList.add('rolling');
    setTimeout(() => randomBtn.classList.remove('rolling'), 400);

    const randomSeed = Math.random().toString(36).substring(2, 10);
    seedInput.value = randomSeed;
    
    handleInputChange();
});

// Link Clipboard Copy Manager
copyBtn.addEventListener('click', async () => {
    const liveUrl = generateAvatarUrl(currentStyle, currentSeed);
    try {
        await navigator.clipboard.writeText(liveUrl);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "✅ Copied!";
        setTimeout(() => copyBtn.innerHTML = originalText, 1500);
    } catch (err) {
        console.error('Failed to copy text.', err);
    }
});

// History Tracking Manager
function addToHistory(style, seed) {
    const url = generateAvatarUrl(style, seed);
    if (historyList.length > 0 && historyList[0].seed === seed && historyList[0].style === style) {
        return;
    }

    historyList.unshift({ style, seed, url });
    if (historyList.length > 6) historyList.pop();
    renderHistory();
}

function renderHistory() {
    historyGrid.innerHTML = '';
    historyList.forEach((item) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.classList.add('history-item');
        thumbContainer.title = `Restore: ${item.seed}`;
        
        const thumbImg = document.createElement('img');
        thumbImg.src = item.url;
        thumbContainer.appendChild(thumbImg);
        
        thumbContainer.addEventListener('click', () => restoreConfiguration(item));
        historyGrid.appendChild(thumbContainer);
    });
}

// LocalStorage Favorites Bookmark System
favoriteBtn.addEventListener('click', () => {
    const isDuplicate = favoritesList.some(item => item.seed === currentSeed && item.style === currentStyle);
    
    if(!isDuplicate) {
        const favoriteItem = {
            style: currentStyle,
            seed: currentSeed,
            url: generateAvatarUrl(currentStyle, currentSeed)
        };

        favoritesList.unshift(favoriteItem);
        localStorage.setItem('avatar_favorites', JSON.stringify(favoritesList));
        renderFavorites();
    }

    const originalText = favoriteBtn.innerHTML;
    favoriteBtn.innerHTML = "✅ Saved!";
    setTimeout(() => favoriteBtn.innerHTML = originalText, 1500);
});

function renderFavorites() {
    favoritesGrid.innerHTML = '';
    if(favoritesList.length === 0) {
        favoritesGrid.innerHTML = '<p style="font-size:0.8rem;color:#475569;padding:4px 2px;">No bookmark entries saved yet.</p>';
        return;
    }

    favoritesList.forEach((item, index) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.classList.add('history-item');
        thumbContainer.style.position = 'relative';
        thumbContainer.title = `Restore: ${item.seed}`;

        const thumbImg = document.createElement('img');
        thumbImg.src = item.url;
        thumbContainer.appendChild(thumbImg);

        thumbImg.addEventListener('click', () => restoreConfiguration(item));

        const deleteMarker = document.createElement('span');
        deleteMarker.innerHTML = '×';
        deleteMarker.style.cssText = 'position:absolute;top:-2px;right:4px;color:#ef4444;font-size:16px;font-weight:bold;cursor:pointer;';
        deleteMarker.addEventListener('click', (e) => {
            e.stopPropagation();
            favoritesList.splice(index, 1);
            localStorage.setItem('avatar_favorites', JSON.stringify(favoritesList));
            renderFavorites();
        });

        thumbContainer.appendChild(deleteMarker);
        favoritesGrid.appendChild(thumbContainer);
    });
}

function restoreConfiguration(item) {
    styleSelect.value = item.style;
    seedInput.value = item.seed;
    handleInputChange();
}

// Canvas Image Processing Downloader Engine
downloadBtn.addEventListener('click', async () => {
    const format = document.querySelector('input[name="downloadFormat"]:checked').value;
    const fetchUrl = generateAvatarUrl(currentStyle, currentSeed);

    try {
        const response = await fetch(fetchUrl);
        const svgText = await response.text();

        if (format === 'svg') {
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            triggerDownload(URL.createObjectURL(blob), `${currentSeed}-avatar.svg`);
        } else {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            canvas.width = parseInt(exportSize);
            canvas.height = parseInt(exportSize);
            
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                try {
                    canvas.toBlob((blob) => {
                        triggerDownload(URL.createObjectURL(blob), `${currentSeed}-avatar.png`);
                    }, 'image/png');
                } catch (canvasErr) {
                    console.error("Canvas conversion security block context workaround applied:", canvasErr);
                    const blob = new Blob([svgText], { type: 'image/svg+xml' });
                    triggerDownload(URL.createObjectURL(blob), `${currentSeed}-avatar.svg`);
                }
            };
            
            img.crossOrigin = "anonymous";
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
        }
    } catch (error) {
        console.error("Failed download setup:", error);
        alert("Unable to compile image export.");
    }
});

function triggerDownload(url, filename) {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = filename;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
}