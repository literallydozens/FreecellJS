/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* global $, console, Stats, Deals, Menu, handleMenuOpen */
/* exported handleOptionsOpen, handleOptionsClose, handleOptionsNewGame */

// CONSTS
const FOUNDATIONS = ['#cardFoun1','#cardFoun2','#cardFoun3','#cardFoun4'];
const OPENCELLS = ['#cardOpen1','#cardOpen2','#cardOpen3','#cardOpen4'];
const SUIT_DICT = {
  club:    { color:'b', accepts:['diamond', 'heart'] },
  diamond: { color:'r', accepts:['club'   , 'spade'] },
  heart:   { color:'r', accepts:['club'   , 'spade'] },
  spade:   { color:'b', accepts:['diamond', 'heart'] }
};
const NUMB_DICT = {
  A: { cascDrop:''  , founDrop:'2' },
  2: { cascDrop:'A' , founDrop:'3' },
  3: { cascDrop:'2' , founDrop:'4' },
  4: { cascDrop:'3' , founDrop:'5' },
  5: { cascDrop:'4' , founDrop:'6' },
  6: { cascDrop:'5' , founDrop:'7' },
  7: { cascDrop:'6' , founDrop:'8' },
  8: { cascDrop:'7' , founDrop:'9' },
  9: { cascDrop:'8' , founDrop:'10'},
  10:{ cascDrop:'9' , founDrop:'J' },
  J: { cascDrop:'10', founDrop:'Q' },
  Q: { cascDrop:'J' , founDrop:'K' },
  K: { cascDrop:'Q' , founDrop:''  }
};

// GLOBAL VARIABLES
let gAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
// GAME SETUP
{

  // SETUP: Define / Start async load of sounds files
  // NOTE: iOS (as of iOS9) is unable to play ogg files, so we are using MP3 for everything
  var gGameSounds = {};
  gGameSounds.cardFlip    = { buffer:null, url:'sounds/cardFlip.mp3',    src:'freesound.org/people/f4ngy/sounds/240776/'    };
  gGameSounds.cardShuffle = { buffer:null, url:'sounds/cardShuffle.mp3', src:'freesound.org/people/deathpie/sounds/19245/'  };
  gGameSounds.crowdCheer  = { buffer:null, url:'sounds/crowdCheer.mp3',  src:'soundbible.com/1700-5-Sec-Crowd-Cheer.html'   };
  gGameSounds.sadTrombone = { buffer:null, url:'sounds/sadTrombone.mp3', src:'freesound.org/people/Benboncan/sounds/73581/' };
}

// ==============================================================================================

function showTips(text){
  if(!Options.showTips)
    return;
  console.log(text);
  // TODO !
}

function setupDraggable(card){
  card
  .draggable({
    helper: cascHelper,
    revert: true,
    start : handleDragStart,
    stop  : handleDragStop
  })
  .dblclick(function(){
    handleCardDblClick($(this));
  });
}

function showCard(card){
  card.show().css('visibility', 'visible');
  card.find("span").show().css('visibility', 'visible');
}

function dropCard(card, where, zIndex = '', top = 0, draggable = true, position = 'relative'){
  // STEP 1: Warn listeners that the card is moving out of it's previous place
  card.trigger("moveOut");
  // STEP 2: Warn the statistic module that a card has been moved
  Stats.cardMoved();
  // STEP 2: Clone the card
  let newCard = card.clone();
  // STEP 4: Place the cards
  newCard.css({'position': position, 'left':'0px', 'top':top+'px', 'z-index':zIndex});
  where.append(newCard);
  // STEP 5: Make sure the new card will be visible
  showCard(newCard);
  // STEP 6: Remove the dragged cards from the board
  card.draggable('option', 'revert', false);
  card.detach().hide();
  // STEP 7: make it draggable
  if ( !draggable )
    newCard.css('cursor','default');
  else
    setupDraggable(newCard);
  // FINALLY: return the cloned card for further processing
  return newCard;
}

