# Night Market

A one-page portfolio for Samathri Abhayapala, AI full-stack developer. The content sits in the
middle of the screen in ordinary sections. Behind it, fixed, is a rain-soaked neon alley of food
stalls that the camera walks down, and dark scrims fade in behind the text so it always reads
clearly. Every section is two scrolls away: the first scroll walks the path (the alley, no text),
the second arrives at the stall. On a desktop one wheel notch, arrow key, page key or swipe moves one
stop; on a phone the page snaps stop by stop. Headings rise word by word and the rest of the content
follows when you arrive, and the content drifts gently against the mouse.

| Stop | How it is shown |
| --- | --- |
| The gate | Her name in pink neon over the gate, her role in blue neon under it. No splash screen, no overlay text |
| About me | Centred text over the alley |
| My skills | The camera stops in front of the whole noodle bar: bowls of noodles, a wok on the fire, a steamer, noodles hung to dry, the lit board on the wall, and on the bench a tiered row of small labelled bowls, one per skill. A hotspot at the wok opens an order pad with four dishes, the stack: Front end, Back end, Database, Tools, each listing its ingredients (the skills). Pick one and the camera comes in close over the bench: each ingredient bowl is lifted and tipped into the wok (or the pot), the noodles go in, the fire flares, a stir and a burst of steam, then a bowl pops up on the counter with an Order up tag and the camera eases back out |
| Projects | Five shops down the alley, left and right in turn, each named after a project with a lit board of what it is made with. A path stop and a shop stop per project; the text sits across the alley from the shop, and the dots show which shop you are at. Shop 3 is a photo lab for Image Converter Pro: its lightbox shows a strip of four screens from the app, three more hang as prints on a line under a red safelight, and a hotspot at the developing trays (or the See how it works button) opens the contact sheet, eight frames that walk through the app with a screenshot and a note each |
| Contact me | Text in the left three quarters, the phone kiosk in the right quarter. Hovering the number or the email lights the kiosk |

## Weather

It rains in the alley when it rains in Colombo. The page asks Open-Meteo (free, no key) for Colombo's
current precipitation and weather code on load and every 15 minutes; when it is dry the rain stops, the
puddles fade and the asphalt loses its shine. Add `?rain=1` or `?rain=0` to the address to force either.
If the request fails the rain stays on.

## Run

Keep XAMPP Apache running and open <http://localhost/portfolio/>. No build step, nothing to install:
Three.js r185 is vendored in `vendor/`.

## Files

- `index.html`: the content, in normal page flow
- `market.css`: layout, type, the scrims (radial, bottom band, left and right side bands)
- `main.js`: the fixed canvas, the stop-by-stop navigation (path, then stall), the camera walk driven by where each section sits on the page, the shop walk, the reveals, hover wiring
- `scene.js`: the alley (stalls, project shops, buildings, lanterns, gate, kiosk, rain, steam), the menu board and shop board painters
- `kit.js`: shared parts kit
