# DR. web component package toolkit
It is designed to accomplish various web frontend tasks:

- Command line tool for managing packages, symlinks, CI process.
- Node package management system
- Yaml File and TS file based configuration management system.


Main purpose is to facilitate out web teams to:
- Modularize their HTML5 + NodeJS based web and hybrid mobile app products.
- Unify, share and reuse pluggable components between different products
- Reuse a lot of predefined HTTP server with a lot of shared fundamental middlewares
- Work together on a consistent platform

Refer to the offcial doc in Chinese at [http://dr-web-house.github.io](http://dr-web-house.github.io).

## Packages
This is a monorepo which contains many tools and packages:

1. Internal packages under `src/internal`, which are installed or linked as `devDependencies` for business projects.
   
   | package | desc | state
   | - | - | -
   | ng-app-builder | Command line tool extension for Angular cli and Create-react-app
   | webpack2-builder | Webpack configuration extension in loaders and plugins for legacy React and AngularJS projects
   | templateBuilder | Webpack loaders for swig template | Obsolete
   | templateBuilder | Webpack loaders for swig template | Obsolete
   | translate-generator | i18n text tool including command line tool and Webpack loader |

2. Runtime packages under `src/runtime`, which are installed or linked as `dependencies` for business project.
   
   | package | desc | state
   | - | - | -
   | assets-processer | Serve static resource in production or develop environment while CDN is not avaible for some products, also support updating online static resource on-the-fly. Details like setting CORS and proper content cache header in response. 
   | express-app | Basic and common express.js middlewares used among all projects.
   | http-server | HTTP and HTTPS server

3. Tools `src/tools`
   
   | package | desc | state
   | - | - | -
   | e2etestHelper| end-to-end test library, should be replaced with framework specific tool like **Protractor** | Obsolete
   | http-request-proxy | A reverse HTTP proxy middleware with API mock function, should be replaced with **http-proxy-middleware** by Webpack

- `dr-comp-package/wfh` \
`drcp` command line tool for build, publish and run application or packages

```
  Command format: drcp <command> <options>                                         
drcp -h                                                           to see brief help information.
drcp help <command>                                               to see help for each command.
drcp <command> -h                                                 to see help for each command.
drcp <command> -c <config-name1> <config-name2> ...               to apply proper config yaml files to the processing command.

Commands:
  drcp init                                  Initialize workspace, generate basic configuration files for project and component
                                             packages
  drcp project [add|remove] [project-dir..]  Associate, disassociate or list associated project folders
  drcp clean [symlink]                       Clean "destDir" and symbolic links from node_modules
  drcp ls                                    If you want to know how many components will actually run, this command prints out a
                                             list and the priorities, including installed components               [aliases: list]
  drcp run <target> [package..]              Run specific exported function of specific packages one by one, in random order
  drcp tsc [package..]                       run typescript compiler
  drcp eol <dir..>                           Convert CRLF to LF from files (before "publish" to NPM registry server).
  drcp lint [package..]                      source code style check
  drcp publish [project-dir..]               npm publish every pakages in source code folder including all mapped recipes
  drcp unpublish [project-dir..]             npm unpublish every pakages in source code folder including all mapped recipes
  drcp pack [project-dir..]                  npm pack every pakage into tarball files
  drcp bump [dir..]                          bump version number of all package.json from specific directories
  drcp test [package..]                      run Jasmine for specific or all packages
  drcp completion                            Adds autocomplete functionality to commands and subcommands             [aliases: ac]

Options:
  --version   Show version number                                                                                        [boolean]
  -c          <config-name..> Read config files, if there are multiple files, the latter one overrides previous one        [array]
  --prop      <property-path>=<value as JSON | literal> ...directly set configuration properties, property name is lodash.set()
              path-like string
              e.g.
              --prop port=8080 devMode=false @dr/foobar.api=http://localhost:8080
              --prop port=8080 devMode=false @dr/foobar.api=http://localhost:8080
              --prop arraylike.prop[0]=foobar
              --prop ["@dr/foo.bar","prop",0]=true                                                                         [array]
  --help, -h  Show help                                                                                                  [boolean]

copyright 2016
```

### Design features
- A Component package (Node package) can contain both Client side code and server side code, even isomorphic code.

- Be compliant (or work with) to modern web framework's command line tools like `Angulr cli` and `create-react-app`

- Support developing library package through symlinks, manage monorepos style projects (like what Lerna, Bazel and Yarn do).
  > [monorepos](https://www.atlassian.com/git/tutorials/monorepos)

- A share environment configuration system which can be avaible 
to runtime client side (in browser), compile time server side and Node.js express http server side.

- Component package can take multiple roles:
   - tooling like Webpack plugin or Angular cli extension
   - client side business logic, server side logic
   - isomorphic logic as shared library which can be run in both sides, if it is needed.

