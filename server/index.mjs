/// <reference types="@altv/types" />
/// <reference types="@altv/native-types" />
import * as alt from 'alt'

let commands = [];

const cooldown_time = 10.0;

// function getPlayerFromId(id) {
//     for(var ply in alt.Player.all) {
//         if (alt.Player.all[ply].id == id) {
//             return alt.Player.all[ply]
//         }
//     }
// }

function convertToRGBA(_r, _g, _b, _a) {
    return {r: _r, g: _g, b: _b, a: _a};
}

function execute3DMessage(target, color, message, max_dist = 10.0) {
    alt.log("ASD")
    alt.emitClient(null, "add3DMessage", target, color, message, max_dist);
}

function isAttemptedCommand(msg, index = 0) {
    if (msg.charAt(index) != "/" && msg.charAt(index) != " ") { // If this is a valid char
        return false;
    }
    else if (msg.charAt(index) == "/") {
        return true;
    }
    else if (index+1 < msg.length) {
        return isAttemptedCommand(msg, index++);
    }
    else {
        return false;
    }
}

function executeNonCommand(player, message) {
    var isCommand = isAttemptedCommand(message);
    if (message != null && !isCommand) {
        execute3DMessage(player, convertToRGBA(255, 255, 0, 200), "*"+player.name+" says \"" + message + "\".*", 10.0);
    }
}

alt.onClient('chat:onInput', (player, isCommand, message) => {
    const cooldown = player.getSyncedMeta("chat:cooldown");
    if (cooldown == null || cooldown <= 0) {
        player.setSyncedMeta("chat:cooldown", cooldown_time);
        (!isCommand) ? executeNonCommand(player, message) : executeCommand(player, message);
    }
    else { 
        sendClient(player, `You cannot use the chat again for ${cooldown} more second(s).`, 'tomato', [140, 0, 0], 'x');
    }
});

export function registerCommand(command, argumentsCount, callback, description, usage = undefined) {
    commands.push([command, argumentsCount, callback, description, usage]);
}

export function registerCmd(command, argumentsCount, callback, description, usage = undefined) {
    registerCommand(command, argumentsCount, callback, description, usage);
}

// Backwards compatibility until next update
export function onCommand(...args) {
    alt.logWarning('Chat function "onCommand" is deprecated. Consider using "registerCommand" as old one will be removed after next update.');
    registerCommand(...args);
}

export function sendClient(player, text, color = 'white', gradient = false, icon = false) {
    alt.emitClient(player, 'chat:showMessage', text, color, gradient, icon);
}

// Backwards compatibility until next update
export function output(...args) {
    alt.logWarning('Chat function "output" is deprecated. Consider using "sendClient" as old one will be removed after next update.');
    sendClient(...args);
}

export function sendAll(text, color = 'white', gradient = false, icon = false) {
    alt.emitClient(null, 'chat:showMessage', text, color, gradient, icon);
}

// Backwards compatibility until next update
export function broadcast(...args) {
    alt.logWarning('Chat function "broadcast" is deprecated. Consider using "sendAll" as old one will be removed after next update.');
    sendAll(...args);
}

export function activateChat(player, state) {
    alt.emitClient(player, 'chat:activateChat', state);
}

// Backwards compatibility until next update
export function showChat(...args) {
    alt.logError('Chat function "showChat" is deprecated. Consider using "activateChat" as old one will be removed after next update. Function was not called!');
}

// Backwards compatibility until next update
export function hideChat(...args) {
    alt.logError('Chat function "hideChat" is deprecated. Consider using "activateChat" as old one will be removed after next update. Function was not called!');
}