function checkFounDrop(ui, drop){
  // RULE 1: Was only a single card provided?
  if ( ui.helper.children().length != 1 ) {
    showTips("You can only drop a single card at a time in this slot");
    return false;
  }

  // RULE 2: Is card valid?
  if ( drop.children('.card').length == 0 ) {
    if ( ui.draggable.data('numb') != 'A' ) {
      showTips("You need to start this space with an ace");
      return false;
    }
  }
  else {
    var card = $(ui.draggable);
    var topCard = $(drop.children('.card').last());

    // Is card next in sequence?
    if ( topCard.data('suit') != card.data('suit') || NUMB_DICT[topCard.data('numb')].founDrop != card.data('numb') ) {
      showTips("This card doesn't folloow the correct sequence");
      return false;
    }
  }
  return true;
}

function handleFounDrop(event, ui, drop) {
  if(!checkFounDrop(ui, drop))
    return false;
  
  // STEP 1: VFX/SFX update
  playSound(gGameSounds.cardFlip);

  // STEP 2: Place it into this foundation
  let zIndex = $(drop).find('.card').length;
  dropCard(ui.draggable, $(drop), zIndex, 0, false, "absolute");

  // STEP 3: CHECK: End of game?
  if ( $('#cardFoun .card').length == 52 )
    return doGameWon();
  
  // STEP 4: CHECK: Can we fill more ?
  tryToFillFoundation();
}

function checkOpenDrop(ui, drop){
  // RULE 1: Was only a single card provided?
  if ( ui.helper.children().length != 1 ) {
    showTips("You can only drop a single card in the free slots");
    return false;
  }
  if ( drop.children().length != 0){
    showTips("There is already a card on this slot");
    return false;
  }
  return true;
}

function handleOpenDrop(event, ui, drop) {
  if(!checkOpenDrop(ui, drop))
    return false;
  
  // STEP 1: VFX/SFX update
  playSound(gGameSounds.cardFlip);
  
  // STEP 2: Place it in the free cell
  let newCard = dropCard(ui.draggable, $(drop), 99);

  // STEP 3: Turn off this slot until it frees up again
  drop.droppable('disable');

  // STEP 4: When the card will move out of the slot, reactivate it
  newCard.one("moveOut", () => $(drop).droppable('enable'));
  
  // STEP 5: CHECK: Can we fill foundation ?
  tryToFillFoundation();
}

function checkCascDrop(ui,drop){
  // DESIGN: We check for valid sets upon dragStart, so assume set sequence is valid upon drop
  // RULE 1: Is the single-card/container-top-card in run order?
  let cardTopCasc = drop.children().last();
  let card = ( ui.helper.prop('id') == 'draggingContainer' ) ? ui.helper.children()[0] : ui.draggable;
  if ( drop.children().length > 0 && 
      ( $.inArray($(cardTopCasc).data('suit'), SUIT_DICT[$(card).data('suit')].accepts) == -1 || 
      NUMB_DICT[$(cardTopCasc).data('numb')].cascDrop != $(card).data('numb') )
  ) {
    showTips("This card, or stack of card don't follow the correct sequence order");
    return false;
  }
  // RULE 2: Ensure enough free slots existing to handle number of cards being dragged
  let dropIsFreeCasc = (drop.children().length == 0);
  let nbFreeOpen = $('#cardOpen .slot:empty').length;
  let nbFreeCasc = $('#cardCasc>div:empty').length - (dropIsFreeCasc?1:0);
  let maxCards = (nbFreeCasc ? (2 << (nbFreeCasc-1)) : 1)*(nbFreeOpen+1);
  let nbCards = (ui.helper.prop('id') == 'draggingContainer' ? ui.helper.children().length : 1);
  if(nbCards > maxCards){
    showTips("Not enough free slots to move the cards");
    return false;
  }
  return true;
}

