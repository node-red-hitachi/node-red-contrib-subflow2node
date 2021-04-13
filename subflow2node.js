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
    "use strict";

    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const crypt = require("crypto-js");
    const childProcess = require("child_process");

    function createPackage(dir, json) {
        try {
            const sf = json[0];
            const meta = sf.meta;
            const module = meta.module;
            const type = meta.type;
            const version = meta.version;
            const author = meta.author;
            const desc = meta.desc;
            const keywords = meta.keywords.split(/ *, */).filter(x => (x !== ""));
            const license = meta.license;
            const nodes = {};
            nodes[type] = "subflow.js";
            const pkg = {
                name: module,
                version: version,
                description: desc,
                keywords: keywords,
                license: license,
                "node-red": {
                    "nodes": nodes,
                    dependencies: [
                    ]
                },
                dependencies: {
                    "crypto-js": "^4.0.0"
                }
            };
            fs.writeFileSync(path.join(dir, "package.json"),
                             JSON.stringify(pkg, null, "\t"));
            return pkg;
        }
        catch (e) {
            console.log(e, e.stack);
            throw new Error("unexpected subflow JSON format");
        }
    }

    function createReadme(dir, readme, pkg) {
        const module = pkg.name;
        const desc = pkg.desc;
        let text = readme;
        if (!readme || (readme === "")) {
            const sep = "-".repeat(module.length);
            text = `${module}
${sep}

${desc}
`;
        }
        fs.writeFileSync(path.join(dir, "README.md"), text);
    }

    function createLicense(dir, license, pkg) {
        const text = ((license && (license.text !== "")) ? license : pkg.license);
        if (text && (text !== "")) {
            fs.writeFileSync(path.join(dir, "LICENSE"), text);
        }
    }

    function npmPack(dir) {
        childProcess.execSync("npm pack", {
            cwd: dir
        });
    }

    function readTgz(dir, pkg, base64) {
        const tgzPath = path.join(dir, pkg.name +"-" +pkg.version +".tgz");
        const data = fs.readFileSync(tgzPath, {
            encoding: (base64 ? "base64": null)
        });
        return data;
    }

    function getEncoder(encoding) {
        var settings = RED.settings;
        if (settings &&
            settings.encodeSubflow &&
            settings.encodeSubflow.methods) {
            const methods = settings.encodeSubflow.methods;
            const method = methods.find((x) => (x.name === encoding));
            if (method) {
                return method.encode;
            }
        }
        if (encoding === "AES") {
            // default: AES
            return function (flow, key) {
                var data = JSON.stringify(flow);
                var enc = crypt.AES.encrypt(data, key);
                return enc.toString();
            }
        }
        throw new Error("encoding not defined:" +encoding);
    }
    
    function createJSON(dstPath, flow, encoding, key) {
        const sf = flow.shift();
        if (encoding && (encoding !== "none")) {
            const encode = getEncoder(encoding);
            const encStr = encode(flow, key);
            sf.flow = {
                encoding: encoding,
                flow: encStr
            };
        }
        else {
            sf.flow = flow;
        }
        const data = JSON.stringify(sf, null, "\t");
        fs.writeFileSync(dstPath, data);
    }
    
    function Subflow2Node(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        const name = n.name;
        const base64 = n.base64;
        const encoding = n.encoding;

        this.on("input", function(msg) {
            const payload = msg.payload;
            const tmpDir = os.tmpdir();
            const dir = fs.mkdtempSync(path.join(tmpDir, "subflow_"));
            const jsSrc = path.join(__dirname, "template", "subflow.js");
            const jsDst = path.join(dir, "subflow.js");
            const jsonDst = path.join(dir, "subflow.json");
            const enc = msg.encoding || n.encoding;
            const key = enc ? (msg.encodeKey || (node.credentials && node.credentials.encodeKey) || null): null;
            if ((enc !== "none") && (!key || (key === ""))) {
                node.error("no encoding key", msg);
                return;
            }
            try {
                const pkg = createPackage(dir, payload);
                createReadme(dir, msg.readme, pkg);
                createLicense(dir, msg.license, pkg);
                createJSON(jsonDst, payload, encoding, key);
                fs.copyFileSync(jsSrc, jsDst);
                npmPack(dir);
                msg.payload = readTgz(dir, pkg, base64);
                node.send(msg);
            }
            catch (e) {
                console.log(e, e.stack);
                node.error(e, msg);
            }
            finally {
                try {
                    fs.rmdirSync(dir, {
                        recursive: true
                    });
                }
                catch (e) {
                    console.log(e, e.stack);
                    node.error(e, msg);
                }
            }
        });

        this.on("close", function() {
        });
    }

    RED.nodes.registerType("sf to node", Subflow2Node, {
        credentials: {
            encodeKey: { type: "password" }
        }
    });

    RED.httpNode.get("/subflow2node/encodings", (req, res) => {
        var encs = [];
        var settings = RED.settings;
        if (settings &&
            settings.encodeSubflow &&
            settings.encodeSubflow.methods) {
            var methods = settings.encodeSubflow.methods;
            encs = methods.map((x) => x.name);
        }
        res.send(encs);
    });

};
