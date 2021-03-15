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
  var recording = false;
  
  // Start recording
  function record(){
    if (!recording) {
        recording = true;
        chrome.runtime.sendMessage({ type: "record" });
        document.querySelector('#record-button').innerHTML = 'Stop Recording';
    } else {
        recording = false;
        chrome.runtime.sendMessage({ type: "stop" });
        document.querySelector('#record-button').innerHTML = 'Start Recording';
    }
  }
  
  // Start recording
  document.querySelector('#record-button').addEventListener('click', record);
  
  // Receive messages
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.type == "loaded") {
          window.close();
      } 
      // else if (request.type == "sources") {
      //     getCamera(request.devices);
          
      //     // Allow user to start recording
      //     if (!recording) {
      //         $("#record").html(chrome.i18n.getMessage("start_recording"));
      //     }
      //     $("#record").removeClass("record-disabled");
      // } else if (request.type == "sources-audio") {
      //     getAudio(request.devices);
          
      //     // Allow user to start recording
      //     if (!recording) {
      //         $("#record").html(chrome.i18n.getMessage("start_recording"));
      //     }
      //     $("#record").removeClass("record-disabled");
      // } else if (request.type == "sources-noaccess") {
      //     $("#camera-select").html("<option value='disabled-access'>"+chrome.i18n.getMessage("disabled_allow_access")+"</option>");
      //     $("#camera-select").niceSelect('update');
      //     chrome.storage.sync.set({
      //         camera: "disabled-access"
      //     });
          
      //     // Allow user to start recording
      //     if (!recording) {
      //         $("#record").html(chrome.i18n.getMessage("start_recording"));
      //     }
      //     if ($(".type-active").attr("id") != "camera-only") {
      //         $("#record").removeClass("record-disabled");
      //     }
      // } else if (request.type == "sources-loaded") {
      //     chrome.tabs.getSelected(null, function(tab) {
      //         chrome.tabs.sendMessage(tab.id, {
      //             type: "camera-request"
      //         });
      //     });
      // } else if (request.type == "sources-audio-noaccess") {
      //     audioRequest();   
      // }
  });
});
