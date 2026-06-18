# Week 6 Example 2 — Free Roam Top-Down with Boss Battle


## Setup and Interaction Instructions

To run the sketch locally, open `index.html` in Google Chrome using Live Server.

**Controls:**
- Move: WASD
- Shoot: Spacebar (shoots in the direction you last moved)
- B: Skip to boss fight (testing only)
- Restart: R (after win or game over)

Explore the world, survive enemy waves as you move north, then enter the glowing boss zone to fight the giant orange blob. Watch the minimap to track enemies off screen.

**Adding Your Own Sounds**
1. Add your sound files to `assets/sounds/`
2. In `preload()`, uncomment the `loadSound()` lines and update the file paths
3. Uncomment the `play()` or `loop()` calls in the relevant functions — there are hooks for the boss music transition too

**Editing the Waves and Boss**
Open `data/enemies.json` to change when waves spawn, how many enemies appear, their speed, and the boss stats. Each wave has a `spawnAt` world Y value — lower values trigger later since the player starts at the bottom of the world.

**Opening the Chrome Console**
- **Windows:** Press `F12` or `Ctrl + Shift + J`, then click the **Console** tab
- **Mac:** Press `Cmd + Option + J`

## Assets

| File | Source |
|------|--------|
| `assets/images/background.png`           | Generated with GenAI |
| `assets/images/enemy.png`                | Generated with GenAI |
| `assets/images/hero.png`                 | Generated with GenAI |
| `assets/sounds/background_music.mp3`     | [4] UniqueCreativeAudio - pixabay |
| `assets/sounds/gun.mp3`                  | [1] EAGLAXLE - pixabay            |
| `assets/sounds/hit.mp3`                  | [2] freesound_community - pixabay |
| `assets/sounds/win.mp3`                  | [3] u_it78ck90s3 - pixabay        |

## References

[1]EAGLAXLE. 2026. Gun shot 1 | Royalty-free Music. Pixabay.com. Retrieved June 18, 2026 from https://pixabay.com/sound-effects/film-special-effects-gun-shot-1-530788/

[2]freesound_community. 2023. GRUNT 1 | Royalty-free Music. Pixabay.com. Retrieved from https://pixabay.com/sound-effects/people-grunt-1-85280/

[3]u_it78ck90s3. 2025. orchestral win | Royalty-free Music. Pixabay.com. Retrieved June 18, 2026 from https://pixabay.com/sound-effects/musical-orchestral-win-331233/

[4]UniqueCreativeAudio. 2023. Rise Together, Fight Together - Power Instrumental | Royalty-free Music. Pixabay.com. Retrieved June 18, 2026 from https://pixabay.com/music/adventure-rise-together-fight-together-power-instrumental-170035/
