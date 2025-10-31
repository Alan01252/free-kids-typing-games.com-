# Agent Notes

## Celebration Overlay
- Shared overlay markup + script lives in `layouts/partials/game-win-overlay.html`.
- Games trigger the overlay via `window.GameCelebration.show({ content, onPlayAgain, focusTarget, initialFocus })`.
- Overlay is automatically injected from `layouts/_default/baseof.html` after the `footer` block.

## Sound Effects
- Default typing feedback: `https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg`
- Wrong-answer cue: `https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg`
- Rocket Run win: `https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg` (previous `descending_whistle` was blocked by ORB)

### Google Actions Sound Library (Cartoon Category)
```
https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg
https://actions.google.com/sounds/v1/cartoon/cartoon_cowbell.ogg
https://actions.google.com/sounds/v1/cartoon/cartoon_ringing_hit.ogg
https://actions.google.com/sounds/v1/cartoon/clown_horn.ogg
https://actions.google.com/sounds/v1/cartoon/clown_slide_sound_effects.ogg
https://actions.google.com/sounds/v1/cartoon/concussive_guitar_hit.ogg
https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg
https://actions.google.com/sounds/v1/cartoon/cowbell_ringing.ogg
https://actions.google.com/sounds/v1/cartoon/crash_layer_cymbals.ogg
https://actions.google.com/sounds/v1/cartoon/crash_layer_drumset.ogg
https://actions.google.com/sounds/v1/cartoon/crash_layer_kick_drum.ogg
https://actions.google.com/sounds/v1/cartoon/crash_layer_kick_pedal.ogg
https://actions.google.com/sounds/v1/cartoon/crash_layer_snare.ogg
https://actions.google.com/sounds/v1/cartoon/crazy_dinner_bell.ogg
https://actions.google.com/sounds/v1/cartoon/cymbal_kick.ogg
https://actions.google.com/sounds/v1/cartoon/deflate.ogg
https://actions.google.com/sounds/v1/cartoon/drumset_falling_down_stairs.ogg
https://actions.google.com/sounds/v1/cartoon/face_stretch.ogg
https://actions.google.com/sounds/v1/cartoon/fart_toot.ogg
https://actions.google.com/sounds/v1/cartoon/getting_stuck.ogg
https://actions.google.com/sounds/v1/cartoon/goofy_spring_bounces.ogg
https://actions.google.com/sounds/v1/cartoon/hair_ripping.ogg
https://actions.google.com/sounds/v1/cartoon/hitting_a_woodblock.ogg
https://actions.google.com/sounds/v1/cartoon/inflating_big_balloon.ogg
https://actions.google.com/sounds/v1/cartoon/instrument_strum.ogg
https://actions.google.com/sounds/v1/cartoon/jingle_bells.ogg
https://actions.google.com/sounds/v1/cartoon/long_fart.ogg
https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg
https://actions.google.com/sounds/v1/cartoon/mechanical_clock_ring.ogg
https://actions.google.com/sounds/v1/cartoon/metal_strike.ogg
https://actions.google.com/sounds/v1/cartoon/metal_twang.ogg
https://actions.google.com/sounds/v1/cartoon/metallic_clank.ogg
https://actions.google.com/sounds/v1/cartoon/metallic_twang_high.ogg
https://actions.google.com/sounds/v1/cartoon/motor_running_muffled.ogg
https://actions.google.com/sounds/v1/cartoon/punchline_drum.ogg
https://actions.google.com/sounds/v1/cartoon/rainstick_slow.ogg
https://actions.google.com/sounds/v1/cartoon/rubber_duck_squeak_series.ogg
https://actions.google.com/sounds/v1/cartoon/rubber_glove_snapping_series.ogg
https://actions.google.com/sounds/v1/cartoon/rubber_squeaking.ogg
https://actions.google.com/sounds/v1/cartoon/siren_whistle.ogg
https://actions.google.com/sounds/v1/cartoon/slapping_three_faces.ogg
https://actions.google.com/sounds/v1/cartoon/slide_whistle_crazy_series.ogg
https://actions.google.com/sounds/v1/cartoon/slide_whistle_rise_and_fall.ogg
https://actions.google.com/sounds/v1/cartoon/slide_whistle_up.ogg
https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum.ogg
https://actions.google.com/sounds/v1/cartoon/small_bell_jingle.ogg
https://actions.google.com/sounds/v1/cartoon/stomach_thumps.ogg
https://actions.google.com/sounds/v1/cartoon/straw_squeak.ogg
https://actions.google.com/sounds/v1/cartoon/suction_cup_pull.ogg
https://actions.google.com/sounds/v1/cartoon/tympani_bing.ogg
https://actions.google.com/sounds/v1/cartoon/ufo_zip_whistle.ogg
https://actions.google.com/sounds/v1/cartoon/vomit_in_bathroom.ogg
https://actions.google.com/sounds/v1/cartoon/vomiting_close.ogg
https://actions.google.com/sounds/v1/cartoon/wet_fart.ogg
https://actions.google.com/sounds/v1/cartoon/wind_up_toy.ogg
https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg
https://actions.google.com/sounds/v1/cartoon/woodpecker.ogg
https://actions.google.com/sounds/v1/cartoon/xylophone_tip_toe_scale_up.ogg
```

## Terms Reminder
- Library is hosted by Google; URLs plug directly into `<audio>` tags.
- Usage must comply with Actions on Google Terms—only embed in project experiences, no redistribution.

## Adding a New Game (Hugo workflow)
1. **Create content entry**  
   - Add `content/games/<slug>.md` with front matter:  
     ```yaml
     ---
     title: "My Game"
     layout: "<slug>"
     tip: "Tip: Helpful one-liner for the footer."
     theme: "light" # or "dark" for inverted footer styling
     ---
     ```
   - The `layout` value must match the new template filename in `layouts/games/`.

2. **Build the layout template**  
   - Copy an existing game file from `layouts/games/` as a starting point.  
   - Keep the structure:  
     - `{{ define "styles" }}` block for per-game CSS.  
     - `{{ define "body_class" }}` for body modifiers.  
     - `{{ define "main" }}` for the HTML shell.  
     - `{{ define "footer" }}` should call `{{ partial "game-footer.html" … }}` so the navigation stays in sync.  
     - `{{ define "scripts" }}` for game-specific JavaScript.  
   - Use assets under `static/` (e.g. `static/images/…`) so Hugo copies them automatically.

3. **Register the game in navigation**  
   - Update `data/games.yaml` with `slug`, `title`, `emoji`, and description details; this feeds menus and the footer partial.  
   - Order matters: keep the list alphabetical unless there’s a deliberate grouping.

4. **Run Hugo to regenerate `public/`**  
   - For local development: `hugo server` (auto-rebuilds)  
   - For a one-off build: `hugo` (writes to `public/`).  
   - Never hand-edit files under `public/`; they are generated output and will be overwritten.

5. **Audio and overlays**  
   - Shared celebration overlay is in `layouts/partials/game-win-overlay.html`; invoke it via `window.GameCelebration.show({ … })`.  
   - Default sound effects:  
     - Correct: `wood_plank_flicks.ogg`  
     - Wrong: `clang_and_wobble.ogg`  
     - Use additional sounds from the Google Actions library list above if needed.

6. **Transparency check for new art**  
   - Run `sips -g hasAlpha static/images/*.png` (macOS) or alternative tooling to confirm PNGs have transparent backgrounds before committing.  
   - Kids’ UI expects transparent faces so background gradients show through.
