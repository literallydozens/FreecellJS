/* jshint esversion:8, loopfunc:true, undef: true, unused: true, sub:true, browser:true */
/* exported Deals */

let Deals = (function(){
  function addCounterToCb(cb){
    let i = 0;
    return (casc,card) => cb(casc,card,i++);
  }
  const numbs = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits = ["club","diamond","heart","spade"];
  function standard(seed, cbDeal){
    cbDeal = addCounterToCb(cbDeal);
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
    cbDeal = addCounterToCb(cbDeal);
    let invNumbs = numbs.slice().reverse();
    suits.forEach((s, i) => invNumbs.forEach(n => cbDeal(i+1, n+"-"+s)));
  }
  function debug2(cbDeal){
    cbDeal = addCounterToCb(cbDeal);
    let invNumbs = numbs.slice().reverse();
    invNumbs.forEach((n,i) => cbDeal(1, n+"-"+["club","diamond"][i%2]));
    invNumbs.forEach((n,i) => cbDeal(2, n+"-"+["diamond","club"][i%2]));
    invNumbs.forEach((n,i) => cbDeal(3, n+"-"+["heart","spade"][i%2]));
    invNumbs.forEach((n,i) => cbDeal(4, n+"-"+["spade","heart"][i%2]));
  }
  return {standard, debug, debug2};
})();