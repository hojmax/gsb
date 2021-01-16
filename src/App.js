import React, { useState } from 'react';
import Connect from "./components/Connect.js"
import Lobby from "./components/Lobby.js"
import "./App.css"
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [lobby, setLobby] = useState("")
  const [lobbyExists, setLobbyExists] = useState(true)
  if (lobby) {
    return <Lobby lobbyExists={lobbyExists} lobby={lobby} />
  } else {
    return <Connect setLobbyExists={setLobbyExists} setLobby={setLobby} />
  }
}

export default App;
