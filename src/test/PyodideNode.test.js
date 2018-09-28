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

        it('1. should run a python code and return the correct result', async function() {
            this.timeout(10000);
            var pyodide = pyodideNode.getModule();
            var result = pyodide.runPython(
                '[1, 2, 3]'
            )
            var expected = [1, 2, 3];
            expect(result).not.to.be(undefined);
            expect(result.length).to.be(3);
            expect(result.length).to.be(expected.length);
            expect(result[0]).to.be(expected[0]);
            expect(result[1]).to.be(expected[1]);
            expect(result[2]).to.be(expected[2]);
        });

        it('2. should run a python code and return the correct result', async function() {
            this.timeout(10000);
            var pyodide = pyodideNode.getModule();
            var result = pyodide.runPython(
                '{42: 64}'
            )
            expect(result).not.to.be(undefined);
            expect(typeof result).to.equal("object");
            expect(result[42]).to.equal(64);
        });

        it('3. should run a python code and return the correct result', async function() {
            this.timeout(10000);
            var pyodide = pyodideNode.getModule();
            var result = pyodide.runPython(
                "b\'bytes\'"
            )
            expect(result).not.to.be(undefined);
            expect(result instanceof Uint8ClampedArray).to.be(true);
            expect(result.length).to.be(5);
            expect(result[0]).to.equal(98);
        });

        it('should import numpy and perform operations', async function() {
            this.timeout(20000);
            var pyodide = pyodideNode.getModule();
            await pyodide.loadPackage('numpy');

            pyodide.runPython('import numpy as np');
            pyodide.runPython(
                'def test():\n'+
                '   a = np.array([1, 2, 3])\n' +
                '   b = np.arange(0, 100, 5)\n' +
                '   c = np.concatenate([b, a])\n' +
                '   return c.tolist()');
            const test = pyodide.pyimport('test');
            const result = test();
            const _result = new Array(...result);
            const expected = new Array(0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 1, 2, 3);

            expect(result).not.to.be(undefined);
            expect(result.constructor.name).to.equal("Array");
            expect(result.length).to.be(expected.length);
            expect(result[0]).to.equal(expected[0]);
            expect(result[1]).to.equal(expected[1]);
            expect(result[3]).to.equal(expected[3]);
            expect(result[result.length-1]).to.equal(expected[expected.length-1]);
        });
        
    });
});