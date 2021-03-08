/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    const fs = require('fs');
    const path = require("path");

    const file = path.join(__dirname, "subflow.json");
    const text = fs.readFileSync(file);
    const flow = JSON.parse(text);


    function convFlow(flow) {
        var sf = flow.shift();
        sf.flow = flow;
        return sf;
    }
    
    RED.nodes.registerSubflow(convFlow(flow));
}
