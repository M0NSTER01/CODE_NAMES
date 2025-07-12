# 🕵️‍♂️ Codenames Clone (Multiplayer Word Game)

This is a real-time multiplayer web clone of the popular word association game **Codenames** — built using **React**, **Socket.IO**, and **Node.js**. Players join a lobby, assume roles (Spymaster or Operative), and work as a team to uncover words based on given clues. Strategy, deduction, and communication are key!

> 🧪 **Note:** This game is currently in active development.  
> ✨ We appreciate your patience as we work toward the final version!

---

## 🚧 Project Status

✅ Real-time multiplayer  
✅ Dynamic role assignment  
✅ Game board logic and socket synchronization  
✅ Victory/end game logic
❌ Card animations and visual transitions (in progress)  
❌ Tailwind CSS Integration (in progress)  
❌ Responsive mobile support  

---

## ⚙️ Tech Stack

- **Frontend**: React, HTML, CSS, JavaScript  
- **Backend**: Node.js, Express, Socket.IO  
- **State Management**: React Hooks  
- **WebSocket Server**: Socket.IO  
- **Deployment**: (Coming soon)

I am actively working to improve and polish the experience.

---

## 🧠 Gameplay Overview

- Players join a room and choose a role:
  - **Spymasters** give one-word clues with a number.
  - **Operatives** guess cards based on the clue.
- Teams alternate turns, and the first to uncover all their words wins.
- Watch out for the **assassin** card — it ends the game instantly!

---

## 🛠️ Setup Instructions (For Devs)

```bash
# Clone the repository
git clone https://github.com/yourusername/codenames-clone.git
cd codenames-clone


# Run the frontend (React app)
cd my-app
npm install
npm start

# (In a separate terminal) Run the backend server
cd backend
npm install
node index.js
