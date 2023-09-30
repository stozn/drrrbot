# DrrrBot

English | [简体中文](README_zh-CN.md)

A Node.js bot for drrr.com
This project is modified from the [DrrrChatbots/drrr-lambot](https://github.com/DrrrChatbots/drrr-lambot). (Thanks to @nobodyzxc aka lambda.catノ)

Changes made:
* Removed support for `Lambda Script` (as there seem to be some bugs with `event`).
* Added local logging of room messages (saved in the `logs` folder).
* Added automatic keep-alive functionality (sends direct message to Bot at regular intervals).
* Added configuration file (`config.txt`).
* Added some exception handling and automatic processing.



## Quick Start

```
# Run demo script

node script/demo.mjs
```



## Configuration

You can configure the bot by editing the `config.txt` file.

```
# profile
name = test
tc = mytc123
avatar = setton
roomID = UgaX0cBVAT

lang = en-US
agent = Bot

# cookies saves
saves = saves.json

# waiting time for sending messages
sendInterval = 1800

# waiting time for getting messages
getInterval = 300
```


* If you want to keep a certain configuration as default, you can delete that line.
* The Tripcode (`tc`) is optional. If you want to log in without a Tripcode, simply delete that line.
* The `RoomID` can be found in the URL of the room, for example: https://drrr.com/room/UgaX0cBVAT.
* It is recommended to set the `SendInterval` to at least 1000ms. If messages are sent too quickly, your IP may be blocked.
* Cookies will be saved in the `saves.json` file. If you want to reset the Cookies, simply delete that file.




## Demo

```js
// script/demo.mjs

import { start } from '../bot.mjs'


start(main) // start the this script

// main function
function main(){
    print("start main") // console.log is bound to print.
    drrr.print("/me hello world")

    drrr.event(['msg', 'me', 'dm'] ,(user, cont, tc, url) => {
        if (cont == "/msg"){
            drrr.print(`@${user} msg ok`)
            drrr.print(`/me@${user} me ok`)
        }
    })

    drrr.event('msg' ,(user, cont) => {
        if (cont == "/dm"){
            drrr.dm(user, `@${user} dm ok`)
        }
    })

    drrr.event('join' ,user => {
        drrr.print(`@${user} welcome`)
    })

    /*
        you can write your script here.
    */
}
```




## Funcitons

You can use these functions in a callback function (`cb`), and then run `start(cb)` in your script.

* `drrr.print(msg, url)`: Send a message (`msg`) to the room. (`url` is optional)

* `drrr.dm(name, msg, url)`: Send a direct message (`msg`) to a user specified by `name`. (`url` is optional)

* `drrr.play(name, url)`: Play a music in the room with the music name (`name`) and the music link (`url`).
  
* `drrr.chown(name)`: Change the host of the room to  another user specified by `name`.

* `drrr.host(name)`: Same as `drrr.chown`.

* `drrr.kick(name)`: Kick a user specified by `name` from the room.

* `drrr.ban(name)`: Ban a user specified by `name` from rejoining the room.

* `drrr.unban(name)`: Unban a user specified by `name`, allowing them to rejoin the room if previously banned.

* `drrr.report(name)`: Report and ban a user specified by `name`.

* `drrr.title(name)`: Set the title of the room to the value specified by `name`.

*  `drrr.descr(desc)`: Set the description of the room to the value specified by `desc`.

* `drrr.join(roomID)`: Make the bot join the chat room specified by `roomID`.

* `drrr.leave()`: Make the bot to leave the room.




## Events

* `msg`: Triggered when a normal message is received.

* `me`: Triggered when a "/me" message is received.

* `dm`: Triggered when a direct message is received.

* `join`: Triggered when a user joins the room.

* `leave`: Triggered when a user leaves the room.

* `music`: Triggered when a user plays music in the room.



## User Agent

```
Desktop
Mobile
Bot
Tv
Tablet
```


## Avatar

![Avatar](avatar.jpg)



