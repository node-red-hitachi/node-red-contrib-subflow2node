
module.exports = function(RED) {
    var fs = require('fs');
    var path = require("path");
    var file = path.join(__dirname,"subflow.json");
    var text = fs.readFileSync(file);
    var flow = JSON.parse(text);
    if (flow.hasOwnProperty("encode")) {
        if (flow.encode == "base64") {
            console.log("; decoding base64 flow");
            var buf = new Buffer(flow.data, "base64");
            var data = buf.toString("utf8");
            flow = JSON.parse(data);
        }
    }
    RED.nodes.registerSubflow(flow);
}