function executeCommand(player, input) {

        player.setSyncedMeta("chat:cooldown", cooldown_time);
        let commandExists = false;

        commands.find((cmdArray) => {
            let [ command, callback, requiredArgumentsCount, description, args ] = cmdArray;
            let spaceLocation = input.search(' ');
            let hasArguments = (spaceLocation === -1) ? false : true;
            let userCommand = (hasArguments) ? input.substr(1, spaceLocation - 1) : input.substr(1);
    
            if (command.toLowerCase() === userCommand.toLowerCase()) {
                commandExists = true;
                if (requiredArgumentsCount === 0) return callback(player);
    
                if (hasArguments) {
                    // Take all input and split it into array
                    let specifiedArguments = split(input, ' ', requiredArgumentsCount);
    
                    // Remove command text from an array
                    specifiedArguments.shift();
                    
                    // Check if has all required arguments
                    if (specifiedArguments.indexOf('') === -1) {
                        callback(player, ...specifiedArguments);
                    } else showCommandInfoMessage(player, command, description, args);
                    // Player did specified argument(s)
    
                } else showCommandInfoMessage(player, command, description, args);
                return;
            }
        });
    
        if(!commandExists) sendClient(player, 'There is no such a command. You can find all of them by typing /help.', 'tomato', [140, 0, 0], 'x');
}

function showCommandInfoMessage(player, command, description, args) {
    if (args) sendClient(player, `/${command} ${args}`, 'lightgrey', [120, 120, 120], 'magnifying-glass');
    if (description) sendClient(player, `${description}`, 'lightgrey', [120, 120, 120], 'minus');
}

function split(s, separator, limit) {
    // split the initial string using limit
    var arr = s.split(separator, limit);
    // get the rest of the string...
    var left = s.substring(arr.join(separator).length + separator.length);
    // and append it to the array
    arr.push(left);
    return arr;
}

// Example Commands

registerCommand('ooc', (player, text) => {
    execute3DMessage(player, convertToRGBA(192, 192, 192, 200), "*OOC: " + text + "*", 10.0);
    sendAll(`[OOC] ${player.name}: ${text}`, 'lightsteelblue', false, 'comments');
}, 1, 'Send a message to global OOC chat.', '[message]');

registerCommand('me', (player, text) => {
    execute3DMessage(player, convertToRGBA(178, 102, 255, 200), "*" + text + "*", 10.0);
    sendAll(`${player.name} ${text}`, 'orchid', false, 'sound');
}, 1, 'Describes your character\'s action.', '[message]');

registerCommand('do', (player, text) => {
    execute3DMessage(player, convertToRGBA(178, 102, 255, 200), "*" + text + " (( "+player.name+" ))*", 10.0);
    sendAll(`${text} (( ${player.name} ))`, 'orchid', false, 'sound');
}, 1, 'Describes your character\'s or object\'s state.', '[message]');

registerCommand('ad', (_, text) => {
    sendAll(`[AD] ${text} (Ph. #000000)`, 'limegreen', [0, 140, 0], 'telephone');
}, 1, 'Broadcasts an advertisement to all citizens.', '[message]');

// registerCommand('showError', (player) => {
//     sendClient(player, 'This is an example of error message!', 'tomato', [140, 0, 0], 'x');
// }, 0, 'Shows an example of error message.');

// registerCommand('showWarning', (player) => {
//     sendClient(player, 'This is an example of warning message!', 'gold', [225, 215, 0], 'alert');
// }, 0, 'Shows an example of warning message.');

// registerCommand('showInfo', (player) => {
//     sendClient(player, 'This is an example of informative message!', 'darkgrey', [140, 140, 140], 'rss');
// }, 0, 'Shows an example of informative message.');

registerCommand('help', (player) => {
    sendClient(player, 'List of commands:', 'lightblue', [90, 90, 160], 'list-thumbnails');
    commands.forEach((c) => {
        const [ command, _, __, description ] = c;
        sendClient(player, `/${command} - ${description}`, 'lightblue', [90, 90, 160]);
    });
}, 0, 'List of commands');

setInterval(function() {
    alt.Player.all.forEach(ply => {
        const cooldown = ply.getSyncedMeta("chat:cooldown");
        if (cooldown != null && cooldown > 0) {
            ply.setSyncedMeta("chat:cooldown", cooldown-1);
        }
    });
}, 1000);