const audioCtx = new AudioContext();
const destination = audioCtx.createMediaStreamDestination();
var output = new MediaStream();
var micsource;
var syssource;
var mediaRecorder = '';
var mediaConstraints;
var micstream;
var audiodevices = [];
var cancel = false;
var recording = false;
var tabid = 0;
var maintabs = [];
var camtabs = [];
var recording_type = "tab-only";
var pushtotalk;
var newwindow = null;
var micable = true;
var width = 1920;
var height = 1080;
var quality = "max";
var camerasize = "medium-size";
var camerapos = {x:"10px", y:"10px"};
var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

function newRecording(stream) {
  // Start Media Recorder
  if (quality == "max") {
      mediaConstraints = {
          mimeType: 'video/webm;codecs=vp8,opus'
      }
  } else {
      mediaConstraints = {
          mimeType: 'video/webm;codecs=vp8,opus',
          bitsPerSecond: 1000
      }
  }
  mediaRecorder = new MediaRecorder(stream, mediaConstraints);
  injectContent(true);
}

function endRecording(stream, recordedBlobs) {  
  // Save recording if requested
  if (!cancel) {
      saveRecording(recordedBlobs);
  } 
  
  // Hide injected content
  recording = false;
  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {
          type: "end"
      });
  });

  // Stop tab and microphone streams
  stream.getTracks().forEach(function(track) {
      track.stop();
  });
  
  if (micable) {
      micstream.getTracks().forEach(function(track) {
          track.stop();
      });
  }
}

function saveRecording(recordedBlobs) {
  newwindow = window.open('../html/videoplayer.html');
  newwindow.recordedBlobs = recordedBlobs;
}

// Start recording the current tab
function getTab() {
  chrome.tabs.getSelected(null, function(tab) {
      chrome.tabCapture.capture({
          video: true,
          audio: true,
          videoConstraints: {
              mandatory: {
                  chromeMediaSource: 'tab',
                  minWidth: width,
                  minHeight: height,
                  maxWidth: width,
                  maxHeight: height,
                  maxFrameRate: 60
              },
          },
          
      }, function(stream) {
          // Combine tab and microphone audio
          output = new MediaStream();
          syssource = audioCtx.createMediaStreamSource(stream);
          if (micable) {
              micsource.connect(destination);
          }
          syssource.connect(destination);
          output.addTrack(destination.stream.getAudioTracks()[0]);
          output.addTrack(stream.getVideoTracks()[0]);
          
          // Keep playing tab audio
          let audio = new Audio();
          audio.srcObject = stream;
          audio.play();
          
          // Set up media recorder & inject content
          newRecording(output)

          // Record tab stream
          var recordedBlobs = [];
          mediaRecorder.ondataavailable = event => {
              if (event.data && event.data.size > 0) {
                  recordedBlobs.push(event.data);
              }
          };

          // When the recording is stopped
          mediaRecorder.onstop = () => {
              endRecording(stream, recordedBlobs);
          }
          
          // Stop recording if stream is ended when tab is closed
          stream.getVideoTracks()[0].onended = function() {
              mediaRecorder.stop();
          }

      });
  });
}

function record() {
  // Get window dimensions to record
  chrome.windows.getCurrent(function(window){
      width = window.width;
      height = window.height;
  })
  
  var constraints = { audio: true };
  // Start microphone stream
  navigator.mediaDevices.getUserMedia(constraints).then(function(mic) {
    micable = true;
    micstream = mic;
    micsource = audioCtx.createMediaStreamSource(mic);

    getTab();
}).catch(function(error) {
    micable = false;

    getTab();
});
}

// Inject content scripts to start recording
function startRecording() {
  //getDeviceId();
  record();
}

function stopRecording() {
  console.log('stopping')
  chrome.tabs.getSelected(null, function(tab) {
      mediaRecorder.stop();

      // Remove injected content
      chrome.tabs.sendMessage(tab.id, {
          type: "end"
      });
  });
}

// Countdown is over / recording can start
function countdownOver() {
  if (!recording) {
    mediaRecorder.start(1000);
    recording = true;
  }
}

// Inject content script
function injectContent(start) {
  chrome.tabs.getSelected(null, function(tab) {
    if (maintabs.indexOf(tab.id) == -1) {
      // Inject content if it's not a camera recording and the script hasn't been injected before in this tab
      tabid = tab.id;

      // Check if it's a new or ongoing recording
      if (start) {
          chrome.tabs.executeScript(tab.id, {
              code: 'window.countdownactive = false;window.camerasize = "' + camerasize + '";window.camerapos = {x:"'+camerapos.x+'",y:"'+camerapos.y+'"};'
          }, function() {
              chrome.tabs.executeScript(tab.id, {
                  file: './js/content.js'
              });
          });
      } else {
          chrome.tabs.executeScript(tab.id, {
              code: 'window.countdownactive = false;window.camerasize = "' + camerasize + '";window.camerapos = {x:"'+camerapos.x+'",y:"'+camerapos.y+'"};'
          }, function() {
              chrome.tabs.executeScript(tab.id, {
                  file: './js/content.js'
              });
          });
      }

      chrome.tabs.insertCSS(tab.id, {
          file: './css/content.css'
      })
      maintabs.push(tab.id);
    } else {
      // If the current tab already has the script injected
      if (start) {
          chrome.tabs.sendMessage(tab.id, {
              type: "restart",
              //countdown: result.countdown
          });
      } else {
          chrome.tabs.sendMessage(tab.id, {
              type: "restart",
              //countdown: false,
              camerapos: camerapos,
              camerasize: camerasize
          });
      }
    }
  })
}

// Listen for messages from content / popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == "record") {
        startRecording();
    } else if (request.type == "stop") {
        stopRecording();
    } else if (request.type == "countdown") {
      countdownOver();
    }
  }
);
