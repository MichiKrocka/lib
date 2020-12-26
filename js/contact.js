/*
t text
v value
p protocol
s suffix
*/
// #####################################################################
var CONTACT_ICON = {
  "EMAIL":"fa-envelope-o",
  "HTTP": "fa-home",
  "TEL":  "fa-phone",
  "FAX":  "fa-fax",
  "MOBIL":"fa-mobile",
  "SKYPE":"fa-skype"
};
// #####################################################################
function contact_make(el, $menu){
  var O = el.val(),
      M = [];
  O = O ==  "" ? [] : $.parseJSON(O);
  if(O === null)
    O = [];
  O.sort(function(a, b){
    return b.p == a.p ? b.t > a.t : b.p > a.p;
  });
  for(var c in O){
    M.push(
    $.sprintf(
      '<li><div><i class="fa fa-fw %s"></i>'+
        ' %s%s'+
      '</div></li>',
      CONTACT_ICON[O[c].p],
      O[c].t,
      O[c].s == "" ? "" : (" / "+O[c].s)
    ));
  }
  $menu
  .html(M.join(""))
  .menu("refresh");
  try{
    $menu.menu("refresh");
  } catch(e){
  }
}
// #####################################################################
function contact_sel(ix, el){
  var O = $.parseJSON(el.val());
  O.sort(function(a, b){
    return b.p == a.p ? b.t > a.t : b.p > a.p;
  });
  var C = O[ix];
  switch(C.p){
    case "EMAIL":
      var W = window.open("mailto:"+C.v, "MAIL");
      W.close();
      break;
    case "HTTP":
      var r = /(HTTP[S]*)[/]*(.*)/gi,
          m = r.exec(C.v);
      if(m)
        var url = C.v;
      else
        var  url = "//" + C.v;
      window.open(url, '_blank').focus();
      break;
  }
}
// #####################################################################
function contact_edit(ix, el, $menu){
  var O = el.val();
  O = (O == "null" || O == "") ? [] : $.parseJSON(O);
  O.sort(function(a, b){
    return b.p == a.p ? b.t > a.t : b.p > a.p;
  });
  var C = ix === null ? {p:"TEL",v:"",t:"",s:""} : O[ix];
      S =  [];
  for(var x in CONTACT_ICON)
    S.push('<option class="'+CONTACT_ICON[x]+'">'+x+'</option>');
  $dialog = $("<div>");
  $dialog
  .html($.sprintf(
    '<table class="dialog">'+
      '<tr>'+
        '<td>%s</td>'+
        '<td>'+
          '<select name="p" class="ui-widget-content">'+
            S.join("")+
          '</select>'+
        '</td>'+
      '</tr>'+
      '<tr>'+
        '<td>%s</td>'+
        '<td><input name="v" value="%s" class="ui-widget-content" type="text"></td>'+
      '</tr>'+
      '<tr>'+
        '<td>%s</td>'+
        '<td><input name="t" value="%s" class="ui-widget-content" type="text"></td>'+
      '</tr>'+
      '<tr>'+
        '<td>%s</td>'+
        '<td><input name="s" value="%s" class="ui-widget-content" type="text"></td>'+
      '</tr>'+
    '</table>',
    _("Protocol"),
    _("Value"), C.v,
    _("Text"), C.t,
    _("Suffix"), C.s
  ))
  .dialog({
    width:  "auto",
    height: "auto",
    title:  _(ix === null ? "Insert" : "Edit"),
    modal:  true,
    closeOnEscape: true,
    resizable: false,
    buttons: [{
      text: _("Remove"),
      disabled: ix === null,
      click: function(){
        O.splice(ix, 1);
        el.val(JSON.stringify(O));
        contact_make(el, $menu);
        $(this).dialog("close");
      }
    },{
      text: _("OK"),
      class: "c_OK",
      click: function(){
        var o = {};
        $("input,select", $dialog).serializeArray().map(function(x){
          o[x.name] = x.value;
        });
        if(o.v == ""){
          $("input[name=v]").addClass("ui-state-error").select().focus();
          return;
        }
        if(o.t == "")
          o.t = o.v;
        if(ix === null){
          O.push(o);
        } else {
          O[ix] = o;
        }
        el.val(JSON.stringify(O));
        contact_make(el, $menu);
        $(this).dialog("close");
      }
    },{
      text: _("Cancel"),
      click: function(){
        $(this).dialog("close");
      }
    }],
    open: function(ev, ui){
      $("select", this)
      .val(C.p)
      .selectmenu();
      setTimeout(function(){
        $("input", $dialog).eq(0).select().focus();
      }, 100);
    },
    close: function(ev, ui ){
      $(this).dialog("destroy");
    }
  })
  .delegate("input[type=text]", "keydown", function(ev){
    if(ev.keyCode == $.ui.keyCode.ENTER){
      if(ev.ctrlKey){
        var OK = $("button.c_OK", $dialog.dialog("widget"));
        OK.click();
      }
      return false;
    }
  });
}
// #####################################################################
