# 3D Tic-Tac-Toe

A three-dimensional twist on the classic Tic-Tac-Toe game built with React, TypeScript, and Three.js.

## Features

- **3D Game Board**: Play on a 3x3x3 cube with 27 positions
- **Keyboard Controls**: Use letter keys (a-z) and 0 to place pieces
- **Visual Position Guide**: Each empty cell shows its keyboard shortcut
- **Position Key**: Reference guide in the lower-left corner
- **Score Tracking**: Persistent score tracking between sessions
- **Game History**: View recent game results
- **Interactive 3D View**: Rotate the board with mouse/touch controls
- **Smart AI Opponent**: Play against a computer opponent

## How to Play

### Keyboard Controls

Place your piece (O) by pressing the corresponding letter key:

**Top Layer:**
```
a b c
d e f  
g h i
```

**Middle Layer:**
```
j k l
m 0 n
o p q
```

**Bottom Layer:**
```
r s t
u v w
x y z
```

The center position of the middle layer is accessed with the '0' key.

### Winning

Get three in a row in any direction:
- Horizontal (within a layer)
- Vertical (within a layer)
- Depth (across layers)
- Diagonal (within a layer or across layers)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd 3d-react-tac-toe
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to play

### Building for Production

```bash
npm run build
```

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Three.js** - 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Helper components for React Three Fiber

## Game Controls

- **Letter Keys (a-z, 0)**: Place your piece at the corresponding position
- **Mouse Drag**: Rotate the 3D board
- **Mouse Wheel**: Zoom in/out

## Project Structure

```
src/
├── components/
│   ├── Board3D.tsx      # 3D game board component
│   ├── GameInfo.tsx     # Game status and score display
│   └── PositionKey.tsx  # Keyboard reference guide
├── types/
│   └── game.ts         # TypeScript type definitions
├── utils/
│   └── gameLogic.ts    # Game logic and AI
├── App.tsx             # Main application component
└── App.css             # Application styles
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.