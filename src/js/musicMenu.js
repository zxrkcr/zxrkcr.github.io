let library = [];
let artistSwiper, songSwiper, howl = null;

async function loadLibrary() {
    const res = await fetch('/src/music/library.json');
    library = await res.json();
}

function buildLandingTitle() {
    const el = document.getElementById('logoText');

    'FAVORITE ARTISTS'.split('').forEach((ch, i) => {
        const span = document.createElement('span');
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(span);

        gsap.to(span, { y: -8, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.06 });
    });
}

function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function getAverageColor(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 8;
                canvas.height = 8;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 8, 8);
                const data = ctx.getImageData(0, 0, 8, 8).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                }
                resolve(`rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`);
            } catch (e) {
                resolve('#ff6a5c');
            }
        };
        img.onerror = () => resolve('#ff6a5c');
        img.src = encodeURI(src);
    });
}

function applyLogoGradient(colors) {
    const el = document.getElementById('logoText');
    const spans = Array.from(el.children);
    if (!colors.length || !spans.length) return;

    const gradient = `linear-gradient(90deg, ${colors.join(', ')})`;
    const containerLeft = el.getBoundingClientRect().left;
    const totalWidth = el.getBoundingClientRect().width || 1;

    spans.forEach((span) => {
        const offset = span.getBoundingClientRect().left - containerLeft;
        span.style.backgroundImage = gradient;
        span.style.backgroundSize = `${totalWidth}px 100%`;
        span.style.backgroundPosition = `-${offset}px 0`;
        span.style.webkitBackgroundClip = 'text';
        span.style.backgroundClip = 'text';
        span.style.color = 'transparent';
        span.style.webkitTextFillColor = 'transparent';
    });
}

function buildCoverScatter(count = 9) {
    const el = document.getElementById('coverScatter');
    el.innerHTML = '';

    const allCovers = library.flatMap((artist) => artist.tracks.filter((t) => t.cover).map((t) => t.cover));
    const picks = shuffle(allCovers).slice(0, Math.min(count, allCovers.length));

    const imgSize = 130;
    const containerRect = el.getBoundingClientRect();
    const logoRect = document.getElementById('logoText').getBoundingClientRect();
    const btnRect = document.getElementById('startBtn').getBoundingClientRect();

    // keep clear of the pinned title + play button near the top
    const clearBelow = Math.max(logoRect.bottom, btnRect.bottom) - containerRect.top + 30;
    const topMin = Math.min(clearBelow, containerRect.height * 0.55);
    const topMax = Math.max(containerRect.height - imgSize - 20, topMin);
    const leftMax = Math.max(containerRect.width - imgSize - 20, 20);
    const minDist = imgSize * 1.05;

    const placed = [];

    picks.forEach((cover, i) => {
        let top, left, attempts = 0;
        do {
            top = topMin + Math.random() * (topMax - topMin);
            left = 20 + Math.random() * (leftMax - 20);
            attempts++;
        } while (
            attempts < 30 &&
            placed.some((p) => Math.hypot(p.top - top, p.left - left) < minDist)
        );
        placed.push({ top, left });

        const img = document.createElement('img');
        img.src = encodeURI(cover);
        img.style.top = top + 'px';
        img.style.left = left + 'px';
        el.appendChild(img);

        const rot = Math.random() * 20 - 10;
        const flyX = Math.random() * 320 - 160;
        const flyY = Math.random() * 320 - 160;

        gsap.fromTo(img,
            { x: flyX, y: flyY, rotate: rot * 3, scale: .3, opacity: 0 },
            { x: 0, y: 0, rotate: rot, scale: 1, opacity: .9, duration: .9, delay: i * 0.08, ease: 'back.out(1.6)',
                onComplete: () => {
                    gsap.to(img, { y: '+=6', duration: 2.6 + Math.random(), repeat: -1, yoyo: true, ease: 'sine.inOut' });
                }
            });
    });

    Promise.all(picks.slice(0, 6).map(getAverageColor)).then((colors) => {
        if (colors.length) applyLogoGradient(colors);
    });
}

function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyArtistTheme(artist) {
    const color = artist.color || 'var(--retro-coral)';
    const tint = artist.color ? hexToRgba(artist.color, .25) : 'rgba(255,106,92,.25)';

    document.querySelector('.pick-label').style.color = color;
    document.querySelector('.track-row').style.color = color;

    document.querySelectorAll('.artist-arrow, .track-arrow').forEach((btn) => {
        btn.style.color = color;
        btn.style.background = tint;
    });

    document.getElementById('playBtn').style.background = color;
}

function goToBrowse() {
    gsap.to('#landing', { opacity: 0, duration: .3, onComplete: () => {
        document.getElementById('landing').classList.remove('active');
        document.getElementById('browse').classList.add('active');
        buildArtistSwiper();
    }});
}

function goToLanding() {
    stopPlayback();
    document.getElementById('browse').classList.remove('active');
    document.getElementById('landing').classList.add('active');
    gsap.fromTo('#landing', { opacity: 0 }, { opacity: 1, duration: .3 });
}

