const timeline = $('.timeline');
const timelineDot = $('.timeline .dot');
const playButton = $('#play-btn');
const syncButton = $('#sync-btn');
const pauseButton = $('#pause-btn');
const searchInput = $('#search-input');
const volume = $('#volume');
const socket = io.connect();

// Getting information about the connected clients
// by the server.
socket.on('connectedCount', (count) => {
  $('#connected-count').html(count);
});

// Everytime a user pause the video it will pause the video
// on the client side.
socket.on('pauseVideo', () => {
  player.pauseVideo();
});

// Everytime a user syncs the video it will sync the video
// at current time the client side.
socket.on('syncVideo', () => {
  player.seekTo(player.getCurrentTime())
});

// Everytime a user search for a new video it will update the video
// for both users.
socket.on('searchVideo', (videoId) => {
  player.cueVideoById(videoId);
  setTimeout(() => {
	changeVideoInformation();
	player.playVideo();
  }, 2000);
});

// Everytime a user plays the video it will play the video
// on the client side.
socket.on('playVideo', () => {
  player.playVideo();
});

// Timeline click
socket.on('timelineClick', (timelineClick) => {
  player.seekTo(timelineClick);
});

// Check if the dialog close button is pressed and emit the username
// to the server.
$('.modal-close').click(() => {
  const usernameInput = $('#username-input').val();
  socket.emit('userJoin', usernameInput);
});

// If a user joins it will append it to the user list.
socket.on('userJoin', (username) => {
  $('#user-list').append(`
        <li class="user">
            <span class="username">
                <i class="inline-icon material-icons">person_outline</i>
                ${username}
            </span>
        </li>
    `);
});

// If a user leaves it will be removed from the user list.
socket.on('userLeave', (username) => {
  const users = document.getElementById('user-list').getElementsByClassName('username');
  for (let i = 0; i < users.length; i++) {
    const user = users[i].innerText;
    if (username === user) {
      const li = users[i].parentElement.parentElement;
      document.getElementById('user-list').removeChild(li);
    }
  }
});

// This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let player;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: 'AIbVkym1o2U',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
    playerVars: {
      'controls': 0,
      'disablekb': 1,
      'modestbranding': 0,
      'rel': 0,
      'showinfo': 0
    }
  });
}

// This method gets called when the player is ready to go.
function onPlayerReady(event) {
  startTimelineLoop();
  changeVideoInformation();
  event.target.setVolume(20);
}

// This method gets called whenever the state of the player changes.
// If someone pressed the play button (state=1) this method will be called
// and it will notify all other connected clients that the video plays.
function onPlayerStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      onPlayClicked();
      break;
    case YT.PlayerState.PAUSED:
      onPauseClicked();
      break;
  }
}

// This function will start the timeline loop.
// It will update the dot for the timeline, so that the timeline
// is accurate with the time of the video.
function startTimelineLoop() {
  setInterval(() => {
    if (player == null || timeline == null) {
      return;
    }
    const fraction = player.getCurrentTime() / player.getDuration() * 100;
    timelineDot.css("left", fraction.toString() + "%");
  });
}

// Whenever a user clicks on the timeline to jump to a position,
// the dot and the movie will jump to this position.
timeline.click(function(event) {
  const offset = $(this).offset();
  const x = event.pageX - offset.left;
  const timelineClick = x * player.getDuration() / $(this).width() - 2;
  socket.emit('playerEvent', {
    'event': 'time',
    'timelineClick': timelineClick
  });
});

// Whenever a user clicks on the play button,
// it will tell the other clients to play/resume the video.
playButton.click((event) => {
  onPlayClicked();
});

// Whenever a user clicks on the sync button,
// it will tell the other clients to sync the video.
syncButton.click((event) => {
  onSyncClicked();
});

// Whenever a user clicks on the pause button,
// it will tell the other clients to puase the video.
pauseButton.click((event) => {
  onPauseClicked();
});

volume.on('input', (event) => {
  const volume = $('.volume-slider span .value').html();
  player.setVolume(volume);
});

function changeVideoInformation() {
  $('#video-title').text(player.getVideoData().title);
  $('#video-id').text(player.getVideoData().video_id);
}

// This function is a helper function to perform everything,
// whenever the play button is clicked.
function onPlayClicked() {
  socket.emit('playerEvent', {
    'event': 'play'
  });
}

// This function is a helper function to perform everything,
// whenever the sync button is clicked.
function onSyncClicked() {
  socket.emit('playerEvent', {
    'event': 'sync'
  });
}

// This function is a helper function to perform everything,
// whenever the pause button is clicked.
function onPauseClicked() {
  socket.emit('playerEvent', {
    'event': 'pause'
  });
}

function onSearchEntered() {
  socket.emit('playerEvent', {
	'event': 'search',
	'videoId': searchInput.val()
  });
}

// Misc
$(document).ready(function() {
  $('.modal').modal();

  $('#username-dialog').modal({
    dismissible: false,
  });

  $('#username-dialog').modal('open');

  $('#username-input').on('input', function() {
    $(this).val($(this).val().replace(/[^a-z0-9]/gi, ''));
  });

  $('#search-input').keypress((e) => {
    if (e.which === 13) { // Enter
      e.preventDefault();
      if (searchInput.val().length == 0) {
        return;
	  }
	  onSearchEntered();
    }
  });
});