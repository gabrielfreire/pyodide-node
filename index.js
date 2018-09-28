const pyodideNode = require('./src/PyodideNode');
async function init() {
    try {
        console.log('loading language');
        await pyodideNode.loadLanguage();
        console.log('language loaded');
        const pyodide = pyodideNode.getModule();
        pyodide.runPython(
            'a = [1, 2, 3]\n' +
            'b = [4, 5, 6]\n' +
            'print(a)\n' +
            'print(b)\n' +
            'print(a + b)\n'
        )
        
    } catch (e) {
        console.log(`error: ${e}`);
    }
}
init();