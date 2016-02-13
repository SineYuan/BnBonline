var resPrefix = 'game/';

//声音WAV库
var SoundType = {
    Appear : "appear.wav",
    Background : "bg.wav",
    Die : "die.wav",
    Draw : "draw.wav",
    Explode : "explode.wav",
    Get : "get.wav",
    Lay : "lay.wav",
    Save : "save.wav",
    Start : "start.wav",
    Win : "win.wav"
};

//声音仓库
var SoundStorage = new Array();
var SoundFreeStorage = {};

//声音控制
var SystemSound = {
    Play: function (type, loop) {
        var foundSound = null;
        if (type in SoundFreeStorage) {
            foundSound = SoundFreeStorage[type];
        }
        if (foundSound != null) {
            foundSound.Play();
        }
        else {
            foundSound = new Sound(resPrefix + "Snd/" + type);
            foundSound.Loop = loop;
            foundSound.Play();
            SoundStorage.push({ Sound: foundSound, Type: type });
        }
        return foundSound;
    },

    Stop: function (sndObject) {
        sndObject.Stop();
    }
}

setInterval(function(){
    for(var i = 0; i < SoundStorage.length; i++){
        if(!SoundStorage[i].Sound.IsPlaying){
            SoundFreeStorage[SoundStorage[i].Type] = SoundStorage[i].Sound;
        }
    }
}, 30);