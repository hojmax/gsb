import React, { useState, useEffect } from 'react'
import { Database } from "./Fire.js"
import CopyLink from "./CopyLink.js"
import { Button, Spinner, Container, Row, Alert, Fade, DropdownButton, Dropdown } from 'react-bootstrap'
import PlayerTable from "./PlayerTable.js"

function Settings(props) {
  return (
    <DropdownButton disabled={props.lobbyExists ? false : true} style={{ margin: 0, position: "absolute", top: "0px", right: "7px" }} id="dropdown-basic-button" className="float-right mt-2" title={<i className="fas fa-cog"></i>}>
      <Dropdown.Item onClick={() => props.setAutoReset(!props.autoReset)}>Reset buzzers when adding points {props.autoReset ? <i className="far fa-toggle-on text-primary"></i> : <i className="far fa-toggle-off text-primary"></i>}</Dropdown.Item>
      {props.showURL && <Dropdown.Item><CopyLink url={props.url} /></Dropdown.Item>}
    </DropdownButton>
  )
}

function Lobby(props) {
  const [serverWait, setServerWait] = useState(false)
  const [autoReset, setAutoReset] = useState(false)
  const isHost = props.lobby.local.userID === props.lobby.server.hostID
  useEffect(() => {
    if (props.lobby.server.kickAnnouncer === props.lobby.local.userID) {
      window.location.search = ""
    }
  }, [props.lobby.server.kickAnnouncer])
  const resetPlayersPressed = () => {
    if (props.lobby.server.players) {
      let updates = {}
      Object.values(props.lobby.server.players).forEach((e) => {
        updates[`lobbies/_${props.lobby.local.lobbyCode}/players/${e.id}/pressed`] = false
      })
      Database.ref().update(updates)
    }
  }
  const tryBuzzerPress = () => {
    if (!serverWait && props.lobbyExists && !props.lobby.server.players[props.lobby.local.userID].pressed) {
      setServerWait(true)
      let updates = {}
      updates[`lobbies/_${props.lobby.local.lobbyCode}/players/${props.lobby.local.userID}/timePressed`] = Date.now()
      updates[`lobbies/_${props.lobby.local.lobbyCode}/players/${props.lobby.local.userID}/pressed`] = true
      Database.ref().update(updates).then(() => setServerWait(false))
    }
  }
  const hasPressedBuzzer = () => !props.lobby.server.players[props.lobby.local.userID].pressed
  const homeNav = (
    <Button
      style={{ margin: 0, position: "absolute", top: "0px", left: "7px" }}
      variant="primary"
      href="/gsb"
      className="mt-2">
      <i className="fas fa-home"></i>
    </Button>
  )
  const lobbyURL = window.location.origin + window.location.pathname + "?" + props.lobby.local.lobbyCode
  return (<>
    {isHost ? (
      <>
        {homeNav}
        <Settings lobbyExists={props.lobbyExists} showURL={props.lobby.server.players} autoReset={autoReset} url={lobbyURL} setAutoReset={setAutoReset} />
      </>
    ) : homeNav
    }
    <Container>
      <center>
        {props.lobby.server.players ? (<>
          {!isHost &&
            <button
              className={(hasPressedBuzzer() ? "pressable" : "nonPressable") + " buzzer"}
              onClick={() => props.lobbyExists && tryBuzzerPress()}
              style={{ marginTop: "20px" }}>
            </button>}
          <PlayerTable lobbyExists={props.lobbyExists} serverWait={serverWait} autoReset={autoReset} setServerWait={setServerWait} lobby={props.lobby} />
          {isHost && <Button variant="dark"
            disabled={props.lobbyExists ? false : true}
            onClick={() => props.lobbyExists && resetPlayersPressed()}>
            Reset buzzers
            </Button>}
        </>) : (<>
          <h2 style={{ marginTop: "55px" }}>Waiting for players.</h2>
          <Spinner className="mb-5" animation="border" variant="primary" />
        </>)}
        {!props.lobby.server.players && <CopyLink url={lobbyURL} />}
        <Fade in={!props.lobbyExists}>
          <Row className="d-flex justify-content-center"><Alert className="mt-3" variant="danger">{isHost ? "The lobby has expired." : "The host has left the lobby."}</Alert></Row>
        </Fade>
      </center>
    </Container>
  </>)
}
export default Lobby;
