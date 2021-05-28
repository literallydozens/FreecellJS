/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $, Sound, doFillBoard */
/* exported Menu */

var Menu = (function(){
  let gameNumber;
  let runningGame = false;
  
  function init(){
    let position = { my: "center", at: "center", of: window };
    $('#dialogMenu').dialog({
      modal: true,
      autoOpen: false,
      draggable: false,
      resizable: false,
      dialogClass: 'dialogCool',
      closeOnEscape: false,
      width: "60%",
      position
    });
    $('#dialogSeed').dialog({
      modal: true,
      autoOpen: false,
      draggable: false,
      resizable: false,
      dialogClass: 'dialogCool',
      closeOnEscape: false,
      width: "50%",
      position
    });
    $(window).on("window:resize", () => $('#dialogMenu').dialog({position}));
    $(window).on("window:resize", () => $('#dialogSeed').dialog({position}));
  }
  function setRunningGame(runGameNumber){
    gameNumber = runGameNumber;
    runningGame = true;
    setTitle("Game #");
  }
  function setTitle(txt){
    $("#dialogMenu .bigText").text(txt.replace("#", "#"+gameNumber));
  }
  
  function handleOpen(status) {
    if(status == "win"){
      runningGame = false;
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

  function handleNewGame() {
    if(false)
      return $('#dialogSeed').dialog('open');
    if(runningGame)
      Sound.play("sadTrombone");
    $('#dialogMenu').dialog('close');
    doFillBoard();
  }

  function handleRetry() {
    Sound.play("sadTrombone");
    $('#dialogMenu').dialog('close');
    doFillBoard(gameNumber);
  }
  return {setRunningGame, setTitle, handleOpen, handleNewGame, handleRetry, init};
})();
