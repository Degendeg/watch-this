const timeline = $('.timeline');
const timelineDot = $('.timeline .dot');
const playButton = $('#play-btn');
const syncButton = $('#sync-btn');
const pauseButton = $('#pause-btn');
const searchInput = $('#search-input');
const volume = $('#volume');
const socket = io.connect();

socket.on('connectedCount', (count) => {
  $('#connected-count').html(count);
});

socket.on('pauseVideo', () => {
  player.pauseVideo();
});

socket.on('syncVideo', () => {
  player.seekTo(player.getCurrentTime())
});

socket.on('searchVideo', (videoId) => {
  player.cueVideoById(videoId);
  setTimeout(() => {
    changeVideoInformation();
    player.playVideo();
  }, 2000);
});

socket.on('playVideo', () => {
  player.playVideo();
});

socket.on('timelineClick', (timelineClick) => {
  player.seekTo(timelineClick);
});

$('.modal-close').click(() => {
  const usernameInput = $('#username-input').val();
  socket.emit('userJoin', usernameInput);
});

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

// This code loads the iframe Player API code async.
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

// This function gets called when the player is ready to go.
function onPlayerReady(event) {
  startTimelineLoop();
  changeVideoInformation();
  event.target.setVolume(20);
}

// This method gets called whenever the state of the player changes.
// If someone pressed the play button (state=1) this function will be called
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

timeline.click(function(event) {
  const offset = $(this).offset();
  const x = event.pageX - offset.left;
  const timelineClick = x * player.getDuration() / $(this).width() - 2;
  socket.emit('playerEvent', {
    'event': 'time',
    'timelineClick': timelineClick
  });
});

playButton.click((event) => {
  onPlayClicked();
});

syncButton.click((event) => {
  onSyncClicked();
});

pauseButton.click((event) => {
  onPauseClicked();
});

volume.on('input', (event) => {
  const volume = $('.volume-slider span .value').html();
  player.setVolume(volume);
});

const changeVideoInformation = () => {
  $('#video-title').text(player.getVideoData().title);
  $('#video-id').text(player.getVideoData().video_id);
}

const onPlayClicked = () => {
  socket.emit('playerEvent', {
    'event': 'play'
  });
}

const onSyncClicked = () => {
  socket.emit('playerEvent', {
    'event': 'sync'
  });
}

const onPauseClicked = () => {
  socket.emit('playerEvent', {
    'event': 'pause'
  });
}

const onSearchEntered = () => {
  socket.emit('playerEvent', {
    'event': 'search',
    'videoId': searchInput.val()
  });
}

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
