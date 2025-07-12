import { useEffect, useRef, useState, useMemo } from "react";
import "./Gamepage.css";
import { IoPersonSharp } from "react-icons/io5";
import { FaLaugh } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";



function ScalableCard({ text, color, onClick, canClick }) {
    const textRef = useRef();

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const parentWidth = el.parentElement.offsetWidth;
        const contentWidth = el.scrollWidth;
        const scale = (Math.max(0.5, Math.min(1, parentWidth / contentWidth)) - 0.1);
        el.style.transform = `scale(${scale})`;
    }, [text]);

    return (
        <div className={`card ${color}`}>
            
            {canClick && (
                <img
                    src="/icontapcard.png"
                    alt=""
                    className="icontap"
                    onClick={onClick}
                />
            )}
            <div className="text-wrapper">
                
                <p ref={textRef} className="scalable-text">{text}</p>
            </div>
        </div>
    );
}


function Gamepage() {
    const [nop, setnop] = useState(0);
    const [playername, setplayername] = useState("Ramdom");







    
    const { roomid } = useParams();
    const [players, setPlayers] = useState([]);
    const [host, setHost] = useState("");
    const username = localStorage.getItem("Username");
    const socketRef = useRef();
    const [gamestart, setgamestart] = useState(false);
    const [message, setmessage] = useState([]);
    let [role, setrole] = useState("none");
    const [wordList, setWordList] = useState([]);
    const [colorMap, setColorMap] = useState({});
    const [firstTurn, setFirstTurn] = useState(null);
    const [currentturn, setcurrentturn] = useState(null);
    const [turnphase, setturnphase] = useState(null);
    const [redcardcount, setredcardcount] = useState(0);
    const [bluecardcount, setbluecardcount] = useState(0);
    const [selectednumber, setselectednumber] = useState(null);
    const [cluetext, setcluetext] = useState("");
    const [revealedCards, setRevealedCards] = useState({});


    const handlecluechange = (e)=>{
        setcluetext(e.target.value.toUpperCase());

    }

    useEffect(()=>{
        console.log(cluetext);
    }, [cluetext]);

    const handleselectchange = (e)=>{
        setselectednumber(e.target.value);
    }

    const spyentry = ()=>{
        if(cluetext.trim() === "")
        {
            alert("Clue Cannot be Empty!!")
        }
        console.log("spy has done entry");
        socketRef.current.emit("spyentry", {username, cluetext, selectednumber, roomid});
    }



    const cardclick = (word, index) => {
        const isOperative = role === "redop" || role === "blueop";
        const isCorrectTurn = (role === "redop" && currentturn === "red") ||
                            (role === "blueop" && currentturn === "blue");
        const isOpPhase = turnphase === "op";

        if (gamestart && isOperative && isCorrectTurn && isOpPhase) {
            socketRef.current.emit("cardclick", {
                index,
                word,
                roomid
            });
        } else {
            console.log("Card click ignored: not valid phase/role/turn");
        }
    };

    const cardrevealer = (color, word, index) => {
        setRevealedCards(prev => ({
            ...prev,
            [index]: color
        }));
    };



    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("https://khhpmfpb-3000.inc1.devtunnels.ms");
            socketRef.current.emit("joinRoom", { roomId: roomid, username, role });
        }

        const socket = socketRef.current;

        const handleRoomUpdate = (data) => {
            console.log("Room Update Received:", data);

            setPlayers(data.players || []);
            setHost(data.host || "");
            setgamestart(data.status || false);

            if (data.wordlist) setWordList(data.wordlist);
            if (data.colorMap) setColorMap(data.colorMap);
            if (data.firstTurn) setFirstTurn(data.firstTurn);
            console.log("Handle room update: ", data.currentturn);
            console.log("clue text:", data.cluetext);
            console.log("selected number: ", data.selectednumber);
            setcurrentturn(data.currentturn);
            setturnphase(data.turnphase || "");
            setbluecardcount(data.bluecardcount || 0);
            setredcardcount(data.redcardcount || 0);
            setcluetext(data.cluetext || null);
            setselectednumber(data.selectednumber || null);


            console.log("current turn: ", currentturn);
            console.log("turnpase: ", turnphase);

        };

        const handlecardreveal = (data) =>{
            console.log(data);
            let color = data.color;
            let word = data.word;
            let index = data.index;
            cardrevealer(color, word, index);
        };

        const handleMessage = (data) => {
            setmessage(prev => [
                ...prev,
                { sender: data.sender, message: data.text }
            ]);
        };

        socket.off("roomUpdate", handleRoomUpdate);
        socket.on("roomUpdate", handleRoomUpdate);

        socket.off("cardreveal", handlecardreveal);
        socket.on("cardreveal", handlecardreveal);

        socket.off("message", handleMessage);
        socket.on("message", handleMessage);
        

        return () => {
            socket.off("roomUpdate", handleRoomUpdate);
            socket.off("message", handleMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomid]);

    useEffect(()=>{
        console.log("Useeffect: ",currentturn);
    }, [currentturn]);


    useEffect(() => {
        const savedRole = localStorage.getItem("role");
        if (savedRole) {
            setrole(savedRole);
        }
    }, []);




    useEffect(()=>{
        console.log("Players list: ", JSON.stringify(players, null, 2));
        console.log("Host: ", JSON.stringify(host, null, 2));
        console.log("Game Status: ", gamestart)

    }, [players, host]);

    useEffect(()=>{
        if (socketRef.current) {
            console.log(role);
            socketRef.current.emit("role", { roomId: roomid, username, role });
        }
    }, [role])


    const joinblsp = ()=>{
        console.log("Join blue spy pressed");
        if(!gamestart){
            setrole("bluespy");
            localStorage.setItem("role", "bluespy");
        }

    }

    const joinblop = ()=>{
        console.log("Join blue operative pressed");
        if(!gamestart){
            setrole("blueop");
            localStorage.setItem("role", "blueop");
        }

    }

    const joinredsp = ()=>{
        console.log("Join red spy pressed");
        if (!gamestart) {
            setrole("redspy");
            localStorage.setItem("role", "redspy");
        }
    }


    const joinredop = ()=>{
        console.log("Join red opreative pressed");
        if(!gamestart){
            setrole("redop");
            localStorage.setItem("role", "redop");
        }
    }

    const startGame = ()=>{
        socketRef.current.emit("start", {roomId: roomid});
    }

    const stopgame = ()=>{
        console.log("Stop game button hit!");
        socketRef.current.emit("stop", {roomId: roomid, username: username});
    }


    const operatorentry = ()=>{
        console.log("Oparator has done entry");
    }

    const endguessing = ()=>{
        socketRef.current.emit("endturn", {roomId: roomid, username: username});
    }

    // Utility functions
    const getTeam = (r) => r?.startsWith("red") ? "red" : r?.startsWith("blue") ? "blue" : null;
    const getPhase = (r) => r?.includes("spy") ? "spy" : r?.includes("op") ? "op" : null;

    const [myTurn, setMyTurn] = useState(false);

    useEffect(() => {
        const team = getTeam(role);
        const phase = getPhase(role);

        if (!gamestart) {
            setMyTurn(false);
        } else if (turnphase === "op") {
            setMyTurn(true);
        } else if (currentturn === team && turnphase === phase) {
            setMyTurn(true);
        } else {
            setMyTurn(false);
        }
    }, [gamestart, turnphase, currentturn, role]);




    return (
        <>
            <div className="gamescreen">
                <div className="headingwindow">
                    <div className="headingright start">
                        <button className="yellowbutton">Players <IoPersonSharp /> {nop}</button>
                    </div>
                    <div className="headingleft end">
                        <button className="yellowbutton">{username} <FaLaugh /></button>
                        <button className="yellowbutton" onClick={stopgame}>Close game</button>
                    </div>
                </div>

                <div className="bodywindow">
                    <div className="redteam teamwindow">
                        <div className="imgnum">
                            <div className="cardtile"></div>
                            <p className="remcount">{redcardcount}</p>
                        </div>
                        <div className="bo player">
                            <p className="teamhead">Operative(s)</p>
                            <div className="userentry">
                                {players.filter(p => p.role === "redop").map((p, idx) => (
                                    <button key={idx} className="playername">{p.name}</button>
                                ))}
                            </div>
                            <button className="yellowbutton joinbutton" onClick={joinredop}>Join as Operative</button>

                        </div>
                        <div className="bs player">
                            <p className="teamhead">Spymaster(s)</p>
                            <div className="userentry">
                                {players.filter(p => p.role === "redspy").map((p, idx) => (
                                    <button key={idx} className="playername">{p.name}</button>
                                ))}
                            </div>
                            <button className="yellowbutton joinbutton" onClick={joinredsp}>Join as Spymaster</button>
                        </div>
                    </div>
                    <div className="gamewindow">
                        {gamestart ? (
                            <div className="cardtile">
                                {wordList.map((word, index) => {
                                    const cardColor = role.includes("spy") 
                                        ? colorMap[word] || "default"
                                        : revealedCards[index] || "default";


                                    const isOperative = role === "redop" || role === "blueop";
                                    const isCorrectTurn = (role === "redop" && currentturn === "red") ||
                                                        (role === "blueop" && currentturn === "blue");
                                    const isOpPhase = turnphase === "op";
                                    const canClick = gamestart && isOperative && isCorrectTurn && isOpPhase;

                                    return (
                                        <div key={index} className={`card ${cardColor}`}>
                                            <ScalableCard
                                                text={word}
                                                color={cardColor}
                                                onClick={() => cardclick(word, index)}
                                                canClick={canClick}
                                            />
                                        </div>
                                    );
                                })}

                            </div>
                        ) : (
                        host.name === username ? (
                            <div className="waiting-screen host-screen">
                            <h2 className="waiting-title bold whiteblack shadow">You are the host</h2>
                            <p className="waiting-info whiteblack shadow">Start the game when everyone is ready!</p>
                            <button className="yellowbutton joinbutton" onClick={startGame}>Start Game</button>
                            </div>
                        ) : (
                            <div className="waiting-screen">
                            <h2 className="waiting-title bold whiteblack shadow">Host: {host.name}</h2>                            
                            <h2 className="waiting-title bold whiteblack shadow">Waiting for game to start...</h2>
                            <p className="waiting-info whiteblack shadow">Ask the host to start the game</p>
                            </div>
                        )
                        )}

                        {myTurn ? (
                        <div className="statustile">
                            <div className="statustile">
                                {(role.includes("spy") && turnphase === "spy") ? (
                                    <div className="spyturn">    
                                        <input type="text" placeholder="GIVE YOUR CLUE" className="spyturntextinput" name="cluetext" onChange={handlecluechange}/>
                                        <select className="spyturnselectinput" name="clueselect" onChange={handleselectchange}>
                                            <option value="0">-</option>
                                            {[...Array(9)].map((_, i) => (
                                            <option key={i+1} value={i+1}>{i+1}</option>
                                            ))}
                                        </select>
                                        <button className="yellowbutton joinbutton bgg" onClick={spyentry}>Give a Hint</button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="opturn">
                                            <p className="opturne">{cluetext}</p>
                                            <p className="opturne">{selectednumber}</p>
                                        </div>
                                        {(role.startsWith(currentturn) && role.includes("op")) && (
                                            <button className="yellowbutton joinbutton bgy" onClick={endguessing}>End Guessing</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        ) : null}
                        <div className="statustile">
                        </div>
                    </div>
                    <div className="teamwindow2">
                        <div className="blueteam teamwindow">
                            <div className="imgnum">
                                <div className="cardtile nxtbluecard"></div>
                                <p className="remcount">{bluecardcount}</p>
                            </div>
                            <div className="bo player">
                                <p className="teamhead">Operative(s)</p>
                                <div className="userentry">
                                    {players.filter(p => p.role === "blueop").map((p, idx) => (
                                        <button key={idx} className="playername">{p.name}</button>
                                    ))}
                                </div>
                                <button className="yellowbutton joinbutton" onClick={joinblop}>Join as Operative</button>
                            </div>
                            <div className="bs player">
                                <p className="teamhead">Spymaster(s)</p>
                                <div className="userentry">
                                    {players.filter(p => p.role === "bluespy").map((p, idx) => (
                                        <button key={idx} className="playername">{p.name}</button>
                                    ))}
                                </div>
                                <button className="yellowbutton joinbutton" onClick={joinblsp}>Join as Spymaster</button>
                            </div>
                        </div>
                        <div className="messagebox">
                            <div className="messagehead">
                                Game Log
                            </div>
                            <div className="messagewindow">
                            {message.map((msg, index) => {
                                const senderObj = players.find(p => p.name === msg.sender || p.id === msg.sender);
                                const senderRole = msg.sender === "Server" ? "server" : senderObj?.role || "unknown";

                                let msgClass = "message";
                                if (senderRole === "server") msgClass += " server-msg";
                                else if (senderRole.startsWith("red")) msgClass += " red-msg";
                                else if (senderRole.startsWith("blue")) msgClass += " blue-msg";
                                else msgClass += " neutral-msg";

                                return (
                                <div key={index} className={msgClass}>
                                    <strong>{msg.sender}</strong>: {msg.message}
                                </div>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Gamepage;
