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
        it('should import numpy', async function() {
            // this.timeout(10000);
            // var pyodide = pyodideNode.getModule();
            // await pyodide.loadPackage('numpy');

            // pyodide.runPython('import numpy as np');
            // pyodide.runPython(
            //     'def test():\n'+
            //     '   a = np.array([1, 2, 3])\n' +
            //     '   b = np.arange(0, 100, 5)\n' +
            //     '   c = np.concatenate([b, a])\n' +
            //     '   print(a)\n' +
            //     '   print(b)\n' +
            //     '   return c.tolist()');
            // const test = pyodide.pyimport('test');
            // const concatenated = test();
            // expect(concatenated).not.to.be(undefined);

            /*
                This new compiled numpy is throwing this error:
                Error: Traceback (most recent call last):
                File "/lib/python3.7/site-packages/pyodide.py", line 35, in eval_code
                    exec(compile(mod, '<exec>', mode='exec'), ns, ns)
                File "<exec>", line 1, in <module>
                File "/lib/python3.7/site-packages/numpy/__init__.py", line 142, in <module>
                    from . import add_newdocs
                File "/lib/python3.7/site-packages/numpy/add_newdocs.py", line 13, in <module>
                    from numpy.lib import add_newdoc
                File "/lib/python3.7/site-packages/numpy/lib/__init__.py", line 8, in <module>
                    from .type_check import *
                File "/lib/python3.7/site-packages/numpy/lib/type_check.py", line 11, in <module>
                    import numpy.core.numeric as _nx
                File "/lib/python3.7/site-packages/numpy/core/__init__.py", line 16, in <module>
                    from . import multiarray
                SystemError: Type does not define the tp_name field.
            */
        });
    });
});