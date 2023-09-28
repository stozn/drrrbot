import { Bot, listen } from './bot.mjs'

room = "oRVMt2rKrN"

drrr = new Bot("test", "kanra")

if room.length then {
    if drrr.load() then {
        print("load success")
        drrr.join(room, () => werewolf("zh"))
    }else {
        drrr.login(() => {
            drrr.save()
            drrr.join(room, () => werewolf("zh"))
        })
    } 
}else console.log("set room ID first")

event ['msg', 'me', 'dm'] (user, cont: "A") => {print("------------------")}

werewolf = (lang)=>{
    drrr.print("/me 程序启动")
  
    event ['msg', 'me', 'dm'] (user, cont: "A") => {print("AAAAAAAAAAAAAAAAA")}
}