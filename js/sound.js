/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $, console, Options */
/* exported Sound */

var Sound = (function(){
  
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let gameSound = {
  cardFlip:    { url:'sounds/cardFlip.mp3',    src:'freesound.org/people/f4ngy/sounds/240776/'    },
  cardShuffle: { url:'sounds/cardShuffle.mp3', src:'freesound.org/people/deathpie/sounds/19245/'  },
  crowdCheer:  { url:'sounds/crowdCheer.mp3',  src:'soundbible.com/1700-5-Sec-Crowd-Cheer.html'   },
  sadTrombone: { url:'sounds/sadTrombone.mp3', src:'freesound.org/people/Benboncan/sounds/73581/' },
};

function getBuffer(sound){
  if(sound == "fake")
    return audioCtx.createBuffer(1, 1, 22050);
  let objSound = gameSound[sound];
  if(!objSound){
    console.log("sound : '" + sound + "' is not defined");
    return;
  }
  let buffer = objSound.buffer;
  if(!buffer){
    console.warn('WARN: No buffer exists for: ' + sound);
    return;
  }
  return buffer;
}

function load(url){
  return new Promise(function(res,rej){
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
      if(this.status != 200)
        return rej("Unable to retrieve the sound, from: " + url);
      audioCtx.decodeAudioData(xhr.response, res, e => "Unable to load sound (" + url + "). "+e);
    };
    xhr.send();
  });
}

function loadAll() {
  let soundObjs = Object.values(gameSound);
  let promises = soundObjs.map(o => load(o.url).then(b => o.buffer = b).catch(e => console.log(e)));
  return Promise.all(promises).then(() => console.log("all sounds loaded"));
}

function play(sound) {
  if(!Options.sound())
    return;
  let source = audioCtx.createBufferSource();
  source.buffer = getBuffer(sound);
  source.connect(audioCtx.destination);
  let start = (source.start || source.noteOn).bind(source);
  start(0);
}

function init(){
  $(document).on('touchstart', () => play("fake"));
  loadAll();
}

return {play, init};
})();