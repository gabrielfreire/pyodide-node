const path = require('path');
const fs = require('fs');
const fetch  = require('isomorphic-fetch');
const externalPackagesURL = 'https://iodide.io/pyodide-demo/';
const externalPyodideModuleInitializer = `${externalPackagesURL}pyodide.asm.js`;
const externalPyodideWasmURL = `${externalPackagesURL}pyodide.asm.wasm`;
const localPyodidePackagesURL = path.join(__dirname, '/assets/packages');
const localPyodideURL = path.join(__dirname, '/assets');
const packages = {
    'dateutil': [],
    'matplotlib': ['numpy', 'dateutil', 'pytz'],
    'numpy': [],
    'pandas': ['numpy', 'dateutil', 'pytz'],
    'pytz': [],
};
let loadedPackages = new Set();
class PyodideNode {
    constructor() {
        this.env = 'node';
        this._setEnvironment();
    }

    _setEnvironment() {
        if (typeof process !== 'undefined') {
            this.env = 'node';
        } else if (typeof window !== 'undefined') {
            this.env = 'browser';
        } else {
            this.env = 'none';
        }
    }
    getModule() {
        if(!process['pyodide']) throw "Pyodide wasn't loaded yet"
        return process['pyodide'];
    }
    
    loadLanguage() {
        return new Promise((resolve, reject) => {
            let self = this;
            let Module = {};
            let pyodide = {};
            self._fetch_node(path.join(localPyodideURL, '/pyodide.asm.wasm')).then((buffer) => buffer.buffer()).then(async (arrayBuffer) => { // get locally
            // self._fetch_node(externalPyodideWasmURL).then((buffer) => buffer.buffer()).then(async (arrayBuffer) => { // get externally
                // fs.writeFileSync('./PyodideNode/pyodide.asm.wasm', arrayBuffer); // save .asm.wasm file locally
                Module['noImageDecoding'] = true;
                Module['noAudioDecoding'] = true;
                Module['noWasmDecoding'] = true;
                Module['filePackagePrefixURL'] = localPyodideURL;
                Module['locateFile'] = (path) => `${localPyodideURL}/${path}`;
                Module['instantiateWasm'] = (info, receiveInstance) => {
                    WebAssembly.compile(arrayBuffer).then(async module => {
                        // add Module to the process
                        process['Module'] = Module;
                        // load pyodide.asm.data.js (python standard libraries)
                        let pckgUrl = await self._fetch_node(path.join(localPyodideURL, '/pyodide.asm.data.js'));
                        eval(pckgUrl && pckgUrl.buffer() ? pckgUrl.buffer().toString() : '');
                        return WebAssembly.instantiate(module, info)
                    })
                    .then(instance => receiveInstance(instance))
                    .catch((err) => console.log(`ERROR: ${err}`));
                    return {};
                };
                Module['global'] = global;
                Module['postRun'] = () => {
                    // remove module from the process
                    Module = null;
                    // setup pyodide and add to the process
                    pyodide['filePackagePrefixURL'] = localPyodidePackagesURL
                    pyodide['loadPackage'] = self._loadPackage;
                    pyodide['locateFile'] = (path) => `${localPyodidePackagesURL}/${path}`;
                    process['Module'] = null;
                    // pyodide._module = Module;
                    process['pyodide'] = pyodide;
                    console.log('Loaded Python');
                    resolve();
                };
                /* get module from remote location */

                // const fetchedFile = await self._fetch_node(externalPyodideModuleInitializer);
                // const buffer = await fetchedFile.buffer();
                // if(!buffer) reject('There is no buffer');

                // eval module code
                let pyodideModuleInitializer = require('./assets/pyodide.asm.js'); // local module
                // let pyodideModuleInitializer = eval(buffer.toString()); // uncomment if module is from remote location
                // load module
                pyodide = pyodideModuleInitializer(Module);
            }).catch((e) => {
                reject(e);
            });
        });
    }
    
    _loadPackage(names) {
        // DFS to find all dependencies of the requested packages
        let queue = [].concat(names || []);
        let toLoad = new Set();
        let self = this;
        while (queue.length) {
            const pckg = queue.pop();
            if (!packages.hasOwnProperty(pckg)) {
                throw `Unknown package '${pckg}'`;
            }
            if (!loadedPackages.has(pckg)) {
                toLoad.add(pckg);
                packages[pckg].forEach((subpackage) => {
                    if (!loadedPackages.has(subpackage) &&
                        !toLoad.has(subpackage)) {
                        queue.push(subpackage);
                    }
                });
            }
        }

        return new Promise((resolve, reject) => {
            console.log('Loading packages...');
            if (toLoad.size === 0) {
                resolve('No new packages to load');
            }

            process.pyodide['monitorRunDependencies'] = (n) => {
                if (n === 0) {
                    toLoad.forEach((pckg) => loadedPackages.add(pckg));
                    delete process.pyodide.monitorRunDependencies;
                    const packageList = Array.from(toLoad.keys()).join(', ');
                    console.log(`Loaded ${packageList}`);
                    resolve(`Loaded ${packageList}`);
                }
            };
            toLoad.forEach(async (pckg) => {                   
                const pckgLocalURL = path.join(localPyodidePackagesURL, `/${pckg}.js`);
                const pckgExternalURL = `${externalPackagesURL}${pckg}.js`;
                if(!fs.existsSync(pckgLocalURL)){
                    // fetch
                    const file = await self._fetch_node(pckgExternalURL);
                    if(!file) reject(`ERROR 404, package ${pckg} was not found`);
                    const buffer = await file.buffer();
                    if(!buffer) reject();
                    fs.writeFileSync(pckgLocalURL, buffer);
                }
                // load dependency
                try {
                    require(pckgLocalURL);
                } catch (e) {
                    reject (`${pckg}.js file does not support NodeJS, please write the support by hand`);
                }
            });

            // We have to invalidate Python's import caches, or it won't
            // see the new files. This is done here so it happens in parallel
            // with the fetching over the network.
            process.pyodide.runPython(
                'import importlib as _importlib\n' +
                    '_importlib.invalidate_caches()\n');
        });
    }
    
    _fetch_node(file) {
        return new Promise((resolve, reject) => {
            if(file.indexOf('http') == -1) {
                fs.readFile(file, (err, data) => err ? reject(err) : resolve({ buffer: () => data }));
            } else {
                fetch(file).then((buff) => resolve({ buffer: () => buff.buffer()}));
            }
        });
    }
}
module.exports = new PyodideNode();