# Night Market

A one-page portfolio for Samathri Abhayapala, AI full-stack developer. The page is an ordinary
scrolling page: the content sits in the middle of the screen. Behind it, fixed, is a rain-soaked
neon alley of food stalls that the camera walks down as you scroll, and dark scrims fade in
behind the text so it always reads clearly.

| Section | How it is shown |
| --- | --- |
| Hero | The neon gate, the name centred over the alley |
| About me | Centred text over the stall with her name on the banner |
| My skills | The camera walks up to the noodle bar; the skills are the menu on a lit board hanging on its wall (a plain list below 900px) |
| Projects | A sticky frame: you walk under five numbered lanterns, one project each. The text sits on the left, the lit lantern and its poster on the right; the dots show which lantern you are under |
| Contact me | Text in the left three quarters, the phone kiosk in the right quarter. Hovering the number or the email lights the kiosk |

## Run

Keep XAMPP Apache running and open <http://localhost/portfolio/market/>. No build step, nothing to install:
Three.js r185 is vendored in `vendor/`.

## Files

- `index.html`: the content, in normal page flow
- `market.css`: layout, type, the four scrims (radial, top band, bottom band, side band)
- `main.js`: the fixed canvas, the camera walk driven by where each section sits on the page, the lantern walk, hover wiring
- `scene.js`: the alley (stalls, buildings, lanterns and posters, gate, kiosk, rain, steam) and the menu board painter
- `kit.js`: shared parts kit
