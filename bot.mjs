import * as fs from 'fs';
import * as https from 'https';
import * as querystring from 'querystring';
import * as path from 'path'

https.globalAgent.keepAlive = true;
global.print = console.log.bind(console);
global.drrr = null;

const endpoint = "https://drrr.com";

const defaultConfig = {
  name: 'test',
  tc: 'None',
  avatar: 'setton',
  lang: 'en-US',
  agent: 'Bot',
  saves: 'saves.json',
  roomID: 'UgaX0cBVAT',
  sendInterval: 1800,
  getInterval: 3000,
}

function getConfig(path='config.txt') {
  let config = JSON.parse(JSON.stringify(defaultConfig));
  try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (line === '' || line.startsWith('#')) return;
      const parts = line.split('=');
      const key = parts[0].trim();
      const values = parts[1].trim();
      if (!config.hasOwnProperty(key)) 
        console.error(`Unknown config key: ${key}`);
      else if (values.length === 0) 
        console.error(`No values for config key: ${key}`);
      else
        config[key] = values;
    });
    console.log('config.txt loaded:');
    console.log(config);
    return config;
  } catch (err) {
    console.error('Failed to read `' + path + '` :' + err.message);
    return defaultConfig;
  }
}

function saveLogs(data, dir='logs'){
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const name = `${year}-${month}-${day}.txt`;

  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) 
      console.error('Failed to create directory `'+ dir + '` :' + err.message);
    else 
      fs.appendFile(path.join(dir, name), data, (err) => {
        if (err) console.error('Failed to append write file `'+ path.join(dir, name) + '` :' + err.message)});
  });  
}

function time(){
  const today = new Date();
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;
  return currentTime;
}

function fetch(url, [opts, body], callback){
  url = new URL(url);
  opts.host = url.host;
  opts.port = {'https:': 443, 'http:': 80}[url.protocol];
  opts.path = url.pathname + url.search;

  if(body){
    body = querystring.stringify(body);
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.headers['Content-Length'] = body.length
  }

  let req = https.request(opts, res => {
    res.setEncoding('utf8');
    let queue = '';
    res.on('data', chunk => queue += chunk);
    res.on('end', () => {
      callback && callback({
        status: res.statusCode,
        headers: res.headers,
        text: queue,
      })
    });
  });
  if(body){ req.write(body); }
  req.end();
}

function getCookie(res){
  let headers = res.headers;
  let cookies = headers['Set-Cookie'] || headers['set-cookie'];
  // what if cookies is a string instead of an array
  if ( (cookies != null) && (cookies[0].length == 1) ) {
    cookies = new Array(1);
    cookies[0] = headers['Set-Cookie'] || headers['set-cookie'];
  }
  for (let i = 0; i < cookies.length; i++)
    cookies[i] = cookies[i].split(';')[0];
  return cookies.join(";");
}

function readJson(fn){
  try{ return JSON.parse(fs.readFileSync(fn, {encoding:'utf8', flag:'r'})); }
  catch(e){ return {}; }
}

function writeJson(fn, obj){
  return fs.writeFileSync(fn, JSON.stringify(obj));
}

function talk2event(talk, bot){
  let evt = {
    type: "",
    user: (talk.from && talk.from.name)
          || (talk.user && talk.user.name) ||  "",
    tc: (talk.from && talk.from.tripcode)
          || (talk.user && talk.user.tripcode) || "None",
    from: (talk.from || talk.user || false),
    text: talk.content || talk.message || "",
    url: talk.url || ""
  };
  if(talk.type === 'message'){
    evt.type = talk.to ? (talk.from.name == bot.name ? 'dmto': 'dm') : 'msg';
    if(evt.type == 'dmto'){
      evt.text = '[dm to] ' + evt.text;
    }else if(evt.type == 'dm'){
      evt.text = '[dm me] ' + evt.text;
    }
  }else{
    evt.type = talk.type;
    switch (evt.type) {
      case 'me':
        break;
      case 'user-profile':
        break;  
      case 'join':
        evt.text = '[join]';
        break;
      case 'leave':
        evt.text = '[leave]';
        break;
      case 'music':
        evt.text = '[music] ' + talk.music.name;
        break;
      default:
        evt.text = '[unknown] ' + talk.type;
        break;
    }
  } 
  if(evt.type!='user-profile'){
    let log = `${time()}  @${evt.user} [${evt.tc}] | ${evt.text}`
    console.log(log);
    saveLogs(log + '\n');
  }
  return evt;
}

