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
    <DropdownButton style={{ margin: 0, position: "absolute", top: "0px", right: "7px" }} id="dropdown-basic-button" className="float-right mt-2" title={<i className="fas fa-cog"></i>}>
      <Dropdown.Item onClick={() => props.setAutoReset(!props.autoReset)}>Reset buzzers when adding points {props.autoReset ? <i className="far fa-toggle-on text-primary"></i> : <i className="far fa-toggle-off text-primary"></i>}</Dropdown.Item>
      {props.showURL && <Dropdown.Item><CopyLink url={props.url} /></Dropdown.Item>}
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
  let tiedFirst = false
  const maxScore = Object.values(data.lobby.server.players)
    .reduce((acc, cur) => {
      if (cur.points > acc) {
        tiedFirst = false
        return cur.points
      } else if (cur.points == acc) {
        tiedFirst = true
        return acc
      } else {
        return acc
      }
    }, -Infinity)
  const getPointsField = (score) => {
    if (score == maxScore) {
      if (tiedFirst) {
        return `${score}🤼‍♂️`
      } else {
        return `${score}🥇`
      }
    } else {
      return score
    }
  }
  const rows = playerTransitions.map(({ item, props, key }, i) => {
    return <animated.tr key={key} style={props} className={data.lobby.local.userID === item.id ? "table-active" : ""}>
      <td>{item.pressed && positionDict[item.id]}</td>
      <td>{item.name}</td>
      <td style={{ fontFamily: 'Roboto Mono' }}>{getPointsField(item.points)}</td>
      {isHost && getSettingsCell(item)}
    </animated.tr>
  })
  return <Row style={{ maxWidth: "500px", marginTop: isHost ? "60px" : "20px" }} className="justify-content-center ">
    <Table bordered>
      <thead className="thead-dark">
        <tr>
          <th><i className="text-success fas fa-list-ol"></i></th>
          <th><i className="text-primary fas fa-users"></i></th>
          <th><i className="text-warning fas fa-star"></i></th>
          {isHost && <th><i className="fas fa-users-cog"></i></th>}
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </Table>
  </Row>
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
        <Settings showURL={props.lobby.server.players} autoReset={autoReset} url={lobbyURL} setAutoReset={setAutoReset} />
      </>
    ) : homeNav
    }
    <Container>
      <center>
        {props.lobby.server.players ? (<>
          {!isHost &&
            <button
              className={(hasPressedBuzzer() ? "pressable" : "nonPressable") + " buzzer"}
              onClick={tryBuzzerPress}
              style={{marginTop:"20px"}}>
            </button>}
          <PlayerTable serverWait={serverWait} autoReset={autoReset} setServerWait={setServerWait} lobby={props.lobby} />
          {isHost && <Button variant="dark" onClick={resetPlayersPressed}>Reset buzzers</Button>}
          <Fade in={!props.lobbyExists}>
            <Row className="d-flex justify-content-center"><Alert className="mt-3" variant="danger">{isHost ? "The lobby has expired." : "The host has left the lobby."}</Alert></Row>
          </Fade>
        </>) : (<>
          <h2 style={{ marginTop: "55px" }}>Waiting for players.</h2>
          <Spinner className="mb-5" animation="border" variant="primary" />
        </>)}
        {!props.lobby.server.players && <CopyLink url={lobbyURL} />}
      </center>
    </Container>
  </>)
}
export default Lobby;
