/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $, console */
/* exported handleMenuOpen, handleOptionsNewGame, handleOptionsRetry, Menu */

var Menu = (function(){
  let gameNumber;
  let runningGame = false;
  
  function init(){
    $('#dialogMenu').dialog({
      modal: true,
      autoOpen: false,
      draggable: false,
      resizable: false,
      dialogClass: 'dialogCool',
      closeOnEscape: false,
      width: "60%",
      position: { my: "center", at: "center", of: window }
    });
  }
  function setRunningGame(runGameNumber){
    gameNumber = runGameNumber;
    runningGame = true;
    setTitle("Game #");
  }
  function getRunningGame(){ return gameNumber; }
  function hasRunningGame(){ return runningGame; }
  function removeRunningGame(){ runningGame = false; }
  function setTitle(txt){
    $("#dialogMenu .bigText").text(txt.replace("#", "#"+gameNumber));
  }
  return {setRunningGame, getRunningGame, hasRunningGame, removeRunningGame, setTitle, init};
})();

function handleMenuOpen(status) {
  if(status == "win"){
    Menu.setTitle("GAME # WON !!!");
    $("#menuPlayBtn").show();
    $("#menuNewBtn").hide();
    $("#menuRetryBtn").hide();
    $("#menuResumeBtn").hide();
  }else if(status == "start"){
    Menu.setTitle("Freecell");
    $("#menuPlayBtn").show();
    $("#menuNewBtn").hide();
    $("#menuRetryBtn").hide();
    $("#menuResumeBtn").hide();
  }else{
    $("#menuPlayBtn").hide();
    $("#menuNewBtn").show();
    $("#menuRetryBtn").show();
    $("#menuResumeBtn").show();
  }
  $('#dialogMenu').dialog('open');
  $('#dialogMenu button').blur();
}

function handleOptionsNewGame() {
  if(Menu.hasRunningGame())
    if(gGameOpts.sound) 
      playSound(gGameSounds.sadTrombone);
  $('#dialogMenu').dialog('close');
  doFillBoard();
}

function handleOptionsRetry() {
  if(gGameOpts.sound) 
    playSound(gGameSounds.sadTrombone);
  $('#dialogMenu').dialog('close');
  doFillBoard(Menu.getRunningGame());
}