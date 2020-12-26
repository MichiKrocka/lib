// #####################################################################
function date_time(){
  var now = new Date(),
      Y = now.getFullYear(),
      M = now.getMonth() + 1,
      D = now.getDate(),
      h = now.getHours(),
      m = now.getMinutes(),
      s = now.getSeconds(),
      sL = now.getMilliseconds(),
      sD = $.sprintf("%02d.%02d.%04d", D, M, Y),
      sE = $.sprintf("%04d-%02d-%02d", Y, M, D),
      sT = $.sprintf("%02d:%02d:%02d", h, m, s);
      sL = $.sprintf("%02d:%02d:%5.3f", h, m, s + sL / 1000.0);
  return {D:sD, E:sE, T:sT, L:sL, now:now};
}
// #####################################################################
