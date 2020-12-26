/** \file
* \brief Function : json dataModel for mk.tables
* Table-Grid jquery ui plugin - json dataModel
*=====
* Copyright: Michael Krocka
*********************************************************************
* Function     | Author   | Created    | Last Uptdate
*--------------|----------|------------|-----------
* dataModel    | M.Krocka | 01.01.2016 |
*********************************************************************
*/
// ---------------------------------------------------------------------
var jsonDataModel = {
  rowIx:    0,      /*!< current record offset */
  Offset:   0,      /*!< top page record */
  Total:    0,      /*!< total number of records */
  Filter:   null,   /*!< number of filtered or searched reecords */
  PAGE:     [],     /*!< page data */
  REC:      [],     /*!< record data */
  JSON_Data:null,   /*!< all data */

  ix2id:    [],
  filt:     null,
  filtSw:   null,
  // ...................................................................
  /*! \brief  Main execute function
  *
  *
  *
  */
  // ...................................................................
  _exec: function(fun, ui, callBack){
    function callRet(data){
      optOut.rowIx  = self.rowIx;
      optOut.Offset = self.Offset;
      optOut.Total  = self.Total;
      optOut.Filter = self.Filter;
      optOut.PAGE   = self.PAGE;
      optOut.REC    = self.REC;
//console.log(fun, optOut);
      ui.object.option(optOut);
      callBack(data);
    }
    // .................................................................
    var self = this,
        optInp = ui.object.option(),
        optOut = {},
        orderBy = "",
        orderType = "",

        sgn = [],
        RetD = {},
        Cols;
    // .................................................................
    if(self.JSON_Data === null){
        if($.isFunction(optInp.JSON_Data)){
          optInp.JSON_Data(function(D){
            self.JSON_Data = D;
            self._exec(fun, ui, callBack);
            //console.log(D);
          });
          return;
        }
        self.JSON_Data = optInp.JSON_Data;
    }
//console.log(fun);
//console.log(fun, optInp);
    // .................................................................
    if(self.filt != optInp.filt && self.filtSw != optInp.filtSw){
      _make_filter();
    }
    // sort
    if(self.orderBy != optInp.orderBy || self.orderType != optInp.orderType){
      _make_order();
    }
    // .................................................................
    var funs = {
      "REFRESH": function(){
        self.JSON_Data = null;
//console.log("R", self.JSON_Data);
        callRet({});
      },
      // OK
      "DATA": function(Sw){
        optInp.rowIx = Math.min(optInp.rowIx, self.Filter - 1);
        optInp.rowIx = Math.max(optInp.rowIx, 0);
        self.rowIx   = optInp.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        optInp.recId = optOut.recId = self.ix2id[optInp.rowIx];
        self.REC[0]  = self.JSON_Data[optInp.recId];
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "ID2IX": function(){
        _make_filter();
        _make_order();
        self.rowIx = self.ix2id.indexOf(optInp.recId);
        if(self.rowIx < 0)
          self.rowIx = 0;
        optInp.rowIx = self.rowIx;
        optInp.recId = optOut.recId = self.ix2id[self.rowIx];
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        self.REC[0]  = self.JSON_Data[optInp.recId];
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "INSERT": function(){
        self.JSON_Data.push($.extend(true, {}, ui.data));
        optInp.recId = optOut.recId = self.JSON_Data.length - 1;
        _make_filter();
        _make_order();
        self.rowIx  = self.ix2id.indexOf(optInp.recId);
        if(self.rowIx < 0)
          self.rowIx = 0;
        self.REC[0]  = self.JSON_Data[optInp.recId];
        optInp.rowIx = self.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "UPDATE": function(){
        self.JSON_Data[optInp.recId] = $.extend(true, {}, ui.data);
        _make_filter();
        _make_order();
        self.rowIx  = self.ix2id.indexOf(optInp.recId);
        if(self.rowIx < 0)
          self.rowIx = 0;
        self.REC[0]  = self.JSON_Data[optInp.recId];
        optInp.rowIx = self.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "DELETE": function(){
        var F = _make_where_delete(ui.sw);
        var T = $.extend(true, [], self.JSON_Data);
        self.JSON_Data.splice(0, self.JSON_Data.length) ;
        for(var i in T){
          if(F.indexOf(parseInt(i)) < 0)
            self.JSON_Data.push(T[i]);
        }
        _make_filter();
        _make_order();
        optInp.rowIx = Math.min(optInp.rowIx, self.Filter - 1);
        optInp.rowIx = Math.max(optInp.rowIx, 0);
        self.rowIx   = optInp.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        optInp.recId = optOut.recId = self.ix2id[optInp.rowIx];
        self.REC[0]  = self.JSON_Data[optInp.recId];
        optInp.rowIx = self.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "FILTER2CONTAINER": function(){
        optInp.cont = {};
        _make_filter();
        optOut["cont"] = {};
        for(var i in self.ix2id)
          optOut["cont"][self.ix2id[i]] = parseInt(i) + 1;
        callRet({PAGE: ""});
      },
      "SEARCH2FILTER": function(){
        optInp.filt = optOut.filt = _make_search();
        optInp.filtSw = optOut.filtSw = true;
        _make_filter();
        _make_order();
        self.rowIx  = self.ix2id.indexOf(optInp.recId);
        if(self.rowIx < 0)
          self.rowIx = 0;
        self.REC[0]  = self.JSON_Data[optInp.recId];
        optInp.rowIx = self.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "CONTAINER2FILTER": function(){
        optInp.filt = optOut.filt = "["+Object.keys(optInp.cont).toString()+"].indexOf(id) >= 0";
        optInp.filtSw = optOut.filtSw = true;
        _make_filter();
        _make_order();
        self.rowIx  = self.ix2id.indexOf(optInp.recId);
        if(self.rowIx < 0)
          self.rowIx = 0;
        self.REC[0]  = self.JSON_Data[optInp.recId];
        optInp.rowIx = self.rowIx;
        self.Offset  = self.rowIx - self.rowIx % optInp.Rows;
        _make_page();
        callRet({PAGE: "", REC: ""});
      },
      // OK
      "SAVE_OPTION": function(){
        var S = {};
        if(!ui.reset)
          for(var x in SAVE_PROPS)
            S[SAVE_PROPS[x]] = optInp[SAVE_PROPS[x]];
        self.loadData(optInp.JSON_Sys, function(D){
          var iX = _get_options_ix(D, "NAVIG");
          if(iX >= 0)
            D[iX].val = S;
          else if($.isArray(D))
            D.push({
              dbuser: optInp.User,
              sign: optInp.Sign,
              fun:  "NAVIG",
              val:  S
            });
          self.saveData(optInp.JSON_Sys, D, function(D){
            if(callRet)
              callRet(D);
          });
        });
      },
      // OK
      "LOAD_OPTION": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          var iX = _get_options_ix(D, "NAVIG");
          if(iX >= 0)
            optOut = $.extend(true, optInp, D[iX].val);
          if(callRet)
            callRet(optInp);
        });
      },
      // OK
      "TABLE_INFO": function(){
        var D = [];
        if(self.JSON_Data.length)
          for(var x in self.JSON_Data[0])
            D.push({name: x});
        callRet({TABLE_INFO: D})
      },
      // OK
      "FILTER_TEST": function(){
        var l = self.JSON_Data.length,
            n = 0,
            W = [],
            D = [],
            t = /[^=!<>][=][^=]|[^=!<>][=]$/g;
        // filter
        if(t.test(ui.filt))
          return callRet({FILTER_TEST: [], FILTER_COUNT: [{N:0}]});
        if(ui.filt != "")
          W.push("("+ui.filt+")");
        // filter fix
        if(optInp.filtFix != "")
          W.push("("+optInp.filtFix+")");
        W = W.join(" && ");
        for(var id = 0;id < l;id++){
          var VAL = $.extend(true, {}, self.JSON_Data[id]);
          with(VAL){
            try{
              if(!W.length || eval(W)){
                n++;
                if(n <= 5)
                  D.push(self.JSON_Data[id]);
              }
            } catch(err){
              callRet({ERROR: err.message})
            }
          }
        }
        callRet({FILTER_TEST: D, FILTER_COUNT: [{N:n}]});
      },
      // OK
      "FILTER_LIST": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          callRet({FILTER_LIST: _get_list(D, "FILTER")});
        });
      },
      // OK
      "FILTER_SAVE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          if(ui.insert){
            D.push(ui.data);
            self.saveData(optInp.JSON_Sys, D, function(D){
              if(callRet)
                callRet(D);
            });
          } else {
            for(var i in D){
              if(
                D[i].dbuser == optInp.User &&
                D[i].sign   == optInp.Sign &&
                D[i].name   == ui.name &&
                D[i].fun    == "FILTER"
              ){
                D[i] = ui.data;
                self.saveData(optInp.JSON_Sys, D, function(D){
                  if(callRet)
                    callRet(D);
                });
                return;
              }
            }
          }
        });
      },
      // OK
      "FILTER_DELETE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          for(var i in D){
            if(
              D[i].dbuser == optInp.User &&
              D[i].sign   == optInp.Sign &&
              D[i].name   == ui.name &&
              D[i].fun    == "FILTER"
            ){
              D.splice(parseInt(i), 1);
              self.saveData(optInp.JSON_Sys, D, function(D){
                if(callRet)
                  callRet(D);
              });
              return;
            }
          }
        });
      },
      // OK
      "UPDATE_LIST": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          callRet({UPDATE_LIST: _get_list(D, "UPDATE")});
        });
      },
      // OK
      "UPDATE_SAVE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          if(ui.insert){
            D.push(ui.data);
            self.saveData(optInp.JSON_Sys, D, function(D){
              if(callRet)
                callRet(D);
            });
          } else {
            for(var i in D){
              if(
                D[i].dbuser == optInp.User &&
                D[i].sign   == optInp.Sign &&
                D[i].name   == ui.name &&
                D[i].fun    == "UPDATE"
              ){
                D[i] = ui.data;
                self.saveData(optInp.JSON_Sys, D, function(D){
                  if(callRet)
                    callRet(D);
                });
                return;
              }
            }
          }
        });
      },
      // OK
      "UPDATE_DELETE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          for(var i in D){
            if(
              D[i].dbuser == optInp.User &&
              D[i].sign   == optInp.Sign &&
              D[i].name   == ui.name &&
              D[i].fun    == "UPDATE"
            ){
              D.splice(parseInt(i), 1);
              self.saveData(optInp.JSON_Sys, D, function(D){
                if(callRet)
                  callRet(D);
              });
              return;
            }
          }
        });
      },
      // OK
      "UPDATE_DO": function(){
        if(ui.test){
          try{
            var W = $.extend(
              true, {},
              self.Filter ? self.JSON_Data[self.ix2id[0]] : {}
            );
            with(W)
              eval(ui.update);
          }
          catch(err){
            callRet({ERROR: err.message})
            return;
          }
          callRet({OBJECT:W});
        } else {
          for(var i in self.ix2id){
            var id = self.ix2id[i];
            with(self.JSON_Data[id]){
              try{
                eval(ui.update);
              }
              catch(err){
                console.log(err.message);
                callRet({ERROR: err.message})
                return;
              }
            }
          }
          callRet();
        }
      },
      // OK
      "REPORT_LIST": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          callRet({REPORT_LIST: _get_list(D, "REPORT")});
        });
      },
      // OK
      "REPORT_SAVE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          if(ui.insert){
            D.push(ui.data);
            self.saveData(optInp.JSON_Sys, D, function(D){
              if(callRet)
                callRet(D);
            });
          } else {
            for(var i in D){
              if(
                D[i].dbuser == optInp.User &&
                D[i].sign   == optInp.Sign &&
                D[i].name   == ui.name &&
                D[i].fun    == "REPORT"
              ){
                D[i] = ui.data;
                self.saveData(optInp.JSON_Sys, D, function(D){
                  if(callRet)
                    callRet(D);
                });
                return;
              }
            }
          }
        });
      },
      // OK
      "REPORT_DELETE": function(){
        self.loadData(optInp.JSON_Sys, function(D){
          for(var i in D){
            if(
              D[i].dbuser == optInp.User &&
              D[i].sign   == optInp.Sign &&
              D[i].name   == ui.name &&
              D[i].fun    == "REPORT"
            ){
              D.splice(parseInt(i), 1);
              self.saveData(optInp.JSON_Sys, D, function(D){
                if(callRet)
                  callRet(D);
              });
              return;
            }
          }
        });
      },
      // OK
      "REPORT_COL": function(){
        if($.isNumeric(ui.col_indx))
          callRet('"'+ui.col_name+'":VAL['+ui.col_indx+']');
        else
          callRet('"'+ui.col_name+'":'+ui.col_indx);
        return;
      },
      // OK
      "REPORT_TEST": function(){
        var l = ui.test ? Math.min(5, self.Filter) : self.Filter,
            D = [];
        for(var ix = 0;ix < l;ix){
          var id = self.ix2id[ix],
              NEW = {},
              VAL = {};
          ix++;
          VAL = $.extend(true, {}, self.JSON_Data[id]);
/*
          (function(VAL) {
            try{
              eval("NEW={"+ui.val+"}");
              D.push(NEW);
            } catch(err){
              callRet({ERROR: err.message});
              return;
            }
          }(VAL));
*/        
          with(VAL){
            try{
              eval("NEW={"+ui.val+"}");
              D.push(NEW);
            } catch(err){
              callRet({ERROR: err.message});
              return;
            }
          }
        }
        callRet({REPORT_TEST: D})
      }
    };
    // .................................................................
    funs[fun]();
    // .................................................................
    function _get_options_ix(D, fun){
      // id,name,dbuser,access,fun,sign,val
      if(D.length)
        for(var i in D)
          if(
            D[i].dbuser == optInp.User &&
            D[i].sign == optInp.Sign &&
            D[i].fun  == fun
          )
            return i;
      return -1;
    }
    // .................................................................
    function _get_list(D, fun){
      // id,name,dbuser,access,fun,sign,val
      var R = [];
      for(var i in D)
        if(
          D[i].dbuser == optInp.User &&
          D[i].sign == optInp.Sign &&
          D[i].fun  == fun
        )
          R.push(D[i]);
      return R
    }
    // .................................................................
    function _get_render(orderBy){
      for(var i in optInp.colModel)
        if(optInp.colModel[i].indx == orderBy){
          if(typeof optInp.colModel[i].render != "undefined")
            return optInp.colModel[i].render;
          else
            return function(x){return x;};
        }
      return function(x){return x;};
    }
    // .................................................................
    function _make_page(){
      self.PAGE   = [];
      var m = Math.min(self.Offset + optInp.Rows, self.Filter);
      for(var i = self.Offset;i < m;i++){
        var id = self.ix2id[i];
        var data = {
          id: id
        };
        for(var x in optInp.colModel){
          var v = self.JSON_Data[id][optInp.colModel[x].indx];
          data[optInp.colModel[x].title] = v;
        }
        self.PAGE.push(data);
      }
    }
    // .................................................................
    function _test_filter(val){
console.log(val);
      var l = self.JSON_Data.length,
          W = [],
          D = [];
      if(typeof n != "undefined")
        l = Math.min(n,l);
      // filter
      if(val != "")
        W.push("("+val+")");
      // filter fix
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      W = W.join(" && ");
console.log(W);
      for(var id = 0;id < l;id++){
        with(self.JSON_Data[id]){
          if(!W.length || eval(W))
            D.push(id);
        }
      }
      return D;
    }
    // .................................................................
    function _get_filtered(n){
      var l = self.JSON_Data.length,
          S = $("input[name=search]", ui.element).val(),
          W = [],
          D = [];
      if(typeof n != "undefined")
        l = Math.min(n,l);
      // filter
      if(optInp.filtSw && optInp.filt != "")
        W.push("("+optInp.filt+")");
      // filter fix
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      // search
      var r = true;
      if(S != ""){
        try{
          S = new RegExp(S, "gi");
        } catch(err){
          r = false;
        }
        if(S != "" && r){
          var cols = [];
          for(var i in optInp.colModel){
            if(optInp.colModel[i].search)
              cols.push("VAL['"+optInp.colModel[i].indx+"'].toString().match(S)");
          }
          if(cols.length)
            W.push("("+cols.join(" || ")+")");
        }
      }
      W = W.join(" && ");
      for(var id = 0;r && id < l;id++){
        var VAL = $.extend(true, {}, self.JSON_Data[id]);
        with(VAL){
        if(!W.length || eval(W))
          D.push(id);
        }
      }
      return D;
    }
    // .................................................................
    function _make_search(n){
      var l = self.JSON_Data.length,
          S = $("input[name=search]", ui.element).val(),
          W = [];
      if(typeof n != "undefined")
        l = Math.min(n,l);
      // filter
      if(optInp.filtSw && optInp.filt != "")
        W.push("("+optInp.filt+")");
      // filter fix
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      // search
      var r = true;
      if(S != ""){
        try{
          S = new RegExp(S, "gi");
        } catch(err){
          r = false;
        }
        if(S != "" && r){
          var cols = [];
          for(var i in optInp.colModel){
            if(optInp.colModel[i].search)
              cols.push("VAL['"+optInp.colModel[i].indx+"'].toString().match("+S+")");
          }
          if(cols.length)
            W.push("("+cols.join(" || ")+")");
        }
      }
      W = W.join(" && ");
      return W;
    }
    // .................................................................
    function _make_filter(){
      self.filt      = optInp.filt;
      self.filtSw    = optInp.filtSw;
      self.ix2id     = $.extend([], _get_filtered());
      self.Total     = self.JSON_Data.length;
      self.Filter    = self.ix2id.length;
      self.orderBy   = "";
      self.orderType = "";
    }
    // .................................................................
    function _make_where_delete(sw){
      switch(sw){
        case "delRec":
          var R = [optInp.recId];
          return R;
        case "delFilt":
          return _get_filtered();
        case "delCont":
          var R = [];
          for(var x in optInp.cont)
            R.push(parseInt(x));
          optOut.cont = optInp.cont = {};
          return R;
      }
      return [];
    }
    // .................................................................
    function _make_order(){
      var comp;
      var D = self.JSON_Data;
      self.orderBy   = optInp.orderBy;
      self.orderType = optInp.orderType;
      if(self.orderBy == "#"){
        comp = function(a ,b){
          return self.orderType == "ASC" ? a - b : b - a;
        };
      } else {
        var F = _get_render(self.orderBy);
        comp = function(a, b){
          var r = self.stringComparison(
            F(D[a][self.orderBy]),
            F(D[b][self.orderBy])
          );
          if(r < 0)
            return self.orderType == "ASC" ? -1 : 1;
          else if(r > 0)
            return self.orderType == "ASC" ? 1 : -1;
          else
            return self.orderType == "ASC" ? a - b : b - a;
        };
      }
      self.ix2id.sort(comp);
    }
    // .................................................................
  },
  // ...................................................................
  loadData: function(File, callRet){
    $.getJSON(File, function(D){
      if(callRet)
        callRet(D);
    }, "json").fail(function(err){
      console.log(err);
      if(callRet)
        callRet({ERROR: err.responseText});
    });
  },
  // ...................................................................
  saveData: function(File, Data, callRet){
    $.post("/sto" + File, JSON.stringify(Data), function(msg){
      if(callRet)
        callRet(msg);
    })
    .fail(function(err){
      console.error(err);
      if(callRet)
        callRet({ERROR: err.responseText});
    });
  },
  // ...................................................................
  stringComparison: function(a, b) {
//console.log($.isNumeric(a), a);
    if($.isNumeric(a) && $.isNumeric(b))
      return a - b;
    if($.isArray(a))
      a = a.toString();
    if($.isArray(b))
      b = b.toString();
    a = a.toLowerCase();
    a = a.replace(/ä/g,"a");
    a = a.replace(/ö/g,"o");
    a = a.replace(/ü/g,"u");
    a = a.replace(/ß/g,"s");

    b = b.toLowerCase();
    b = b.replace(/ä/g,"a");
    b = b.replace(/ö/g,"o");
    b = b.replace(/ü/g,"u");
    b = b.replace(/ß/g,"s");

    return(a==b)?0:(a>b)?1:-1;
  }
  // ...................................................................
};
// ---------------------------------------------------------------------
