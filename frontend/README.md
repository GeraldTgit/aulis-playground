# Butterfly Catcher Game

A fun interactive React game where players catch butterflies with a draggable net and collect them in a cage.

## Features

- 🦋 Randomly generated butterflies that flutter around the screen
- 🕸️ Draggable net to catch butterflies
- 🏆 Counter to track caught butterflies
- 🏡 Cage to store and release butterflies
- ✨ Visual feedback when catching butterflies
- 🎨 Beautiful garden background theme

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```

## How to Play

1. Drag the net across the screen to catch butterflies
2. Each caught butterfly increases your counter
3. Click the cage to release all collected butterflies
4. Watch as the released butterflies flutter away!

## Project Structure

- `App.js`: Main game component with game logic
- `Butterfly.js`: Butterfly component with movement logic
- `DraggableNet.js`: Interactive net component
- `App.css`: Main styling for the game
- `Butterfly.css`: Butterfly-specific styling

## Dependencies

- React
- React DOM

## Assets

The game uses the following assets (should be placed in `public/images/`):
- Multiple butterfly GIFs (`butterfly1.gif`, `butterfly2.gif`, etc.)
- Net images (`catching_net_left.png`, `catching_net_right.png`)
- Garden background (`garden.png`)
- Cage image (`cage.png`)
- Popup image (`gotchaa.png`)

## Customization

You can easily customize:
- Number of butterfly variants by adding more GIFs
- Game difficulty by adjusting butterfly speed
- Visual styles in the CSS files

## License

This project is open source and available under the MIT License.

Enjoy catching butterflies! 🦋
