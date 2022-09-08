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
This code is a modification of the angular schematics repository: https://github.com/angular/angular-cli/tree/main/packages/schematics/angular/library