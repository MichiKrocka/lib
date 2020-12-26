function make_csv(D){
  var R = "sep=,\r\n",
      A = [],
      I = D.length,
      J = 0,
      iJ = 0;
  for(var i = 0;i < I;i++){
    if(D[i].label){
      A.push('"T-'+D[i].label+'"');
      A.push('"'+D[i].label+'"');
      if(J < D[i].data.length){
        J = D[i].data.length;
        iJ = i;
      }
    }
  }
  R += A.join(",") + "\r\n";
  for(var j = 0;j < J;j++){
    A = [];
    for(var i = 0;i < I;i++){
      if(D[i].label){
        if(typeof D[i].data[j] == "undefined" ||
           D[i].data[j] === null
          ){
          A.push("");
          A.push("");
        } else {
          A.push(D[i].data[j][0]);
          A.push(D[i].data[j][1]);
        }
      }
    }
    R += A.join(",") + "\r\n";
  }
  return R;
}