function handleCascDrop(event, ui, drop) {
  if(!checkCascDrop(ui, drop))
    return false;

  // STEP 1: VFX/SFX update
  playSound(gGameSounds.cardFlip);

  // STEP 2: Place cards into this cascade
  let cards = ( ui.helper.prop('id') == 'draggingContainer' ) ? ui.helper.children() : [ui.draggable];
  let cardOffset = getCardOffset();
  let cardHeight = getCardHeight();
  $.each(cards, (i, card) => {
    let intTop = ( drop.children().length > 0 ) ? Number(drop.children().last().css('top').replace('px','')) - (cardHeight - cardOffset) : 0;
    dropCard($('#'+$(card).prop('id')), $(drop), '', intTop);
  });
  
  // STEP 3: CHECK: Can we fill foundation ?
  tryToFillFoundation();
  
  // STEP 3: Shorten fanning padding if card stack grows too large
  // TODO: measure #playArea and length of children
}

function handleCardDblClick(card) {
  // RULE 1: Only topmost card can be double-clicked
  if ( $($(card).parent().find('.card:last-child')[0]).prop('id') != $(card).prop('id') ) return;

  let event = {};
  let ui = { draggable:$(card), helper:{ children:function(){ return [$(card)]; } } };
  let drop = null;
  
  // are we in the cascades ?
  if($(card).parents("#cardCasc").length > 0){
      // CHECK 1: Can card go to foundation?
      drop = FOUNDATIONS.map(id => $(id)).filter(drop => checkFounDrop(ui,drop))[0];
      if(drop)
        return handleFounDrop(event, ui, drop);
      
      // CHECK 2: Do we have an open slot to send this card to?
      drop = OPENCELLS.map(id => $(id)).filter(drop => checkOpenDrop(ui, drop))[0];
      if(drop)
        return handleOpenDrop(event, ui, drop);
  }
  
  // are we in the open slot ?
  if($(card).parents("#cardOpen").length > 0){
    // CHECK 1: Can card go to foundation?
    drop = FOUNDATIONS.map(id => $(id)).filter(drop => checkFounDrop(ui,drop))[0];
    if(drop){
      $(card).trigger("dragstart");
      return handleFounDrop(event, ui, drop);
    }
  }
}

/**
 * jquery-ui handler
 * Validate selection - only begin drag if selection meets rules
 */
function handleDragStart(event, ui){
  var prevCard;

  // RULE 1: If a group is being dragged, then validate the sequence, otherwise, dont allow drag to even start
  if ( ui.helper.prop('id') == 'draggingContainer' && ui.helper.children().length > 1 ) {
    for (var idx=0; idx<ui.helper.children().length; idx++) {
      var card = ui.helper.children()[idx];
      // Just capture first card, then start checking seq
      if ( idx > 0 ) {
        if ( $.inArray($(card).data('suit'), SUIT_DICT[$(prevCard).data('suit')].accepts) == -1 || 
             NUMB_DICT[$(prevCard).data('numb')].cascDrop != $(card).data('numb')) {
          // Disallow drag start
          handleDragStop(event, ui);
          return false;
        }
      }
      prevCard = card;
    }
  }
}

function handleDragStop(event, ui){
  let cards = ( ui.helper.prop('id') == 'draggingContainer' ) ? ui.helper.children() : [ui.draggable];
  $.each(cards, (i, card) => {
    let cardId = '#'+$(card).prop('id');
    showCard($('#cardCasc').find(cardId));
    showCard($('#cardFoun').find(cardId));
    showCard($('#cardOpen').find(cardId));
  });
}

function checkCardIsInFoundation(found, numb, suit){
  if(suit.some)
    return suit.some(s => checkCardIsInFoundation(found, numb, s));
  if(!found.children('.card').length)
    return false;
  let topcard = $(found.children('.card').last());
  if(topcard.data('suit') != suit)
    return false;
  let cur = topcard.data('numb');
  while(cur){
    if(cur == numb)
      return true;
    cur = NUMB_DICT[cur].cascDrop;
  }
  return false;
}

function isCardOkForFoundation(card){
  let suit = card.data('suit');
  let numb = card.data('numb');
  let prevNumb = NUMB_DICT[numb].cascDrop;
  // CHECK: Only put to foundation if it is useless in the cascade
  if(prevNumb == "")
    return true;

  let otherSuits = SUIT_DICT[suit].accepts;
  let nbAlreadyHere = FOUNDATIONS.map(id => $(id)).filter(found => checkCardIsInFoundation(found,prevNumb,otherSuits)).length;
  return (nbAlreadyHere == otherSuits.length);
}

