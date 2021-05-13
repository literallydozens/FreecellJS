/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* exported Deals */

let Deals = (function(){
  const numbs = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["club","diamond","heart","spade"];
  function standard(seed, cbDeal){
    let state = seed;
    function getRnd(){
      state = (214013*state + 2531011) & 0x7FFFFFFF;
      return (state >> 16);
    }
    let deck = numbs.reduce((deck, n) => suits.reduce((deck, s) => { deck.push(n+"-"+s); return deck; }, deck), []);
    let size = 52;
    let casc = 1;
    while(size > 1){
      let pos = getRnd()%size;
      let toDeal = deck[pos];
      deck[pos] = deck[size-1];
      cbDeal(casc, toDeal);
      size--;
      casc = (casc%8)+1;
    }
    cbDeal(casc, deck[0]);
  }
  function debug(cbDeal){
    let invNumbs = numbs.slice().reverse();
    suits.forEach((s, i) => invNumbs.forEach(n => cbDeal(i+1, n+"-"+s)));
  }
  return {standard, debug};
})();