class Bot {

  events = {};
  states = {};
  cur_st = "";
  loopID = null;
  listen = null;
  history = null;
  room = {};

  _prev_say_args = [];

  repeat(msg){
    let [func, args] = this._prev_say_args;
    if(func) this[func](...args);
  }

  constructor(name, tc, avatar, roomID, lang, agent, saves, sendInterval, getInterval, cb){
    this.name = name;
    this.tc = tc || 'None';
    this.name_tc = name + (tc == 'None' ? '' : '#' + tc);
    this.avatar = avatar || 'setton';
    this.roomID = roomID || null;
    this.lang = lang || 'en-US';
    this.agent = agent || 'Bot';
    this.saves = saves || "saves.json";
    this.sendInterval = sendInterval || 1800;
    this.getInterval = getInterval || 3000;
    this.cb = cb;
    this.cookie = null;
    this.exec_ctrl = false;
    this.ctrl_queue = [];
    this.visitors = {}
  }

  save(){
    let json = readJson(this.saves);
    json[this.name] = this.cookie;
    writeJson(this.saves, json);
  }

  load(){
    let json = readJson(this.saves);
    let p = json[this.name] || false;
    if(!p){
      console.warn('can not find "' + this.name + '" in cookie file:' + this.saves);
      return false;
    } 
    this.cookie = p;
    return true;
  }

  get(url, callback){
    let opts = {
      'method':'GET',
      'headers':{ 'User-Agent': this.agent }
    };
    if(this.cookie)
      opts.headers.cookie = this.cookie;
    fetch(url, [opts], callback);
  }

  post(url, data, callback){
    let opts = {
      'method':'POST',
      'headers':{ 'User-Agent': this.agent },
      'muteHttpExceptions': true
    };
    if(this.cookie)
      opts.headers.cookie = this.cookie;
    fetch(url, [opts, data], callback);
  }

  login(...args){
    let callback = args.find(v => typeof v === 'function');
    let ready = args.find(
      v => typeof v === 'boolean') || true;

    function get_login_token(bot, callback){
      bot.get(endpoint + "/?api=json", res => {
        if(res.status == 200){
          let data = JSON.parse(res.text);
          if(data.redirect) return callback(res);
          callback && callback(data['token'], getCookie(res));
        }
        else{
          console.log(res.status);
          console.log(res.text);
          callback && callback(res);
        }
      });
    }

    get_login_token(this, (token, cookie) => {
      if(!cookie){
        console.error('get cookie error');
        process.exit(0);
      }
      console.log(this.name_tc);
      let form = {
        'name' : this.name_tc,
        'login' : 'ENTER',
        'token' : token,
        'language' : this.lang,
        'icon' : this.avatar
      };

      this.cookie = cookie;

      this.post(endpoint + "/?api=json", form, res => {
        if(res.status == 200 && ready){
          this.cookie = getCookie(res);
          console.log('login success');
          callback && callback(token);
        }
        else{
          console.error('login error: ' + JSON.parse(res.text).error);
          process.exit(0);
        } 
      });
    });
  }

  getLounge(callback){
    this.get(endpoint + "/lounge?api=json", res => {
      let json;
      try{ json = JSON.parse(res.text); }
      catch(e){ json = res.text; }
      this.lounge = json;
      this.rooms = json.rooms;
      callback && callback(json);
    });
  }

  getRoom(callback){
    this.get(endpoint + "/room?api=json", res => {
      // can set user and profile
      let json = JSON.parse(res.text);
      if(json.redirect){
        console.warn('Same username exists in the room, please change your username');
        process.exit(0);
      }else{
        this.loc = json.room ? 'room' : 'lounge';
        this.room = json.room || false;
        if(!this.room){
          console.error('Not in the room');
          process.exit(0);
        }else if(this.room.roomId != this.roomID){
          console.warn('The bot is already in another room: ' + this.room.roomId);
          this.leave(() => this.join(this.roomID));
        }else{
          this.users =
            (this.room && this.room.users) || false;
          this.users && this.users.forEach(u => {
            this.visitors[u.name] = u;
          })
        } 
        callback && callback(json);
        setInterval(()=> this.dm(this.name, 'keep'), 4*60*1000);
        }   
    });
  }

