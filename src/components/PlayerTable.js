import { Button, Table, Row, ButtonGroup } from 'react-bootstrap'
import { useTransition, animated } from "react-spring"
import { Database } from "./Fire.js"

const kick = (lobbyCode, id) => {
    Database.ref(`lobbies/_${lobbyCode}/kickAnnouncer`).set(id)
    Database.ref(`lobbies/_${lobbyCode}/players/${id}`).remove()
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
    const positionTransitions = useTransition(Object
        .values(data.lobby.server.players)
        .filter((e) => e.pressed)
        .sort((a, b) => a.timePressed - b.timePressed)
        .map((e, i) => { return { ...e, position: i + 1 } }), item => item.id, {
        config: { duration: 200 },
        from: { x: 0, opacity: 0 },
        enter: { x: 1, opacity: 1 },
        leave: { x: 1, opacity: 0 },
    })
    const getPositionTransition = (element) => {
        const pointer = positionTransitions.map(e => e.item.id).indexOf(element.id)
        if (pointer != -1) {
            const e = positionTransitions[pointer]
            return <animated.p key={e.key} style={{
                fontSize: e.props.x
                    .interpolate({
                        range: [0, 0.5, 1],
                        output: [5, 20, 16]
                    })
                    .interpolate(x => `${x}px`),
                margin: 0,
                opacity: e.props.opacity
            }}>
                {e.item.position}
            </animated.p >
        } else {
            return null
        }
    }
    const getSettingsCell = (item) => {
        return <td className="text-center">
            <ButtonGroup size="sm">
                <Button variant="primary"
                    disabled={data.lobbyExists ? false : true}
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
                            Database.ref().update(updates).then(() => {
                                Database.ref(`lobbies/_${data.lobby.local.lobbyCode}/players/${item.id}`).once("value").then((snapshot) => {
                                    if (snapshot.val().id === undefined) {
                                        Database.ref(`lobbies/_${data.lobby.local.lobbyCode}/players/${item.id}`).remove()
                                    }
                                })
                                data.setServerWait(false)
                            })
                        }
                    }}>
                    <i className="fas fa-plus"></i>
                </Button>
                {" "}
                <Button variant="primary"
                    disabled={data.lobbyExists ? false : true}
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
                    disabled={data.lobbyExists ? false : true}
                    onClick={() => (data.lobby.server.players[item.id]) && kick(data.lobby.local.lobbyCode, item.id)}>
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
            } else if (cur.points === acc) {
                tiedFirst = true
                return acc
            } else {
                return acc
            }
        }, -Infinity)
    const getPointsField = (score) => {
        if (score === maxScore) {
            if (tiedFirst) {
                return `${score}🤼‍♂️`
            } else {
                return `${score}🥇`
            }
        } else {
            return score
        }
    } // style={{fontSize:"16px"}}
    const rows = playerTransitions.map(({ item, props, key }, i) => {
        if (item.id) {
            return <animated.tr key={key} style={props} className={data.lobby.local.userID === item.id ? "table-active" : ""}>
                <td>{getPositionTransition(item)}</td>
                <td>{item.name}</td>
                <td style={{ fontFamily: 'Roboto Mono' }}>{getPointsField(item.points)}</td>
                {isHost && getSettingsCell(item)}
            </animated.tr>
        } else {
            return undefined
        }
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

export default PlayerTable