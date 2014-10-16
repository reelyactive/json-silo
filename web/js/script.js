/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var DEFAULT_JSON = { person: { } };


$(document).ready( function(){
  $("input").on("keyup", onInput)
});


$("#json").append(JSON.stringify(DEFAULT_JSON, undefined, 2));


var onInput = function() {
  var personInputs = {};
  $.each($("form").serializeArray(), function() {
    if ((this.value !== "") && (this.name !== "place") &&
        (this.name !== "duration")) {
      personInputs[this.name] = this.value;
    }
  });

  var userJson = { person: personInputs };
  $("#json").html(JSON.stringify(userJson, undefined, 2));
};
