import React, { useState, useEffect } from 'react'
import { Database } from "./Fire.js"
import CopyLink from "./CopyLink.js"
import { Button, Spinner, Nav, Table, Container, Row, Alert, ButtonGroup, Fade, DropdownButton, Dropdown, Col, Form } from 'react-bootstrap'
import { useTransition, animated } from "react-spring"

const kick = (lobbyCode, id) => {
  Database.ref(`lobbies/_${lobbyCode}/kickAnnouncer`).set(id)
}

function Settings(props) {
  return (
    <DropdownButton id="dropdown-basic-button" className="float-right mt-1 mr-1" title={<i className="fas fa-cog"></i>}>
      <Dropdown.Item onClick={() => props.setAutoReset(!props.autoReset)}>Reset buzzers when adding points {props.autoReset ? <i className="far fa-toggle-on text-primary"></i> : <i className="far fa-toggle-off text-primary"></i>}</Dropdown.Item>
    </DropdownButton>
  )
}

function PlayerTable(data) {
  const isHost = data.lobby.local.userID === data.lobby.server.hostID
  const positionDict = {}
  Object
    .values(data.lobby.server.players)
    .filter((e) => e.pressed)
    .sort((a, b) => a.timePressed - b.timePressed)
    .forEach((e, i) => positionDict[e.id] = i + 1)
  const playerTransitions = useTransition(Object.values(data.lobby.server.players), item => item.id, {
    config: { duration: 1000 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  })
  const getSettingsCell = (item) => {
    return <td className="text-center">
      <ButtonGroup size="sm">
        <Button variant="primary"
          onClick={() => {
            if (!data.serverWait && data.lobby.server.players[item.id]) {
              data.setServerWait(true)
              let updates = {}
              if (data.autoReset) {
                Object.values(data.lobby.server.players).forEach((e) => {
                  updates[`lobbies/_${data.lobby.local.lobbyCode}/players/${e.id}/pressed`] = false
                })
              }
              updates[`lobbies/_${data.lobby.local.lobbyCode}/players/${item.id}/points`] = item.points + 1
              Database.ref().update(updates).then(() => data.setServerWait(false))
            }
          }}>
          <i className="fas fa-plus"></i>
        </Button>
        {" "}
        <Button variant="primary"
          onClick={() => {
            if (!data.serverWait && data.lobby.server.players[item.id]) {
              data.setServerWait(true)
              Database.ref(`lobbies/_${data.lobby.local.lobbyCode}/players/${item.id}/points`).set(item.points - 1).then(() => data.setServerWait(false))
            }
          }}>
          <i className="fas fa-minus"></i>
        </Button>
        {" "}
        <Button variant="primary"
          onClick={() => data.lobby.server.players[item.id] && kick(data.lobby.local.lobbyCode, item.id)}>
          <i className="fas fa-users-slash"></i>
        </Button>
      </ButtonGroup>
    </td>
  }
  const maxScore = Object.values(data.lobby.server.players)
    .reduce((acc, cur) => cur.points > acc ? cur.points : acc, -Infinity)
  const rows = playerTransitions.map(({ item, props, key }, i) => {
    return <animated.tr key={key} style={data.lobby.local.userID === item.id ? { ...props, backgroundColor: "rgb(208, 233, 193)" } : { ...props }}>
      <td>{item.pressed && positionDict[item.id]}</td>
      <td>{item.name}</td>
      <td>{maxScore === item.points ? `${item.points} 🥇` : item.points}</td>
      {isHost && getSettingsCell(item)}
    </animated.tr>
  })
  return <Container>
    <Row style={{ maxWidth: "400px" }} className="d-flex justify-content-center">
      <Table striped bordered>
        <thead>
          <tr>
            <th><i className="text-success fas fa-list-ol"></i></th>
            <th><i className="text-secondary fas fa-users"></i></th>
            <th><i className="text-warning fas fa-star"></i></th>
            {isHost && <th><i className="fas fa-users-cog"></i></th>}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    </Row>
  </Container>
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
    <Nav activeKey="" style={{ display: "inline-block" }}>
      <Nav.Item>
        <Nav.Link style={{ fontSize: "22px" }} href="/gsb">Home</Nav.Link>
      </Nav.Item>
    </Nav>)
  return (
    <>
      {isHost ? (
        <Row>
          <Col>
            {homeNav}
          </Col >
          <Col>
            <Settings autoReset={autoReset} setAutoReset={setAutoReset} />
          </Col >
        </Row >
      ) : homeNav
      }
      <center>
        {props.lobby.server.players ? (<>
          {!isHost &&
            <button
              className={(hasPressedBuzzer() ? "pressable" : "nonPressable") + " buzzer mb-4"}
              onClick={tryBuzzerPress}>
            </button>}
          <PlayerTable serverWait={serverWait} autoReset={autoReset} setServerWait={setServerWait} lobby={props.lobby} />
          {isHost && <Button className="mb-5" variant="secondary" onClick={resetPlayersPressed}>Reset buzzers</Button>}
          <Fade in={!props.lobbyExists}>
            <Row className="d-flex justify-content-center"><Alert className="mt-3" variant="danger">{isHost ? "The lobby has expired." : "The host has left the lobby."}</Alert></Row>
          </Fade>
        </>) : (<>
          <h2>Waiting for players.</h2>
          <Spinner className="mb-5" animation="border" variant="primary" />
        </>)}
        {isHost && <CopyLink url={window.location.origin + window.location.pathname + "?" + props.lobby.local.lobbyCode} />}
      </center>
    </>
  )
}
export default Lobby;
