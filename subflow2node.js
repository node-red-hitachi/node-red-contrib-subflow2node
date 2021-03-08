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
                    dependencies: []
                },
                dependencies: {}
            };
            fs.writeFileSync(path.join(dir, "package.json"),
                             JSON.stringify(pkg, null, "\t"));
            return pkg;
        }
        catch (e) {
            console.log(e, e.stack);
            throw "unexpected subflow JSON format";
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
        const text = (license ? license : pkg.license);
        if (license && (license !== "")) {
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

    function createJSON(dstPath, sf, key) {
        if (key) {
            const flow = sf.flow;
            sf.flow = {
                encoding: "AES",
                flow: crypt.AES.encrypt(flow, key).toString()
            };
        }
        const data = JSON.stringify(sf, null, "\t");
        fs.writeFileSync(dstPath, data);
    }
    
    function Subflow2Node(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        const name = n.name;
        const base64 = n.base64;
        console.log("; N", node);
        const key = n.encrypt ? node.credentials.encryptionKey : null;

        this.on("input", function(msg) {
            const payload = msg.payload;
            const dir = fs.mkdtempSync("/tmp/subflow_");
            const jsSrc = path.join(__dirname, "template", "subflow.js");
            const jsDst = path.join(dir, "subflow.js");
            const jsonDst = path.join(dir, "subflow.json");

            console.log("; M", msg);
            try {
                const pkg = createPackage(dir, payload);
                createReadme(dir, msg.readme, pkg);
                createLicense(dir, msg.license, pkg);
                createJSON(jsonDst, payload, key);
                fs.copyFileSync(jsSrc, jsDst);
                npmPack(dir);
                msg.payload = readTgz(dir, pkg, base64);
                node.send(msg);
            }
            catch (e) {
                node.error(e);
                console.log(e, e.stack);
            }
            finally {
                try {
                    fs.rmdirSync(dir, {
                        recursive: true
                    });
                }
                catch (e) {
                    node.error(e);
                    console.log(e, e.stack);
                }
            }
        });

        this.on("close", function() {
        });
    }

    RED.nodes.registerType("sf to node", Subflow2Node, {
        credentials: {
            encryptionKey: { type: "password" }
        }
    });
};
