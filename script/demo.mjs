import { start } from '../bot.mjs'

// start the this script
start(main)

// main function
function main(){
    print("start main") // console.log is bound to print.
    drrr.print("/me hello world")

    drrr.event(['msg', 'me', 'dm'] ,(user, cont) => {
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