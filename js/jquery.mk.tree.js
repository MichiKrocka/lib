/** \file
* \brief Function : mk.tree
* Tree Menu jquery ui plugin
*=====
* Copyright: Michael Krocka
*********************************************************************
* Function     | Author   | Created    | Last Uptdate
*--------------|----------|------------|-----------
* mk.tree      | M.Krocka | 01.01.2016 |
*********************************************************************
*/
// ---------------------------------------------------------------------
$.widget("mk.tree", {
  options: {
    space:       "",          /*!< id postfix */
    top:         null,        /*!< Title,... */
    data:        null,        /*!< Function, Object */
    chck:        false,       /*!< Checkbox for leafs */
    lang_class:  "lang",      /*!< Localization class */
    labelFun:    function(x){ /*!< Transformation key => label */
                   return x;
                 },
  },
  // -------------------------------------------------------------------
  oldHtml:  "",
  oldClass: "",
  // -------------------------------------------------------------------
  _create: function() {
    var self = this;
    self.oldHtml  = self.element.html();
    self.oldClass = $(self.element).prop("class");
    // .................................................................
    if($.isFunction(self.options.data))           // callBack => data
      self.options.data(self.options, function(data){
        var html = recursion(data);
        self._render(html);
      });
    else {                                        // data object
      var html = recursion(self.options.data);
      self._render(html);
    }
    // .................................................................
    function recursion(oM){
      var R = "";
      for(var x in oM){
        var sw = $.isPlainObject(oM[x]);
        var id = (x + self.options.space).replace(/[^a-zA-Z_0-9]/g, "_");
        R +=
          '<div>'+
            '<input type="checkbox" id="'+id+'" data-menu="'+x+'" data-check="true">'+
            '<label for="'+id+'">'+
              (sw ?
                '<i class="fa fa-fw fa-caret-right"></i>'+
                '<i class="fa fa-fw fa-caret-down"></i>' :
                (self.options.chck ?
                  '<i class="fa fa-fw fa-square-o"></i>'+
                  '<i class="fa fa-fw fa-check-square-o"></i>' :
                  '<i class="fa fa-fw fa-file-o"></i>'
                )
              )+
              '<span class="'+self.options.lang_class+'">'+
                self.options.labelFun(x)+
              '</span>'+
            '</label>'+
            '<div>'+
              (sw ? recursion(oM[x]) : '')+
            '</div>'+
          '</div>';
      }
      return R;
    }
    // .................................................................
  },
  // -------------------------------------------------------------------
  _render: function(html){
    var self = this;
    $(self.element)
    .append('<div id="mk-dummy" class="ui-state-hover"></div>');
    colorHover = $('div#mk-dummy', this.element)
    .css("background-color"),
    $("#mk-dummy", self.element)
    .remove();
    html =
      (self.options.top ? self.options.top : "")+
      html+
      '<style type="text/css">'+
      'div.mk-tree div label:hover {'+
        'background-color: '+colorHover+' !important;'+
      '}'+
      '</style>'+
      '';
    $(self.element)
    .addClass("mk-tree")
    .html(html);
    // ...............................................................
    $("i.fa-square-o,i.fa-check-square-o", self.element)
    .click(function(){
      var d = $(this).parent().prev().data("check");
      d = !d;
      $(this).parent().prev()
      .data("check", d)
      .attr("data-check", d);
      return false;
    });
    // ...............................................................
    $("i.fa-caret-right", self.element)
    .click(function(){
      var check = $(this).parent().prev("input[type=checkbox]");
      if(check.length)
        check[0].checked = true;
      return false;
    });
    // ...............................................................
    $("i.fa-caret-down", self.element)
    .click(function(){
      var newMenu = $(this).parent(),
          check   = $(this).parent().prev("input[type=checkbox]"),
          div     = $(this).parent().parent();
      if(
        check.length &&
        ( $("label.ui-state-highlight", div).length == 0 ||
          newMenu.hasClass("ui-state-highlight"))
      ){
        check[0].checked = false;
        return false;
      }
    });
    // ...............................................................
    $("input[type=checkbox]", self.element)
    .change(function(ev){
      var newMenu = $(this).next(),
          oldMenu = $("label.ui-state-highlight", self.element);
      if(newMenu.hasClass("ui-state-highlight") && !this.checked)
        this.checked = false;
      else
        this.checked = true;
      oldMenu.removeClass("ui-state-highlight");
      newMenu.addClass("ui-state-highlight");
      self._trigger("select", null, {
        oldMenu: oldMenu.length ? oldMenu.prev() : null,
        newMenu:newMenu.prev()
      });
      return false;
    });
    // ...............................................................
    self._trigger("render", null, {
      options: self.options,
      element: self.element
    });
  },
  // -------------------------------------------------------------------
  _setOption: function(key, value){
    this._super(key, value);
  },
  // -------------------------------------------------------------------
  _setOptions: function(options){
    this._super(options);
    this.refresh();
  },
  // -------------------------------------------------------------------
  _getCreateEventData: function(){
    return {options: this.options, element: this.element};
  },
  // -------------------------------------------------------------------
  refresh: function(){
    var self = this;
    self.destroy();
    self._create();
    self._trigger("refresh", null, {
      options: self.options,
      element: self.element
    });
  },
  // -------------------------------------------------------------------
  close: function(){
    var self    = this,
        oldMenu = $("label.ui-state-highlight", self.element);
    $("input[type=checkbox]", self.element).prop("checked", false);
    if(oldMenu.length){
      self.open(oldMenu.prev());
      $(oldMenu).get(0).scrollIntoView();
    }
  },
  // -------------------------------------------------------------------
  open: function(selection, noSelect){
    var self    = this,
        oldMenu = $("label.ui-state-highlight", self.element);
    oldMenu = oldMenu.length ? oldMenu.prev() : [];
    if(selection){
      var chck = $(selection).prop("checked");
      $(selection)
        .parentsUntil("div.mk-tree").each(function(){
          $(this).children("input[type=checkbox]:first-child").prop("checked", true);
        });
      if(!noSelect && selection.length){
        $(selection).click();
        $(selection).prop("checked", chck);
        $(selection).get(0).scrollIntoView();
      }
    } else {
      $("input[type=checkbox]", self.element).prop("checked", true);
      if(oldMenu.length){
        $(oldMenu).get(0).scrollIntoView();
      }
    }
  },
  // -------------------------------------------------------------------
  getChecks: function(){
    var self = this,
        oR   = {};
    $("input", self.element).each(function(){
      oR[$(this).data("menu")] = $(this).data("check");
    });
    return oR;
  },
  // -------------------------------------------------------------------
  setChecks: function(oR){
  },
  // -------------------------------------------------------------------
  destroy: function(){
    var self = this;
    $(self.element)
    .removeClass()
    .addClass(self.oldClass)
    .html(self.oldHtml);
  }
  // -------------------------------------------------------------------
});
