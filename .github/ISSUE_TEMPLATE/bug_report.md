---
name: Bug report
about: Problems and issues with code or docs
title: ''
labels: bug
assignees: ''

---

<!--

Welcome to spec2ts!  For a smooth issue process, try to answer the following questions.
Don't worry if they're not all applicable; just try to include what you can :-)

If you need to include code snippets or logs, please put them in fenced code
blocks.  If they're super-long, please use the details tag like
<details>
<summary>super-long log</summary>

lots of stuff
</details>

-->

<!--

IMPORTANT!!!

Please complete the next sections or the issue will be closed.
This questions are the first thing we need to know to understand the context.

-->

**spec2ts version**:

**Environment**:

- **NodeJS** (e.g. `node -v`):
- **NPM** (e.g. `npm -v`):
- **Typescript** (e.g. `npx tsc -v` or globally `tsc -v`):
- **Install tools**:
- **Others**:

**What happened**:

<!-- (please include exact error messages or misbehaved output if you can) -->

**What you expected to happen**:

<!-- What do you think went wrong? -->

**How to reproduce it**:
<!---

Make it as minimal and precise as possible. Keep in mind we do not have access to your project or application.
Help up us (if possible) reproducing the issue using a minimal Typescript setup.

## Install NodeJS and NPM

- NodeJS https://nodejs.org/en/download/package-manager/ (or using your (package manager)[https://nodejs.org/en/download/package-manager/]])
- NPM should be shipped with NodeJS (otherwise see https://www.npmjs.com/get-npm)

## Install Typescript

```sh
npm i typescript@<your-version>
# or globally
npm i -g typescript@<your-version>
```

## Install the specific spec2ts package (most often `@spec2ts/cli`) and version

```sh
npm i @spec2ts/<concerned-package>@<your-version>
# or globally
npm i -g @spec2ts/<concerned-package>@<your-version>
```

## Create a specification document or refer to a provided one (please add any additional details required to make the issue explicit)

<details>
<summary><code># packages/openapi/tests/assets/petstore.yml</code></summary>

```yml
openapi: "3.0.0"
info:
  version: 1.0.0
  title: Swagger Petstore
  license:
    name: MIT
servers:
  - url: http://petstore.swagger.io/v1
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags:
        - pets
      parameters:
        - name: limit
          in: query
          description: How many items to return at one time (max 100)
          required: false
          schema:
            type: integer
            format: int32
      responses:
        '200':
          description: A paged array of pets
          headers:
            x-next:
              description: A link to the next page of responses
              schema:
                type: string
          content:
            application/json:    
              schema:
                $ref: "#/components/schemas/Pets"
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
    post:
      summary: Create a pet
      operationId: createPets
      tags:
        - pets
      responses:
        '201':
          description: Null response
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
  /pets/{petId}:
    get:
      summary: Info for a specific pet
      operationId: showPetById
      tags:
        - pets
      parameters:
        - name: petId
          in: path
          required: true
          description: The id of the pet to retrieve
          schema:
            type: string
      responses:
        '200':
          description: Expected response to a valid request
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
        default:
          description: unexpected error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        tag:
          type: string
    Pets:
      type: array
      items:
        $ref: "#/components/schemas/Pet"
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
          format: int32
        message:
          type: string
```
</details>

## Execute the tool
```sh
npx spec2ts openapi <path/to/the/schema>
# or globally
spec2ts openapi <path/to/the/schema>
```

--->

**Anything else we need to know**:

<!-- If this is actually only about documentation, please replace the label with `documentation` -->