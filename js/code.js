// #####################################################################
var ALL_CHARS="\nABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ,.-;:!'()=?ßäöüÄÖÜ+*_\"/&%§@#$";
// #####################################################################
function JS_Encode(Key, Txt)
{
  var Codiert = "";
  var Stelle, StelleS, Summe;
  var SPosition = 0;
  while (Key.length < Txt.length)
    Key = Key + Key;
  for(i=0;i < Txt.length;i++) {
    Stelle = ALL_CHARS.indexOf(Txt.charAt(i));
    StelleS = ALL_CHARS.indexOf(Key.charAt(i));
    if((Stelle > -1)&& (StelleS > -1)){
      Summe = Stelle + StelleS;
      if(Summe >= ALL_CHARS.length)
        Summe = Summe - ALL_CHARS.length;
      Codiert = Codiert + ALL_CHARS.charAt(Summe);
    }
    else
      Codiert = Codiert + "_";
  }
  return Codiert;
}
// #####################################################################
function JS_Decode(Key, Txt)
{
  var Decodiert="";
  var Stelle, StelleS, Summe;
  var SPosition = 0;
  while(Key.length < Txt.length)
    Key = Key + Key;
  for(i=0;i < Txt.length;i++) {
    Stelle = ALL_CHARS.indexOf(Txt.charAt(i));
    StelleS = ALL_CHARS.indexOf(Key.charAt(i));
    if((Stelle > -1)&& (StelleS > -1)) {
      Summe = Stelle - StelleS;
      if(Summe < 0)
        Summe = Summe + ALL_CHARS.length;
      Decodiert = Decodiert + ALL_CHARS.charAt(Summe);}
    else
      Decodiert = Decodiert + " ";
  }
  return Decodiert;
}
// #####################################################################
function rot_13()
{
  var keycode = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var text  = document.getElementById('rot13Text').value;
  var textrot = new String();

  for(var i = 0; i < text.length; i++)
  {
    var codechar = text.substring(i, i + 1);
    var pos = keycode.indexOf(codechar.toUpperCase());

    if(pos >= 0)
    {
      pos = (pos + keycode.length / 2) % keycode.length;
      codechar = (codechar == codechar.toUpperCase()) ? keycode.substring(pos, pos + 1) : keycode.substring(pos, pos + 1).toLowerCase();
    }
    textrot = textrot + codechar;
  }
  document.getElementById('rot13Text').value = textrot;
}
// #####################################################################
