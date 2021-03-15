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
  const uniqueid = "screenity-hybrid-extension";
  var arrowon = false;

  const downloadFromUrl = (url) => {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', url);
      x.responseType = 'blob';
      x.onload = function () {
        const url = URL.createObjectURL(x.response);
        
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = 'test.webm';
        a.click();
        window.URL.revokeObjectURL(url);
      };
      x.send();
    } catch (e) {
      console.log('Failed to download blobURL', e);
    }
  }
  
  injectCode(true, false);
  
  // Inject or remove all the content
  function injectCode(inject, active) {
    console.log('injectCode - content', { inject, active })
      if (inject) { 
          // Reset to start a new recording
          recording = true;
          alt = false;
          mdown = false;
          dragging = false;
          drawing = false;
          erasing = false;
          mousedown = false;
          pendown = false;
          cameraon = true;
          micon = true;
          tabaudioon = true;
          arrowon = false;
          window.arrowon = arrowon;
          texton = false;
          clickon = false;
          focuson = false;
          hideon = false;
          sliderhover = false;
          sliderhovereraser = false;
          penhover = false;
          eraserhover = false;
          
          // Extension wrapper
          var wrapper = "<div id='"+uniqueid+"' style='width: 100%;height:100%;position:absolute;'></div>";
          document.querySelector('body').insertAdjacentHTML('beforeend', wrapper);
          
          // Inject the iframe
          var iframeinject = "<div id='canvas-cont'><canvas id='canvas-draw'></canvas></div><div id='click-highlight'></div><div id='detect-iframe'><div id='hide-camera' class='camera-hidden'><img src='"+chrome.extension.getURL('./assets/images/close.svg')+"' class='noselect'></div><div id='change-size' class='camera-hidden'><div id='small-size' class='size-active choose-size'></div><div id='medium-size' class='choose-size'></div><div id='large-size' class='choose-size'></div></div></div><div id='wrap-iframe' class='notransition'><iframe src='"+chrome.extension.getURL('./html/camera.html')+"' allow='camera'></iframe></div><canvas id='canvas-freedraw' width=500 height=500></canvas><canvas id='canvas-focus' width=500 height=500></canvas>";
          document.querySelector("#"+uniqueid).insertAdjacentHTML('afterbegin', iframeinject);

          // Inject the toolbar
          var toolbarinject = "<div id='color-pckr-thing'></div><div id='pen-slider' class='toolbar-inactive'><input type='range' min=1 max=50><img class='slider-track' src='"+chrome.extension.getURL('./assets/images/slider-track.svg')+"'></div><div id='eraser-slider' class='toolbar-inactive'><input type='range' min=1 max=50><img class='slider-track' src='"+chrome.extension.getURL('./assets/images/slider-track.svg')+"'></div><iframe id='toolbar-settings' class='toolbar-inactive' src='"+chrome.extension.getURL('./html/settings.html')+"'></iframe><div id='toolbar-record-cursor' class='toolbar-inactive noselect'><div id='click-tool' class='tool' title='Highlight clicks'><img src='"+chrome.extension.getURL('./assets/images/click.svg')+"'/></div><div id='focus-tool' class='tool' title='Highlight cursor'><img src='"+chrome.extension.getURL('./assets/images/focus.svg')+"'/></div><div id='hide-cursor-tool' class='tool' title='Hide cursor when inactive'><img src='"+chrome.extension.getURL('./assets/images/hide-cursor.svg')+"'/></div></div>   <div id='toolbar-record-pen' class='toolbar-inactive noselect'><div id='pen-tool' class='tool' title='Pen tool'><img src='"+chrome.extension.getURL('./assets/images/pen.svg')+"' class=/></div><div id='eraser' class='tool' title='Eraser tool'><img src='"+chrome.extension.getURL('./assets/images/eraser.svg')+"'/></div><div id='color-pckr' class='tool' title='Change the annotation color'><div id='color-icon'></div></div><div id='text' class='tool' title='Text tool'><img src='"+chrome.extension.getURL('./assets/images/text.svg')+"'/></div><div id='arrow' class='tool' title='Arrow tool'><img src='"+chrome.extension.getURL('./assets/images/arrow.svg')+"'/></div><div id='clear' class='tool' title='Delete all annotations'><img src='"+chrome.extension.getURL('./assets/images/clear.svg')+"'/></div></div>   <div id='toolbar-record' class='toolbar-inactive noselect'><div id='pause' class='tool' title='Pause/resume recording'><img src='"+chrome.extension.getURL('./assets/images/pausewhite.svg')+"'/></div><div id='cursor' class='tool' title='Cursor settings'><img src='"+chrome.extension.getURL('./assets/images/cursor.svg')+"'/></div><div id='pen' class='tool' title='Annotation tools'><img src='"+chrome.extension.getURL('./assets/images/pen.svg')+"'/></div><div id='camera' title='Enable camera' class='tool'><img src='"+chrome.extension.getURL('./assets/images/camera.svg')+"'/></div><div id='mic' class='tool tool-active' title='Enable/disable microphone'><img src='"+chrome.extension.getURL('./assets/images/mic-off.svg')+"'/></div><div id='tab-audio' class='tool tool-active' title='Enable/disable browser audio'><img src='"+chrome.extension.getURL('./assets/images/tab-audio-off.svg')+"'/></div><div id='settings' class='tool' title='Recording settings'><img src='"+chrome.extension.getURL('./assets/images/settings.svg')+"'/></div></div>";
          document.querySelector("#"+uniqueid).insertAdjacentHTML('afterbegin', toolbarinject);
          
          getDefaults();
          
          document.querySelector("#"+uniqueid+" #camera").classList.add('camera-on')
          //drag = $("#"+uniqueid+" #wrap-iframe");
          
          // Allow CSS transitions (prevents camera from scaling on load)
          window.setTimeout(function(){
              document.querySelector(".notransition").classList.remove('notransition')
          }, 500);
          
          // Check if countdown is enabled
          if (active) {
              // $("#"+uniqueid+" #toolbar-record").css("pointer-events", "none");
              // chrome.storage.sync.get(['countdown_time'], function(result) {
              //     injectCountdown(result.countdown_time);
              // });
          } else {
              //chrome.runtime.sendMessage({type: "countdown"});
              // if (persistent) {
              //     $("#"+uniqueid+" #toolbar-record").removeClass("toolbar-inactive");
              // }
              // if (camerasize && camerapos) {
              //     cameraSize(camerasize);
              //     setCameraPos(camerapos.x, camerapos.y);
              // }
          }
          
          // Initialize canvas
          //initCanvas();
      } else {
          //$("#"+uniqueid).remove();
          Array.from(document.querySelectorAll("#"+uniqueid)).forEach(function (button) {
            button.remove();
          });
      }
  }

  if (window.location.href.includes("twitter.com") || window.location.href.includes("facebook.com") || window.location.href.includes("pinterest.com") || window.location.href.includes("reddit.com")) {
      document.body.style.height = "unset";
  }
  
  // Stop and save the recording
  function saveRecording(){
      //chrome.runtime.sendMessage({type: "stop-save"}); 
      chrome.runtime.sendMessage({action: "stopRecording"}, response => {
        console.log('Recieved URL: ', response.url);
        downloadFromUrl(response.url)
      }); 

  }
  
  // Change camera size
  // function cameraSize(id) {
  //     if (id == "small-size") {
  //         $("#"+uniqueid+" .size-active").removeClass("size-active");
  //         $("#"+uniqueid+" #small-size").addClass("size-active");
  //         $("#"+uniqueid+" #detect-iframe").css({"width": "195px", "height": "195px"});
  //         $("#"+uniqueid+" #wrap-iframe").css({"width": "195px", "height": "195px"});
  //         $("#"+uniqueid+" #hide-camera").css({"left": "7px", "top": "7px"});
  //     } else if (id == "medium-size") {
  //         $("#"+uniqueid+" .size-active").removeClass("size-active");
  //         $("#"+uniqueid+" #medium-size").addClass("size-active");
  //         $("#"+uniqueid+" #detect-iframe").css({"width": "330px", "height": "330px"});
  //         $("#"+uniqueid+" #wrap-iframe").css({"width": "330px", "height": "330px"});
  //         $("#"+uniqueid+" #hide-camera").css({"left": "27px", "top": "27px"});
  //     } else {
  //         $("#"+uniqueid+" .size-active").removeClass("size-active");
  //         $("#"+uniqueid+" #large-size").addClass("size-active");
  //         $("#"+uniqueid+" #detect-iframe").css({"width": "580px", "height": "580px"});
  //         $("#"+uniqueid+" #wrap-iframe").css({"width": "580px", "height": "580px"});
  //         $("#"+uniqueid+" #hide-camera").css({"left": "64px", "top": "64px"});
  //     }
  //     chrome.runtime.sendMessage({ type: "camera-size", size:id });
  // }
  
  // function setCameraPos(x,y) {
  //     $("#"+uniqueid+" #wrap-iframe").css("left", x,);
  //     $("#"+uniqueid+" #wrap-iframe").css("top", y);
  //     $("#"+uniqueid+" #detect-iframe").css("left", x);
  //     $("#"+uniqueid+" #detect-iframe").css("top", y);
  // }

  // Listen for popup/background/content messages
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.type == "end") {
          injectCode(false, false);
      } else if (request.type == "restart") {
          camerapos = request.camerapos;
          camerasize = request.camerasize;
          injectCode(true, request.countdown);
      }
  });
});
