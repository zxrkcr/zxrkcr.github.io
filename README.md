# zxrkcr's site
Git repo for my personal website.
I have seen many cool among friends as well as wonderful personal websites across sites like nekoweb and neocities thought it looked really cool and amazing.

# AI usage disclaimer
No copy pasted AI code. The ideas for the project was thought up by me and a lot of references across the web and primarily programmed using online resources and guides. Minimal AI usage was present when attempting to debug.

## Why! / Goals
I want a personal space that I can share with friends, experiment with, and potentially blog post.

## Features
- The main features currently at the time of writing are a commenting widget which is held on a google form.
- /Radio -- displays tracks connected to my lasfm account and allows users to listen in.
- linked my socials for visitors to follow
- the site is hosted on a Raspberry Pi (originally was going to self host my songs but I got too many)

ADDED:

- /AOTY -- I use this unofficial [AlbumOfTheYearAPI](https://github.com/JahsiasWhite/AlbumOfTheYearAPI) using their user.py by creating a script to use it, convert to json, and then redirect to `src/data/aoty.json`. All done with a cronjob to pull data every 20 minutes and display
- A sort of collage too show off some albums I actively listen too and like in the homepage which uses the [color-thief](https://lokeshdhakar.com/projects/color-thief/) library to show a colored border based on the prominent colors on each image.
- Added 2 new endpoints about me & friends

# Directory layout
## `src/css`
simply where all the styles / looks of the site comes to fruition

- `src/css/index.css`
adds a navigation bar to the top of the page as well as positionings for social media links

- `src/css/music.css`
Handles the music collage section. 
manually scattered images and positioned it using px with inspect element and using live preview plugin. learned how positioning, image sizing, boxes, hover effects, and transitions work.

- `src/css/comment-widget-dark.css`
This file controls the look of the commenting section, box sizing, and color scheme

 
any of the css with the same names as their .html are styles for that page in specific



## `src/favicon`
storing some images used to plug my socials and favicon




## `src/js`
holds all the files for most of the interactive portions of the website. 

- `src/js/comment-widget.js`
This file loads and controls the commenting portion of the site. The comments are connected to a google form, so the script is responsible for making that system usable, built using [commenting-widget](https://virtualobserver.moe/ayano/comment-widget)

- `src/js/getMusic.js`
fetches data from my cloudflare worker which fetches data from my lastfm using my API key, built using [lastfm-cf-worker](https://github.com/monoxideboi/lastfm-cf-worker/)

- `src/js/glow.js`
This file uses Color Thief library to grab colors from the album images and apply them to the CSS. The goal is to make it pop on hover and have a nice snake trail border glow effect based on the cover art.

- `src/js/quotes.js`
stores and shows rotating quotes on random into a marquee

- `src/js/color-thief.js`
I simply added the library code internally as i was hoping to quicken the load in time for my site hoping it would be faster fetching the data

- `src/js/aoty.js`
This file fetches the data from the local json in `src/data/aoty.json` parsing thru the data to then display the latest reviews I post on [albumoftheyear](https://www.albumoftheyear.org/).

- `src/js/status.js`
This file fetches data from `src/data/status.json` with the getStatus() pull the information from the latest data for display in homepage.
loadStatus then checks for each entry and builds a list of them to save as a history / log of statuses 

- `src/js/typing`
I wanted to add like a terminal typing effect and this looks at the `typing` class`reads the characters of the work and to type it out 




## `src/TuneTuneTuneSahur`
just a pool of images for my favourite music which is used to redirect to spotify

## `src/data` & `src/img`
These directoreies just hold the jsons that need be read aswell as other miscallanieous stuff for the website 

# Note
So far with the time put in it's all been enjoyable and a great learning experiance. Honestly the most challenging part is being creative in what to add and how I want things too look 

