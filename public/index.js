var text = '{"message":"Hi bitch ass nigga"}'
var xmlhttp = new XMLHttpRequest();
var url = "../app.js";

xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var response = xmlhttp.responseText;
    }
}


xmlhttp.open("GET", url, true);
xmlhttp.send();

function singlePlayer() {
  window.open("singlePlayer.html", '_blank');
}
