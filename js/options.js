/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $ */
/* exported Options */

var Options = (function(){
  // SETUP: Table backgrounds
  let gGameTableBkgds = {};
  gGameTableBkgds.pattern = { url:'img/table_pattern.jpg' };
  gGameTableBkgds.circles = { url:'img/table_circles.jpg' };
  gGameTableBkgds.felt    = { url:'img/table_felt.jpg'    };
  gGameTableBkgds.plain   = { url:'img/table_plain.png'   };

  // SETUP: Game Options / Defaults
  let gGameOpts = {};
  gGameOpts.showTips       = false;
  gGameOpts.sound          = true;
  gGameOpts.tableBkgdUrl   = gGameTableBkgds.pattern.url;
  
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
      gGameOpts.tableBkgdUrl = localStorage.tableBkgdUrl;
    $('body').css('background', 'url("'+ gGameOpts.tableBkgdUrl +'")');
    if(localStorage.sound)
      gGameOpts.sound = (localStorage.sound == "true");
    $('#chkOptSound').prop('checked', gGameOpts.sound);
    $.each(gGameTableBkgds, function(i,obj){
      let strHtml = '<div>' +
            '  <div><input id="radBkgd'+i+'" name="radBkgd" type="radio" data-url="'+ obj.url +'" ' +
            (gGameOpts.tableBkgdUrl == obj.url ? ' checked="checked"' : '') + '></div>' +
            '  <div><label for="radBkgd'+i+'"><div style="background:url(\''+ obj.url +'\'); width:100%; height:60px;"></div></div>' +
            '</div>';

      $('#optBkgds').append( strHtml );
    });
  }

  function handleOpen() {
    $('#chkOptSound').prop('checked', gGameOpts.sound);
    $('#dialogOptions').dialog('open');
  }

  function handleClose() {
    // STEP 1: Update game options
    gGameOpts.sound = $('#chkOptSound').prop('checked');
    localStorage.sound = (gGameOpts.sound?"true":"false");
    
    // STEP 2: Set background
    let strBkgdUrl = $('input[type="radio"][name="radBkgd"]:checked').data('url');
    if(strBkgdUrl) $('body').css('background', 'url("'+ strBkgdUrl +'")');
    localStorage.tableBkgdUrl = strBkgdUrl;

    // LAST: Close dialog
    $('#dialogOptions').dialog('close');
  }
  
  function sound(){
    return gGameOpts.sound;
  }
  
  function showTips(){
    return gGameOpts.showTips;
  }

  return {handleOpen, handleClose, sound, showTips, init};
})();

