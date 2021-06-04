/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $ */
/* exported Options */

var Options = (function(){
  // STable backgrounds
  let gameTableBkgds = {};
  gameTableBkgds.pattern = { url:'img/table_pattern.jpg' };
  gameTableBkgds.circles = { url:'img/table_circles.jpg' };
  gameTableBkgds.felt    = { url:'img/table_felt.jpg'    };
  gameTableBkgds.plain   = { url:'img/table_plain.png'   };

  // Game Options / Defaults
  let gameOpts = {};
  gameOpts.selectSeed     = false;
  gameOpts.showTips       = true;
  gameOpts.sound          = true;
  gameOpts.tableBkgdUrl   = gameTableBkgds.pattern.url;
  
  function init(){
    // prepare modal
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
    // read locally stored options
    if(localStorage.tableBkgdUrl)
      gameOpts.tableBkgdUrl = localStorage.tableBkgdUrl;
    $('body').css('background', 'url("'+ gameOpts.tableBkgdUrl +'")');
    if(localStorage.sound)
      gameOpts.sound = (localStorage.sound == "true");
    if(localStorage.showTips)
      gameOpts.showTips = (localStorage.showTips == "true");
    if(localStorage.selectSeed)
      gameOpts.selectSeed = (localStorage.selectSeed == "true");
    // construct the UI
    $('#chkOptSound').prop('checked', gameOpts.sound);
    $('#chkTooltip').prop('checked', gameOpts.showTips);
    $('#chkSelectSeed').prop('checked', gameOpts.selectSeed);
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
    $('#chkTooltip').prop('checked', gameOpts.showTips);
    $('#chkSelectSeed').prop('checked', gameOpts.selectSeed);
    $('#dialogOptions').dialog('open');
  }

  function handleClose() {
    // Update game options
    gameOpts.sound = $('#chkOptSound').prop('checked');
    gameOpts.showTips = $('#chkTooltip').prop('checked');
    gameOpts.selectSeed = $('#chkSelectSeed').prop('checked');
    
    // Save options locally
    localStorage.sound = (gameOpts.sound?"true":"false");
    localStorage.showTips = (gameOpts.showTips?"true":"false");
    localStorage.selectSeed = (gameOpts.selectSeed?"true":"false");
    
    // Set background
    let strBkgdUrl = $('input[type="radio"][name="radBkgd"]:checked').data('url');
    if(strBkgdUrl) $('body').css('background', 'url("'+ strBkgdUrl +'")');
    localStorage.tableBkgdUrl = strBkgdUrl;

    // Close dialog
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

