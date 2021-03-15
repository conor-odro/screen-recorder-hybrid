var facingMode = "user";
var cameradevices = [];
var audiodevices = [];
var mediaRecorder = '';
var camerastream;
var micstream;
var output = new MediaStream();
var audioCtx;
var destination;
var micsource;
var constraints
var cancel = false;
var recording = false;
var newwindow = null;

// Inject video to contain camera stream
var htmlinject = "<video id='injected-video' style='height:100%;position:absolute;transform:translateX(-50%);left:50%;right:0;top:0;bottom:0;background-color:#3f4049' playsinline autoplay muted></video>";
document.body.innerHTML += htmlinject;
var video = document.getElementById("injected-video");

(function (){
  constraints = {
    audio: false,
    video: true
  };
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
      document.getElementById("injected-video").srcObject = stream;  
  });
})()

// Start recording stream + mic
function startRecording(){
    recording = true;
    audioCtx = new AudioContext();
    destination = audioCtx.createMediaStreamDestination();
    navigator.mediaDevices.getUserMedia({
            audio: true
    }).then(function(mic) {
        // Show recording icon
        chrome.browserAction.setIcon({path: "../assets/extension-icons/logo-32-rec.png"});
        
        // Connect the audio to a MediaStreamDestination to be able to control it without affecting the playback
        micstream = mic;
        micsource = audioCtx.createMediaStreamSource(mic);
        micsource.connect(destination);
        output.addTrack(destination.stream.getAudioTracks()[0]);
        output.addTrack(camerastream.getVideoTracks()[0]);
        mediaRecorder = new MediaRecorder(output, {
            videoBitsPerSecond: 2500000,
            mimeType: 'video/webm;codecs=h264'
        }); 
        
        // Record camera stream
        var recordedBlobs = [];
        mediaRecorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) {
              recordedBlobs.push(event.data);
            }
        };
        
        // When the recording has been stopped
        mediaRecorder.onstop = () => {
            // Show default icon
            chrome.browserAction.setIcon({path: "../assets/extension-icons/logo-32.png"});
            recording = false;
            if (!cancel) {
                newwindow = window.open('../html/videoeditor.html', "_blank");
                newwindow.recordedBlobs = recordedBlobs;
            }
            chrome.runtime.sendMessage({type: "end-camera-recording"});
            camerastream.getTracks().forEach(function(track) {
              track.stop();
            });
            micstream.getTracks().forEach(function(track) {
              track.stop();
            });
        }
        
        // Start recording
        mediaRecorder.start();
    });
}

// Change camera source
function updateCamera(id){
    if (id != "disabled") {
        constraints = {
          audio: false,
          video: {deviceId:id}
        };
        navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
            document.getElementById("injected-video").srcObject = stream;  
        });
    } else {
        constraints = {
          audio: false,
          video: true
        };
        navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
            document.getElementById("injected-video").srcObject = stream;  
        });
    }
}

// Listen for messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type == "update-camera") {
        updateCamera(request.id);
    } else if (request.type == "camera-record") {
        //startRecording();
    }
});