  getProfile(callback){
    this.get(endpoint + "/profile/?api=json", res => {
      let json;
      try{ json = JSON.parse(res.text); }
      catch(e){ json = res.text; }
      if(json.message == 'Not Logined'){
        console.log(json.message)
        return callback(false)
      }
      this.profile = json.profile;
      this.user = this.profile;
      this.name = json.profile.name;
      this.avatar = json.profile.icon;
      this.lang = json.profile.lang;
      this.agent = json.profile.device;
      callback && callback(json.profile);
    });
  }

  log(...args){
    console.log(...args);
  }

  getLoc(callback){
    this.getRoom(info => {
      this.setInfo(info);
      callback && callback(this.loc);
    })
  }

  setInfo(info){
    if(info){
      this.prevInfo = this.info;
      this.info = info;
      if(info.prfile){
        this.profile = info.profile;
        this.user = this.profile;
      }
      if(info.user)
        this.user = info.user;
      if(info.room){
        this.room = info.room;
        this.users = info.room.users;
      }
    }
    if(info && info.redirect)
      this.loc = info.redirect;
    else this.loc = "room";
  }

  getReady(callback){
    this.getProfile(() => {
      this.getLoc(() => {
        this.getLounge(callback);
      });
    });
  }

  update(callback){
    let url = "/json.php";
    this.updateTime = this.updateTime || '';
    if(this.history) url += `?update=${this.updateTime}`;
    this.get(endpoint + url, res => {
      let json = false;
      try { json = JSON.parse(res.text); }
      catch (err){ callback(false); }
      if(json && json.users){
        this.room = json;
        this.users = json.users;
        this.updateTime = json.update;
      }
      callback && callback(json);
      this.history = json;
    });
  }

  handleUser(talk){
    if(!talk.user) return;
    if(talk.type === 'join'){
      let users = this.room.users || []
      let index = users.findIndex(u => u.id == talk.user.id);
      if(index < 0) this.room.users.push(talk.user);
    }
    else if(talk.type === 'leave'){
      let users = this.room.users || []
      let index = users.findIndex(u => u.id == talk.user.id);
      if(index >= 0) this.room.users.splice(index, 1);;
    }
  }

  handle(talk){
    // ignore room history
    if(!this.history) return;

    let e = talk2event(talk, this);
    (this.events[e.type] || []).forEach(
      f => f(e.user, e.text, e.tc, e.url, e))

    if(this.listen)
      this.listen(e)
  }

  event(types, callback){
    if(!Array.isArray(types))
      types = [types];
    for(let type of types){
      this.events[type] = this.events[type] || [];
      this.events[type].push(callback);
    }
  }

  state(name, callback){
    this.states[name] = callback;
  }

  going(name){
    let dest = this.states[name];
    if(!dest) return console.log("no such state");
    this.cur_st = name;
    dest();
  }

  visit(name){
    let dest = this.states[name];
    if(!f) return console.log("no such state");
    this.cur_st = name;
    dest();
  }

  create(...args){

    let callback = args.find(v => typeof v === 'function');
    args = args.filter(v => typeof v !== 'function');

    let [name, desc, limit, lang, music, adult, hidden] = args;
    let form =  {
      name: name || 'DOLLARS',
      description: desc || '',
      limit: limit || 5,
      language: lang || this.lang,
      music: music || false,
      adult: adult || false,
      conceal: hidden || false,
      submit: "Create+Room"
    };

    this.post(endpoint + "/create_room/?api=json", form, res => {
      if(!callback) return;
      if(res.status == 200)
        this.getReady(() => callback && callback(res.text));
      else
        this.getReady(() => callback && callback(false));
      this.startHandle();
    });
  }

  join(id, callback){
    this.roomID = id;
    this.get(endpoint + "/room/?id=" + id + "&api=json", res => {
      let json = JSON.parse(res.text)
      this.getReady(() => callback && callback(json));
      this.startHandle();
      console.log("join room")
    });
  }

  startHandle(){
    let self = this;
    let handle_count = 0;
    self.lastTalk = self.lastTalk || null;
    let handle = () => {
      if(handle_count) return;
      handle_count += 1;
      this.update(json => {
        let room = json;
        if(room && room.talks){
          let talks = room.talks.filter(
            talk => !self.lastTalk || talk.time > self.lastTalk.time)
          talks.forEach(talk => self.handleUser(talk));
          talks.forEach(talk => self.handle(talk));
          if(talks.length)
            self.lastTalk = talks[talks.length - 1];
        }
        handle_count -= 1;
      });
    }
    if(!this.loopID){
      this.loopID = setInterval(handle, this.getInterval);
      handle();
    }
  }

