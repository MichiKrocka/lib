// #####################################################################
function ini2obj(ini){
  // ...................................................................
  function makeNumber(s){
    if($.isNumeric(s))
      return Number(s);
    return s.replace(/\\n/g, "\n");
  }
  // ...................................................................
  function makeArray(obj){
    for(var x in obj){
      var r;
      if($.isPlainObject(obj[x])){
        makeArray(obj[x]);
        if(typeof obj[x].length != "undefined"){
          var A = Array.prototype.slice.call(obj[x], 0);
          obj[x] = A;
        }
      // Begrenzung BACHMANN ini Zeilenlänge
      } else if(r = x.match(/([^0-9]+)([0-9]+)$/)){
        if(!$.isPlainObject(obj[r[1]])){
          obj[r[1]] += obj[x];
          delete obj[x];
        }
      }
    }
  }
  // ...................................................................
  var regex = {
      section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
      group:   /^\s*\(\s*([^\]]*)\s*\)\s*$/,
      set:     /^\s*\{\s*([^\]]*)\s*\}\s*$/,
      unit:    /^\s*\|\s*([^\]]*)\s*\|\s*$/,
      key:     /^\s*([\w\.\-\_]+)\s*=\s*"{0,1}(.*?)"{0,1}\s*$/,
      comment: /^\s*;.*$/
    }
    value   = {},
    lines   = ini.split(/\r\n|\r|\n/),
    unit    = null,
    set     = null,
    group   = null,
    section = null;
  lines.forEach(function(line){
    line = line.replace(/;.*$/g, "");
    if(line == "" || regex.comment.test(line)){
      return;
    } else if(regex.key.test(line)){
      var match = line.match(regex.key);
      if(section){
        if(group){
          if(set){
            if(unit)
              value[section][group][set][unit][match[1]] = makeNumber(match[2]);
            else
              value[section][group][set][match[1]] = makeNumber(match[2]);
          } else {
            value[section][group][match[1]] = makeNumber(match[2]);
          }
        } else {
          value[section][match[1]] = makeNumber(match[2]);
        }
      } else {
        value[match[1]] = makeNumber(match[2]);
      }
    } else if(regex.unit.test(line)){      // unit
      var match = line.match(regex.unit);
      if(section){
        if(group){
          if(set){
            value[section][group][set][match[1]] = {};
          } else {
            value[section][group][match[1]] = {};
          }
        } else {
          value[section][match[1]] = {};
        }
      } else {
        value[match[1]] = makeNumber(match[2]);
      }
      unit = match[1];
    } else if(regex.set.test(line)){      // set
      var match = line.match(regex.set);
      if(section){
        if(group){
          value[section][group][match[1]] = {};
        } else {
          value[section][match[1]] = {};
        }
      } else {
        value[match[1]] = makeNumber(match[2]);
      }
      set = match[1];
    } else if(regex.group.test(line)){    // group
      var match = line.match(regex.group);
      if(section){
        value[section][match[1]] = {};
      } else {
        value[match[1]] = makeNumber(match[2]);
      }
      group = match[1];
      unit = null;
      set = null;
    } else if(regex.section.test(line)){  // section
      var match = line.match(regex.section);
      value[match[1]] = {};
      section = match[1];
      unit = null;
      set = null;
      group = null;
    } else if(line.length == 0 && section){
      unit = null;
      set = null;
      group = null;
      section = null;
    };
  });
  makeArray(value);
  return value;
}
// #####################################################################
function obj2ini(obj, lim){
  var ini = "",
      frm = ["[%s]\n", "  (%s)\n", "    {%s}\n", "      |%s|\n", "%s = %s\n"];
  // ...................................................................
  function make_block(obj, level){
    var f = "%"+(2 * level)+"s%s = \"%s\"\n";
    for(var x in obj){
      if(!$.isPlainObject(obj[x]) && !$.isArray(obj[x])){
        if(typeof obj[x] == "boolean")
          obj[x] = obj[x] ? 1 : 0;
        if(!$.isNumeric(obj[x])){
          if(typeof obj[x] == "undefined" || obj[x] === null)
            obj[x] = "";
          obj[x] = obj[x].replace(/\n/g, "\\n").replace(/"/g, "'");
        }
        if(lim && obj[x].length > lim){
          var ix = 0,
              S  = obj[x];
          while(S.length > lim){
            if(ix)
              ini += $.sprintf(f, "", x+ix, S.substr(0, lim));
            else
              ini += $.sprintf(f, "", x, S.substr(0, lim));
            S = S.substr(lim);
            ix++;
          }
          ini += $.sprintf(f, "", x+ix, S.substr(0, lim));
        } else
          ini += $.sprintf(f, "", x, obj[x]);
      }
    }
    for(var x in obj){
      if($.isPlainObject(obj[x])){
        ini += $.sprintf(frm[level], x);
        make_block(obj[x], level + 1);
      } else if($.isArray(obj[x])){
        var f = "%"+(2 * level)+"s%s = %i\n";
        ini += $.sprintf(frm[level], x);
        ini += $.sprintf(f, "", "  length", obj[x].length);
        make_block(obj[x], level + 1);
      }
    }
  }
  // ...................................................................
  make_block($.extend({}, obj), 0);
  return ini;
}
// #####################################################################
