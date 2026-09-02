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

function goToBrowse() {
    gsap.to('#landing', { opacity: 0, duration: .3, onComplete: () => {
        document.getElementById('landing').classList.remove('active');
        document.getElementById('browse').classList.add('active');
        buildArtistSwiper();
    }});
}

function goToLanding() {
    if (howl) howl.stop();
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
        wrapper.appendChild(slide);
    });

    artistSwiper = new Swiper('#artistSwiper', {
        slidesPerView: 1,
        effect: 'slide',
        speed: 350,
        on: { slideChange: (sw) => buildSongSwiper(library[sw.activeIndex]) }
    });

    document.getElementById('artistPrev').onclick = () => artistSwiper.slidePrev();
    document.getElementById('artistNext').onclick = () => artistSwiper.slideNext();

    buildSongSwiper(library[0]);
}

function buildSongSwiper(artist) {
    const wrapper = document.getElementById('songWrapper');
    wrapper.innerHTML = '';

    artist.tracks.forEach((track) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        if (track.cover) {
            slide.style.backgroundImage = `url("${encodeURI(track.cover)}")`;
        } else {
            slide.textContent = track.title;
        }

        wrapper.appendChild(slide);
    });

    if (songSwiper) songSwiper.destroy(true, true);

    songSwiper = new Swiper('#songSwiper', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: { rotate: 30, stretch: 0, depth: 150, modifier: 1, slideShadows: false },
        on: { slideChange: (sw) => updateTrackTitle(artist, sw.activeIndex) }
    });

    document.getElementById('songPrev').onclick = () => songSwiper.slidePrev();
    document.getElementById('songNext').onclick = () => songSwiper.slideNext();

    updateTrackTitle(artist, 0);
}

function updateTrackTitle(artist, idx) {
    document.getElementById('trackTitle').textContent = artist.tracks[idx]?.title || '';
}

function playSelectedTrack() {
    const artist = library[artistSwiper.activeIndex];
    const track = artist.tracks[songSwiper.activeIndex];

    if (!track) return;

    if (howl) howl.unload();

    howl = new Howl({ src: [encodeURI(track.src)], html5: true });
    howl.play();

    const barFill = document.getElementById('barFill');

    howl.on('play', () => {
        requestAnimationFrame(function step() {
            if (howl.playing()) {
                barFill.style.width = (howl.seek() / howl.duration() * 100) + '%';
                requestAnimationFrame(step);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    buildLandingTitle();

    document.getElementById('startBtn').addEventListener('click', async () => {
        await loadLibrary();
        goToBrowse();
    });

    document.getElementById('playBtn').addEventListener('click', playSelectedTrack);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('browse').classList.contains('active')) {
            goToLanding();
        }
    });
});