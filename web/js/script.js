/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */


var DEFAULT_JSON = { person: { } };


$(document).ready( function(){
  $("input").on("keyup", onInput);

  $.get("/durations", function(data) {
    $(data).each(function() {
      var option = $('<option>' + this.title + '</option>');
      option.attr('value', this.value);
      $('#duration').append(option);
    });
  }, 'json');

  $.get("/places", function(data) {
    $(data).each(function() {
      var option = $('<option>' + this.title + '</option>');
      option.attr('value', this.value);
      $('#places').append(option);
    });
  }, 'json');

  $.get("/authentication", function(data) {
    if(data.useAuthentication === false) {
      $('#authentication').hide();
    }
    else if(data.authenticated === true) {
      $('#login').hide();
    }
    else {
      $('#logout').hide();
      $('#adminPanel').hide();
      $('.separator').hide();
    }
  }, 'json');
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
  var userCormorant = $.extend({}, personInputs);
  var mappingJSONld = {
    'firstName': 'givenName',
    'lastName': 'familyName',
    'portraitImageUrl': 'image',
    'companyName': 'worksFor',
    'linkedInPublicUrl': 'url'
  }
  userCormorant['@type'] = 'Person';
  userCormorant['@context'] = "http://schema.org/";
  for( var index in Object.keys(personInputs) ){
    var key = Object.keys(personInputs)[index]
    if(('companyName' === key || 'companyUrl' === key)
        && !userCormorant.worksFor ){
      userCormorant.worksFor = {};
      userCormorant.worksFor['@type'] = 'Organization';
      userCormorant.worksFor['@context'] = "http://schema.org/";
    }
    userCormorant[mappingJSONld[key]] = personInputs[key];
  }
  React.render(
    React.createElement(
      cormorant.getComponent(userCormorant),
      {props: userCormorant}
    ),
    document.getElementById('cormorant')
  );
  $("#json").html(JSON.stringify(userJson, undefined, 2));
};
