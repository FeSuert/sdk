// Process recaptcha input and inits SDK
export function verifyCallback(response) {
  var self = this;
  var data =
    encodeURIComponent("g-recaptcha-response") +
    "=" +
    encodeURIComponent(response);
  data +=
    "&" +
    encodeURIComponent("session-duration") +
    "=" +
    encodeURIComponent("60m");
}

export function registerInputHandlers(termName, instance) {
  var self = this;
  // Attach block actions
  var actions = document.querySelectorAll('code[class*="' + termName + '"]');

  actions.forEach((a) => {
    // The parent of <code> blocks is the whole <pre> block
    a.parentElement.addEventListener("click", function () {
      let cmd = this.innerText;
      let dataCmd = this.getAttribute("data-command-src");
      if (dataCmd) {
          cmd = atob(dataCmd);
      }
      self.socket.emit("instance terminal in", instance.name, cmd);
    });
  });

  actions = document.querySelectorAll('[data-upload-term*="' + termName + '"]');
  actions.forEach((a) => {
    var path = a.getAttribute("data-upload-path") || undefined;
    var url = a.getAttribute("data-source-url") || undefined;
    var dataSrc = a.getAttribute("data-upload-src") || undefined;

    let data, name;
    if (dataSrc) {
        let [dname, bdata] = dataSrc.split(":");
        name = dname;
        let formData = new FormData();

        // Decode base64 to ascii
        let binData = atob(bdata);
        var blob = new Blob([binData], { type: "text/plain"});
        formData.append("file", blob, name);
        data = formData;
    }

    a.addEventListener("click", function () {
        // TODO decide callback action
        self.upload(instance.name, {path, url, data, name});
    });
  });
  // Attach file uploads
}

export function registerPortHandlers(termName, instance) {
  var self = this;
  // Attach block actions
  var actions = document.querySelectorAll('[data-term*="' + termName + '"]');
  actions.forEach(function(anchor) {
    var port = anchor.getAttribute("data-port");
    var protocol = anchor.getAttribute("data-protocol") || "http:";
    
    if (port) {
      var link = protocol +
                 "//" +
                 instance.proxy_host +
                 "-" +
                 port +
                 ".direct." +
                 self.opts.baseUrl.split("/")[2] +
                 anchor.getAttribute("href");

      anchor.addEventListener("click", function (evt) {
        evt.preventDefault();
        if (link) {
          window.open(link, "_blank");
        }
      });

      anchor.addEventListener("contextmenu", function () {
        if (link) {
          this.setAttribute("href", link);
        }
      });
    }
  });
}


export function sendRequest(req, callback) {
  var request = new XMLHttpRequest();
  var asyncReq = !req.sync;
  request.open(req.method, req.url, asyncReq);

  if (req.opts && req.opts.headers) {
    for (var key in req.opts.headers) {
      request.setRequestHeader(key, req.opts.headers[key]);
    }
  }
  request.withCredentials = true;
  request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  request.onerror = function (error) {
    callback(error);
  };
  request.onload = function () {
    callback(undefined, request);
  };
  if (typeof req.data === "object" && req.data.constructor.name != "FormData") {
    request.send(JSON.stringify(req.data));
  } else {
    request.send(req.data);
  }
}
