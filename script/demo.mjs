import { Bot } from '../bot.mjs'
global.print = console.log.bind(console);

let room = "EN6BcFXeqP"

let drrr = new Bot("test", "kanra")


if (drrr.load()){
    print("load success")
    drrr.join(room, () => werewolf("zh"))
}else {
    drrr.login(() => {
        print("login success")
        drrr.save()
        drrr.join(room, () => werewolf("zh"))
    })
} 


let werewolf = (lang)=>{
    print("werewolf")
    drrr.print("/me 程序启动")
  
    drrr.event(['msg', 'me', 'dm'] ,(user, cont) => {print(cont)})
}