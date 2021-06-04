/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $ */
/* exported Options */

var Options = (function(){
  // SETUP: Table backgrounds
  let gameTableBkgds = {};
  gameTableBkgds.pattern = { url:'img/table_pattern.jpg' };
  gameTableBkgds.circles = { url:'img/table_circles.jpg' };
  gameTableBkgds.felt    = { url:'img/table_felt.jpg'    };
  gameTableBkgds.plain   = { url:'img/table_plain.png'   };

  // SETUP: Game Options / Defaults
  let gameOpts = {};
  gameOpts.selectSeed     = false;
  gameOpts.showTips       = false;
  gameOpts.sound          = true;
  gameOpts.tableBkgdUrl   = gameTableBkgds.pattern.url;
  
  function init(){
    let position = { my: "center", at: "center", of: window };    
    $('#dialogOptions').dialog({
      modal: true,
      autoOpen: false,
      draggable: false,
      resizable: false,
      dialogClass: 'dialogCool',
      closeOnEscape: true,
      width: "60%",
      position
    });
    $(window).on("window:resize", () => $('#dialogOptions').dialog({position}));
    if(localStorage.tableBkgdUrl)
      gameOpts.tableBkgdUrl = localStorage.tableBkgdUrl;
    $('body').css('background', 'url("'+ gameOpts.tableBkgdUrl +'")');
    if(localStorage.sound)
      gameOpts.sound = (localStorage.sound == "true");
    if(localStorage.showTips)
      gameOpts.showTips = (localStorage.showTips == "true");
    if(localStorage.selectSeed)
      gameOpts.selectSeed = (localStorage.selectSeed == "true");
    $('#chkOptSound').prop('checked', gameOpts.sound);
    $.each(gameTableBkgds, function(i,obj){
      let radioBtn = $("<input>").attr("name", "radBkgd").attr("type", "radio");
      radioBtn.attr("id", "radBkgd-"+i);
      radioBtn.attr("data-url", obj.url);
      radioBtn.prop("checked", gameOpts.tableBkgdUrl == obj.url);
      let radioDiv = $("<div>").append(radioBtn);
      let imageDiv = $("<div>");
      imageDiv.css("width","100%");
      imageDiv.css("height","60px");
      imageDiv.css("background","url('" + obj.url + "')");
      let label = $("<label>").append(imageDiv);
      label.attr("for", "radBkgd-"+i);
      let backgroundDiv = $("<div>").append(label);
      $('#optBkgds').append($("<div>").append(radioDiv).append(backgroundDiv));
    });
  }

  function handleOpen() {
    $('#chkOptSound').prop('checked', gameOpts.sound);
    $('#dialogOptions').dialog('open');
  }

  function handleClose() {
    // STEP 1: Update game options
    gameOpts.sound = $('#chkOptSound').prop('checked');
    localStorage.sound = (gameOpts.sound?"true":"false");
    
    // STEP 2: Set background
    let strBkgdUrl = $('input[type="radio"][name="radBkgd"]:checked').data('url');
    if(strBkgdUrl) $('body').css('background', 'url("'+ strBkgdUrl +'")');
    localStorage.tableBkgdUrl = strBkgdUrl;

    // LAST: Close dialog
    $('#dialogOptions').dialog('close');
  }
  
  function sound(){
    return gameOpts.sound;
  }
  
  function showTips(){
    return gameOpts.showTips;
  }
  
  function selectSeed(){
    return gameOpts.selectSeed;
  }

  return {handleOpen, handleClose, sound, showTips, selectSeed, init};
})();

