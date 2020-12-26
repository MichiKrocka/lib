/** \file
* \brief Function : mk.tables
* Table-Grid jquery ui plugin
*=====
* Copyright: Michael Krocka
*********************************************************************
* Function     | Author   | Created    | Last Uptdate
*--------------|----------|------------|-----------
* mk.tables    | M.Krocka | 01.01.2016 |
*********************************************************************
*/
// ---------------------------------------------------------------------
(function ($, undefined) {
  $.fn.getCursorPosition = function() {
    var el = $(this).get(0);
    var pos = 0;
    if ('selectionStart' in el) {
      pos = el.selectionStart;
    } else if ('selection' in document) {
      el.focus();
      var Sel = document.selection.createRange();
      var SelLength = document.selection.createRange().text.length;
      Sel.moveStart('character', -el.value.length);
      pos = Sel.text.length - SelLength;
    }
    return pos;
  }
})(jQuery);
// ---------------------------------------------------------------------
$.fn.setCursorPosition = function(pos) {
  this.each(function(index, elem) {
    if (elem.setSelectionRange) {
      elem.setSelectionRange(pos, pos);
    } else if (elem.createTextRange) {
      var range = elem.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  });
  return this;
};
/*
var position = $("#selector").getCursorPosition();
var content = $('#selector').val();
var newContent = content.substr(0, position) + "text to insert" + content.substr(position);
$('#selector').val(newContent);
*/
// ---------------------------------------------------------------------
/*
create
destroy
refresh
refreshData
refreshView
i18n: _()
colModel
  indx
  title
  width
  sort
  show
  align
dataModel
  search
  filter
  id
  sort
  getPage
  getRecord
  total

*/
// ---------------------------------------------------------------------
var GRID_FORM_ELEMENT = "input,textarea,select"
var SAVE_PROPS = ["colModel", "recId", "orderBy", "orderType", "cont", "filt", "filtSw", "Rows", "Left"];
$.widget("mk.tables", {
  // ...................................................................
  options: {
    colModel : [],
    dataModel: {},
    accessModel: {
      edt: true,
      ins: true,
      del: true,
      rep: true
    },

    ID:        "id",
    recId:     null,
    rowIx:     0,
    Left:      0,
    Rows:      10,
    orderBy:   "#",
    orderType: "DESC",
    filtFix:   "",
    filt:      "",
    filtSw:    false,
    cont:      {},

    Report:   "report.htm",
    Header:    null,
    Footer:    null,
    Search:    true,
    Icons:     "",
    i18n:      function(value){return value},
    DefOption: {},
    autoOpt:   {},
    autoSave:  true
    //    PAGE:      []
  },
  // ...................................................................
  colorHighlight:     '',
  colorContentBorder: '',
  // ...................................................................
  timer:   null,
  overlay: null,
  Wreport: null,
  // ...................................................................
  _overlay: function(on){
    if(on){
      this.overlay = $('<div class="ui-overlay" style="position:absolute;top:0pt;left:0pt;display:inline-block;overflow:hidden;"><div class="ui-widget-overlay" style="top:0pt;left:0pt;"></div></div>')
      .hide()
      .appendTo($('body'));
      this.overlay
      .width('100%')
      .height('100%')
      .fadeIn();
    } else {
      this.overlay
      .fadeOut()
      .remove();
    }
  },
  // ...................................................................
  _create: function(){
    var self = this,
        options = this.option();
    for(var x in SAVE_PROPS){
      if($.isArray(options[SAVE_PROPS[x]]))
        self.options.DefOption[SAVE_PROPS[x]] = $.extend(true, [], options[SAVE_PROPS[x]]);
      else
        self.options.DefOption[SAVE_PROPS[x]] = options[SAVE_PROPS[x]];
    }
    self.loadOption(function(){
      self._build();
    });
  },
  // ...................................................................
  _build: function(){
    var self = this,
        options = this.option();
    self.orgHtml = this.element.html();
    $(self.element)
    .append('<div id="mk-dummy" class="ui-state-highlight"></div>');
    self.colorHighlight = $('div#mk-dummy', this.element)
    .css("background-color"),
    $("#mk-dummy", self.element)
    .removeClass("ui-state-highlight")
    .addClass("ui-widget-content");
    self.colorContentBorder = $('div#mk-dummy', this.element)
    .css("border-left-color");
    $("#mk-dummy", self.element)
    .remove();
    $(self.element)
    .show();
    var td_l = [],
        td_r = [],
        th_l = [],
        th_r = [],
        tr_l = [],
        tr_r = []
        orderBySw = false;
    for(var i = 0;i < options.colModel.length;i++){
      orderBySw = orderBySw || options.colModel[i].indx == options.orderBy;
      if(!options.colModel[i].show)
        continue;
      if(i < options.Left){
        td_l.push($.sprintf(
          '<td><div style="text-align:%s;width:%s" class="%s"></div></td>',
          options.colModel[i].align,
          options.colModel[i].width,
          options.colModel[i].title
        ));
        th_l.push($.sprintf(
          '<td class="%s"><div style="text-align:%s;width:%s">%s</div></td>',
          options.colModel[i].indx == options.orderBy ?
          "mk-state-highlight "+options.orderType:
          "",
          options.alignTitle,
          options.colModel[i].width,
          options.i18n(options.colModel[i].title)
        ));
      } else {
        td_r.push($.sprintf(
          '<td><div style="text-align:%s;width:%s" class="%s"></div></td>',
          options.colModel[i].align,
          options.colModel[i].width,
          options.colModel[i].title
        ));
        th_r.push($.sprintf(
          '<td class="%s"><div style="text-align:%s;width:%s">%s</div></td>',
          options.colModel[i].indx == options.orderBy ?
          "mk-state-highlight "+options.orderType:
          "",
          options.alignTitle,
          options.colModel[i].width,
          options.i18n(options.colModel[i].title)
        ));
      }
    }
    td_l = td_l.join("");
    td_r = td_r.join("");
    for(var i = 0;i < options.Rows;i++){
      tr_l.push(
        '<tr>'+
          '<td>'+(i+1)+'</td>'+
          td_l+
        '</tr>'
      );
      tr_r.push(
        '<tr>'+
            td_r+
          '<td>&nbsp;</td>'+
        '</tr>'
      );
    }
    var Color = self.colorContentBorder.replace(/[^0-9,]/g, "").split(",");
    for(var i in Color)
      Color[i] = parseInt(Color[i] * 1.01);
    $(this.element).append(
      $('<style>', {
        html:
          '.mk-wrapper td.ui-widget-content td.mk-state-highlight,'+
          '.mk-wrapper tr.ui-state-highlight td.ui-widget-content {'+
            'background-image: url();'+
            'background-color:'+this.colorHighlight+';'+
          '}'
      })
    );
    this.element
    .prop("tabindex", 1)
    .addClass("mk-tables")
    .prepend(
    '<ul class="mk-tables-menu" style="z-index:1000;position:absolute;display:none"></ul>'+
    '<table class="mk-wrapper">'+
        (options.Header ?
        '<tr><td class="ui-widget-header mk-header" colspan="2">'+
          options.Header+
        '</td></tr>' : '')+
        (options.Search ?
        '<tr><td class="ui-widget-header mk-search" colspan="2">'+
          '<div style="float:left" class="ctr_group">'+
            '<button data-choice="OPTION" title="Options" class="lang-title">'+
              '<i class="fa fa-wrench"></i>'+
            '</button>'+
            '<span class="input ui-widget-content ui-corner-all">'+
              '<input name="search" placeholder="'+options.i18n("Search")+'" autocomplete="off" type="text">'+
            '</span>'+
            '<button data-choice="SEARCH_STOP" title="Stop search" class="lang-title">'+
              '<i class="fa fa-times"></i>'+
            '</button>'+
            '<input type="checkbox" id="'+this.element.attr("id")+'id_OnOff" data-choice="ON_OFF" accesskey=".">'+
            '<label for="'+this.element.attr("id")+'id_OnOff" class="lang-title" title="Filter ON/OFF">'+
              '<i class="fa fa-lightbulb-o"></i>'+
            '</label>'+
            '<button data-choice="FILTER" title="Filter" class="lang-title" accesskey="F">'+
              '<i class="fa fa-filter"></i>'+
            '</button>'+
            (options.accessModel.edt ?
              '<button data-choice="EDIT" title="Edit" class="lang-title" accesskey="E">'+
                '<i class="fa fa-pencil"></i>'+
              '</button>' : ''
            )+
            (options.accessModel.ins ?
              '<button data-choice="INSERT" title="Insert" class="lang-title" accesskey="+">'+
                '<i class="fa fa-plus"></i>'+
              '</button>'+
              '<button data-choice="CLONE" title="Clone" class="lang-title" accesskey="M">'+
                '<i class="fa fa-clone"></i>'+
              '</button>' : ''
            )+
            (options.accessModel.del ?
              '<button data-choice="DELETE" title="Delete" class="lang-title" accesskey="DEL">'+
                '<i class="fa fa-trash"></i>'+
              '</button>' : ''
            )+
            (options.accessModel.rep ?
              '<button data-choice="REPORT" title="Report" class="lang-title" accesskey="R">'+
                '<i class="fa fa-bar-chart"></i>'+
              '</button>' : ''
            )+
            options.Icons+
          '</div>'+
        '</td></tr>' : '')+

        '<tr>'+
          '<td class="ui-widget-content mk-content-left">'+
            '<div class="mk-div-left">'+
              '<table class="mk-tables-left">'+
                '<thead>'+
                  '<tr>'+
                    '<td class="'+
                      (orderBySw ?
                      "" :
                      "mk-state-highlight "+options.orderType
                      )+
                      '" style="text-align:'+options.alignTitle+'">#</td>'+
                    th_l.join("")+
                  '</tr>'+
                '</thead>'+
                '<tbody>'+
                    tr_l.join("")+
                '</tbody>'+
              '</table>'+
            '</div>'+
          '</td>'+
          '<td class="ui-widget-content mk-content-right" style="wwidth:100%">'+
            '<div class="mk-div-right">'+
              '<table class="mk-tables-right">'+
                '<thead>'+
                  '<tr>'+
                    th_r.join("")+
                    '<td>&nbsp;</td>'+
                  '</tr>'+
                '</thead>'+
                '<tbody>'+
                  tr_r.join("")+
                '</tbody>'+
              '</table>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        (options.Footer ?
        '<tr><td class="ui-widget-header mk-footer" colspan="2">'+
          options.Footer+
        '</td></tr>' :
        '<tr><td class="ui-widget-header mk-footer" colspan="2">'+
          '<div style="float:left" class="ctr_group">'+
            '<button data-choice="FIRST" title="First page" class="lang-title">'+
              '<i class="fa fa-fast-backward"></i>'+
            '</button>'+
            '<button data-choice="PREV" title="Previous page" class="lang-title">'+
              '<i class="fa fa-backward"></i>'+
            '</button>'+
            '<span class="input ui-widget-content ui-corner-all">'+
              '<input name="pageNr" type="text">'+
            '</span>'+
            '<button data-choice="NEXT" title="Next page" class="lang-title">'+
              '<i class="fa fa-forward"></i>'+
            '</button>'+
            '<button data-choice="LAST" title="Last page" class="lang-title">'+
              '<i class="fa fa-fast-forward"></i>'+
            '</button>'+
            '<button data-choice="REFRESH" title="Refresh" class="lang-title">'+
              '<i class="fa fa-refresh"></i>'+
            '</button>'+
          '</div>'+
          '<div style="float:right">'+
            '<span class="info-wrapper">'+
              '<span class="info" style="vertical-align:middle"></span>'+
            '</span>'+
          '</div>'+
          ''+
        '</td></tr>'
        )+
      '</table>'+
      ''
    );
    $(window).on("resize", function(){
      self._resize(self);
    });
    $("table table thead tr td", this.element)
    .addClass("ui-widget-header");
    $("table table tbody tr td", this.element)
    .addClass("ui-widget-content");
    // .................................................................
    // hover row
    $(".mk-tables-left td,.mk-tables-right td:not(:last-child)", this.element)
    .hover(
      function(ev){$(this).addClass("ui-state-hover")},
      function(ev){$(this).removeClass("ui-state-hover")}
    );
    // .................................................................
    // choice row
    $(".mk-tables-left tbody td:not(:first-child),.mk-tables-right tbody td:not(:last-child)", this.element)
    .on("click",  function(ev){
      var options = self.option(),
          iX = options.Offset + $(this).closest("tr").index();
      self.option("rowIx", iX);
      self._exec("DATA");
      if(iX < options.Filter)
        self._trigger("cellClk", null, {
          element: self,
          td: this,
          tr: $(this).closest("tr").eq(0),
          iX: iX,
          recId: options.recId
        });
      return false;
    })
    .on("dblclick",  function(ev){
      var options = self.option(),
          iX = options.Offset + $(this).closest("tr").index();
      if(iX < options.Filter)
        self._trigger("cellDblClk", null, {
          element: self,
          td: this,
          tr: $(this).closest("tr").eq(0),
          iX: iX,
          recId: options.recId
        });
    });
    // .................................................................
    // help function for container
    function set_container(el, iX){
      var options = self.option();
      // decrease all after remove
      function dec_cnt(n){
        for(var x in options.cont)
          if(options.cont[x] > n)
            options.cont[x]--;
      }
      if(iX >= options.PAGE.length)
        return;
      var id = options.PAGE[iX][options.ID];
      if($(el).hasClass("ui-state-active")){
        dec_cnt(options.cont[id]);
        $(el)
        .removeClass("ui-state-active")
        .text(options.Offset + parseInt(iX) + 1);
        delete options.cont[id];
        $(".mk-tables-left tbody td:first-child", self.element)
        .each(function(iX){
          if($(this).hasClass("ui-state-active")){
            var id = options.PAGE[iX][options.ID];
            $(this)
            .text(
              options.cont[id]+
              "-"+
              (options.Offset + parseInt(iX) + 1)
            );
          }
        });
      } else {
        options.cont[id] = Object.keys(options.cont).length + 1;
        $(el)
        .addClass("ui-state-active")
        .text(
          options.cont[id]+
          "-"+
          (options.Offset + parseInt(iX) + 1)
        );
      }
      self.option("cont", options.cont);
    }
    // .................................................................
    // container select
    $(".mk-tables-left tbody", this.element)
    .selectable({
      filter: "tr td",
      distance: 2,
      selected: function(ev, ui){
        options = self.option();
        var $tr = $(ui.selected).closest("tr"),
            iD = $(ui.selected).index(),
            iX = $tr.index();
        if(iD > 0){
          ui.selected = $("td:first-child", $tr);
        }
        set_container(ui.selected, iX);
      },
    });
    // .................................................................
    // container click
    $(".mk-tables-left tbody tr td:first-child", this.element)
    .on("click",  function(ev){
      var iX = $(this).closest("tr").index();
      set_container(this, iX);
    });
    // .................................................................
    // help function for order
    function set_order(el, iX){
      options = self.option();
      self.option("orderType",
        options.orderType =
        $(el).hasClass("mk-state-highlight") ?
        (options.orderType == "ASC" ? "DESC" : "ASC") :
        options.orderType
      );
      $("thead td", self.element)
      .removeClass("mk-state-highlight DESC ASC");
      $(el)
      .addClass("mk-state-highlight "+options.orderType);
      if(iX == "#"){ // container
        self.option("orderBy", "#");
      } else {
        self.option("orderBy", options.colModel[iX].indx);
      }
      if(options.recId != null)
        self._exec("ID2IX");
      else
        self._exec("DATA");
    }
    // .................................................................
    // order
    $(".mk-tables-left thead td:not(:first-child)", this.element)
    .on("click",  function(ev){
      set_order(this, $(this).index() - 1)
    });
    $(".mk-tables-right thead td:not(:last-child)", this.element)
    .on("click",  function(ev){
      set_order(this, $(this).index() + parseInt(options.Left))
    });
    $(".mk-tables-left thead td:first-child", this.element)
    .on("click",  function(ev){
      set_order(this, "#")
    });
    // .................................................................
    // search
    var search_timer = null,
        val_prev = "";
    $("input[name=search]", this.element)
    .on("keydown", function(ev){
      var search = this;
      var Key = ev.altKey << 10 | ev.ctrlKey << 9 | ev.shiftKey << 8 | ev.which;
      if(Key == 0x001B)
        this.value = "";
      if(search_timer){
        clearTimeout(search_timer);
        search_timer  =  null;
      }
        search_timer = setTimeout(function(){
          search.value = search.value.replace(/'/g, "");
          if(search.value != val_prev){
            self._exec("ID2IX");
          }
          val_prev = search.value;
        }, 400);
    });
    // .................................................................
    // page number
    $(".mk-footer input[name=pageNr]", this.element)
    .on("change", function(ev){
      options = self.option();
      this.value = this.value.replace(/[^0-9]/g, "");
      if(this.value == "" || this.value == "0")
        this.value = 1;
      self.option("rowIx",
        (this.value - 1) * options.Rows +
        options.rowIx % options.Rows
      );
      self._exec("DATA");
      return false;
    });
    // .................................................................
    // hot keys
    $(this.element).on("keydown.tables", function(ev){
      if($(document.activeElement, self.element[0]).length == 0)
        return;
      var iX = $(".mk-tables-left tr.ui-state-highlight", self.element).index();
      var Key = ev.altKey << 10 | ev.ctrlKey << 9 | ev.shiftKey << 8 | ev.which;

      if(
        document.activeElement != self.element[0] &&
        [0x0026, 0x0028, 0x0021, 0x0022, 0x0024, 0x0023, 0x020D].indexOf(Key) < 0
      )
        return;
      options = self.option();
      switch(Key){
        case 0x0026: // up
          self.option("rowIx", Math.max(options.rowIx - 1, 0));
          self._exec("DATA");
          return false;
        case 0x0028: // down
          self.option("rowIx", Math.min(options.rowIx + 1, options.Filter - 1));
          self._exec("DATA");
          return false;
        case 0x0021: // pgup
          self.option("rowIx", Math.max(options.rowIx - options.Rows, 0));
          self._exec("DATA");
          return false;
        case 0x0022: // pgdown
          self.option("rowIx", Math.min(options.rowIx + options.Rows, options.Filter - 1));
          self._exec("DATA");
          return false;
        case 0x0024: // pos
          self.option("rowIx", 0);
          self._exec("DATA");
          return false;
        case 0x0023: // end
          self.option("rowIx", options.Filter - 1);
          self._exec("DATA");
          return false;
        case 0x126: // shift + up => container + up
          var iX = options.rowIx % options.Rows,
              el = $(".mk-tables-left tbody td:first-child", self.element)
                   .eq(iX);
          set_container(el, iX)
          self.option("rowIx", Math.max(options.rowIx - 1, 0));
          self._exec("DATA");
          return false;
        case 0x128: // shift + down => container + down
          var iX = options.rowIx % options.Rows,
              el = $(".mk-tables-left tbody td:first-child", self.element)
                   .eq(iX);
          set_container(el, iX)
          self.option("rowIx", Math.min(options.rowIx + 1, options.Filter - 1));
          self._exec("DATA");
          return false;
        case 0x0027: // right
          var L = $("div.mk-div-right", self.element).scrollLeft();
          $("div.mk-div-right", self.element).scrollLeft(L + 100);
          return false;
        case 0x0025: // left
          var L = $("div.mk-div-right", self.element).scrollLeft();
          $("div.mk-div-right", self.element).scrollLeft(L - 100);
          return false;
        case 0x020D: // ctrl + enter
          self._edit(null, false, false);
          return false;
        case 0x002D: // insert => insert
          self._edit(null, true, false);
          return false;
        case 0x022D: // ctrl + insert => clone
          self._edit(null, true, true);
          return false;
        case 0x002E: // del
          $('button[data-choice="DELETE"]', self.element).click();
          return false;
      }
    });
    // .................................................................
    // mouse wheel
//    $(this.element)
    $(".mk-wrapper", this.element)
    .mousewheel(function(ev){
      var dY = ev.originalEvent.deltaY;
      if(dY == 0)
        return;
      var c  = $.ui.keyCode[dY > 0 ? "DOWN" : "UP"],
          e  = $.Event('keydown', {which: c, keyCode: c});
      $(this).trigger(e);
    });
    // .................................................................
    // touch
    $(this.element)
    .on("touchstart", function(ev){
      var touch = ev.originalEvent.touches[0];
      this.Y0 = touch.pageY;
    });
    $(this.element)
    .on("touchmove", function(ev){
      var touch = ev.originalEvent.touches[0];
      this.Y = touch.pageY;
      var dY = this.Y - this.Y0;
      if(Math.abs(dY) <= 10)
        return;
      this.Y0 = this.Y;
      var c  = $.ui.keyCode[dY < 0 ? "PAGE_DOWN" : "PAGE_UP"],
          e  = $.Event('keydown', {which: c, keyCode: c});
      $(this).trigger(e);
    });
    // .................................................................
    // button
    $("input[type=checkbox]", this.element)
    .checkboxradio({icon: false});
    $("button", this.element)
    .button();
    $("button,input[type=checkbox]", this.element)
    .click(function(ev){
      var c  = $(this).data("choice");
      
      options = self.option();
      switch(c){
        case "FIRST":
          self.option("rowIx", 0);
          self._exec("DATA");
          break;
        case "PREV":
          self.option("rowIx", Math.max(options.rowIx - options.Rows, 0));
          self._exec("DATA");
          break;
        case "NEXT":
          self.option("rowIx", Math.min(options.rowIx + options.Rows, options.Filter - 1));
          self._exec("DATA");
          break;
        case "LAST":
          self.option("rowIx", options.Filter - 1);
          self._exec("DATA");
          break;
        case "REFRESH":
          self.refresh();
          break;
        case "OPTION":
          self._option();
          break;
        case "SEARCH_STOP":
          $("input[name=search]", self.element)
          .val("")
          .trigger("keydown");
          break;
        case "ON_OFF":
          self.option("filtSw", this.checked);
          self._exec("ID2IX");
          break;
        case "FILTER":
          self._filter(this);
          return false;
        case "EDIT":
          self._edit(null, false, false);
          break;
        case "INSERT":
          self._edit(null, true, false);
          break;
        case "CLONE":
          self._edit(null, true, true);
          break;
        case "DELETE":
          self._delete(this);
          return false;
        case "REPORT":
          self._report(this);
          return false;
        default:
          if($.isFunction(options.clickButton))
            options.clickButton(null, {
              choice: c,
              element: self,
              button: this,
              data: options.REC
            });
          else
            console.log(c);
      }
      self.element.focus();
    });
    $("div.ctr_group", this.element).controlgroup();
    // .................................................................
    self._resize(self);
    // .................................................................
    // start position
    self._exec("ID2IX");
//    self.element.focus();
    self._trigger("build", null, {});
  },
  // ...................................................................
  _destroy: function(){
    var self = this,
        options = this.option();
    if(options.autoSave)
      self.saveOption(false, true);
    else
      self._clean_up();
    $(self.element).hide();
  },
  // ...................................................................
  _clean_up: function(callBack){
    $(document)
    .off("keyup.tables");
    this.element
    .off()
    .html(this.orgHtml)
    .removeClass("mk-tables");
    if(callBack)
      callBack();
  },
  // ...................................................................
  _setOption: function(key, value){
    this._super(key, value);
  },
  // ...................................................................
  _setOptions: function(options){
    this._super(options);
  },
  // ...................................................................
  _refresh: function(){
    var self = this;
    
    self._exec("ID2IX");
    self._trigger("refresh", null, {});
  },
  // ...................................................................
  _resize: function(self){
    if(!$(self.element).is(":visible"))
      return;
    if(self.timeout)
      clearTimeout(self.timeout);
    $(self.element).hide();
    self.timeout = setTimeout(function(){
      $(self.element).show();
      $(".mk-tables-form textarea", self.element).height(5);
      $(".mk-div-right", self.element).width(100);
      var W = $(".mk-div-right", self.element).parent().width();
      $(".mk-div-right", self.element).width(W);
      W = $(".mk-div-right", self.element).parent().width();
      $(".mk-div-right", self.element).width(W);
      $(".mk-tables-form textarea", self.element).each(function(){
        var H = $(this).parent().height();
        $(this).height(H - 2);
      });
      self._trigger("resize", null, {});
    }, 500);
  },
  // ...................................................................
  _exec: function(fun, ui){
    var self = this,
        options = this.option();
    if(!ui)
      ui = {object: this};
    ui.element = self.element;
//    ui.options = options;
    ui.fun = fun;
    if(["DELETE", "UPDATE", "UPDATE_DO", "INSERT"].indexOf(fun) >= 0 &&
       $.isFunction(options.beforeChanged)
    ){
      options.beforeChanged(null, ui, function(){
        self.options.dataModel._exec(fun, ui, ret);
      });
    } else
      self.options.dataModel._exec(fun, ui, ret);
    // .................................................................
    function ret(data){
      options = self.option();
//console.log(options);
//console.log("ret", fun, data, $.isFunction(options.afterDelete));
//console.log("ret M", ui, data);
      for(fun_ret in data){
        switch(fun_ret){
          case "PAGE":
//console.log(data[fun_ret][0].id);
            self.refreshPage();
            break;
          case "REC":
//console.log(self.refreshRec, data);
            if($.isFunction(options.beforeRefreshRec))
              self.options.beforeRefreshRec(null, data, function(){
                self.refreshRec();
              });
            else
              self.refreshRec();
            break;
          case "ERROR":
          console.log("err", data);
            break;
        }
      }
      if(["DELETE", "UPDATE", "UPDATE_DO", "INSERT"].indexOf(fun) >= 0){
        ui.fun = fun;
        ui.data = data;
        self._trigger("dataChanged", null, ui);
      }
      if($.isFunction(ui.ret))
        ui.ret(data);
    }
  },
  // ...................................................................
  _option: function(){
    var self = this,
        options = this.option(),
        $dialog = $("<div>", self.element),
        tr = [];
    for(var i in options.colModel){
      tr.push($.sprintf(
        '<tr data-ix="%i">'+
          '<td>%s</td>'+
          '<td><input name="show" type="checkbox" %s></td>'+
          '<td><input name="search" type="checkbox" %s></td>'+
          '<td><input name="align" type="text" value="%s"></td>'+
          '<td><input name="width" type="text" value="%s"></td>'+
        '</tr>',
        i,
        options.i18n(options.colModel[i].title),
        options.colModel[i].show ? "checked" : "",
        options.colModel[i].search ? "checked" : "",
        options.colModel[i].align,
        options.colModel[i].width
      ));
    };
    $dialog.html(
      '<div style="max-height:30em;overflow:auto;overflow-x:hidden">'+
        '<table class="mk-tables-option cols">'+
          '<thead>'+
            '<tr>'+
              '<td>'+options.i18n("Column")+'</td>'+
              '<td>'+options.i18n("Show")+'</td>'+
              '<td>'+options.i18n("Search")+'</td>'+
              '<td>'+options.i18n("Align")+'</td>'+
              '<td>'+options.i18n("Width")+'</td>'+
            '</tr>'+
          '</thead>'+
          '<tbody>'+
            tr.join("")+
          '</tbody>'+
        '</table>'+
      '</div>'+
      '<table class="mk-tables-option">'+
        '<tr>'+
          '<td style="text-align:right">'+options.i18n("Rows")+'</td>'+
          '<td>'+
            '<input name="Rows" type="text" value="'+options.Rows+'" style="width:4em;text-align:right">'+
          '</td>'+
        '</tr>'+
        '<br>'+
        '<tr>'+
          '<td style="text-align:right">'+options.i18n("Fixed columns")+'</td>'+
          '<td>'+
            '<input name="Left" type="text" value="'+options.Left+'" style="width:4em;text-align:right">'+
          '</td>'+
        '</tr>'+
      '</table>'
    );
    $("table.mk-tables-option thead td", $dialog).addClass("ui-widget-header");
    $("table.mk-tables-option:first-child tbody td", $dialog)
    .addClass("ui-widget-content");
    $("tbody td input[type=text]", $dialog)
    .css({"border":"0"});
    $("input[name=Rows]", $dialog).spinner({
      min: 1,
      max: 30
    });
    $("input[name=Left]", $dialog).spinner({
      min: 0
    });

    $dialog.dialog({
      resizable: true,
      height:   "auto",
      width:    "auto",
      title:    options.i18n("Options"),
      modal:    true,
      buttons:  [{
        tabindex: "200",
        text: options.i18n("Reset"),
        click: function(){
          self.option(self.options.DefOption);
          self.saveOption(true, true);
          $dialog.dialog("close");
        }
      },{
        tabindex: "201",
        class: "OK",
        text: options.i18n("OK"),
        click: function(){
          self.option("Rows", parseInt($("input[name=Rows]", $dialog).val()));
          self.option("Left", parseInt($("input[name=Left]", $dialog).val()));
          var cols = [];
          $("table.cols tbody tr", $dialog).each(function(iX){
            var iP = $(this).data("ix"),
                c  = options.colModel[iP];
            c.show   = $("input[name=show]", this).prop("checked");
            c.search = $("input[name=search]", this).prop("checked");
            c.align  = $("input[name=align]", this).val().replace(/"/g,"");
            c.width  = $("input[name=width]", this).val().replace(/"/g,"");
            cols.push(c);
          });
          self.option("colModel", cols);
          self.saveOption(true, false);
          $dialog.dialog("close");
        }
      },{
        tabindex: "202",
        text: options.i18n("Cancel"),
        click: function(){
          $(this).dialog("close");
        }
      }],
      open: function(){
      },
      close: function(){
        $(this)
        .off("keydown")
        .dialog("destroy");
        self.element.focus();
      },
      show: {
        effect: "puff",//"clip","explode","blind",
        duration: 100
      },
      hide: {
        effect: "puff",
        duration: 100
      },
      create: function(){
        $dialog.submit(function(ev){
          ev.preventDefault();
        });
      }
    }).on("keydown", function(ev){
      if(ev.keyCode == $.ui.keyCode.ENTER && ev.ctrlKey){
        ev.originalEvent.originalTarget.blur();
        var $OK = $("button.OK", $dialog.dialog("instance").uiDialog);
        $OK.click();
        return false;
      }
    });
    $(".mk-tables-option:first-child tbody", $dialog.dialog("instance").uiDialog)
    .css({"cursor":"default"})
    .sortable({
      axis: "y",
      containment: "parent"
    });
    $(".mk-cols-table tbody", $dialog).disableSelection();
  },
  // ...................................................................
  _filter: function(el){
    var self  = this,
        options = this.option();
        li    = [
          '<li data-choice="CANCEL">'+
            '<div>'+
              options.i18n("Cancel")+
            '</div>'+
          '</li>',
          '<li data-choice="EDIT">'+
            '<div>'+
              options.i18n("Edit")+
            '</div>'+
          '</li>'
        ],
        filters = [],
        $menu = $('ul.mk-tables-menu', self.element),
        filters = [];
    if($("input[name=search]", self.element).val() != ""){
      li.push(
        '<li><div></div></li>',
        '<li data-choice="SEARCH2FILTER">'+
         '<div>'+
            options.i18n("Make filter from search results")+
          '</div>'+
        '</li>'
      );
    }
    if($("input[name=search]", self.element).val() != "" ||
       (options.filtSw && options.filt != "")
    ){
      li.push(
        '<li><div></div></li>',
        (options.accessModel.edt ?
          '<li data-choice="UPDATE">'+
            '<div>'+
              options.i18n("Update all selected records")+
              ' ('+options.Filter+')'+
            '</div>'+
          '</li>' : ''
        ),
        '<li data-choice="FILTER2CONTAINER">'+
         '<div>'+
            options.i18n("Make container from filter")+
          '</div>'+
        '</li>'
      );
    }
    if(!$.isEmptyObject(options.cont))
      li.push(
        '<li><div></div></li>',
        '<li data-choice="CONTAINER2FILTER">'+
          '<div>'+
            options.i18n("Make filter from container")+
            ' ('+Object.keys(options.cont).length+')'+
          '</div>'+
        '</li>',
        '<li data-choice="PURGE_CONTAINER">'+
          '<div>'+
            options.i18n("Purge container")+
          '</div>'+
        '</li>'
      );
    if(!$menu.is(":hidden")){
      $(this)
      .menu("destroy")
      .hide();
      self._overlay(false);
      self.element.focus();
      return false;
    }
    // list filters
    self.options.dataModel._exec(
      "FILTER_LIST",
      {options: options, object: self},
      function(D){
        filters = D.FILTER_LIST;
        if(filters.length > 0){
          li.push('<li><div></div></li>');
          for(var i in filters)
            li.push('<li data-choice="'+i+'"><div>'+filters[i].name+'</div></li>');
        }
        self._overlay(true);
        $menu
        .html(li.join(""))
        .show()
        .position({
          my: "left top",
          at: "left bottom",
          of: el
        })
        .menu({
          select: function(ev, ui){
            var c = $(ui.item).data("choice");
            switch(c){
              case "CANCEL":
                break;
              case "EDIT":
                self._edit_filter();
                break;
              case "UPDATE":
                self._edit_update();
                break;
              case "SEARCH2FILTER":
                self._exec("SEARCH2FILTER");
                break;
              case "CONTAINER2FILTER":
                self._exec("CONTAINER2FILTER");
                break;
              case "FILTER2CONTAINER":
                self._exec("FILTER2CONTAINER", {object: self});
                break;
              case "PURGE_CONTAINER":
                self.option("cont", {});
                $(".mk-tables-left tbody td:first-child", self.element)
                .each(function(iX){
                  $(this)
                  .html(
                    options.Offset + parseInt(iX) < options.Filter ?
                    (options.Offset + parseInt(iX) + 1) : "&nbsp;"
                  );
                })
                .removeClass("ui-state-active");
                break;
              default:
                self.option({
                  filt: filters[c].val,
                  filtSw: true
                });
                self._exec("ID2IX");
            }
            $(this).menu("option", "close")();
          },
          close: function(){
            $menu
            .off()
            .menu("destroy")
            .hide();
            self._overlay(false);
            self.element.focus();
          }
        })
        .focus()
        .on("keydown", function(ev){
          if(ev.which == $.ui.keyCode.ESCAPE){
            $menu.menu("option", "close")();
          }
          ev.preventDefault();
          return false;
        });
      }
    );
  },

  // ...................................................................
  // filter management
  _edit_filter: function(){
    var self = this,
        options = this.option(),
        $dialog = $("<div>", self.element),
        search_timer = null,
        val_prev = "",
        filters = [],
        ix = -1;
    // list of filters .................................................
    function filter_list(){
      self.options.dataModel._exec(
        "FILTER_LIST",
        {options: options, object: self},
        function(D){
          var tr = [];
          D = filters = D.FILTER_LIST;
          for(var i in D){
            tr.push($.sprintf(
              '<tr data-id="%s">'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
              '</tr>',
              D[i].id,
              D[i].name,
              D[i].dbuser,
              D[i].access
            ));
          }
          $("table.mk-edit-list-body", $dialog)
          .html(tr.join(""));
          $("table.mk-edit-list-body td", $dialog)
          .addClass("ui-widget-content");
          $(".mk-edit-list-body tr td", this.element)
          .hover(
            function(ev){$(this).addClass("ui-state-hover")},
            function(ev){$(this).removeClass("ui-state-hover")}
          )
          .click(function(ev){
            var tr = $(this).parent();
            ix = tr.index();
            $("td", tr.parent()).css("background-color", "");
            $("td", tr).css("background-color", self.colorHighlight);
            $("textarea[name=filt]", $dialog)
            .val(filters[ix].val)
            .focus()
            .trigger("keydown");
            if(filters[ix].dbuser == options.User)
              $(".REMOVE, .SAVE, .ACCESS").button("enable");
            else
              $(".REMOVE, .SAVE, .ACCESS").button("disable");
          });
          $(".REMOVE, .SAVE, .ACCESS").button("disable");
        }
      );
    }
    // filter save .....................................................
    function filter_save(insert){
      var $dialog_save = $('<div>');
      $dialog_save
      .html(
        '<form autocomplete="off">'+
          '<input name="name" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n(insert ? "Insert" : "Save"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            var name = $("input[name=name]", $dialog_save).val(),
                search = $("textarea[name=filt]", $dialog).val();
            if(name != "" || search == "")
              self.options.dataModel._exec(
                "FILTER_SAVE",{
                  options: options,
                  object: self,
                  insert: insert,
                  id:     ix < 0 ? "" : filters[ix].id,
                  name:   typeof filters[ix] == "undefined" ? name : filters[ix].name,
                  data: {
                    name:   name,
                    sign:   options.Sign,
                    dbuser: options.User,
                    access: ix < 0 ? options.User : filters[ix].access,
                    fun:    "FILTER",
                    val:    search.trim()
                  }
                },
                filter_list
              );
            $(this).dialog("close");
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          if(!insert)
            $("input[name=name]", $dialog_save).val(filters[ix].name);
        },
        create: function(){
          $dialog_save.submit(function(ev){
            $("button.OK", $dialog_save.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // filter access ...................................................
    function filter_access(){
      var $dialog_access = $('<div>');
      $dialog_access
      .html(
        '<form autocomplete="off">'+
          '<input name="access" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n("Access"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            filters[ix].access = $("input[name=access]", $dialog_access).val();
            $(this).dialog("close");
            filter_save(false);
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          $("input[name=access]", $dialog_access).val(filters[ix].access);
        },
        create: function(){
          $dialog_access.submit(function(ev){
            $("button.OK", $dialog_access.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // filter main dialog ..............................................
    $dialog.html(
      '<table class="mk-tables-option mk-cols-table" style="width:100%">'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<table class="mk-tables-option mk-edit-list mk-edit-list-header" style="border:0;width:100%">'+
              '<tr>'+
                '<td><div>'+options.i18n("Name")+'</div></td>'+
                '<td><div>'+options.i18n("User")+'</div></td>'+
                '<td style="width:99%"><div>'+options.i18n("Access")+'</div></td>'+
              '</tr>'+
            '</table>'+
            '<div style="height:6em;padding:0;margin:0;border:0;width:100%;overflow:auto;">'+
              '<table class="mk-tables-option mk-edit-list mk-edit-list-body" style="border:0;width:100%">'+
              '</table>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-header" colspan="2">WHERE<div class="info" style="float:right">0</div></td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" style="padding:0;width:26em;">'+
            '<textarea name="filt" style="height:12em;width:40em;border:0;margin:0" spellcheck="false">'+
              options.filt+
            '</textarea>'+
          '</td>'+
          '<td class="ui-widget-content" style="padding:0;vertical-align:top;">'+
            '<div style="width:10em;height:12em;overflow:auto;overflow-x:hidden">'+
              '<ul class="mk-edit-menu" style="border-right:0;border-left:0;text-align:left"></ul>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<div class="mk-edit-info" style="height:10em;width:100%;overflow:auto">'+
            '</div>'+
          '</td>'+
        '</tr>'+
      '</table>'
    );
    $("td.ui-widget-header div", $dialog)
    .css({
      "text-align":"center",
      "display":"inline-block"
    });
    $("div.row_list div", $dialog)
    .css({
      "display":"inline-block"
    });
    $("table.mk-edit-list-header td", $dialog)
    .addClass("ui-widget-header");
    // cols as menu
    var li = [];
    for(var i in options.colModel){
      li.push(
        '<li class="ui-widget-content" data-ix="'+i+'">'+
          '<div>'+
            options.i18n(options.colModel[i].title)+
          '</div>'+
        '</li>'
      );
    }
    li.push('<li class="ui-widget-content ui-state-disabled"><div>TABLE</div></li>');
    // filter table columns
    self.options.dataModel._exec(
      "TABLE_INFO",
      {options: options, object: self},
      function(D){
        D = D.TABLE_INFO;
        for(var i in D){
          li.push(
            '<li class="ui-widget-content">'+
              '<div>'+
                D[i].name+
              '</div>'+
            '</li>'
          );
        }
        $("ul.mk-edit-menu", $dialog)
        .html(li.join(""))
        .menu({
          select: function(ev, ui){
            var Ele = $("textarea[name=filt]", $dialog),
                Ix  = ui.item.data("ix"),
                Col = typeof Ix == "undefined" ?
                      ui.item.text() :
                      options.colModel[Ix].indx,
                Pos = Ele.getCursorPosition(),
                Txt = Ele.val();
            Txt = Txt.substr(0, Pos) + Col + Txt.substr(Pos);
            Ele
            .val(Txt).setCursorPosition(Pos + Col.length)
            .trigger("keydown");
          }
        });
      }
    );
    // filter list .....................................................
    filter_list();
    // filter textarea .................................................
    $("textarea[name=filt]", $dialog)
    .on("keydown", function(ev){
      var search = this;
      if(search_timer){
        clearTimeout(search_timer);
        search_timer  =  null;
      }
      search_timer = setTimeout(function(){
        if(search.value != val_prev){
          self.options.dataModel._exec(
            "FILTER_TEST",
            {options: options, object: self, filt: search.value.trim()},
            ret
          );
        }
        val_prev = search.value;
      }, 400);
      function ret(D){
        if(typeof D.err != "undefined"){
          $("div.info", $dialog).text("");
          $("div.mk-edit-info", $dialog)
          .text(D.err)
          .addClass("ui-state-error");
          $(".SAVE,.NEW,.OK").button("disable");
        } else {
          if(ix >= 0 && filters[ix].dbuser == options.User)
            $(".SAVE").button("enable");
          $(".OK,.NEW").button("enable");
          var tr = [],
              th = [],
              r = "";
          $("div.info", $dialog).text(
            typeof D.FILTER_COUNT == "undefined" ?
            "" :
            D.FILTER_COUNT[0].N
          );
          if(typeof D.FILTER_TEST != "undefined" && D.FILTER_TEST.length != 0){
            D = D.FILTER_TEST;
            var H = [];
            for(var i in D){
              if(i == 0){
                for(var x in D[i]){
                  th.push('<td><div>'+x+'</td></div>');
                  H.push(x);
                 }
              }
              var td = [];
              for(var ixx in H){
                if($.isPlainObject(D[i][H[ixx]]))
                  val = JSON.stringify(D[i][H[ixx]]);
                else
                  val = D[i][H[ixx]];
                td.push('<td><div>'+val+'</td></div>');
              }
              tr.push('<tr>'+td.join("")+'</td>');
            }
            r =
              '<table class="mk-tables-option" style="width:100%">'+
                '<thead>'+
                  '<tr>'+th.join("")+'</tr>'+
                '</thead>'+
                '<tbody>'+tr.join("")+'</tbody>'+
              '</table>'+
              '';
          }
          $("div.mk-edit-info", $dialog)
          .html(r)
          .removeClass("ui-state-error");
          $("div.mk-edit-info table thead td", $dialog)
          .addClass("ui-widget-header");
          $("div.mk-edit-info table tbody td", $dialog)
          .css("text-align", "left")
          .addClass("ui-widget-content");
        }
      };
    });
    // main dialog .....................................................
    $dialog.dialog({
      resizable: true,
      height:   "auto",
      width:    "auto",
      title:    options.i18n("Filter"),
      modal:    true,
      buttons:  [{
        disabled: true,
        tabindex: "200",
        class: "REMOVE",
        text: options.i18n("Remove"),
        click: function(){
//console.log("REMOVE", ix, filters[ix], filters[ix].name);
          self.options.dataModel._exec(
            "FILTER_DELETE",{
              options: options,
              object:  self,
              id:      filters[ix].id,
              name:    filters[ix].name
            }, function(D){
              ix = -1;
              $(".REMOVE,.SAVE,.ACCESS").button("disable");
              filter_list();
            }
          );
        }
      },{
        disabled: true,
        tabindex: "201",
        class: "SAVE",
        text: options.i18n("Save"),
        click: function(){
          filter_save(false);
        }
      },{
        disabled: true,
        tabindex: "202",
        class: "ACCESS",
        text: options.i18n("Access"),
        click: function(){
          filter_access();
        }
      },{
        tabindex: "203",
        class: "NEW",
        text: options.i18n("New"),
        click: function(){
          filter_save(true);
        }
      },{
        tabindex: "204",
        class: "OK",
        text: options.i18n("OK"),
        click: function(){
          if($("div.mk-edit-info", $dialog).hasClass("ui-state-error"))
            return;
          self.option({
            filt: $("textarea[name=filt]", $dialog).val(),
            filtSw: true
          });
          self._exec("ID2IX");
          $(this).dialog("close");
        }
      },{
        tabindex: "205",
        text: options.i18n("Cancel"),
        click: function(){
          $(this).dialog("close");
        }
      }],
      open: function(){
        setTimeout(function(){
          var w = $("div.mk-edit-info", $dialog).parent().width();
          $("div.mk-edit-info", $dialog).width(w);
        }, 100);
        $("textarea[name=filt]", $dialog)
        .trigger("keydown");
      },
      close: function(){
        $(this)
        .off("keydown")
        .dialog("destroy");
        self.element.focus();
      },
      show: {
        effect: "puff",//"clip","explode","blind",
        duration: 100
      },
      hide: {
        effect: "puff",
        duration: 100
      },
      create: function(){
        $dialog.submit(function(ev){
          ev.preventDefault();
        });
      }
    }).on("keydown", function(ev){
      if(ev.keyCode == $.ui.keyCode.ENTER && ev.ctrlKey){
        ev.originalEvent.originalTarget.blur();
        var $OK = $("button.OK", $dialog.dialog("instance").uiDialog);
        $OK.click();
        return false;
      }
    });
  },

  // ...................................................................
  // update management
  _edit_update: function(){
    var self = this,
        options = this.option(),
        $dialog = $("<div>", self.element),
        search_timer = null,
        val_prev = "",
        updates = [],
        ix = -1;
    // list of updates .................................................
    function update_list(){
      self.options.dataModel._exec(
        "UPDATE_LIST",
        {options: options, object: self},
        function(D){
          var tr = [];
          D = updates = D.UPDATE_LIST;
          for(var i in D){
            tr.push($.sprintf(
              '<tr data-id="%s">'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
              '</tr>',
              D[i].id,
              D[i].name,
              D[i].dbuser,
              D[i].access
            ));
          }
          $("table.mk-edit-list-body", $dialog)
          .html(tr.join(""));
          $("table.mk-edit-list-body td", $dialog)
          .addClass("ui-widget-content");
          $(".mk-edit-list-body tr td", this.element)
          .hover(
            function(ev){$(this).addClass("ui-state-hover")},
            function(ev){$(this).removeClass("ui-state-hover")}
          )
          .click(function(ev){
            var tr = $(this).parent();
            ix = tr.index();
            $("td", tr.parent()).css("background-color", "");
            $("td", tr).css("background-color", self.colorHighlight);
            $("textarea[name=val]", $dialog)
            .val(updates[ix].val)
            .focus()
            .trigger("keydown");
            if(updates[ix].dbuser == options.User)
              $(".REMOVE, .SAVE, .ACCESS").button("enable");
            else
              $(".REMOVE, .SAVE, .ACCESS").button("disable");
          });
          $(".REMOVE, .SAVE, .ACCESS").button("disable");
        }
      );
    }
    // update save .....................................................
    function update_save(insert){
      var $dialog_save = $('<div>');
      $dialog_save
      .html(
        '<form autocomplete="off">'+
          '<input name="name" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n(insert ? "Insert" : "Save"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            var name = $("input[name=name]", $dialog_save).val(),
                search = $("textarea[name=val]", $dialog).val();
            if(name != "" || search == "")
              self.options.dataModel._exec(
                "UPDATE_SAVE",{
                  options: options,
                  object: self,
                  insert: insert,
                  id:     ix < 0 ? "" : updates[ix].id,
                  name:   typeof updates[ix] == "undefined" ? name : updates[ix].name,
                  data: {
                    name:   name,
                    sign:   options.Sign,
                    dbuser: options.User,
                    access: ix < 0 ? options.User : updates[ix].access,
                    fun:    "UPDATE",
                    val:    search.trim()
                  }
                },
                update_list
              );
            $(this).dialog("close");
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          if(!insert)
            $("input[name=name]", $dialog_save).val(updates[ix].name);
        },
        create: function(){
          $dialog_save.submit(function(ev){
            $("button.OK", $dialog_save.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // update access ...................................................
    function update_access(){
      var $dialog_access = $('<div>');
      $dialog_access
      .html(
        '<form autocomplete="off">'+
          '<input name="access" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n("Access"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            updates[ix].access = $("input[name=access]", $dialog_access).val();
            $(this).dialog("close");
            update_save(false);
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          $("input[name=access]", $dialog_access).val(updates[ix].access);
        },
        create: function(){
          $dialog_access.submit(function(ev){
            $("button.OK", $dialog_access.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // update main dialog ..............................................
    $dialog.html(
      '<table class="mk-tables-option mk-cols-table" style="width:100%">'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<table class="mk-tables-option mk-edit-list mk-edit-list-header" style="border:0;width:100%">'+
              '<tr>'+
                '<td><div>'+options.i18n("Name")+'</div></td>'+
                '<td><div>'+options.i18n("User")+'</div></td>'+
                '<td style="width:99%"><div>'+options.i18n("Access")+'</div></td>'+
              '</tr>'+
            '</table>'+
            '<div style="height:6em;padding:0;margin:0;border:0;width:100%;overflow:auto;">'+
              '<table class="mk-tables-option mk-edit-list mk-edit-list-body" style="border:0;width:100%">'+
              '</table>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-header" colspan="2">UPDATE SET</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" style="padding:0;width:26em;">'+
            '<textarea name="val" style="height:12em;width:40em;border:0;margin:0" spellcheck="false">'+
            '</textarea>'+
          '</td>'+
          '<td class="ui-widget-content" style="padding:0;vertical-align:top;">'+
            '<div style="width:10em;height:12em;overflow:auto;overflow-x:hidden">'+
              '<ul class="mk-edit-menu" style="border-right:0;border-left:0;text-align:left"></ul>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<div class="mk-edit-info" style="width:100%;height:8em;overflow:auto">'+
            '</div>'+
          '</td>'+
        '</tr>'+
      '</table>'
    );
    $("td.ui-widget-header div", $dialog)
    .css({
      "text-align":"center",
      "display":"inline-block"
    });
    $("div.row_list div", $dialog)
    .css({
      "display":"inline-block"
    });
    $("table.mk-edit-list-header td", $dialog)
    .addClass("ui-widget-header");
    // table cols as menu
    self.options.dataModel._exec(
      "TABLE_INFO",{options: options, object: self}, function(D){
        D = D.TABLE_INFO;
        var li = [];
        for(var i in D){
          li.push(
            '<li class="ui-widget-content">'+
              '<div>'+
                D[i].name+
              '</div>'+
            '</li>'
          );
        }
        $("ul.mk-edit-menu", $dialog)
        .html(li.join(""))
        .menu({
          select: function(ev, ui){
            var Ele = $("textarea[name=val]", $dialog),
                Col = ui.item.text(),
                Pos = Ele.getCursorPosition(),
                Txt = Ele.val();
            Txt = Txt.substr(0, Pos) + Col + Txt.substr(Pos);
            Ele
            .val(Txt).setCursorPosition(Pos + Col.length)
            .trigger("keydown");
          }
        });
      }
    );
    // update list .....................................................
    update_list();
    // update textarea .................................................
    $("textarea[name=val]", $dialog)
    .on("keydown", function(ev){
      var search = this;
      if(search_timer){
        clearTimeout(search_timer);
        search_timer  =  null;
      }
      search_timer = setTimeout(function(){
        if(search.value.trim() == ""){
          ret({});
          return;
        }
        if(search.value != val_prev){
          self.options.dataModel._exec(
            "UPDATE_DO",{
              options: options,
              object: self,
              test: true,
              update: search.value.trim()
            },
            ret
          );
        }
        val_prev = search.value;
      }, 400);
      function ret(D){
        if(typeof D.err != "undefined"){
          $("div.info", $dialog).text("");
          $("div.mk-edit-info", $dialog)
          .text(D.err)
          .addClass("ui-state-error");
          $(".SAVE,.NEW,.OK").button("disable");
        } else {
          if(ix >= 0 && updates[ix].dbuser == options.User)
            $(".SAVE").button("enable");
          if($(search).val().trim() == "")
            $(".OK").button("disable");
          else
            $(".OK,.NEW").button("enable");
          var Html = "OK";
          if(typeof D.OBJECT != "undefined"){
            Html = '<pre>'+JSON.stringify(D.OBJECT, " ", 2)+'</pre>';
          }
          $("div.mk-edit-info", $dialog)
          .html(Html)
          .removeClass("ui-state-error");
          $("div.mk-edit-info table thead td", $dialog)
          .addClass("ui-widget-header");
          $("div.mk-edit-info table tbody td", $dialog)
          .css("text-align", "left")
          .addClass("ui-widget-content");
        }
      };
    });
    // update main dialog ..............................................
    $dialog.dialog({
      resizable: true,
      height:   "auto",
      width:    "auto",
      title:    options.i18n("Update"),
      modal:    true,
      buttons:  [{
        disabled: true,
        tabindex: "200",
        class: "REMOVE",
        text: options.i18n("Remove"),
        click: function(){
          self.options.dataModel._exec(
            "UPDATE_DELETE",{
              options: options,
              object: self,
              id: updates[ix].id
            }, function(D){
              $(".REMOVE,.SAVE,.ACCESS").button("disable");
              update_list();
            }
          );
        }
      },{
        disabled: true,
        tabindex: "201",
        class: "SAVE",
        text: options.i18n("Save"),
        click: function(){
          update_save(false);
        }
      },{
        disabled: true,
        tabindex: "202",
        class: "ACCESS",
        text: options.i18n("Access"),
        click: function(){
          update_access();
        }
      },{
        tabindex: "203",
        class: "NEW",
        text: options.i18n("New"),
        click: function(){
          update_save(true);
        }
      },{
        tabindex: "204",
        class: "OK",
        disabled: true,
        text: options.i18n("OK"),
        click: function(){
          if($("div.mk-edit-info", $dialog).hasClass("ui-state-error"))
            return;
          var search = $("textarea[name=val]", $dialog).val();
          $dialog.dialog("close");
          self._exec("UPDATE_DO", {
            options: options,
            object: self,
            test: false,
            update: search.trim()
          });
/*
          self.options.dataModel._exec(
            "UPDATE_DO",
            {options: options, object: self, test: false, update: search.trim()},
            function(D){
              self._trigger("dataChanged", null, {options: options});
              self._exec("ID2IX");
              $dialog.dialog("close");
            }
          );
*/
        }
      },{
        tabindex: "205",
        text: options.i18n("Cancel"),
        click: function(){
          $(this).dialog("close");
        }
      }],
      open: function(){
        setTimeout(function(){
          var w = $("div.mk-edit-info", $dialog).parent().width();
          $("div.mk-edit-info", $dialog).width(w);
        }, 100);
      },
      close: function(){
        $(this)
        .off("keydown")
        .dialog("destroy");
        self.element.focus();
      },
      show: {
        effect: "puff",//"clip","explode","blind",
        duration: 100
      },
      hide: {
        effect: "puff",
        duration: 100
      },
      create: function(){
        $dialog.submit(function(ev){
          ev.preventDefault();
        });
      }
    }).on("keydown", function(ev){
      if(ev.keyCode == $.ui.keyCode.ENTER && ev.ctrlKey){
        ev.originalEvent.originalTarget.blur();
        var $OK = $("button.OK", $dialog.dialog("instance").uiDialog);
        $OK.click();
        return false;
      }
    });
  },


  // ...................................................................
  _report: function(el){
    var self  = this,
        options = this.option(),
        li    = [
          '<li data-choice="CANCEL">'+
            '<div>'+
              options.i18n("Cancel")+
            '</div>'+
          '</li>',
        ],
        reports = [],
        $menu = $('ul.mk-tables-menu', self.element),
        reports = [];
    if(options.accessModel.rep)
      li.push(
        '<li data-choice="EDIT">'+
          '<div>'+
            options.i18n("Edit")+
          '</div>'+
        '</li>'
      );
    if(!$menu.is(":hidden")){
      $(this)
      .menu("destroy")
      .hide();
      self._overlay(false);
      self.element.focus();
      return false;
    }
    // list reports
    self.options.dataModel._exec(
      "REPORT_LIST",
      {options: options, object: self},
      function(D){
        reports = D.REPORT_LIST;
        if(reports.length > 0){
          li.push('<li><div></div></li>');
          for(var i in reports)
            li.push('<li data-choice="'+i+'"><div>'+reports[i].name+'</div></li>');
        }
        self._overlay(true);
        $menu
        .html(li.join(""))
        .show()
        .position({
          my: "left top",
          at: "left bottom",
          of: el
        })
        .menu({
          select: function(ev, ui){
            var c = $(ui.item).data("choice");
            switch(c){
              case "CANCEL":
                break;
              case "EDIT":
                self._edit_report();
                break;
              default:
                self._report_view($.parseJSON(reports[c].val));
            }
            $(this).menu("option", "close")();
          },
          close: function(){
            $menu
            .off()
            .menu("destroy")
            .hide();
            self._overlay(false);
            self.element.focus();
          }
        })
        .focus()
        .on("keydown", function(ev){
          if(ev.which == $.ui.keyCode.ESCAPE){
            $menu.menu("option", "close")();
          }
          ev.preventDefault();
          return false;
        });
      }
    );
  },
  // ...................................................................
  // report management
  _edit_report: function(){
    var self = this,
        options = this.option(),
        $dialog = $("<div>", self.element),
        search_timer = null,
        val_prev = null,
        reports = [],
        ix = -1;
    // list of reports .................................................
    function report_list(){
      self.options.dataModel._exec(
        "REPORT_LIST",
        {options: options, object: self},
        function(D){
          var tr = [];
          D = reports = D.REPORT_LIST;
          for(var i in D){
            tr.push($.sprintf(
              '<tr data-id="%s">'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
                '<td><div>%s</div></td>'+
              '</tr>',
              D[i].id,
              D[i].name,
              D[i].dbuser,
              D[i].access
            ));
          }
          $("table.mk-edit-list-body", $dialog)
          .html(tr.join(""));
          $("table.mk-edit-list-body td", $dialog)
          .addClass("ui-widget-content");
          $(".mk-edit-list-body tr td", this.element)
          .hover(
            function(ev){$(this).addClass("ui-state-hover")},
            function(ev){$(this).removeClass("ui-state-hover")}
          )
          .click(function(ev){
            var tr = $(this).parent();
            ix = tr.index();
            $("td", tr.parent()).css("background-color", "");
            $("td", tr).css("background-color", self.colorHighlight);
            var rep = $.parseJSON(reports[ix].val);
            $("input[name=ext]", $dialog).val(rep.ext);
            $("textarea[name=val]", $dialog)
            .val(rep.val)
            .focus()
            .trigger("keydown");
            if(reports[ix].dbuser == options.User)
              $(".REMOVE, .SAVE, .ACCESS").button("enable");
            else
              $(".REMOVE, .SAVE, .ACCESS").button("disable");
          });
          $(".REMOVE, .SAVE, .ACCESS").button("disable");
        }
      );
    }
    // report save .....................................................
    function report_save(insert){
      var $dialog_save = $('<div>');
      $dialog_save
      .html(
        '<form autocomplete="off">'+
          '<input name="name" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n(insert ? "Insert" : "Save"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            var name = $("input[name=name]", $dialog_save).val(),
                search = $("textarea[name=val]", $dialog).val();
            if(name != "" || search == "")
              self.options.dataModel._exec(
                "REPORT_SAVE",{
                  options: options,
                  object: self,
                  insert: insert,
                  id:     ix < 0 ? "" : reports[ix].id,
                  name:   typeof reports[ix] == "undefined" ? name : reports[ix].name,
                  data: {
                    name:   name,
                    sign:   options.Sign,
                    dbuser: options.User,
                    access: ix < 0 ? options.User : reports[ix].access,
                    fun:    "REPORT",
                    val:    JSON.stringify({
                      val: search.trim(),
                      ext: $("input[name=ext]", $dialog).val()
                    })
                  }
                },
                report_list
              );
            $(this).dialog("close");
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          if(!insert)
            $("input[name=name]", $dialog_save).val(reports[ix].name);
        },
        create: function(){
          $dialog_save.submit(function(ev){
            $("button.OK", $dialog_save.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // report access ...................................................
    function report_access(){
      var $dialog_access = $('<div>');
      $dialog_access
      .html(
        '<form autocomplete="off">'+
          '<input name="access" type="text" class="ui-widget-content ui-corner-all" style="width:100%">'+
        '</form>')
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    options.i18n("Access"),
        modal:    true,
        buttons:  [{
          tabindex: "204",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            reports[ix].access = $("input[name=access]", $dialog_access).val();
            $(this).dialog("close");
            report_save(false);
          }
        },{
          tabindex: "205",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        close: function(){
          $(this)
          .off("keydown")
          .dialog("destroy");
        },
        open: function(){
          $("input[name=access]", $dialog_access).val(reports[ix].access);
        },
        create: function(){
          $dialog_access.submit(function(ev){
            $("button.OK", $dialog_access.dialog("instance").uiDialog)
            .click();
            ev.preventDefault();
          });
        }
      });
    }
    // report main dialog ..............................................
    $dialog.html(
      '<table class="mk-tables-option mk-cols-table" style="width:100%">'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<table class="mk-tables-option mk-edit-list mk-edit-list-header" style="border:0;width:100%">'+
              '<tr>'+
                '<td><div>'+options.i18n("Name")+'</div></td>'+
                '<td><div>'+options.i18n("User")+'</div></td>'+
                '<td style="width:99%"><div>'+options.i18n("Access")+'</div></td>'+
              '</tr>'+
            '</table>'+
            '<div style="height:6em;padding:0;margin:0;border:0;width:100%;overflow:auto;">'+
              '<table class="mk-tables-option mk-edit-list mk-edit-list-body" style="border:0;width:100%">'+
              '</table>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-header" colspan="2">SELECT</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" style="padding:0;width:26em;">'+
            '<textarea name="val" style="height:12em;width:40em;border:0;margin:0" spellcheck="false">'+
            '</textarea>'+
            '<input name="ext" type="hidden">'+
          '</td>'+
          '<td class="ui-widget-content" style="padding:0;vertical-align:top;">'+
            '<div style="width:10em;height:12em;overflow:auto;overflow-x:hidden">'+
              '<ul class="mk-edit-menu" style="border-right:0;border-left:0;text-align:left"></ul>'+
            '</div>'+
          '</td>'+
        '</tr>'+
        '<tr>'+
          '<td class="ui-widget-content" colspan="2">'+
            '<div class="mk-edit-info" style="height:10em;width:100%;width-max:20em;overflow:auto">'+
            '</div>'+
          '</td>'+
        '</tr>'+
      '</table>'
    );
    $("td.ui-widget-header div", $dialog)
    .css({
      "text-align":"center",
      "display":"inline-block"
    });
    $("div.row_list div", $dialog)
    .css({
      "display":"inline-block"
    });
    $("table.mk-edit-list-header td", $dialog)
    .addClass("ui-widget-header");
    // cols as menu
    var li = [];
    for(var i in options.colModel){
      li.push(
        '<li class="ui-widget-content" data-indx="'+options.colModel[i].indx+'">'+
          '<div>'+
            options.i18n(options.colModel[i].title)+
          '</div>'+
        '</li>'
      );
    }
    li.push('<li class="ui-widget-content ui-state-disabled"><div>TABLE</div></li>');
    self.options.dataModel._exec(
      "TABLE_INFO",{options: options, object: self}, function(D){
        D = D.TABLE_INFO;
        for(var i in D){
          li.push(
            '<li class="ui-widget-content" data-indx="'+D[i].name+'">'+
              '<div>'+
                D[i].name+
              '</div>'+
            '</li>'
          );
        }
        $("ul.mk-edit-menu", $dialog)
        .html(li.join(""))
        .menu({
          select: function(ev, ui){
            var Ele  = $("textarea[name=val]", $dialog),
                Pos  = Ele.getCursorPosition(),
                Txt  = Ele.val();
            self.options.dataModel._exec(
              "REPORT_COL",{
                col_indx: ui.item.data("indx"),
                col_name: ui.item.text(),
                options:  options,
                object:   self
            }, function(Col){
              Txt = Txt.substr(0, Pos) + Col + Txt.substr(Pos);
              Ele
              .val(Txt).setCursorPosition(Pos + Col.length)
              .trigger("keydown");
            });
          }
        });
      }
    );
    // report editor for ext ...........................................
    function edit_extra(){
      var $dialog_ext = $(
        '<div class="mk-cols-table">'+
          '<textarea style="width:60em;height:40em" class="ui-widget-content"></textarea>'+
        '</div>'
      );
      $dialog_ext
      .dialog({
        resizable: true,
        height:   "auto",
        width:    "auto",
        title:    "Extra",
        modal:    true,
        buttons:  [{
          tabindex: "200",
          class: "OK",
          text: options.i18n("OK"),
          click: function(){
            $('input[name=ext]', $dialog)
            .val($('textarea', $dialog_ext).val());
            $(this).dialog("close");
          }
        },{
          tabindex: "201",
          text: options.i18n("Cancel"),
          click: function(){
            $(this).dialog("close");
          }
        }],
        open: function(){
          $("textarea", $dialog_ext)
          .val($('input[name=ext]', $dialog).val())
          .focus();
        },
        close: function(){
          $(this)
          .dialog("destroy");
        },
        create: function(){
          $dialog_ext.submit(function(ev){
            ev.preventDefault();
          });
        }
      });
    }
    // report list .....................................................
    report_list();
    // report textarea .................................................
    $("textarea[name=val]", $dialog)
    .on("keydown", function(ev){
      var search = this;
      if(search_timer){
        clearTimeout(search_timer);
        search_timer  =  null;
      }
      search_timer = setTimeout(function(){
        if(search.value != val_prev){
          self.options.dataModel._exec(
            "REPORT_TEST", {
              options: options,
              object: self,
              test: true,
              val: search.value.trim()
            },
            ret
          );
        }
        val_prev = search.value;
      }, 400);
      function ret(D){
        if(typeof D.err != "undefined"){
          $("div.mk-edit-info", $dialog)
          .text(D.err)
          .addClass("ui-state-error");
          $(".SAVE,.NEW,.OK").button("disable");
        } else {
          if(ix >= 0 && reports[ix].dbuser == options.User)
            $(".SAVE,.NEW").button("enable");
          $(".OK,.NEW").button("enable");
          var tr = [],
              th = [],
              r = "";
          if(typeof D.REPORT_TEST != "undefined" && D.REPORT_TEST.length != 0){
            D = D.REPORT_TEST;
            for(var i in D){
              var td = [];
              for(var x in D[i]){
                if(i == 0)
                  th.push('<td><div>'+x+'</td></div>');
                td.push('<td><div>'+D[i][x]+'</td></div>');
              }
              tr.push('<tr>'+td.join("")+'</td>');
            }
            r =
              '<table class="mk-tables-option" style="width:100%">'+
                '<thead>'+
                  '<tr>'+th.join("")+'</tr>'+
                '</thead>'+
                '<tbody>'+tr.join("")+'</tbody>'+
              '</table>'+
              '';
          } else
            r = "";
          $("div.mk-edit-info", $dialog)
          .html(r)
          .removeClass("ui-state-error");
          $("div.mk-edit-info table thead td", $dialog)
          .addClass("ui-widget-header");
          $("div.mk-edit-info table tbody td", $dialog)
          .css("text-align", "left")
          .addClass("ui-widget-content");
        }
      };
    });
    // report main dialog ..............................................
    $dialog.dialog({
      resizable: true,
      height:   "auto",
      width:    "auto",
      title:    options.i18n("Report"),
      modal:    true,
      buttons:  [{
        tabindex: "200",
        class: "EXTRA",
        text: "Extras",
        click: function(){
          edit_extra();
        }
      },{
        disabled: true,
        tabindex: "201",
        class: "REMOVE",
        text: options.i18n("Remove"),
        click: function(){
          self.options.dataModel._exec(
            "REPORT_DELETE",{
              options: options,
              object:  self,
              name:    reports[ix].name,
              id:      reports[ix].id
            }, function(D){
              $(".REMOVE,.SAVE,.ACCESS").button("disable");
              report_list();
            }
          );
        }
      },{
        disabled: true,
        tabindex: "201",
        class: "SAVE",
        text: options.i18n("Save"),
        click: function(){
          report_save(false);
        }
      },{
        disabled: true,
        tabindex: "202",
        class: "ACCESS",
        text: options.i18n("Access"),
        click: function(){
          report_access();
        }
      },{
        tabindex: "203",
        class: "NEW",
        text: options.i18n("New"),
        click: function(){
          report_save(true);
        }
      },{
        tabindex: "204",
        class: "OK",
        text: options.i18n("OK"),
        click: function(){
          if($("div.mk-edit-info", $dialog).hasClass("ui-state-error"))
            return;
          self._report_view({
            val: $("textarea[name=val]", $dialog).val(),
            ext: $("input[name=ext]", $dialog).val()
          });
        }
      },{
        tabindex: "205",
        text: options.i18n("Cancel"),
        click: function(){
          $(this).dialog("close");
        }
      }],
      open: function(){
        setTimeout(function(){
          var w = $("div.mk-edit-info", $dialog).parent().width();
          $("div.mk-edit-info", $dialog).width(w);
        }, 100);
        $("textarea[name=val]", $dialog)
        .trigger("keydown");
      },
      close: function(){
        $(this)
        .off("keydown")
        .dialog("destroy");
        self.element.focus();
      },
      show: {
        effect: "puff",//"clip","explode","blind",
        duration: 100
      },
      hide: {
        effect: "puff",
        duration: 100
      },
      create: function(){
        $dialog.submit(function(ev){
          ev.preventDefault();
        });
      }
    }).on("keydown", function(ev){
      if(ev.keyCode == $.ui.keyCode.ENTER && ev.ctrlKey){
        ev.originalEvent.originalTarget.blur();
        var $OK = $("button.OK", $dialog.dialog("instance").uiDialog);
        $OK.click();
        return false;
      }
    });
  },
  // ...................................................................
  // report view
  _report_view: function(val){
    var self = this,
        options = this.option();
    val["options"] = self.option();
    val["object"]  = self;
    window.val = val;
    self.Wreport = window.open(
      options.Report,
      "REPORT",
      'scrollbars=yes,toolbar=no,width=900,height=700,resizable=yes'
    );
    self.Wreport.focus();
  },
  // ...................................................................
  // form edit
  _edit: function(el, insert, clone){
    var self    = this,
        options = this.option(),
        $dialog = $(".mk-tables-form", self.element),
        W       = $dialog.width(),
        F       = $("form.mk-tables-form", self.element);
    if(el)
      el.blur();
    // access + beforeEdit
    if(
      !options.accessModel.edt ||
      (insert && !options.accessModel.ins) ||
      ($.isFunction(options.beforeEdit) &&
       options.beforeEdit(null, {
         form:   F,
         insert: insert,
         clone:  clone,
         data:   insert ? [] : options.REC
       }) === false)
    ){
      return;
    }
    // stop focus event
    if(options.Filter == 0){
      insert = true;
      clone = false;
    }
      $(GRID_FORM_ELEMENT, F)
      .off("focus");
    // open edit form
    $dialog.dialog({
      resizable: false,
      height:   "auto",
      width:    $dialog.is(":visible") ? W + 40 : "auto",
      title:    insert ? options.i18n("Insert") : options.i18n("Edit"),
      modal:    true,
      buttons:  [{
        tabindex: "200",
        class: "OK",
        text: insert ? options.i18n("Insert") : options.i18n("Save"),
        click: function(){
          var ui = {
            options: options,
            element: $dialog.dialog("instance").uiDialog
          };
          $dialog.cancel = false;
          $dialog.dialog("close");
          if(
            $.isFunction(options.afterEdit) &&
            options.afterEdit(null, {
              form:   F,
              insert: insert,
              clone:  clone,
              data:   options.REC
            }) === false
          )
            return;
          var data = {};
          $("form.mk-tables-form .upd", ui.element).each(function(){
            if($(this).hasClass("object")){
              data[this.name] = $(this).data("val");
            } else if($(this).hasClass("array"))
              data[this.name] = $(this).data("val");
            else
              data[this.name] = $(this).val();
          });
          self._exec(insert ? "INSERT" : "UPDATE", {data: data, object: self});
        }
      },{
        tabindex: "201",
        text: options.i18n("Cancel"),
        click: function(){
          $(this).dialog("close");
        }
      }],
      open: function(){
        $dialog.cancel = true;
        // interaction's elements
        $(GRID_FORM_ELEMENT, F)
        .each(function(){
          this.prev = this.value;
          if($(this).hasClass("datepicker")){
            if(insert)
              $(this).val(date_time().E);
            $(this)
            .datepicker({
              dateFormat:"yy-mm-dd"
            });
          } else if($(this).hasClass("enum")){
            $(this)
            .on("click", function(ev){
              var aEnum = $(this).data("enum"),
                  ix    = aEnum.indexOf(this.value) + 1;
              if(ix >= aEnum.length)
                ix = 0;
              $(this)
              .val(aEnum[ix])
              .change();
            });
          } else if($(this).hasClass("selectmenu")){
            $(this).selectmenu();
          } else if($(this).hasClass("autocomplete")){
            $(this).autocomplete(options.autoOpt);
          }
          // insert but not clone
          if(((insert && !clone) || (clone && this.disabled))  &&
            !$(this).hasClass("fix")
          ){
            if($(this).hasClass("enum"))
              this.value = $(this).data("enum")[0];
            else if($(this).is("select"))
              this.value = $("option", this).eq(0).val();
            else if(typeof $(this).data("default") != "undefined")
              this.value = $(this).data("default");
            else
              this.value = "";
          }
        });
        // element to focus/select
        if(!el)
          el = $(GRID_FORM_ELEMENT, $dialog.dialog("instance").element[0])
          .filter("[type=text]:enabled:visible")
          .eq(0);
        else
          el = $(el);
        el.blur();
        el && setTimeout(function(){
          el.focus().select();
        }, 200);
      },
      close: function(){
        if($dialog.cancel && $.isFunction(options.cancelEdit))
          options.cancelEdit(null, {
            form:   F,
            insert: insert,
            clone:  clone,
            data:   options.REC
          });
        $(this)
        .off("keydown")
        .dialog("destroy");
        $("input[type=button]:not(.ui-state-disabled)", F)
        .off("click");
        $(GRID_FORM_ELEMENT, F)
        .each(function(){
          if($(this).hasClass("datepicker"))
            $(this).datepicker("destroy");
          if($(this).hasClass("selectmenu"))
            $(this).selectmenu("destroy");
          if($(this).hasClass("ui-autocomplete-input"))
            $(this).autocomplete("destroy");
          this.value = this.prev;
        })
        .on("focus", function(){
          self._edit(this, options.recId == null, false);
        });
        if($.isFunction(options.closeEdit))
          options.closeEdit(null, {
            cancel: $dialog.cancel,
            form:   F,
            insert: insert,
            clone:  clone,
            data:   options.REC
          });
        self.element.focus();
      },
      show: {
        effect: "puff",//"clip","explode","blind",
        duration: 100
      },
      hide: {
        effect: "puff",
        duration: 100
      },
      create: function(){
//        self._trigger("beforeEdit", null);
        $dialog.submit(function(ev){
          ev.preventDefault();
        });
      }
    }).on("keydown", function(ev){
      if(ev.keyCode == $.ui.keyCode.ENTER && ev.ctrlKey){
        //ev.originalEvent.originalTarget.blur();
        var $OK = $("button.OK", $dialog.dialog("instance").uiDialog);
        $OK.click();
        return false;
      }
    });

  },
  // ...................................................................
  _delete: function(el){
    var self  = this,
        options = this.option(),
        li    = [],
        $menu = $('ul.mk-tables-menu', self.element);
    // access
    if(!options.accessModel.del || options.Filter == 0)
      return;
    if(
      $.isFunction(options.beforeDelete) &&
      options.beforeDelete(null, options) === false
    )
      return;
    li.push(
      '<li data-choice="CANCEL">'+
        '<div>'+
          options.i18n("Cancel")+
        '</div>'+
      '</li>',
      '<li><div></div></li>',
      '<li data-choice="delRec">'+
        '<div>'+
          options.i18n("Remove selected record")+
          ' ('+options.ID+' = '+options.recId+')'+
        '</div>'+
      '</li>'
    );
    if($("input[name=search]", self.element).val() != "" ||
       options.filtSw && options.filt != ""
    )
      li.push(
        '<li data-choice="delFilt">'+
          '<div>'+
            options.i18n("Remove all selected records")+
            ' ('+options.Filter+')'+
          '</div>'+
        '</li>'
      );
    if(!$.isEmptyObject(options.cont))
      li.push(
        '<li data-choice="delCont">'+
          '<div>'+
            options.i18n("Remove all records in container")+
            ' ('+Object.keys(options.cont).length+')'+
          '</div>'+
        '</li>'
      );
    if(li.length == 0)
      return;
    if(!$menu.is(":hidden")){
      $(this)
      .menu("destroy")
      .hide();
      self._overlay(false);
      self.element.focus();
      return false;
    }
    self._overlay(true);
    $menu
    .html(li.join(""))
    .show()
    .position({
      my: "left top",
      at: "left bottom",
      of: el
    })
    .menu({
      select: function(ev, ui){
        var c = $(ui.item).data("choice");
        if(c != "CANCEL"){
          self._exec("DELETE", {sw: c, object: self, object: self});
        }
        $(this).menu("option", "close")();
      },
      close: function(){
        $menu
        .off()
        .menu("destroy")
        .hide();
        self._overlay(false);
        self.element.focus();
      }
    })
    .focus()
    .on("keydown", function(ev){
      if(ev.which == $.ui.keyCode.ESCAPE){
        $menu.menu("option", "close")();
      }
      ev.preventDefault();
      return false;
    });
  },
  // ...................................................................
  // refresh form
  refreshRec: function(){
    var self = this,
        options = this.option();
    // delay after close dialog
    setTimeout(function(){
      var F = $("form.mk-tables-form", self.element),
          D = options.REC;
      if(options.Filter == 0)
        D = [];

//console.log(D.length, D, options.REC);
//      self._trigger("beforeRefreshRec", null, {form: F, REC: D});
      $(GRID_FORM_ELEMENT, F)
      .each(function(){
        if($(this).hasClass("object"))
          $(this).data("val", D.length ? $.extend(true, {}, D[0][this.name]) : null);
        else if($(this).hasClass("array"))
          $(this).data("val", D.length ? $.extend(true, [], D[0][this.name]) : null);
        else {
          $(this).val(typeof D[0] == "undefined" ? "" : D[0][this.name]);
        }
      })
      .on("focus", function(){
        self._edit(this, options.recId == null, false);
      });
      self._trigger("refreshRec", null, {form: F, REC: D});
    }, 100);
    // button state
    $("input[data-choice='ON_OFF']", self.element)
    .prop("checked", options.filtSw)
    .button("refresh");
    // current record
    var iX = options.rowIx % options.Rows;
    if(iX  < 0)
      iX = options.Rows;
    if(options.Filter > 0){
      $(".mk-tables-left tbody tr", self.element)
      .removeClass("ui-state-highlight")
      .eq(iX)
      .addClass("ui-state-highlight");
      $(".mk-tables-right tbody tr", self.element)
      .removeClass("ui-state-highlight")
      .eq(iX)
      .addClass("ui-state-highlight");
    } else {
      $(".mk-tables-left tbody tr,.mk-tables-right tbody tr", self.element)
      .removeClass("ui-state-highlight");
    }
    // info
    var iP = parseInt(options.rowIx / options.Rows) + 1;
    $(".mk-footer input[name=pageNr]", this.element)
    .val(iP);
    $(".mk-footer span.info", this.element)
    .text($.sprintf(
      "%d - %d / %d /%d",
      options.Filter ? options.Offset + 1 : 0,
      Math.min(options.Offset + options.Rows, options.Filter),
      options.Filter,
      options.Total
    ));
  },
  // ...................................................................
  // refresh table
  refreshPage: function(){
    var self = this,
        options = self.option(),
        D = options.PAGE;
    for(var i = 0;i < options.Rows;i++){
      var tr_l = $(".mk-tables-left tbody tr", this.element).eq(i),
          tr_r = $(".mk-tables-right tbody tr", this.element).eq(i),
          td_cont = $("td", tr_l).eq(0);
      if(i < D.length){
        var j = -1;
        for(var x in D[i]){
          if(j < 0)
            var v = D[i][x];
          else
            var v = typeof options.colModel[j] == "undefined" ||
                    typeof options.colModel[j].render == "undefined" ?
                    D[i][x] :
                    options.colModel[j].render({rowData: D[i], col: x});
          if(j < options.Left)
            $("div."+x, tr_l)
            .html(v);
          else
            $("div."+x, tr_r)
            .html(v);
          j++;
        }
        if(options.cont[D[i][options.ID]])
          td_cont
          .addClass("ui-state-active")
          .text(
            options.cont[D[i][options.ID]]+
            "-"+
            (options.Offset + parseInt(i) + 1)
          );
        else
          td_cont
          .removeClass("ui-state-active")
          .text(options.Offset + parseInt(i) + 1);
      } else {
        $("td", tr_l)
        .eq(0)
        .removeClass("ui-state-active")
        .html("&nbsp;");
        $("div", tr_l)
        .text("");
        $("div", tr_r)
        .text("");
      }
    }
    this._trigger("refreshPage", null, {PAGE: D});
  },
  // ...................................................................
  saveOption: function(refresh, clean_up){
    var self = this,
        options = this.option();
    self.options.dataModel._exec(
      "SAVE_OPTION",
      {options: options, object: self},
      function(D){
        if(refresh)
          self.rebuild();
        else if(clean_up)
          self._clean_up();
      }
    );
  },
  // ...................................................................
  loadOption: function(callBack){
    var self = this;
    
    self.options.dataModel._exec(
      "LOAD_OPTION",
      {object: self},
      function(D){
        D = $.extend(true, {}, self.option(), D);
        self.option(D);
        if(callBack)
          callBack();
      }
    );
  },
  // ...................................................................
  filter: function(callBack){
    return this.options.dataModel._exec(
      "FILTER",
      {fun:"FILTER", object:this},
      callBack
    );
  },
  // ...................................................................
  rebuild: function(){
    var self = this;
    self._clean_up();
    self._build();
    self._trigger("rebuild", null, {});
    setTimeout(function(){
      self.element.focus();
    }, 1000);
  },
  // ...................................................................
  refresh: function(){
    var self = this;

    var F = $("form.mk-tables-form", self.element);
    $(GRID_FORM_ELEMENT, F)
    .off("focus");

    self._exec("REFRESH");
    self._exec("ID2IX");
    self._trigger("refresh", null, {});
  }
  // ...................................................................
});
// ---------------------------------------------------------------------
