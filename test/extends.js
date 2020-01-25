class S {
  t = 5;
  #p = 6;
  constructor() {}
  sup(n) { 
    console.log(this.t);
    console.log(this.#p);
    this.f();
  }
}

class C extends S {
  constructor() { super(); }
  sub() {
    super.sup();
    console.log(this.t);
    //console.log(this.#p);
    this.t = 8;
    this.sup();
    //console.log(super.#p);
  }

  f() { console.log('F'); }
}

let c = new C();
//c.sub();
// note, we can't use a reference to c.sub, have to wrap it in a func to maintain context
let f = () => { c.sub(); }
f();
/*
xx(f);
function xx(FF) {
  FF();
}
*/
