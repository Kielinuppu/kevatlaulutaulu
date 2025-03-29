// Äänitiedostojen hallinta
const sounds = {
    "ampiainen": "audio/ampiainen.mp3",
    "Aurinko": "audio/aurinko.mp3",
    "hamahakki": "audio/hamahakki.mp3",
    "hiekkalaatikko": "audio/hiekkalaatikko.mp3",
    "Hiirenkorva": "audio/hiirenkorva.mp3",
    "hyttynen": "audio/hyttynen.mp3",
    "keinu": "audio/keinu.mp3",
    "kiipeilyteline": "audio/kiipeilyteline.mp3",
    "Leskenlehti": "audio/leskenlehti.mp3",
    "Lintu": "audio/lintu.mp3",
    "liukumaki": "audio/liukumaki.mp3",
    "muurahainen": "audio/muurahainen.mp3",
    "muuttolintu": "audio/muuttolintu.mp3",
    "paasiainen": "audio/paasiainen.mp3",
    "Pajunkissa": "audio/pajunkissa.mp3",
    "pyora": "audio/pyora.mp3",
    "Retki": "audio/retki.mp3",
    "Siitepoly": "audio/siitepoly.mp3",
    "Valkovuokko": "audio/valkovuokko.mp3",
    "vappu": "audio/vappu.mp3"
};

let currentPlayingAudio = null;
let activeHotspot = null;
let popupImage = null;

// Latauslogiikka
document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const gameBoard = document.querySelector('.game-board');
    const imageWrapper = document.querySelector('.image-wrapper');
    
    // Lisää latausanimaatio
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = '<div class="spinner"></div><p>Ladataan...</p>';
    container.insertBefore(loader, gameBoard);
    
    // Piilota pelialue latauksen ajaksi
    if (imageWrapper) {
        imageWrapper.style.visibility = 'hidden';
    }
    
    // Kerää kaikki ladattavat resurssit
    const resourcesToLoad = [];
    
    // Taustakuva
    const backgroundImg = document.querySelector('.background-img');
    if (backgroundImg) {
        resourcesToLoad.push(backgroundImg.src);
    }
    
    // Hotspot-kuvat
    document.querySelectorAll('.hotspot-img').forEach(img => {
        resourcesToLoad.push(img.src);
        
        // Lisää myös popup-kuvat, jos niitä on
        const popupImage = img.closest('.hotspot').getAttribute('data-popup-image');
        if (popupImage) resourcesToLoad.push(popupImage);
    });
    
    // Stop-nappi
    const stopButton = document.querySelector('.stop-button');
    if (stopButton) {
        resourcesToLoad.push(stopButton.src);
    }
    
    // Äänitiedostot
    for (let key in sounds) {
        resourcesToLoad.push(sounds[key]);
    }
    
    // Lataa kaikki resurssit
    let loadedCount = 0;
    const totalResources = resourcesToLoad.length;
    
    function resourceLoaded() {
        loadedCount++;
        
        // Päivitä mahdollinen progressipalkki
        const progress = Math.floor((loadedCount / totalResources) * 100);
        const progressText = loader.querySelector('p');
        if (progressText) {
            progressText.textContent = `Ladataan... ${progress}%`;
        }
        
        // Kun kaikki on ladattu, näytä peli
        if (loadedCount >= totalResources) {
            loader.style.display = 'none';
            if (imageWrapper) {
                imageWrapper.style.visibility = 'visible';
            }
            
            // Käynnistä pelin logiikka latauksen jälkeen
            initializeGameLogic();
        }
    }
    
    // Lataa kuvat ja äänifaillit
    if (resourcesToLoad.length === 0) {
        // Jos ei ole resursseja ladattavaksi, siirry suoraan peliin
        loader.style.display = 'none';
        if (imageWrapper) {
            imageWrapper.style.visibility = 'visible';
        }
        initializeGameLogic();
    } else {
        resourcesToLoad.forEach(src => {
            if (src.match(/\.(jpeg|jpg|gif|png)$/i)) {
                const img = new Image();
                img.onload = resourceLoaded;
                img.onerror = resourceLoaded; // Jatka, vaikka kuva ei latautuisi
                img.src = src;
            } else if (src.match(/\.(mp3|ogg|wav)$/i)) {
                // Lataa äänitiedostot
                const audio = new Audio();
                audio.oncanplaythrough = resourceLoaded;
                audio.onerror = resourceLoaded;
                audio.src = src;
                
                // Joissain selaimissa oncanplaythrough ei laukea, jos audio ei ole liitetty DOMin
                // Lisätään timeout varmuuden vuoksi
                setTimeout(resourceLoaded, 3000);
            } else {
                // Jos resurssityyppi ei ole tunnettu, merkitse se ladatuksi
                resourceLoaded();
            }
        });
    }
});

