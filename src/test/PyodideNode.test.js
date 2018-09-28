var expect = require('expect.js');
var pyodideNode = require('../PyodideNode');
describe('Python', function() {
    before(async function() {
        this.timeout(10000);
        await pyodideNode.loadLanguage();
    });
    describe('Load language', function() {
        it('should have loaded the python language', async function() {
            expect(pyodideNode.getModule()).not.to.equal(null);
       
        });
        it('should define a python function and return a result', async function() {
            this.timeout(10000);
            var pyodide = pyodideNode.getModule();
            pyodide.runPython(
                'def test():\n' +
                '   a = 10\n' +
                '   b = 20\n' +
                '   return a + b\n'
            )
            var test = pyodide.pyimport('test');
            var result = test();
            var expected = 30;
            expect(result).not.to.be(undefined);
            expect(result).to.be(expected);
        });
    });
});