function moveCardToFoundation(card){
  let ui = { draggable:card, helper:{ children:() => [card] } };
  let drop = FOUNDATIONS.map(id => $(id)).filter(drop => checkFounDrop(ui, drop))[0];
  if(!drop)
    return false;
  handleFounDrop({}, ui, drop);
  return true;
}

function tryToFillFoundation(){
  let cards = OPENCELLS.map(id => $($(id).children('.card').last()));
  for(let i=0;i<8;i++)
    cards.push($($("#cardCasc"+(i+1)).children('.card').last()));
  cards = cards.filter(card => card && card.data('suit'));
  return cards.some(card => (isCardOkForFoundation(card) && moveCardToFoundation(card)));
}

// ==============================================================================================

function handleStartBtn() {
  $('#dialogStart').dialog('close');
  playSound(gGameSounds.cardShuffle);
  doFillBoard();
}

function playSound(objSound) {
  // SRC: http://www.html5rocks.com/en/tutorials/webaudio/intro/
  if(!Options.sound)
    return;

  // STEP 1: Reality Check
  if ( !objSound.buffer ) {
    console.warn('WARN: No buffer exists for: '+objSound.url);
    console.log(objSound.buffer);
    return;
  }

  // STEP 2: Create new bufferSource with existing file buffer and play sound
  var source = gAudioCtx.createBufferSource();
  source.buffer = objSound.buffer;
  source.connect(gAudioCtx.destination);
  if(source.start)
    source.start(0);
  else
    source.noteOn(0);
}

// ==============================================================================================

function cascHelper() {
  // A: Build container and fill with cards selected
  let container = $('<div/>').attr('id', 'draggingContainer').addClass('cardCont');
  container.css( 'position', 'absolute' );
  container.css( 'z-index', '100' );
  container.css( 'top' , $(this).offset().top +'px' );
  container.css( 'left', $(this).offset().left+'px' );
  container.append( $(this).clone() );
  container.append( $(this).nextAll('.card').clone() );

  // B: Hide original cards
  $(this).css('visibility','hidden'); // IMPORTANT: Dont hide() this or container jumps to {0,0} (jQuery must be using .next or whatever)
  $(this).find('span').css('visibility','hidden'); // IMPORTANT: the cool cards we use have spans that must be set on their own
  $(this).nextAll().hide();

  // C: "Cascade" cards in container to match orig style
  let cardOffset = getCardOffset();
  container.find('div.card').each(function(i){ $(this).css('position', 'absolute').css('top', (i*cardOffset)+'px'); });

  // LAST:
  return container;
}

const suitToLogo = {
  club: '♣',
  diamond: '♦',
  heart: '♥',
  spade: '♠'
};
const numbToName = {
  'A' : 'ace',  
  '2' : 'two',  
  '3' : 'three',
  '4' : 'four', 
  '5' : 'five', 
  '6' : 'six',  
  '7' : 'seven',
  '8' : 'eight',
  '9' : 'nine', 
  '10': 'ten',  
  'J' : 'jack', 
  'Q' : 'queen',
  'K' : 'king'
};
const isFace = {'J': true, 'Q': true, 'K': true};

function buildCard(numb, suit){
    let cardId = "card"+suit.substring(0,1)+numb;
    let cardDiv = $("<div>").attr("id", cardId);
    cardDiv.addClass("card").attr("data-suit", suit).attr("data-numb", numb);
    let suitLogo = suitToLogo[suit];
    let cardInnerDiv = $("<div>").addClass("card-"+numbToName[numb]).addClass(suit);
    
    let corner = $("<div>").addClass("corner");
    corner.append($("<span>").addClass("number"+(numb == '10' ? ' ten':'')).text(numb));
    corner.append($("<span>").text(suitLogo));
    
    cardInnerDiv.append(corner.clone().addClass("top"));
    if(isFace[numb]){
      let img = $("<img>").attr("src", "img/faces/face-"+numbToName[numb]+"-"+suit+".png");
      cardInnerDiv.append($("<span>").addClass("face middle_center").append(img));
    }else{
      cardInnerDiv.append($("<span>").addClass("suit top_center").text(suitLogo));
      cardInnerDiv.append($("<span>").addClass("suit bottom_center").text(suitLogo));
    }
    cardInnerDiv.append(corner.addClass("bottom"));
    cardDiv.append(cardInnerDiv);
    return cardDiv;
}

