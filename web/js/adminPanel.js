$(document).ready( function(){
  $.get("/users", function(users) {
    $(users).each(function(index, user) {
      var profileData = user.json.person;

      var portraitImageUrl = formatData(profileData.portraitImageUrl, 'img');
      var userID = formatData('/id/' + user._id, 'a', user._id);
      var firstName = formatData(profileData.firstName, 'text');
      var lastName = formatData(profileData.lastName, 'text');
      var companyName = formatData(profileData.companyUrl, 'a', profileData.companyName);
      var linkedInPublicUrl = formatData(profileData.linkedInPublicUrl, 'a', 'LinkedIn');
      var twitterPersonalScreenName = formatData('https://twitter.com/' + profileData.twitterPersonalScreenName, 'a', profileData.twitterPersonalScreenName);
      var deleteBtn = '<td><button class="deleteBtn" value="DELETE" id="' + user._id + '">DELETE</button>';

      $('#userTable').append('<tr id="user' + user._id + '">' + portraitImageUrl + userID + firstName + lastName + companyName + linkedInPublicUrl + twitterPersonalScreenName + deleteBtn + '</tr>');
    });

    $('.deleteBtn').click(function() {

      var userID = $(this).attr('id');

      if(confirm("Are you sure you want to delete this user?")) {
        $.delete('/id/' + userID, function() {
          $('#user' + userID).hide();
        });
      }
    });

  }, 'json');

  var formatData = function(data, type, title) { 
    var html = '<td>';

    if (!data)
      html += '-';
    else {

      switch(type) {
        case 'a':
          if (!title)
            break;

          html += '<a href="' + data + '" target="_blank">' + title + '<a>';
          break;
        case 'img':
          html += '<img src="' + data + '" width="100px"/>';
          break;
        default:
          html += data;
      }
    }

    return html + '</td>';
  };

  // Create a jquery delete request
  $.delete = function(url, callback){
   
    return $.ajax({
      url: url,
      type: 'DELETE',
      success: callback
    });
  }
});