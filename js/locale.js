var LangVoc = {},
    UserLang = "en-en";
// Set Language --------------------------------------------------------
function set_lang(Lang, callBack){
  if(Lang == "en-en"){
    LangVoc = {};
    change_all_lang();
  } else if(UserLang != Lang){
    $.getJSON(DIR_LANG + "/" + Lang + ".json", function(D){
      LangVoc = $.extend({}, D);
      change_all_lang();
      UserLang = Lang;
      if($.paramquery)
        set_paramquery();
      if(callBack)
        callBack();
      return;
    });
  } else
    change_all_lang();
  UserLang = Lang;
  if($.paramquery)
    set_paramquery();
}
// Get Language --------------------------------------------------------
function get_lang(){
  var UserLang = (navigator.language ||
              navigator.userLanguage).substr(0, 2);
  if(!UserLang.length)
    UserLang = DEFAULT_LANG;
  else if(UserLang.length == 2)
    UserLang += "-" + UserLang;
  return UserLang;
}
// Language translation ------------------------------------------------
function __(s){
  return _(s, true);
}
// Language translation ------------------------------------------------
function _(s, no_log){
  if(LangVoc[s])
    return LangVoc[s];
  if(
    !no_log &&
    s != " " &&
    s != "" &&
    s.length > 1 &&
    UserLang != "en-en" &&
    !$.isEmptyObject(LangVoc)
  )
    console.info(s, s.charCodeAt(0));
  return s;
}
// Language Change all -------------------------------------------------
function change_all_lang(el, no_log){
  // placeholder .......................................................
  $(".lang-placeholder", el).each(function(){
    var Placeholder = $(this).prop("placeholder");
    if( typeof Placeholder !== "undefined" && Placeholder != ""){
      if(!this.palceholder_org)
        this.palceholder_org = Placeholder;
      $(this).prop("placeholder", _(this.palceholder_org, no_log));
    }
  });
  // title .............................................................
  $(".lang-title", el).each(function(){
    var Title = $(this).prop("title");
    if( typeof Title !== undefined && Title != ""){
      if(!this.title_org)
        this.title_org = Title;
      $(this).prop("title", _(this.title_org, no_log));
      return;
    }
  });
  // label .............................................................
  $(".lang-label", el).each(function(){
    var Title = $(this).prop("title");
    if( typeof Title !== undefined && Title != ""){
      if(!this.title_org)
        this.title_org = Title;
      $(this).prop("title", _(this.title_org, no_log));
      return;
    }
  });
  // button ............................................................
  $("button.lang", el).each(function(){
    if(!$(this).hasClass("ui-widget"))
      return;
    if(!this.org)
      this.org = $(this).button("option", "label");
    if(this.org != "")
      $(this).button("option", "label", _(this.org, no_log));
  });
  // html ..............................................................
  $(".lang", el).each(function(){
    if($("*", this).length)
      return;
    if(!this.org)
      this.org = $(this).text();
    if(this.org != "")
      $(this).text(_(this.org, no_log));
  });
}
// ---------------------------------------------------------------------
