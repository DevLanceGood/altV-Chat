/// <reference types="@altv/types" />
/// <reference types="@altv/native-types" />
import * as alt from 'alt'
import * as game from 'natives';

let chatActive = false;
let inputActive = false;
let scrollActive = false;

const webview = new alt.WebView('http://resource/client/html/index.html');
webview.focus();

webview.on('chat:onLoaded', () => {
    activateChat(true);
    push('Connected to the server', 'limegreen', [0, 190, 0], 'check')
});

webview.on('chat:onInputStateChange', state => {
    inputActive = state;

    alt.showCursor(state);
    alt.toggleGameControls(!state);
});

webview.on('chat:onChatStateChange', state => {
    chatActive = state;
});

webview.on('chat:onInput', text => {
    alt.emitServer('chat:onInput', (text[0] === '/') ? true : false, text);
});

alt.onServer('chat:sendMessage', (sender, text) => {
    push(`${sender} says: ${text}`);
});

alt.onServer('chat:showMessage', (text, color, gradient, icon) => {
    push(text, color, gradient, icon);
});

alt.onServer('chat:activateChat', state => {
    activateChat(state);
});

export function clearMessages() {
    webview.emit('chat:clearMessages');
}

// Backwards compatibility until next update
export function clearChat(...args) {
    alt.logWarning('Chat function "clearChat" is deprecated. Consider using "clearMessages" as old one will be removed after next update.');
    clearMessages(...args);
}

export function push(text, color = 'white', gradient = false, icon = false) {
    webview.emit('chat:pushMessage', text, color, gradient, icon);
}

// Backwards compatibility until next update
export function addChatMessage(...args) {
    alt.logWarning('Chat function "addChatMessage" is deprecated. Consider using "push" as old one will be removed after next update.');
    push(...args);
}

export function activateChat(state) {
    webview.emit('chat:activateChat', state);
}

// Backwards compatibility until next update
export function showChat() {
    alt.logError('Chat function "showChat" is deprecated. Consider using "activateChat" as old one will be removed after next update. Function was not called!');
    push('Check you console!', 'red');
}

// Backwards compatibility until next update
export function hideChat() {
    alt.logError('Chat function "hideChat" is deprecated. Consider using "activateChat" as old one will be removed after next update. Function was not called!');
    push('Check you console!', 'red');
}


alt.on('keyup', key => {
    // Keys working only when chat is not active
    if (!chatActive) {
        switch (key) {
        }
    }

    // Keys working only when chat is active
    if (chatActive) {
        switch (key) {
            // PageUp
            case 33: return scrollMessagesList('up');
            // PageDown
            case 34: return scrollMessagesList('down');
        }
    }

    // Keys working only when chat is active and input is not active
    if (chatActive && !inputActive) {
        switch (key) {
            // KeyT
            case 84: return activateInput(true);
        }
    }

    // Keys working only when chat is active and input is active
    if (chatActive && inputActive) {
        switch (key) {
            // Enter
            case 13: return sendInput();
            // ArrowUp
            case 38: return shiftHistoryUp();
            // ArrowDown
            case 40: return shiftHistoryDown();
        }
    }
});

function scrollMessagesList(direction) {
    if (scrollActive) return;
    scrollActive = true;
    alt.setTimeout(() => scrollActive = false, 250 + 5);
    webview.emit('chat:scrollMessagesList', direction);
}

function activateInput(state) {
    webview.emit('chat:activateInput', state);
}

function sendInput() {
    webview.emit('chat:sendInput');
}

function shiftHistoryUp() {
    webview.emit('chat:shiftHistoryUp');
}

function shiftHistoryDown() {
    webview.emit('chat:shiftHistoryDown');
}


alt.log('Client side has loaded!');

const font = 0;

var messages = [];

function getNormalizedCoords(coords) {
    if (coords instanceof alt.Player) {
        return { x: coords.pos.x, y: coords.pos.y, z: coords.pos.z + 1.0 };
    }
    else {
        return coords;
    }
}

function getScaleFromDistance(coords, max_dist = 40.0) {
    const cur_coords = game.getEntityCoords(game.getPlayerPed(alt.Player.local), false);
    const distance = game.getDistanceBetweenCoords(coords.x, coords.y, coords.z, cur_coords.x, cur_coords.y, cur_coords.z, true);
    const scale = ((max_dist - distance) / max_dist) - 0.5;
    return scale < 0.0 ? 0.0 : scale;
}

function addMessage(_coords, _color = {r: 255, g: 0, b: 0, a: 255}, _message, _max_dist) {
    messages[messages.length] = {message: _message, position: _coords, color: _color, max_dist: _max_dist, time: 10.0};
}

function removeMessage(i) {
    messages[i] = null;
    if (i+1 < messages.length) {
        messages[i] = messages[i+1];
        removeMessage(i+1);
    }
    else {
        messages.length--;
    }
}

function DrawText3d(msg, coords, color, scale, useOutline = true, useDropShadow = true, layer = 0 ) {
    let hex = msg.match('{.*}');
    if (hex) {
        const rgb = hexToRgb(hex[0].replace('{', '').replace('}', ''));
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
        msg = msg.replace(hex[0], '');
    }
    game.getEntityCoords(game.getPlayerPed(alt.Player.local), false)
    game.setDrawOrigin(coords.x, coords.y, coords.z, 0);
    game.beginTextCommandDisplayText('STRING');
    game.addTextComponentSubstringPlayerName(msg);
    game.setTextFont(font);
    game.setTextScale(1, scale);
    game.setTextWrap(0.0, 1.0);
    game.setTextCentre(true);
    game.setTextColour(color.r, color.g, color.b, color.a);

    if (useOutline) game.setTextOutline();

    if (useDropShadow) game.setTextDropShadow();

    game.endTextCommandDisplayText(0, 0);
    game.clearDrawOrigin();
}

alt.onServer("add3DMessage", function(coords, color, msg, max_dist) {
    addMessage(coords, color, msg, max_dist);
});

alt.everyTick(function() {
    for (var i=0; i<messages.length; i++) {
        const msg = messages[i];
        if (msg != null) {
            const coords = getNormalizedCoords(msg.position);
            const scale = getScaleFromDistance(coords, msg.max_dist);
            if (scale > 0.0) {
                DrawText3d(msg.message, coords, msg.color, scale);
            }
        }
    }
});

alt.setInterval(function() {
    for (var i=0; i<messages.length; i++) {
        messages[i].time -= 1.0;
        if (messages[i].time <= 0.0) {
            removeMessage(i);
        }
    }
}, 1000);