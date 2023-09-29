import { start } from '../bot.mjs'

let main = () => {

    print("start main")
    drrr.print("/me 程序启动")

    drrr.event(['msg', 'me', 'dm'] ,(user, cont) => {
        if (cont == "/"){
            for(let i = 0; i < 3; i++){
                drrr.print(i)
            }
        }
    })

    drrr.event(['msg', 'me', 'dm'] ,(user, cont) => {
        if (cont == "/1"){
            for(let i = 0; i < 3; i++){
                drrr.dm(user, i)
            }
        }
    })

}

start(main)