function buildArtistSwiper() {
    const wrapper = document.getElementById('artistWrapper');
    wrapper.innerHTML = '';

    library.forEach((artist) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide artist-slide';
        slide.innerHTML = `
            <div class="artist-name">${artist.artist}</div>
            ${artist.photo ? `<img class="artist-photo" src="${encodeURI(artist.photo)}" onerror="this.style.display='none'">` : ''}
        `;
        if (artist.color) slide.querySelector('.artist-name').style.color = artist.color;
        wrapper.appendChild(slide);
    });

    artistSwiper = new Swiper('#artistSwiper', {
        slidesPerView: 1,
        effect: 'slide',
        speed: 350,
        loop: library.length > 1,
        on: { slideChange: (sw) => {
            const artist = library[sw.realIndex];
            buildSongSwiper(artist);
            applyArtistTheme(artist);
        } }
    });

    document.getElementById('artistPrev').onclick = () => artistSwiper.slidePrev();
    document.getElementById('artistNext').onclick = () => artistSwiper.slideNext();

    buildSongSwiper(library[0]);
    applyArtistTheme(library[0]);
}

function buildSongSwiper(artist) {
    const wrapper = document.getElementById('songWrapper');
    wrapper.innerHTML = '';

    artist.tracks.forEach((track) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        const inner = document.createElement('div');
        inner.className = 'cover-inner';

        if (track.cover) {
            inner.style.backgroundImage = `url("${encodeURI(track.cover)}")`;
        } else {
            inner.textContent = track.title;
        }

        slide.appendChild(inner);
        wrapper.appendChild(slide);
    });

    if (songSwiper) songSwiper.destroy(true, true);

    songSwiper = new Swiper('#songSwiper', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 20,
        loop: artist.tracks.length > 2,
        loopedSlides: artist.tracks.length,
        coverflowEffect: { rotate: 30, stretch: 0, depth: 150, modifier: 1, slideShadows: false },
        on: { slideChange: (sw) => updateTrackTitle(artist, sw.realIndex) }
    });

    document.getElementById('songPrev').onclick = () => songSwiper.slidePrev();
    document.getElementById('songNext').onclick = () => songSwiper.slideNext();

    updateTrackTitle(artist, 0);
}

function updateTrackTitle(artist, idx) {
    const track = artist.tracks[idx];
    document.getElementById('trackTitle').textContent = track?.title || '';

    if (!track || track.src !== currentTrackSrc) {
        stopPlayback();
    }
}

let currentTrackSrc = null;

function updatePlayBtn(isPlaying) {
    const btn = document.getElementById('playBtn');
    btn.innerHTML = isPlaying
        ? '<span class="pixel-pause"></span> PAUSE'
        : '<span class="pixel-tri play-icon"></span> PLAY';
}

function setProgress(pct) {
    document.getElementById('barFill').style.width = (pct * 100) + '%';
    document.getElementById('barThumb').style.left = (pct * 100) + '%';
}

function stopPlayback() {
    if (howl) {
        howl.unload();
        howl = null;
    }
    currentTrackSrc = null;
    updatePlayBtn(false);
    setProgress(0);
}

function playSelectedTrack() {
    const artist = library[artistSwiper.realIndex];
    const track = artist.tracks[songSwiper.realIndex];

    if (!track) return;

    if (howl && currentTrackSrc === track.src) {
        if (howl.playing()) howl.pause();
        else howl.play();
        return;
    }

    if (howl) howl.unload();
    currentTrackSrc = track.src;

    howl = new Howl({ src: [encodeURI(track.src)], html5: true });
    howl.play();

    howl.on('play', () => {
        updatePlayBtn(true);
        requestAnimationFrame(function step() {
            if (howl && howl.playing()) {
                setProgress(howl.seek() / howl.duration());
                requestAnimationFrame(step);
            }
        });
    });

    howl.on('pause', () => updatePlayBtn(false));
    howl.on('end', () => updatePlayBtn(false));
}

let isSeeking = false;

function pctFromClientX(clientX) {
    const rect = document.getElementById('barWrap').getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
}

function startSeekDrag(clientX) {
    if (!howl || !howl.duration()) return;
    isSeeking = true;
    setProgress(pctFromClientX(clientX));
}

function updateSeekDrag(clientX) {
    if (!isSeeking) return;
    setProgress(pctFromClientX(clientX));
}

function endSeekDrag(clientX) {
    if (!isSeeking) return;
    isSeeking = false;
    if (!howl || !howl.duration()) return;
    const pct = pctFromClientX(clientX);
    howl.seek(pct * howl.duration());
    setProgress(pct);
}

document.addEventListener('DOMContentLoaded', async () => {
    buildLandingTitle();
    await loadLibrary();
    buildCoverScatter();

    document.getElementById('startBtn').addEventListener('click', goToBrowse);

    document.getElementById('playBtn').addEventListener('click', playSelectedTrack);

    const barWrap = document.getElementById('barWrap');
    barWrap.addEventListener('mousedown', (e) => { startSeekDrag(e.clientX); e.preventDefault(); });
    barWrap.addEventListener('touchstart', (e) => startSeekDrag(e.touches[0].clientX), { passive: true });

    document.addEventListener('mousemove', (e) => updateSeekDrag(e.clientX));
    document.addEventListener('touchmove', (e) => { if (isSeeking) updateSeekDrag(e.touches[0].clientX); }, { passive: true });

    document.addEventListener('mouseup', (e) => endSeekDrag(e.clientX));
    document.addEventListener('touchend', (e) => endSeekDrag(e.changedTouches[0].clientX));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (document.getElementById('browse').classList.contains('active')) goToLanding();
            return;
        }

        if (!document.getElementById('browse').classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                songSwiper && songSwiper.slidePrev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                songSwiper && songSwiper.slideNext();
                break;
            case 'a':
            case 'A':
                artistSwiper && artistSwiper.slidePrev();
                break;
            case 'd':
            case 'D':
                artistSwiper && artistSwiper.slideNext();
                break;
            case ' ':
            case 'Enter':
                e.preventDefault();
                playSelectedTrack();
                break;
        }
    });
});