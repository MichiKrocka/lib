// #####################################################################
// Transport von Daten:
// browser  -> remote   writeBinaryRemote (REST /sto)
// remote   -> browser  readBinaryRemote  (REST /loa)
// local    -> browser  loadDataLocal
// browser  -> local    saveDataLocal
// #####################################################################
var data_trans = true;
// #####################################################################
function writeBinaryRemote(url, data, callBack, callError){
  var bytesToSend = [],
      I = data.length;
  for(var i = 0;i < I;i++)
    bytesToSend.push(data.charCodeAt(i) & 0xFF);
  var bytesArray = new Uint8Array(bytesToSend);
  $.ajax({
    url: "/sto/" + encodeURIComponent(url),
    type: 'POST',
    contentType: 'application/octet-stream',
    data: bytesArray,
    processData: false,
    success: function() {
      if(callBack)
        callBack();
    }
  })
  .fail(function(err){
    if(callError)
      callError(err);
    else
      console.error(err);
  });
}
// #####################################################################
function readBinaryRemote(url, callBack, callError){
  var content, newContent = "";
  $.ajax({
    dataType: 'text',
    mimeType: 'text/plain; charset=x-user-defined',
    url: "/loa" + url,
    async: true,
    cache: false,
    success: function (theContent) {
      for(var i = 0; i < theContent.length; i++)
        newContent += String.fromCharCode(theContent.charCodeAt(i) & 0xFF);
      if(callBack)
        callBack(newContent);
    }
  })
  .fail(function(err){
    if(callError)
      callError(err);
    else
      console.error(err);
  });
  return content;
};
// #####################################################################
// load data from local host
function loadDataLocal(callBack, readAs){
  if($("#id_FileUpload").length)
    $("#id_FileUpload")
    .off()
    .remove();
  $("body").append('<input id="id_FileUpload" type="file" style="width:0">');
  $("#id_FileUpload")
  .on("change", function(){
    $(this).off();
    var File = this.files[0];
    var R = new FileReader();
    R.onloadend = (function(theFile){
      return function(er) {
        callBack(R.result, theFile.name, theFile);
      };
    })(File);
    // readAsDataURL, readAsArrayBuffer, readAsBinaryString, readAsText
    if(readAs)
      R[readAs](File);
    else
      R.readAsText(File);
  });
  $("#id_FileUpload").click();
}
// #####################################################################
// save data to local host
// fileData - data to save
// fileName - file name
// fileType - mimetype
// msg      - text
// callBack - callback function
function saveDataLocal(fileData, fileName, fileType, msg, callBack){
  var $dialog = $('<div>')
  .html(
    (msg ? '<p>'+msg+'</p>' : '')+
    '<input type="text" name="FileSave" class="ui-corner-all" style="width:99%;border:1px solid silver" value="'+fileName+'">'+
    '<div class="ui-state-error ui-corner-all" style="display:none;padding: 0 .7em;;margin-top:5px"></div>'
  );
  $dialog
  .dialog({
    ret: false,
    width: "auto",
    title: _("Save as"),
    modal: true,
    closeOnEscape: true,
    resizable: false,
    buttons: [{
      text: _("Download"),
      click: function(){
        var V = $("input[name=FileSave]", $dialog).val();
        if(V == ""){
          $("div.ui-state-error").text(_("Filename has to be defined...")).show();
          return;
        }
        if(fileType){
          A = fileData;
        } else {
          var I = fileData.length,
              A = new Uint8Array(I);
          for(var i = 0; i < I; i++){
            A[i] = fileData.charCodeAt(i);
          }
        }
        var blob = new Blob(
          [A],
          {type: fileType ? fileType : 'text/plain; charset=x-user-defined'}
        );
        saveAs(blob, V, true);
        $(this).dialog("option", "ret", true);
        $(this).dialog("close");
      }
    },{
      text: _("Cancel"),
      click: function(){
        $(this).dialog("close");
      }
    }],
    close: function( ev, ui ){
      if(callBack)
        callBack($(this).dialog("option", "ret"));
      $(this).dialog("destroy");
    }
  });
}
// #####################################################################
