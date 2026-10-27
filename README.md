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
| My skills | A noodle bar with four real dishes: Pad Thai (front end), Shoyu Ramen (back end), Miso Udon (database), and Yakisoba (tools). A compact menu shows cartoon food illustrations, dish names and tech-stack ingredients. A small order tracker shows preparing, cooking and plating progress without skill categories or ingredient lists. Selecting a dish automatically adds each ingredient (1.65 seconds per pour), cooks and serves it. A small popup and progress bar track the order while keeping the stall visible. “Ready for pickup” appears once the bowl is served; “Order more” returns to the menu. The phone menu scrolls within 42% of the viewport height. The finished bowl stays on the counter until returning to the menu or closing the kitchen. Reduced motion shows the completed dish immediately. |
| Projects | Five project shops line the alley. Image Converter Pro occupies a dedicated photo studio with an aluminium frame, equipment desk, camera tripod, softbox and lightbox. Choose a film roll for conversion, membership or studio administration: a focus, shutter and contact-sheet reveal runs once when that roll opens. Its frames then switch directly with previous/next arrows or the left/right arrow keys, with no repeated capture animation. Each roll has its own frame count; the film roll library switches between the three main rolls. Escape returns to the alley. |
| Contact me | Text in the left three quarters, the phone kiosk in the right quarter. Hovering the number or the email lights the kiosk |

## Weather

It rains in the alley when it rains where the visitor is. The page finds the device's location without a
permission prompt: the precise position if the browser already allows it, otherwise the network's idea of the
city (geojs.io, free, no key), and Colombo if neither answers. It then asks Open-Meteo (free, no key) for the
precipitation there on load, every 2 minutes and whenever the tab comes back. Only measured rain counts: at
least 2 mm in the current 15-minute reading; a forecast code of showers on its own leaves the alley dry. The
data is a weather model, not a rain gauge, so it can differ from a weather widget. Add `?rain=1` or `?rain=0`
to the address to force either.

## Run

Keep XAMPP Apache running and open <http://localhost/portfolio/>. No build step, nothing to install:
Three.js r185 is vendored in `vendor/`.

## Files

- `index.html`: the content, in normal page flow
- `market.css`: layout, type, the scrims (radial, bottom band, left and right side bands)
- `main.js`: the fixed canvas, the stop-by-stop navigation (path, then stall), the camera walk driven by where each section sits on the page, the shop walk, the reveals, hover wiring
- `scene.js`: the alley (stalls, project shops, buildings, lanterns, gate, kiosk, rain, steam), the menu board and shop board painters
- `kit.js`: shared parts kit

Food menu images live in `img/menu/`; the active cartoon assets and built-in imagegen prompts are recorded in `img/menu/cartoon-generation-notes.md`. Original photo prompts remain in `img/menu/generation-notes.md`.