function doFillBoard(gameNumber) {
  // STEP 1: VFX/SFX
  playSound(gGameSounds.cardShuffle);
  
  // STEP 2: Remove all cards and re enable free slot
  $('.card').remove();
  $('#cardOpen .slot').droppable('enable')
  
  // STEP 3: Choose dealing method
  if(!gameNumber)
    gameNumber = 1+Math.floor(32000*Math.random());
  Menu.setRunningGame(gameNumber);
  let method = Deals.standard.bind(null,gameNumber);
  //method = Deals.debug2;

  // STEP 3: Deal the cards
  let cardOffset = getCardOffset(); 
  let cardHeight = getCardHeight();
  let height = $(window).innerHeight();
  let width = $(window).innerWidth();
  let nbCardsPresent = [];
  method(function(casc, card, idx){
    let [numb, suit] = card.split("-");
    let cardDiv = buildCard(numb, suit);
    cardDiv.css('position','absolute');
    cardDiv.css('left', (idx%2 ? '-1000px' : (width+1000)+'px') );
    cardDiv.css('top',  (idx%2 ? '-1000px' : (height+1000)+'px') );
    nbCardsPresent[casc] = (nbCardsPresent[casc] || 0) + 1;
    let finalTop = -((nbCardsPresent[casc]-1) * (cardHeight-cardOffset));
    let animTop = (nbCardsPresent[casc]-1) * cardOffset;
    let offset = $('#cardCasc'+casc).offset();
    $("body div.content").append(cardDiv);
    cardDiv.delay(idx*25).animate({left:offset.left+"px",top:(offset.top+animTop)+'px'}, 200, () => {
      cardDiv.detach();
      cardDiv.css('position','relative');
      cardDiv.css('left', '0px');
      cardDiv.css('top',  finalTop + 'px');
      $('#cardCasc'+casc).append(cardDiv);
    });
  });

  // STEP 4: Draggable setup
  setupDraggable($('.card'));
    
  // STEP 5: Inform the statistics module
  Stats.startGame();
}

function winAnimation(){
  ["K","Q","J","10","9","8","7","6","5","4","3","2","A"].forEach((numb, j) => {
    $('.card[data-numb='+numb+']').each(function(i,card){
      card = $(card);
      let left = Math.floor(Math.random()*$(window).innerWidth());
      let top = $(window).innerHeight() * 1.1;
      let offset = card.offset();
      $("body div.content").append(card.detach().css({"position":"absolute", left:offset.left+"px", top:offset.top+"px"}));
      card.delay(j*100).animate({left:left+'px', top:top+'px'}, 1000, () => card.remove());
    });
  });
}

function doGameWon() {
  // STEP 1: VFX/SFX update
  playSound(gGameSounds.crowdCheer);

  // STEP 2: Win animation
  winAnimation();
  
  // STEP 3: Update stats
  Stats.gameWon();
  
  // STEP 4:
  Menu.handleOpen("win");
}

function loadSounds() {
  // SEE: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData (most up-to-date source)
  // SEE: http://www.html5rocks.com/en/tutorials/webaudio/intro/

  // STEP 1: Load each sound
  $.each(gGameSounds, function(key,sound){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', sound.url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
      if (this.status == 0 || this.status == 200)
        gAudioCtx.decodeAudioData(xhr.response, function(buffer){ sound.buffer = buffer; }, onError);
    };
    xhr.send();
  });

  function onError(e){ console.error("Unable to load sound. "+e); }
}

