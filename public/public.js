const socket = io();


//variable setup

let channel = "0-0";

//login stuff

if(!sessionStorage[SERVERNAME]){
    window.location.replace(LOGINPATH);
}

function resetSliders(){
    let s = user.settings.sliders;
    document.getElementById(`custom_gradient_r1`).value = s[0];
    document.getElementById(`custom_gradient_r2`).value = s[1];
    document.getElementById(`custom_gradient_g1`).value = s[2];
    document.getElementById(`custom_gradient_g2`).value = s[3];
    document.getElementById(`custom_gradient_b1`).value = s[4];
    document.getElementById(`custom_gradient_b2`).value = s[5];
}

let user = JSON.parse(sessionStorage[SERVERNAME]);
socket.emit("autologin?",user);

socket.on("login?", (usr)=>{
    if(!usr.passes){
        window.location.replace(LOGINPATH);
    }
    user = usr;

    document.getElementById("settings").style.background = user.settings.gradient.main;
    document.getElementById("main").style.background = user.settings.gradient.main;
    document.getElementById("side_pannel").style.background = user.settings.gradient.secondary;

    // document.getElementById("input").style.background = secondaryGradient;
    document.getElementById("input").style.background = user.settings.gradient.secondary;

    resetSliders();

    displayServers(usr.serverList);
})

function changeTheme(){
    console.warn("changeTheme incomplete")
}

function toggleSettings(){
    if(document.getElementById("settings").classList.contains("hidden")){
        document.getElementById("settings").classList.remove("hidden");
    }else{
        document.getElementById("settings").classList.add("hidden");

    }
}

//coloring and settings

function signout(){
    localStorage.removeItem(SERVERNAME);
    sessionStorage.removeItem(SERVERNAME);
    window.location.replace(LOGINPATH);
}


function saveSettings(){
    socket.emit("settings",user);

}



document.getElementById("main").style.background = `linear-gradient(135deg, #888, #777)`;
document.getElementById("side_pannel").style.background = `linear-gradient(-135deg, #888, #777)`;
function updateColors(num){
    let r = document.getElementById(`custom_gradient_r${num}`);
    let g = document.getElementById(`custom_gradient_g${num}`);
    let b = document.getElementById(`custom_gradient_b${num}`);
    let formula = Math.floor(255/100);
    let R = r.value*formula, G = g.value*formula, B = b.value*formula;
    r.style.accentColor = `rgb(${R},0,0)`;
    g.style.accentColor = `rgb(0,${G},0)`;
    b.style.accentColor = `rgb(0,0,${B})`;
    document.getElementById(`rgb_slider${num}`).style.backgroundColor=`rgba(${R},${G},${B}, 0.5)`;
    updateBackground();
}

function updateBackground(){
    let f = 255/100;
    let r1 = Math.floor(document.getElementById(`custom_gradient_r1`).value*f), r2 = Math.floor(document.getElementById(`custom_gradient_r2`).value*f);
    let g1 = Math.floor(document.getElementById(`custom_gradient_g1`).value*f), g2 = Math.floor(document.getElementById(`custom_gradient_g2`).value*f);
    let b1 = Math.floor(document.getElementById(`custom_gradient_b1`).value*f), b2 = Math.floor(document.getElementById(`custom_gradient_b2`).value*f);

    let sliders = [Math.floor(r1*100/255), Math.floor(g1*100/255), Math.floor(b1*100/255), Math.floor(r2*100/255), Math.floor(g2*100/255), Math.floor(b2*100/255)];

    let mainGradient = `linear-gradient(135deg, rgb(${r1},${g1},${b1}),rgb(${r2},${g2},${b2}))`;
    let secondaryGradient = `linear-gradient(-135deg,rgb(${r1*4/5},${g1*4/5},${b1*4/5}),rgb(${r2*4/5},${g2*4/5},${b2*4/5}))`;
    
    document.getElementById("settings").style.background = mainGradient;
    document.getElementById("main").style.background = mainGradient;
    document.getElementById("side_pannel").style.background = secondaryGradient;

    document.getElementById("input").style.backgroundColor = secondaryGradient;
    

    user.settings.gradient.main = mainGradient;
    user.settings.gradient.secondary = secondaryGradient;
    user.settings.sliders = sliders;
    
    saveSettings();
}

document.getElementById("custom_gradient_r1").onclick = () =>{updateColors(1);}
document.getElementById("custom_gradient_g1").onclick = () =>{updateColors(1);}
document.getElementById("custom_gradient_b1").onclick = () =>{updateColors(1);}

document.getElementById("custom_gradient_r2").onclick = () =>{updateColors(2);}
document.getElementById("custom_gradient_g2").onclick = () =>{updateColors(2);}
document.getElementById("custom_gradient_b2").onclick = () =>{updateColors(2);}


//messages
function send(message){

    let msg = {
        user:user.name,
        channel:channel,
        content:message,
        timestamp:Date.now()
    }

    socket.emit("message",msg);
}

socket.on("message", (msg)=>{
    const span = document.createElement("span");
    span.classList.add("message");

    const msgHeader = document.createElement("p");
    msgHeader.innerHTML = `<b>${msg.user}</b> - ${msg.timestamp}`;

    const content = document.createElement("p");
    content.classList.add("message_content");
    content.innerText = msg.content;

    span.appendChild(msgHeader);
    span.appendChild(content);

    document.getElementById("chat").appendChild(span);
})

let downKey;

document.getElementById("input").onkeydown = (e) => {
    downKey = e.key;
}

document.getElementById("input").onkeyup = (e) =>{
    if(e.key === "Enter" && downKey != "Shift"){
        send(document.getElementById("input").value,channel.id);
        document.getElementById("input").value = "";
    }
}