// Pelin varsinainen logiikka
function initializeGameLogic() {
    function playSound(soundName, hotspotElement) {
        stopAllSounds();
        if (sounds[soundName]) {
            const audio = new Audio(sounds[soundName]);
            audio.play();
            currentPlayingAudio = audio;
            fadeOtherHotspots(hotspotElement);
            enlargeHotspot(hotspotElement);
            audio.onended = resetState;
        } else {
            console.warn(`Ääntä ei löydy nimellä "${soundName}"`);
        }
    }

    function stopAllSounds() {
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
            resetState();
        }
    }

    function fadeOtherHotspots(exceptHotspot) {
        const allHotspots = document.querySelectorAll('.hotspot');
        allHotspots.forEach(hotspot => {
            if (hotspot !== exceptHotspot) {
                hotspot.classList.add('faded');
            }
        });
    }

    function unfadeAllHotspots() {
        const allHotspots = document.querySelectorAll('.hotspot');
        allHotspots.forEach(hotspot => {
            hotspot.classList.remove('faded');
        });
    }

    function enlargeHotspot(hotspotElement) {
        const popupImageSrc = hotspotElement.getAttribute('data-popup-image');
        
        // Poista edellinen popup-kuva jos sellainen on
        removePopupImage();
        
        // Luo uusi kuvaelementti popup-kuvalle
        if (popupImageSrc) {
            popupImage = document.createElement('img');
            popupImage.src = popupImageSrc;
            popupImage.className = 'popup-image';
            document.body.appendChild(popupImage);
        }
        
        activeHotspot = hotspotElement;
        hotspotElement.classList.add('enlarged');
        document.body.insertAdjacentHTML('beforeend', '<div class="overlay"></div>');
        document.querySelector('.overlay').style.display = 'block';
        document.querySelector('.stop-button').classList.add('active');
    }

    function removePopupImage() {
        if (popupImage) {
            popupImage.remove();
            popupImage = null;
        }
    }

    function shrinkHotspot() {
        removePopupImage();
        
        if (activeHotspot) {
            activeHotspot.classList.remove('enlarged');
            activeHotspot = null;
        }
        
        const overlay = document.querySelector('.overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.remove();
        }
        
        document.querySelector('.stop-button').classList.remove('active');
    }

    function resetState() {
        unfadeAllHotspots();
        shrinkHotspot();
        currentPlayingAudio = null;
    }

    const hotspots = document.querySelectorAll('.hotspot');
    
    hotspots.forEach(hotspot => {
        const name = hotspot.getAttribute('data-name');
        const hotspotImg = hotspot.querySelector('.hotspot-img');

        if (hotspotImg) {
            hotspotImg.setAttribute('data-original-src', hotspotImg.src);
        }
        
        hotspot.addEventListener('click', function(e) {
            e.stopPropagation();
            hotspot.classList.add('active');
            setTimeout(() => {
                playSound(name, this);
            }, 1000);
        });

        hotspot.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            e.preventDefault();
            hotspot.classList.add('active');
            setTimeout(() => {
                playSound(name, this);
            }, 1000);
        });
    });

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('overlay')) {
            stopAllSounds();
        }
    });

    const stopButton = document.querySelector('.stop-button');
    if (stopButton) {
        stopButton.addEventListener('click', function() {
            stopAllSounds();
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key.toLowerCase() === 'd') {
            document.querySelector('.game-board').classList.toggle('debug-mode');
        }
    });
}