function getCardOffset(){
  if($(window).innerWidth() < 800)
    return 40;
  if($(window).innerWidth() < 900)
    return 40;
  return 50;
}

// need to be sync with the CSS
var deduceHeight = (function(){
  let cache = null;
  return function(screenWidth){
    if(cache && cache.screenWidth == screenWidth)
      return cache.size;
    let reactiveSize = [
      {screenWidth: 1280,h: 168,w: 120},
      {screenWidth: 1150,h: 156,w: 111},
      {screenWidth: 1080,h: 147,w: 105},
      {screenWidth: 1020,h: 134,w: 96},
      {screenWidth: 900 ,h: 119 ,w: 85},
      {screenWidth: 800 ,h: 105 ,w: 75},
      {screenWidth: 700 ,h: 91 ,w: 65},
      {screenWidth: 600 ,h: 77 ,w: 55},
      {screenWidth: 500 ,h: 63 ,w: 45},
      {screenWidth: 400 ,h: 49 ,w: 35},
    ];
    let size = {h:168,w:120};
    for(let i=0;i<reactiveSize.length;i++){
      let reactSize = reactiveSize[i];
      if(reactSize.screenWidth < screenWidth)
        break;
      if(reactSize.h)
        size.h = reactSize.h;
      if(reactSize.w)
        size.w = reactSize.w;
    }
    cache = {screenWidth,size};
    return size;
  };
})();

function getCardHeight(){
  return ($('.card:first-child').height() || deduceHeight($(window).innerWidth()).h);
}

function doRespLayout() {
  // STEP 1: Re-fan cards to handle varying offsets as resizes occur
  let cardOffset = getCardOffset();
  let cardHeight = getCardHeight();
  $('#cardCasc > div').each(function(i,col){
    $(col).find('.card').each(function(idx,card){ 
      $(card).css('top','-'+(idx*(cardHeight-cardOffset))+'px'); 
    });
  });
}

$(function() {
  //alert($(window).innerWidth());
  // STEP 1: Start async load of sound files
  loadSounds();

  // STEP 2: Setup 3 core droppable areas
  $('#cardFoun .slot').droppable({
    accept:     '.card',
    hoverClass: 'hvr-pulse-grow-hover',
    tolerance:  'pointer',
    drop:       function(event,ui){handleFounDrop(event,ui,$(this));}
  });
  $('#cardOpen .slot').droppable({
    accept:     '.card',
    hoverClass: 'hvr-pulse-grow-hover',
    tolerance:  'pointer',
    drop:       function(event,ui){ handleOpenDrop(event, ui, $(this)); }
  });
  $('#cardCasc > div').droppable({
    accept:     '.card',
    hoverClass: 'cascHover',
    tolerance:  'pointer',
    drop:       function(event,ui){ handleCascDrop(event, ui, $(this)); }
  });
  
  // STEP 3: Add handler for window resize (use a slight delay for PERF)
  let gTimer;
  window.onresize = () => { 
    clearTimeout(gTimer); 
    gTimer = setTimeout(() => $(window).trigger("window:resize"), 0); 
  };
  $(window).on("window:resize", doRespLayout());

  // STEP 4: Web-Audio for iOS
  $(document).on('touchstart', '#btnStart', function(){
    // A: Create and play a dummy sound to init sound in iOS
    // NOTE: iOS (iOS8+) mutes all sounds until a touch is detected (good on you Apple!), so we have to do this little thing here
    var buffer = gAudioCtx.createBuffer(1, 1, 22050); // create empty buffer
    var source = gAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(gAudioCtx.destination); // connect to output (your speakers)
    if(source.start)
      source.start(0);
    else
      source.noteOn(0);

    // B: Start game
    handleStartBtn();
  });

  // STEP 5: Initialise options popup
  Options.init();
  
  // STEP 6: Initialise menu popup
  Menu.init();
  
  // STEP 7: Initialise statistics popup
  Stats.init();
  
  // STEP 8: Launch start popup
  Menu.handleOpen("start");
});