/** \file
* \brief Function : sqlite dataModel for mk.tables
* Table-Grid jquery ui plugin - sqlite dataModel
*=====
* Copyright: Michael Krocka
*********************************************************************
* Function     | Author   | Created    | Last Uptdate
*--------------|----------|------------|-----------
* dataModel    | M.Krocka | 01.01.2016 |
*********************************************************************
*/
// ---------------------------------------------------------------------
var sqliteDataModel = {
  rowIx:    0,      /*!< current record offset */
  Offset:   0,      /*!< top page record */
  Total:    0,      /*!< total number of records */
  Filter:   null,   /*!< number of filtered or searched reecords */
  PAGE:     [],     /*!< page data */
  REC:      {},     /*!< record data */
  // ...................................................................
  /*! \brief  Main execute function
  *
  *
  *
  */
  _exec: function(fun, ui, callBack){
    function callRet(data){
      optOut.Offset = self.Offset;
      ui.object.option(optOut);
      callBack(data);
    }
    var self = this,
        optInp = ui.object.option(),
        optOut = {},
        sgn = [],
        WHERE = 1,
        WHERE_TOTAL = 1,
        WHERE_DEL = 0,
        RetD = {};
//console.log(fun);
//console.log("s-in", self.rowIx);
    // .................................................................
    if(typeof this.queryPage == "undefined"){
      var cols = [optInp.ID];
      this.Cols = [optInp.ID];
      for(var i in optInp.colModel){
        cols.push(
          optInp.colModel[i].indx+
          " AS '"+
          optInp.colModel[i].title+"'"
        );
        this.Cols.push(
          optInp.colModel[i].indx+
          " AS '"+
          optInp.i18n(optInp.colModel[i].title)+"'"
        );
      }
      this.queryPage =
        "SELECT "+cols.join(",")+
        " FROM "+optInp.SQL_Table+" %s ORDER BY %s,%s LIMIT %d,%d";
      this.queryRec =
        optInp.SQL_Query ?
        optInp.SQL_Query+" %s" :
        "SELECT * FROM "+optInp.SQL_Table+" %s";
      this.queryTotal =
        "SELECT COUNT(*) AS Total FROM "+optInp.SQL_Table+" %s";
      this.queryFilter =
        "SELECT COUNT(*) AS Filter FROM "+optInp.SQL_Table+" %s";
    }
    // .................................................................
    var funs = {
      "FILTER": function(){
        callRet(_make_where());
      },
      "REFRESH": function(){
        callRet({});
      },
      "DATA": function(Sw){
        WHERE       = _make_where();
        WHERE_TOTAL = _make_where_total();
        sgn = ["TOTAL", "FILTER", "PAGE"];
        _sql_exec(sgn, _load_page);
      },
      "ID2IX": function(){
        WHERE = _make_where();
        WHERE_TOTAL = _make_where_total();
        sgn = ["ID2IX", "TOTAL"];
        _sql_exec(sgn, function(D){
          self.Offset = self.rowIx - self.rowIx % optInp.Rows;
          sgn = ["PAGE", "REC"];
          _sql_exec(sgn, callRet);
        });
      },
      "INSERT": function(){
        sgn = ["INSERT"];
        _sql_exec(sgn, _make_insert);
      },
      "UPDATE": function(){
        sgn = ["UPDATE"];
        _sql_exec(sgn, _make_update);
      },
      "DELETE": function(){
        WHERE_DEL = _make_where_delete(ui.sw);
        WHERE = _make_where();
        WHERE_TOTAL = _make_where_total();
        sgn = ["DELETE", "TOTAL", "FILTER"];
        _sql_exec(sgn, _make_delete);
      },
      "FILTER2CONTAINER": function(){
        WHERE = _make_where();
        sgn = ["FILTER2CONTAINER"];
        _sql_exec(sgn, _filter2container);
      },
      "SEARCH2FILTER": function(){
        sgn = ["SEARCH2FILTER"];
        _sql_exec(sgn, _search2filter);
      },
      "CONTAINER2FILTER": function(){
        sgn = ["CONTAINER2FILTER"];
        _sql_exec(sgn, _container2filter);
      },
      "SAVE_OPTION": function(){
        var S = {};
        if(!ui.reset)
          for(var x in SAVE_PROPS)
            S[SAVE_PROPS[x]] = optInp[SAVE_PROPS[x]];
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "SAVE_OPTION",
            query: $.sprintf(
              "INSERT OR REPLACE INTO %s (id,name,dbuser,access,fun,sign,val)"+
              "VALUES("+
                "(SELECT id FROM %s WHERE dbuser=? AND fun='NAVIG' AND sign=?),"+
                "?,?,?,?,?,?"+
              ")",
              optInp.SQL_SysTable, optInp.SQL_SysTable
            ),
            para: [
              optInp.User,      // user
              optInp.Sign,      // navig identification
              "",                   // name
              optInp.User,      // user
              optInp.User,      // access
              "NAVIG",              // table optInp
              optInp.Sign,      // navig identification
              JSON.stringify(S)     // val = optInp
            ]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          if(callRet)
            callRet(D);
        }, "json");
      },
      "LOAD_OPTION": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "LOAD_OPTION",
            query: $.sprintf(
              "SELECT val FROM %s WHERE dbuser=? AND fun='NAVIG' AND sign=?",
              optInp.SQL_SysTable
            ),
            para: [
              optInp.User,      // user
              optInp.Sign       // navig identification
            ]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          if(D.LOAD_OPTION.length)
            D = JSON.parse(D.LOAD_OPTION[0].val);
          else
            D = {};
          if(callRet)
            callRet(D);
        }, "json");
      },
      "FILTER_TEST": function(){
        var o = {
          base: optInp.SQL_Base,
          cmd:  [{
            sgn:   "FILTER_TEST",
            query: $.sprintf(
              "SELECT %s FROM %s WHERE (%s) AND (%s) LIMIT 5",
              self.Cols.join(","),
              optInp.SQL_Table,
              optInp.filtFix == "" ? "1" : optInp.filtFix,
              ui.filt == "" ? "1" : ui.filt
            ),
            para: []
          },{
            sgn:   "FILTER_COUNT",
            query: $.sprintf(
              "SELECT COUNT(*) AS N FROM %s WHERE (%s) AND (%s)",
              optInp.SQL_Table,
              optInp.filtFix == "" ? "1" : optInp.filtFix,
              ui.filt == "" ? "1" : ui.filt
            ),
            para: []
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        })
        .fail(function(err){
          callRet({ERROR: err.responseText})
        });
      },
      "FILTER_LIST": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "FILTER_LIST",
            query: $.sprintf(
              "SELECT * FROM %s WHERE fun='FILTER' AND sign=? AND (dbuser=? OR access=? OR access='' OR access LIKE('%%,'||?)  OR access LIKE('%%,'||?||',%%') OR access LIKE(?||',%%')) ORDER BY name",
              optInp.SQL_SysTable
            ),
            para: [
              optInp.Sign,      // navig identification
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User       // user
            ]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "FILTER_SAVE": function(){
        var s = [],
            v = [],
            p = [];
        for(var x in ui.data){
          if(ui.insert){
            v.push(x);
            s.push("?");
          } else {
            s.push(x+"=?");
          }
          p.push(ui.data[x]);
        }
        if(!ui.insert)
          p.push(ui.id);
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "FILTER_SAVE",
            query:
              ui.insert ?
              "INSERT INTO "+optInp.SQL_SysTable+" ("+v.join(",")+") VALUES("+s.join(",")+")" :
              "UPDATE "+optInp.SQL_SysTable+" SET "+s.join(",")+" WHERE id=?"
            ,
            para: p
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "FILTER_DELETE": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "FILTER_DELETE",
            query: "DELETE FROM "+optInp.SQL_SysTable+" WHERE id=?",
            para: [ui.id]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "TABLE_INFO": function(){
        var o = {
          base: optInp.SQL_Base,
          cmd:  [{
            sgn:   "TABLE_INFO",
            query: "PRAGMA table_info('"+optInp.SQL_Table+"')",
            para: []
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "UPDATE_LIST": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "UPDATE_LIST",
            query: $.sprintf(
              "SELECT * FROM %s WHERE fun='UPDATE' AND sign=? AND (dbuser=? OR access=? OR access='' OR access LIKE('%%,'||?)  OR access LIKE('%%,'||?||',%%') OR access LIKE(?||',%%')) ORDER BY name",
              optInp.SQL_SysTable
            ),
            para: [
              optInp.Sign,      // navig identification
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User       // user
            ]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "UPDATE_SAVE": function(){
        var s = [],
            v = [],
            p = [];
        for(var x in ui.data){
          if(ui.insert){
            v.push(x);
            s.push("?");
          } else {
            s.push(x+"=?");
          }
          p.push(ui.data[x]);
        }
        if(!ui.insert)
          p.push(ui.id);
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "UPDATE_SAVE",
            query:
              ui.insert ?
              "INSERT INTO "+optInp.SQL_SysTable+" ("+v.join(",")+") VALUES("+s.join(",")+")" :
              "UPDATE "+optInp.SQL_SysTable+" SET "+s.join(",")+" WHERE id=?"
            ,
            para: p
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "UPDATE_DELETE": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "UPDATE_DELETE",
            query: "DELETE FROM "+optInp.SQL_SysTable+" WHERE id=?",
            para: [ui.id]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "UPDATE_DO": function(){
        WHERE = _make_where();
        var o = {
          base: optInp.SQL_Base,
          cmd:  [{
            sgn:   "UPDATE_TEST",
            query: $.sprintf(
              "UPDATE  %s SET %s %s",
              optInp.SQL_Table,
              ui.update,
              ui.test ? "WHERE 0" : WHERE
            ),
            para: [],
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          if(ui.test)
            callRet(D)
          else {
            WHERE = _make_where();
            WHERE_TOTAL = _make_where_total();
            sgn = ["ID2IX", "TOTAL"];
            _sql_exec(sgn, function(D){
              self.Offset = self.rowIx - self.rowIx % optInp.Rows;
              sgn = ["PAGE", "REC", "UPDATE_DO"];
              _sql_exec(sgn, callRet);
            });
            return;
          }
        })
        .fail(function(err){
          callRet({ERROR: err.responseText})
        });

      },
      "REPORT_COL": function(){
        callRet(ui.col_indx.replace("%%", "%")+' AS "'+ui.col_name+'"');
        return;
      },
      "REPORT_TEST": function(){
        WHERE = _make_where();
        ui.val = ui.val.replace(/#TABLE#/g, optInp.SQL_Table);
        ui.val = ui.val.replace(/#WHERE#/g, WHERE);
        ui.val = ui.val.replace(/#RECID#/g, optInp.recId);
//console.log(this, ui, optInp);
        var o = {
          base: optInp.SQL_Base,
          cmd:  [{
            sgn:   "REPORT_TEST",
            query: $.sprintf(
              "SELECT %s",
              ui.test ?
              ui.val.replace(/LIMIT.*$/g, "")+" LIMIT 5" :
              ui.val
            ),
            para: []
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        })
        .fail(function(err){
          callRet({ERROR: err.responseText});
          return;
        });
      },
      "REPORT_LIST": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "REPORT_LIST",
            query: $.sprintf(
              "SELECT * FROM %s WHERE fun='REPORT' AND sign=? AND (dbuser=? OR access=? OR access='' OR access LIKE('%%,'||?)  OR access LIKE('%%,'||?||',%%') OR access LIKE(?||',%%')) ORDER BY name",
              optInp.SQL_SysTable
            ),
            para: [
              optInp.Sign,      // navig identification
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User,      // user
              optInp.User       // user
            ]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "REPORT_SAVE": function(){
        var s = [],
            v = [],
            p = [];
        for(var x in ui.data){
          if(ui.insert){
            v.push(x);
            s.push("?");
          } else {
            s.push(x+"=?");
          }
          p.push(ui.data[x]);
        }
        if(!ui.insert)
          p.push(ui.id);
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "REPORT_SAVE",
            query:
              ui.insert ?
              "INSERT INTO "+optInp.SQL_SysTable+" ("+v.join(",")+") VALUES("+s.join(",")+")" :
              "UPDATE "+optInp.SQL_SysTable+" SET "+s.join(",")+" WHERE id=?"
            ,
            para: p
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "REPORT_DELETE": function(){
        var o = {
          base: optInp.SQL_SysBase,
          cmd:  [{
            sgn:   "REPORT_DELETE",
            query: "DELETE FROM "+optInp.SQL_SysTable+" WHERE id=?",
            para: [ui.id]
          }]
        };
        o.cmd = JSON.stringify(o.cmd);
        $.post("/sql", o, function(D){
          callRet(D)
        });
      },
      "WHERE": function(){
        callRet({
          WHERE: ui.fun == "DELETE" ?
          _make_where_delete(ui.sw) : _make_where()
        });
      }
    };
    // .................................................................
    if(funs[fun])
      funs[fun]();
    else
      console.log(fun + "?");
    // .................................................................
    function _make_delete(D){
      self.Offset = self.rowIx - self.rowIx % optInp.Rows;
      sgn = ["PAGE", "FILTER"];
      _sql_exec(sgn, function(D){
        if(D.PAGE.length)
          optOut.recId = optInp.recId = D.PAGE[self.rowIx % optInp.Rows][optInp.ID];
        else
          optOut.recId = optInp.recId = null;
        sgn = ["REC"];
        ui.object.option(optInp);
        _sql_exec(sgn, callRet);
      });
    }
    // .................................................................
    function _make_update(D){
      WHERE = _make_where();
      WHERE_TOTAL = _make_where_total();
      sgn = ["ID2IX", "TOTAL"];
      var recIdTmp = optInp.recId;
      _sql_exec(sgn, function(D){
        if(D.FILTER == 0 || recIdTmp != D.ID2IX.recId){
          optOut.filtSw = optInp.filtSw = false;
          $("input[name=search]", ui.element).val("");
          WHERE = _make_where();
          optOut.recId = optInp.recId = recIdTmp;
          sgn = ["ID2IX", "TOTAL"];
          _sql_exec(sgn, function(D){
            self.Offset = self.rowIx - self.rowIx % optInp.Rows;
            sgn = ["PAGE", "REC"];
            _sql_exec(sgn, callRet);
          });
          return;
        }
        self.Offset = self.rowIx - self.rowIx % optInp.Rows;
        sgn = ["PAGE", "REC"];
        _sql_exec(sgn, callRet);
      });
    }
    // .................................................................
    function _make_insert(D){
      optOut.recId = optInp.recId = D.INSERT.lastID;
      _make_update(D);
    }
    // .................................................................
    function _load_page(D){
      if(self.rowIx < 0)
        self.rowIx = 0;
      else if(self.rowIx >= self.Total)
        self.rowIx = self.Total - 1;
//console.log(optInp.rowIx / optInp.Rows, self.rowIx / optInp.Rows);
      if(parseInt(optInp.rowIx / optInp.Rows) == parseInt(self.rowIx / optInp.Rows)){
//console.log("H");
        self.rowIx = optInp.rowIx;
        self.Offset = self.rowIx - self.rowIx % optInp.Rows;
        _load_rec();
        return;
      }
      sgn = ["PAGE"];
      self.rowIx = optInp.rowIx;
//console.log("P");
      self.Offset = self.rowIx - self.rowIx % optInp.Rows;
      _sql_exec(sgn, _load_rec);
    }
    // .................................................................
    function _load_rec(D){
      var iX = self.rowIx % optInp.Rows;
      if(typeof self.PAGE[iX] == "undefined")
        return;
      optOut.recId = optInp.recId = self.PAGE[iX][optInp.ID];
      sgn = ["REC"];
      _sql_exec(sgn, callRet);
    }
    // .................................................................
    function _filter2container(D){
      optOut.cont = {};
      for(var x in D.FILTER2CONTAINER)
        optOut.cont[D.FILTER2CONTAINER[x][optInp.ID]] = parseInt(x) + 1;
      self.Offset = self.rowIx - self.rowIx % optInp.Rows;
      sgn = ["PAGE"];
      _sql_exec(sgn, callRet);
    }
    // .................................................................
    function _search2filter(){
      optInp.filt = "";
      optOut.filtSw = optInp.filtSw = true;
      WHERE = _make_where();
      optOut.filt = WHERE.replace(/^WHERE /, "");
      WHERE_TOTAL = _make_where_total();
      sgn = ["ID2IX", "TOTAL"];
      _sql_exec(sgn, function(D){
        self.Offset - self.rowIx % self.Rows;
        sgn = ["PAGE", "REC"];
        _sql_exec(sgn, callRet);
      });
    }
    // .................................................................
    function _container2filter(){
      var F = [];
      for(var x in optInp.cont)
        F.push(optInp.ID+"='"+x+"'");
      optOut.filt = optInp.filt = F.join(" OR ");
      optOut.filtSw = optInp.filtSw = true;
      WHERE = _make_where();
      WHERE_TOTAL = _make_where_total();
      sgn = ["ID2IX", "TOTAL"];
      _sql_exec(sgn, function(D){
        self.Offset - self.rowIx % self.Rows;
        sgn = ["PAGE", "REC"];
        _sql_exec(sgn, callRet);
      });
    }
    // .................................................................
    function _sql_exec(sgn, callRet){
      var o = {
        base: optInp.SQL_Base,
        cmd:  []
      };
      for(var x in sgn){
        switch(sgn[x]){
          case "PAGE":
            o.cmd.push({
              sgn: "PAGE",
              query: $.sprintf(
                self.queryPage,
                WHERE,                // WHERE
                _make_order_by(optInp.orderBy)+
                " "+
                optInp.orderType, // ORDER BY col [ASC|DESC]
                optInp.ID+
                " "+
                optInp.orderType, // ORDER BY id [ASC|DESC]
                self.Offset,          // OFFSET
                optInp.Rows       // LIMIT
              ),
              para: []
            });
            break;
          case "REC":
            o.cmd.push({
              sgn: "REC",
              query: $.sprintf(
                self.queryRec,
                optOut.recId == "" ?
                _make_where()+
                " ORDER BY "+
                  _make_order_by(optInp.orderBy)+" "+optInp.orderType+","+
                  optInp.ID+" "+optInp.orderType+
                " LIMIT "+optInp.rowIx+",1" :
                "WHERE "+optInp.ID+"=?"
              ),
              para: optOut.recId == "" ?
                    [] :
                    [optOut.recId]
            });
            break;
          case "TOTAL":
            o.cmd.push({
              sgn: "TOTAL",
              query: $.sprintf(self.queryTotal, WHERE_TOTAL),
              para: []
            });
            break;
          case "FILTER":
            o.cmd.push({
              sgn: "FILTER",
              query: $.sprintf(self.queryFilter, WHERE),
              para: []
            });
            break;
          case "ID2IX":
            o.cmd.push({
              sgn:        "ID2IX",
              WHERE:      WHERE,
              orderBy:    _make_order_by(optInp.orderBy),
              orderType:  optInp.orderType,
              table:      optInp.SQL_Table,
              ID:         optInp.ID,
              recId:      optInp.recId,
              query:      "",
              para:       []
            });
            break;
          case "INSERT":
            var cols = [],
                para = [],
                vals = [];
            for(var x in ui.data){
              cols.push(x);
              vals.push("?");
              para.push(ui.data[x]);
            }
            o.cmd.push({
              sgn: "INSERT",
              query: $.sprintf(
                "INSERT INTO %s (%s) VALUES(%s)",
                optInp.SQL_Table, cols.join(","), vals.join(",")
              ),
              para: para
            });
            break;
          case "UPDATE":
            var cols = [],
                para = [];
            for(var x in ui.data){
              cols.push(x+"=?");
              para.push(ui.data[x]);
            }
            para.push(optInp.recId);
            o.cmd.push({
              sgn: "UPDATE",
              query: $.sprintf(
                "UPDATE %s SET %s WHERE %s=?",
                optInp.SQL_Table, cols.join(","), optInp.ID
              ),
              para: para
            });
            break;
          case "DELETE":
            o.cmd.push({
              sgn: "DELETE",
              query: $.sprintf(
                "DELETE FROM %s %s",
                optInp.SQL_Table, WHERE_DEL
              ),
              para: []
            });
            o.cmd.push({
              sgn: "AUTO",
              query: $.sprintf(
                "UPDATE SQLITE_SEQUENCE SET seq = (SELECT MAX(id) FROM %s) WHERE name = '%s'",
                optInp.SQL_Table, optInp.SQL_Table
              ),
              para: []
            });
            break;
          case "FILTER2CONTAINER":
            o.cmd.push({
              sgn: "FILTER2CONTAINER",
              query: $.sprintf(
                "SELECT %s FROM %s %s ORDER BY %s,%s",
                optInp.ID, optInp.SQL_Table, WHERE,
                _make_order_by(optInp.orderBy)+
                " "+
                optInp.orderType, // ORDER BY col [ASC|DESC]
                optInp.ID+
                " "+
                optInp.orderType // ORDER BY id [ASC|DESC]
              ),
              para: []
            });
            break;
          case "UPDATE_DO":
            break;
        }
      }
//console.log("o", sgn, o.cmd);//return;
      o.cmd = JSON.stringify(o.cmd);
      $.post("/sql", o, function(D){
        if(D.TOTAL)
          self.Total = optInp.Total = optOut.Total = D.TOTAL[0].Total;
        if(D.FILTER){
          self.Filter = optInp.Filter = optOut.Filter = D.FILTER = D.FILTER[0].Filter;
          if(optInp.rowIx >= D.FILTER)
            self.rowIx = optInp.rowIx = optOut.rowIx = Math.max(0, D.FILTER - 1);
        }
        if(D.ID2IX){
          if(typeof D.ID2IX.recId != "undefined")
            optInp.recId = optOut.recId = D.ID2IX.recId;
          else {
            optInp.recId = optOut.recId = null;
            D.ID2IX.rowIx = 0;
          }
          self.rowIx = optInp.rowIx = optOut.rowIx = D.rowIx = D.ID2IX.rowIx;
          self.Filter = optInp.Filter = optOut.Filter = D.FILTER = D.ID2IX.Filter;
          self.Offset = self.rowIx - self.rowIx % optInp.Rows;
        }
        if(D.REC){
          self.REC = optOut.REC = D.REC;
          if(D.REC.length)
            optOut.recId = optInp.recId = D.REC[0][optInp.ID];
        }
        if(D.PAGE)
          self.PAGE = optOut.PAGE = D.PAGE;
        if(D.DELETE && ui.sw == "delCont")
           optOut.cont = {};
        $.extend(RetD, D);
        if(callRet)
          callRet(RetD);
      }, "json");
    }
    // .................................................................
    function _make_order_by(orderBy){
      if(orderBy != "#")
        return orderBy;
      if($.isEmptyObject(optInp.cont)){
        return "1 + 1";
      } else {
        var sort = "CASE "+optInp.ID,
            max  = 0;
        for(var x in optInp.cont){
          if(max < optInp.cont[x])
            max = optInp.cont[x];
          sort += " WHEN '"+x+"' THEN "+optInp.cont[x];
        }
        sort += " ELSE "+(max + 1)+" END";
        return sort;
      }
    }
    // .................................................................
    function _make_where(){
      var W = [],
          S = $("input[name=search]", ui.element).val();
      if(optInp.filtSw && optInp.filt != "")
        W.push("("+optInp.filt+")");
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      if(S != ""){
        var cols = [],
            search = " LIKE('%"+S+"%')";
        for(var i in optInp.colModel){
          if(optInp.colModel[i].search)
            cols.push(optInp.colModel[i].indx+search);
        }
        if(cols.length)
          W.push("("+cols.join(" OR ")+")");
      }
      if(W.length)
        return "WHERE "+W.join(" AND ");
      else
        return "WHERE 1";
    }
    // .................................................................
    function _make_where_total(){
      var W = [];
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      if(W.length)
        return "WHERE "+W.join(" AND ");
      else
        return "WHERE 1";
    }
    // .................................................................
    function _make_where_container(){
      var W = [];
      for(var id in optInp.cont)
        W.push(optInp.ID+"='"+id+"'");
      W = ["("+W.join(" OR ")+")"];
      if(optInp.filtFix != "")
        W.push("("+optInp.filtFix+")");
      if(W.length)
        return "WHERE "+W.join(" AND ");
      else
        return "WHERE 0";
    }
    // .................................................................
    function _make_where_delete(sw){
      switch(sw){
        case "delRec":
          var R = "WHERE "+optInp.ID+"='"+optInp.recId+"'";
          return R;
        case "delFilt":
          return _make_where();
        case "delCont":
          var R = _make_where_container();
          return R;
      }
      return "WHERE 0";
    }
    // .................................................................
  }
};
// ---------------------------------------------------------------------
