import React, { useState, useEffect } from 'react';
import { Database } from "./Fire.js"
import getRandomString from "./RandomString.js"
import { Button, InputGroup, FormControl, Row, Container, Alert, Fade } from 'react-bootstrap'

function Connect(props) {
  const options = require("./Options.json")
  const [lobbyCode, setLobbyCode] = useState("")
  const [lobbyCodeError, setLobbyCodeError] = useState(false)
  const [userID, setUserID] = useState(getRandomString(16))
  const [waitingForServer, setWaitingForServer] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [name, setName] = useState("")
  const [inputName, setInputName] = useState(false)
  const [nameError, setNameError] = useState(false)
  useEffect(() => {
    const linkCode = window.location.search.substring(1, 9)
    if (linkCode) {
      tryFirstContact(linkCode)
    } else {
      setShowContent(true)
    }
  }, [])
  const tryUploadingName = () => {
    if (name.trim().length < options.name.minLength) {
      setNameError(true)
    } else {
      if (!waitingForServer) {
        setWaitingForServer(true)
        Database.ref(`lobbies/_${lobbyCode}`).once("value", (snapshot) => {
          if (snapshot.exists()) {
            Database.ref(`lobbies/_${lobbyCode}/players/${userID}`).set({ id: userID, name: name, points: 0, timePressed: 0, pressed: false })
            Database.ref(`lobbies/_${lobbyCode}/players/${userID}`).onDisconnect().remove()
            connect(lobbyCode)
          } else {
            window.location.search = window.location.search
          }
        })
      }
    }
  }
  const connect = (key) => {
    Database.ref(`lobbies/_${key}`).on("value", (snapshot) => {
      if (snapshot.exists()) {
        props.setLobby({ server: snapshot.val(), local: { lobbyCode: key, userID: userID } })
      } else {
        props.setLobbyExists(false)
      }
    })
  }
  const tryFirstContact = (key) => {
    if (!waitingForServer) {
      setWaitingForServer(true)
      Database.ref(`lobbies/_${key}`).once("value", (snapshot) => {
        if (snapshot.exists()) {
          setLobbyCode(key)
          setInputName(true)
          setWaitingForServer(false)
        } else {
          setLobbyCodeError(true)
          setWaitingForServer(false)
        }
        setShowContent(true)
      })
    }
  }
  const createLobby = () => {
    if (!waitingForServer) {
      setWaitingForServer(true)
      const randomLobbyCode = getRandomString(8)
      Database.ref(`lobbies/_${randomLobbyCode}`).set({
        players: [],
        hostID: userID,
        kickAnnouncer: ""
      }).then(() => {
          Database.ref(`lobbies/_${randomLobbyCode}`).onDisconnect().remove()
        connect(randomLobbyCode)
      })
    }
  }
  if (!showContent) {
    return <></>
  }
  if (inputName) {
    return (<>
      <Container>
        <Row className="d-flex justify-content-center">
          <InputGroup style={{ maxWidth: "270px" }} className="mt-5">
            <FormControl
              placeholder="Team Name"
              onChange={(event) => { setNameError(false); setName(event.target.value) }}
              maxLength={options.name.maxLength} />
            <InputGroup.Append>
              <Button
                variant="outline-primary"
                onClick={tryUploadingName}>
                Enter
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Row>
        <Fade in={nameError}>
          <Row className="d-flex justify-content-center"><Alert className="mt-3" variant="danger">{`The name is too short. The minimum length is ${options.name.minLength} characters.`}</Alert></Row>
        </Fade>
      </Container>
    </>)
  }
  return (
    <center>
      <h1 className="mt-3">Game Show Buzzer</h1>
      <Button
        variant="primary"
        onClick={createLobby}
        className="mt-4">
        Create a new lobby
      </Button>
      {lobbyCodeError && <Row className="d-flex justify-content-center"><Alert className="mt-3" variant="danger">The challenge link is invalid.</Alert></Row>}
    </center>
  )
}

export default Connect;