  do_ctrl(){
    let self = this;
    let sendInterval = this.sendInterval;
    function _do_ctrl(){
      if(self.ctrl_queue.length){
        self.ctrl_queue.shift()(); // may use promise instead
        setTimeout(()=>{ // wait previous task complete
          if(self.ctrl_queue.length)
            _do_ctrl();
          else self.exec_ctrl = false;
        }, sendInterval);
      }
    }
    if(!self.exec_ctrl){ self.exec_ctrl = true; _do_ctrl(); }
  }

  _room_api(cmd, callback){
    this.post(endpoint + "/room/?ajax=1&api=json", cmd, res => {
      if(!callback) return;
      if(res.status == 200){
        callback && callback(res.status);
      }
      else{
        console.log(res.status)
        console.log(res.text);
        callback && callback(false);
      }
    });
  }

  room_api(cmd, callback){
    let self = this;
    this.ctrl_queue.push(
      ((_c, _cb) =>
        () => self._room_api(_c, _cb)
      )(cmd, callback)
    );
    this.do_ctrl();
  }

  leave(callback){ this.room_api({'leave': 'leave'}, callback); }

  roomName(name, callback){ this.room_api({'room_name': String(name)}, callback); }

  roomDesc(desc, callback){ this.room_api({'room_description': String(desc)}, callback); }

  dj(mode, callback){ this.room_api({'dj_mode': String(mode).lower()}, callback); }

  send(msg, url, callback){
    let cmd = {'message': msg };
    if(url) cmd.url = url;
    this.room_api(cmd, callback);
  }

  sendTo(name, msg, url, callback){
    this._prev_say_args = ['sendTo', arguments];
    let users = this.room.users || []
    let u = users.find(x => x.name === name);
    if(u){
      let cmd = {'message': msg, 'to': u.id || ''};
      if(url) cmd.url = url;
      this.room_api(cmd, callback);
    }else console.error('Can not find the user: @' + name + ' while sending drirect message: ' + msg);
  }

  music(name, url, callback){ this.room_api({'music': 'music', 'name': name, 'url': url}, callback); }

  handOver(name, callback){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'new_host': u.id}, callback);
  }

  kick(name, callback){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'kick': u.id}, callback);
  }

  ban(name, callback){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'ban': u.id}, callback);
  }

  report(name, callback){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'report_and_ban_user': u.id}, callback);
  }

  unban(name, callback){
    let users = this.visitors || []
    let u = this.visitors[name]
    if(u) this.room_api({'unban': u.id, 'userName': u.name}, callback);
    else callback(false);
  }

  // for werewolf room on drrr.com
  player(name, player = false){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'player': player, to: u.id });
  }

  alive(name, alive = false){
    let users = this.room.users || []
    let u = users.find(x => x.name === name)
    this.room_api({'alive': alive, to: u.id });
  }

  /* alias for extension name binding */

  /* alias for roomName */
  title = this.roomName.bind(this);

  /* alias for roomDesc */
  descr = this.roomDesc.bind(this);

  /* alias for send */
  print = this.send.bind(this);

  /* alias for sendTo */
  dm = this.sendTo.bind(this);

  /* alias for handOver */
  chown = this.handOver.bind(this);
  host = this.handOver.bind(this);

  /* port more powerful play function */
  play = this.music.bind(this);
}

function name_trip_split(expr){
  let e = expr.split('#');
  return [e[0], e.length > 1 ? e[e.length - 1] : undefined];
}

function match_user(name, tc, nameTripRegex){
  let [nameRegex, tripRegex] = name_trip_split(nameTripRegex);
  if(name === undefined) name = "";
  if(tc === undefined) tc = "";
  if(nameTripRegex.includes('#'))
    return name.match(new RegExp(nameRegex, 'i')) && (tc && tc.match(new RegExp(tripRegex, 'i')));
  else
    return name.match(new RegExp(nameRegex, 'i'));
}

console.log("bot.mjs loaded");

function start(cb=()=>drrr.print("/mehi")){
  let config = getConfig();
  drrr = new Bot(config.name, config.tc, config.avatar, config.roomID, config.lang, config.agent, config.saves,
                 parseInt(config.sendInterval), parseInt(config.getInterval), cb);
  if (drrr.load()){
      console.log('saved cookies loaded');
      drrr.join(config.roomID, cb);
  }else {
      drrr.login(() => {
          console.log('login...');
          drrr.save();
          console.log('cookies saved');
          drrr.join(config.roomID, cb);
      })
  } 
}
export { Bot as Bot, start as start};
