# DrrrBot

NodeJS Bot for drrr.com



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
* Tripcode(tc) is optional. (You can just delete that line to login without tc)
* RoomID can be found in the URL of the room. (e.g. https://drrr.com/room/UgaX0cBVAT)
* SendInterval is recommended to be at least 1000ms. (Your IP will be ban if you send messages too fast)
* Cookies will be saved in the `saves.json` file, if you want to reset the cookies, just delete the file.
  



## Avatar
![Avatar](avatar.jpg)

## User Agent
```
Desktop
Mobile
Bot
Tv
Tablet
```




## Acknowledgements

This project includes code derived from the work of [DrrrChatbots/drrr-lambot](https://github.com/DrrrChatbots/drrr-lambot).

