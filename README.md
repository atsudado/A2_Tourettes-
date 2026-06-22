# Tactic — Tourette Awareness Platformer

Tactic is a small JavaScript platformer made for a school assignment. It is inspired by rage-bait/trick platformers, but the purpose is to raise awareness about Tourette syndrome and tics.

## How to run

1. Unzip the folder.
2. Open `index.html` in a web browser.
3. Play using the keyboard.

No install steps are required. The game uses only HTML, CSS, and vanilla JavaScript.

## Controls

- Left arrow: move left
- Right arrow: move right
- Up arrow: jump
- R: restart the current level

The game also supports A/D/W and simple on-screen buttons for mobile testing.

## Levels included

### Level 1: Irregular Small Tics
A straight horizontal level with one flashing red block in the middle. If the player touches the block, they die. The player must jump over it and reach the door.

### Level 2: Cause-Effect Tics
A straight horizontal level that looks flat at first. There are two invisible holes in the ground. When the player jumps, the hidden platforms fall down and the holes appear.

### Level 3: Delayed Tics
Two platforms move horizontally back and forth. The player must jump at the correct time to cross and reach the door.

## Awareness goal

Tourette syndrome is a neurological condition involving tics: sudden, repeated movements or vocal sounds. Tactic uses platformer obstacles as metaphors:

- Irregular obstacles represent unpredictability.
- Cause-effect traps represent situations that can make symptoms harder to control.
- Delayed moving platforms represent timing, waiting, and adapting.

This game is not a medical tool or a full simulation of Tourette syndrome. It is meant to encourage empathy and awareness.

## Sources used for awareness wording

- CDC: About Tourette Syndrome
- NIH / NINDS: Tourette Syndrome

## File structure

```text
tactic-platformer/
├── index.html
├── style.css
├── README.md
└── src/
    └── game.js
```
