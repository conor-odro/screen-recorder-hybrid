function docReady(fn) {
  // see if DOM is already available
  if (document.readyState === "complete" || document.readyState === "interactive") {
      // call on next available tick
      setTimeout(fn, 1);
  } else {
      document.addEventListener("DOMContentLoaded", fn);
  }
} 

docReady(function(){
  var blobs = recordedBlobs;
  var player;
  var setup = true;
  
  // Show recorded video
  var superBuffer = new Blob(recordedBlobs, {
      type: 'video/webm'
  });
  
  // Create the src url from the blob. #t=duration is a Chrome bug workaround, as the webm generated through Media Recorder has a N/A duration in its metadata, so you can't seek the video in the player. Using Media Fragments (https://www.w3.org/TR/media-frags/#URIfragment-user-agent) and setting the duration manually in the src url fixes the issue.
  var url = window.URL.createObjectURL(superBuffer);
  document.querySelector("#video").setAttribute('src', url+"#t="+blobs.length)
  
  // Download video in different formats
  function download() {
    var superBuffer = new Blob(blobs, {
        type: 'video/mp4'
    });
    var url = window.URL.createObjectURL(superBuffer);
    chrome.downloads.download({
        url: url
    });
  }
  
  // Check when video has been loaded
  // document.querySelector("#video").addEventListener("loadedmetadata", function(){

  //     // Initialize custom video player
  //     player = new Plyr('#video', {
  //         controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'fullscreen'],
  //         ratio: '16:9'
  //     });
      
  //     // Check when player is ready
  //     player.on("canplay", function(){
  //         // First time setup
  //         if (setup) {
  //             setup = false;
  //             initRanges();
  //             player.currentTime = 0;
  //         }
          
  //     });
  // })
  
  // Download video
  $("#download").on("click", function(){
      download();
  });
});
