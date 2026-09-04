#!/usr/bin/env python3
"""
Rebuilds library.json from the covers/ and music/downloaded_music/ folders.

Rule: a track's cover and its audio file must share the exact same
filename (only the extension differs) within an artist's folder, e.g.

    covers/vax/AWOL.jpg
    music/downloaded_music/vax/AWOL.mp3

Run this after adding/removing/renaming any cover or song:

    python3 src/music/build_library.py

To add a brand new artist, add them to ARTISTS below (slug -> name/color).
The artist photo is expected at src/music/artists/<slug>.webp and is left
untouched by this script.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
COVERS_DIR = os.path.join(HERE, 'covers')
AUDIO_DIR = os.path.join(HERE, 'music', 'downloaded_music')
ARTISTS_DIR = os.path.join(HERE, 'artists')
OUT_FILE = os.path.join(HERE, 'library.json')

# Each artist's accent color drives the artist name, "PICK A SONG" label,
# track title, and the arrow/play button highlights on the browse screen.
# Change the "color" hex here and re-run this script to update the page.
ARTISTS = {
    'slayr': {'name': 'Slayr', 'color': '#ff6a5c'},
    'yit': {'name': 'Yit', 'color': '#29c7ac'},
    'vax': {'name': 'Vax', 'color': '#4d6bff'},
    'lucy-bedroque': {'name': 'Lucy Bedroque', 'color': '#ff5ca8'},
    'egobreak': {'name': 'Egobreak', 'color': '#a05cff'},
    'ezcodylee': {'name': 'Ezcodylee', 'color': '#f2b705'},
}


def basenames(path):
    if not os.path.isdir(path):
        return {}
    out = {}
    for fn in sorted(os.listdir(path)):
        full = os.path.join(path, fn)
        if not os.path.isfile(full):
            continue
        title, ext = os.path.splitext(fn)
        out[title] = fn
    return out


def main():
    had_mismatch = False
    library = []

    for slug, info in ARTISTS.items():
        display = info['name']
        color = info.get('color', '#ff6a5c')
        cov_dir = os.path.join(COVERS_DIR, slug)
        aud_dir = os.path.join(AUDIO_DIR, slug)

        covers = basenames(cov_dir)
        audio = basenames(aud_dir)

        cover_only = sorted(set(covers) - set(audio))
        audio_only = sorted(set(audio) - set(covers))

        for title in cover_only:
            had_mismatch = True
            print(f'[MISMATCH] {slug}: "{covers[title]}" has a cover but no matching audio file', file=sys.stderr)

        for title in audio_only:
            had_mismatch = True
            print(f'[MISMATCH] {slug}: "{audio[title]}" has audio but no matching cover', file=sys.stderr)

        photo_path = os.path.join(ARTISTS_DIR, f'{slug}.webp')
        if not os.path.isfile(photo_path):
            print(f'[WARN] {slug}: no artist photo at src/music/artists/{slug}.webp', file=sys.stderr)

        tracks = []
        for title in sorted(set(covers) & set(audio)):
            tracks.append({
                'title': title,
                'cover': f'/src/music/covers/{slug}/{covers[title]}',
                'src': f'/src/music/music/downloaded_music/{slug}/{audio[title]}',
            })

        library.append({
            'artist': display,
            'color': color,
            'photo': f'/src/music/artists/{slug}.webp',
            'tracks': tracks,
        })

    with open(OUT_FILE, 'w') as f:
        json.dump(library, f, indent=2)
        f.write('\n')

    total = sum(len(a['tracks']) for a in library)
    print(f'Wrote {OUT_FILE}: {len(library)} artists, {total} tracks.')

    if had_mismatch:
        print('\nFix the mismatches above (rename so the cover and audio filenames match exactly) and re-run.', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
