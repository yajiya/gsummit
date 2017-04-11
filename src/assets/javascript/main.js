'use strict';

var api_locale = '/en-us/';
var gwc_api = 'http://apius.gwcevents.com';
var event_id = 16;
var speakers = [];
var agenda = [];

$(document).ready(function() {
  if ($('.slideshow').length) {
    var slideTime = 4000;
    var $slides = $('[data-slides]');
    var slideImgs = $slides.data('slides');
    var slideCount = slideImgs.length;
    var currentSlide = 0;

    var slideshow = function() {
      if (currentSlide >= slideCount)
        currentSlide = 0;
      $slides
        .css('background-image', 'url("' + slideImgs[currentSlide++] + '")')
        .show(0, function() {
          setTimeout(slideshow, slideTime);
        });
    };
    setTimeout(slideshow, slideTime);
  }
  if ($('.speakers').length) {
    var opt = {gmicId:event_id};

    if (location.pathname == '/') {
      opt.isMainPage = true;
    }

    $.getJSON(gwc_api + api_locale + 'speaker/getspeakerlist', opt, function (data) {
      if (data.message != "SUCCESS") {
        console.log('There was an error with the request.');
      }
      else {
        speakers = data.result.speakers;
        // returns an array of objects sorted by last name
        $.each(speakers, function(index, speaker) {
          // TODO: handle if speaker image not specified
          var $ele = $('<div>', {'class': 'small-4 medium-3 columns'})
            .append($('<div>', {'class' : 'speaker-box text-center'})
              .append($('<a>', {
                'class' : 'speaker-' + speaker.id
              })
                .append($('<img>', {
                  'src' : speaker.photo_url,
                  'alt' : speaker.name
                }))
              )
              .append($('<div>', {
                'class': 'speaker-name',
                'text' : speaker.name
              }))
              .append($('<div>', {
                'class': 'speaker-title',
                'text' : speaker.title
              }))
              .append($('<div>', {
                'class': 'speaker-company',
                'text' : speaker.company
              }))
          );
          $ele.appendTo('#speakers');
        });

        $('#speakers').on('click', 'a', function(e) {
          var id = $(this).attr('class').split('-')[1];
          var selected = {};
          clearModal();

          $.each(speakers, function(index, speaker) {
            if (speaker.id == id) {
              selected = speaker;
            }
          });

          if (selected) {
            $('#speaker-detail .photo').html($('<img>', {
              'src': selected.photo_url,
              'alt': selected.name,
              'class': 'speaker-photo'
            }));
            $('#speaker-detail .speaker-name').html(selected.name);
            $('#speaker-detail .speaker-title').html(selected.title);
            $('#speaker-detail .speaker-company').html(selected.company);
            if (selected.intro) {
              $('#speaker-detail .speaker-bio').html('<hr>' + selected.intro);
            }
            $('#speaker-detail').foundation('open');
          }
          else {
            console.log('Speaker with id ' + id + ' not found');
          }
        });

        function clearModal() {
          $('#speaker-detail .photo').html('');
          $('#speaker-detail .speaker-name').html('');
          $('#speaker-detail .speaker-title').html('');
          $('#speaker-detail .speaker-company').html('');
          $('#speaker-detail .speaker-bio').html('');
        }
      }
    });
  }
  if ($('#agenda').length) {
    var days = [];
    var opt = {
      'summitId': 2477,
      'speakerDetail': true
    };
    $.getJSON(gwc_api + api_locale + 'summit/getsummitbyid', opt, function (data) {
      if (data.message != 'SUCCESS' || data.result.length < 1) {
        console.log('Error with request, or no summit exists.');
      }
      else {
        var topics = data.result.summits[0].section_topics;
        $.each(topics, function(i, topic) {
          agenda = agenda.concat(topic.schedules);
        });
        agenda.sort(function(a,b){
          return new Date(Date.parse(a.begin_time)) - new Date(Date.parse(b.begin_time));
        });
        displayAgenda(agenda);
      }
    });
  }
  if ($('.partners').length) {
    var opt = {
      gmicId: event_id,
      attendtype: 'Partner'
    };
    var partners;
    $.getJSON(gwc_api + api_locale + 'exhibitor/GetExhibitorsList', opt, function (data) {
      if (data.Status != "SUCCESS" || data.ExhibitorList.length < 1) {
        console.log('There was an error with the request, or no partners exist.');
      }
      else {
        partners = data.ExhibitorList;
        $.each(partners, function(index, partner) {
          var $ele = $('<li>', {'class':'partner-block'});
          var $link = $('<a>').attr('href', partner.WebSite);
          var $img = $('<img>').attr({
            'src': partner.LogoUrl,
            'alt': partner.NativeName,
            'class': 'partner-logo'
          });
          $link.append($img);
          $ele.append($link);
          $('.partner-list').append($ele);
        });
      }
    });
  }
  function displayAgenda(agenda) {
    var days = [];
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var containerNum = 0;
    $.each(agenda, function(i, session) {
      var $list_item, $container, $title, $time, $description, $format, $speakers, $moderator;

      var startTime = moment.tz(session.begin_time, "America/Los_Angeles");
      var endTime = moment.tz(session.end_time, "America/Los_Angeles");

      if (days.indexOf(startTime.dayOfYear()) < 0) {
        days.push(startTime.dayOfYear());
        var $day_header = $('<h4>').append(dayOfWeek[startTime.day()] + ', ' + months[startTime.month()] + ' ' + startTime.date());
        $('#agenda').append($day_header).append(
          $('<ul>', {'class': 'agenda day-' + containerNum})
        );
        containerNum++;
      }

      $list_item = $('<li>', {'class': 'agenda-item'});
      $container = $('<div>', {'class': 'session'});
      $title = $('<span>', {'class': 'title'}).append(session.topic);
      $time = $('<span>', {'class': 'time'}).append(startTime.format('hh:mm A') + ' - ' + endTime.format('hh:mm A'));
      if (session.section_topic_id != 0) {
        $container.addClass('sub-session');
      }
      if (session.description.length) {
        $description = $('<span>', {'class': 'description'}).append(session.description);
      }
      if (session.speakers.length) {
        $speakers = $('<div>', {'class':'row small-up-2 speaker-list'}).append($('<h5>Speakers</h5>'));
        $.each(session.speakers, function(j, speaker) {
          var $speaker_block = $('<div>', {'class': 'column media-object stack-for-small clearfix'});
          var $speaker_img = $('<div>', {'class': 'media-object-section'}).append($('<img>', {
            'class': 'speaker-img float-left',
            'src' : speaker.photo_url,
            'alt' : speaker.name
          }));
          var $speaker_content = $('<div>', {'class': 'media-object-section'});
          var $speaker_name = $('<span>', {'class': 'speaker-name'}).append(speaker.name);
          if (speaker.speaker_type == 'Moderator') {
            $speaker_name.append($('<span class="moderator">(Moderator)</span>'));
          }
          var $speaker_desc = $('<span>', {'class': 'speaker-desc'}).append(speaker.title + ', ' + speaker.company);
          $speaker_content.append($speaker_name).append($speaker_desc);
          $speaker_block.append($speaker_img).append($speaker_content);
          $speakers.append($speaker_block);
        });
      }
      $container.append($title).append($time).append($format).append($description).append($speakers);
      $list_item.append($container);

      $('.agenda.day-' + (containerNum - 1)).append($list_item);
    });
  }
  $('.top-btn').click(function(e) {
    $("html, body").animate({ scrollTop: 0 }, "slow");
    e.preventDefault();
  });

  $(document).scroll(function() {
    var y = $(this).scrollTop();
    var height = window.innerHeight;
    if (y > height) {
      $('.top-btn').fadeIn();
    } else {
      $('.top-btn').fadeOut();
    }
  });
});

function initMap() {
  var office = {lat: 37.794482, lng: -122.395843};
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: office,
    scrollwheel: false
  });

  var contentString = '<div id="content">'+
      '<div id="siteNotice">'+
      '</div>'+
      '<h6>Hyatt Regency San Francisco</h6>'+
      '<div id="bodyContent">'+
      '<p>5 Embarcadero Center<br>'+
      'San Francisco, CA 94111</p>'+
      '</div>'+
      '</div>';

  var infowindow = new google.maps.InfoWindow({
    content: contentString
  });

  var marker = new google.maps.Marker({
    position: office,
    map: map,
    title: 'Hyatt Regency'
  });
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });
}
