# Description
This schematics allow creating libraries with a name starting with @ and as much nested paths as we want (E.g. @libs/shared/project1/component1). 

It also updates tsconfig.json paths to allow importing the created library in any other library or application (The first / is conserved and others are converted into -):

```
"paths": {
      "@libs/shared-project1-component1": [
        "projects/libs/shared/project1/component1/src/public-api.ts",
      ],
    },
```
## NPM package
https://www.npmjs.com/package/custom-schematics-library

## Github repo
https://github.com/angular/angular-cli/tree/main/packages/schematics/angular/library

## Notes
The MIT License

Copyright (c) 2010-2022 Google LLC. http://angular.io/license

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.