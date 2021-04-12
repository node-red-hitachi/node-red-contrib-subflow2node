node-red-contrib-subflow2node
=============================

Node-RED node for packageng exported subflow JSON definition to node module

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

```
npm install node-red-contrib-subflow2node
```

## Usage

`subflow2node` node is a node for creating a subflow module that can be installed from manage palette menu of Node-RED editor as described documentation page([[Packaging a Subflow as a module : Node-RED](https://nodered.org/docs/creating-nodes/subflow-modules)]).　Package generation with tools and/or Node-RED editor are being considered by core Node-RED project.  This node is intended as a substitution until then.

The subflow2node node inputs the exported SUBFLOW JSON format data and outputs the npm package.　A subflow module can be added to the palette by saving this package to a file and uploading it from the manage palette menu in the Node-RED editor.

This node provides experimental support of flow encoding discussed [here](https://github.com/node-red/designs/pull/26).  Decoding key for flow should be defined by OS environment variable `NR_FLOW_DECODE_KEY`.

***Note:*** A npm module created by this node uses APIs that require at least Node-RED 1.3.

Example
-------

Import example from `Inport/Examples/node-red-contrib-subflow2node`.

- *01 - generate package*
  
  This example use a `template` node to define subflow json data and a `file` node to write package.  
  
  

- *02 - simple Web UI*
  
  This example flow creates a HTTP end-point at http://localhost:1880/subflow2node that provides UI for subflow module generation.  Write subflow JSON data, readme in Markdown, and licence text.  Pressing send button moves to package download page.
  
  
  
  Example Sublow Definition:
  
  ```json
  [{"id":"921a4b1d.07bb68","type":"subflow","name":"QRcode","info":"","category":"","in":[{"x":140,"y":120,"wires":[{"id":"e563f491.e443f8"}]}],"out":[{"x":380,"y":120,"wires":[{"id":"e563f491.e443f8","port":0}]}],"env":[],"meta":{"module":"node-red-contrib-qrcode","type":"qrcode","version":"0.1.0","author":"hiroyasu.nishiyama.uq@hitachi.com","desc":"Node-RED node for converting string to QRcode","keywords":"Node-RED, subflow, QRcode","license":"Apache-2.0"},"color":"#87A980","icon":"font-awesome/fa-qrcode"},{"id":"e563f491.e443f8","type":"function","z":"921a4b1d.07bb68","name":"","func":"qrcode.toString(msg.payload, (err,str) => {\n    if (err) {\n        node.error(err);\n        return;\n    }\n    node.send({payload: str});\n});","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[{"var":"qrcode","module":"qrcode"}],"x":260,"y":120,"wires":[[]]}]
  ```
  
  
