import { useState, useEffect } from "react";
import "./Homepage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Homepage() {
    const navigate = useNavigate();

    let [username, setusername] = useState("");
    let [roomid, setroomid] = useState("");

    let entryu = (e)=>{
        setusername(e.target.value);
    }
    let entryr = (e) =>{
        setroomid(e.target.value);
    }

    useEffect(() => {
        console.log("Updated username:", username);
    }, [username]);

    useEffect(() => {
        console.log("Updated username:", roomid);
    }, [roomid]);


    let createroom = ()=>{
        if (username.trim() === "") {
            console.log("Invalid username");
            return;
        }
        let url = `Your server Socket or Local Host url/create-room?name=${username}`;
        axios.get(url)
        .then((response)=>{
            console.log(response);
            localStorage.setItem("Roomid", response.data.roomId);
            localStorage.setItem("Username", username);
            console.log(localStorage.getItem("Roomid"));
            navigate(`/room/${localStorage.getItem("Roomid")}`);
        })
        .catch((error)=>{console.log(error)});
    }

    let joinroom = ()=>{
        if (username.trim() === "") {
            console.log("Invalid username");
            return;
        }
        if(roomid.trim() === "") {
            console.log("Invalid Room Id");
            return;
        }
        localStorage.setItem("Roomid", roomid);
        localStorage.setItem("Username", username);
        navigate(`/room/${localStorage.getItem("Roomid")}`);
    }


    return <>
        <div className="gamescreen2">
            <div className="entrywindow">
                <h1 className="homehead">Welcome to CodeNames</h1>
                <p className="jbe">To enter a room, choose your nickname</p>
                <input type="text" placeholder="Enter you Nickname" className="homeentry" onChange={entryu}/>

                <button className="yellowbutton bottomshadow roundbutton" onClick={createroom}>Create a Room</button>

                <h2 className="nbm">OR</h2>

                <h3 className="jbe">Enter room id to Join a room</h3>
                <input type="text" placeholder="e.g. apple-cake-cherry" className="homeentry" onChange={entryr}/>
                <button className="yellowbutton bottomshadow roundbutton" onClick={joinroom}>Join room</button>
            </div>
        </div>
    </>
}

export default Homepage;