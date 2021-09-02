"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withGlobalOptions = exports.withCwdOption = exports.CommandOverrider = exports.PlinkCommand = exports.PlinkCommandHelp = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-assignment,  @typescript-eslint/no-unsafe-return */
const commander_1 = __importDefault(require("commander"));
const package_mgr_1 = require("../package-mgr");
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
const cli_slice_1 = require("./cli-slice");
const log4js_1 = __importDefault(require("log4js"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const log = log4js_1.default.getLogger('plink.override-commander');
class PlinkCommandHelp extends commander_1.default.Help {
    subcommandTerm(cmd) {
        const str = super.subcommandTerm(cmd);
        if (cmd instanceof PlinkCommand && cmd.nameStyler) {
            return cmd.nameStyler(str);
        }
        return str;
    }
    optionTerm(option) {
        return option.optionStyler ? option.optionStyler(option.flags) : option.flags;
    }
    longestSubcommandTermLengthForReal(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
            return Math.max(max, strip_ansi_1.default(helper.subcommandTerm(command)).length);
        }, 0);
    }
    longestOptionTermLengthForReal(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
            return Math.max(max, strip_ansi_1.default(helper.optionTerm(option)).length);
        }, 0);
    }
    // subcommandDescription(cmd: commander.Command) {
    //   return stripAnsi(super.subcommandDescription(cmd));
    // }
    realPadWidth(cmd, helper) {
        return Math.max(helper.longestOptionTermLengthForReal(cmd, helper), helper.longestSubcommandTermLengthForReal(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    formatHelp(cmd, helper) {
        // const termWidth = helper.padWidth(cmd, helper); // It is bigger than actual width due to colorful character
        const realTermWidth = helper.realPadWidth(cmd, helper);
        // console.log('termWidth=', termWidth);
        const helpWidth = helper.helpWidth || 80;
        const itemIndentWidth = 2;
        const itemSeparatorWidth = 2; // between term and description
        function formatItem(term, description, styler) {
            if (description) {
                // Support colorful characters
                const fullText = `${term}${' '.repeat(realTermWidth + itemIndentWidth - strip_ansi_1.default(term).length)}${description}`;
                return helper.wrap(fullText, helpWidth - itemIndentWidth, realTermWidth + itemSeparatorWidth);
            }
            return term;
        }
        function formatList(textArray) {
            return textArray.join('\n').replace(/^/gm, ' '.repeat(itemIndentWidth));
        }
        // Usage
        const output = [`Usage: ${helper.commandUsage(cmd)}`, ''];
        // Description
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
            output.push(commandDescription, '');
        }
        // Arguments
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
            return formatItem(argument.term, argument.description);
        });
        if (argumentList.length > 0) {
            output.push('Arguments:', formatList(argumentList), '');
        }
        // Options
        const optionList = helper.visibleOptions(cmd).map((option) => {
            return formatItem(helper.optionTerm(option), helper.optionDescription(option), option.optionStyler);
        });
        if (optionList.length > 0) {
            output.push('Options:', formatList(optionList), '');
        }
        // Commands
        let pkgName = '';
        const commandList = helper.visibleCommands(cmd).map((cmd) => {
            let header = '';
            if (pkgName !== cmd.pkgName) {
                pkgName = cmd.pkgName;
                header = pkgName ? `\n${chalk_1.default.inverse(chalk_1.default.gray('Provided by package ' + pkgName + ': '))}\n` :
                    '\n';
            }
            pkgName = cmd.pkgName;
            return header + formatItem(helper.subcommandTerm(cmd), helper.subcommandDescription(cmd), cmd.nameStyler);
        });
        if (commandList.length > 0) {
            output.push('Commands:', formatList(commandList), '');
        }
        return output.join('\n');
    }
}
exports.PlinkCommandHelp = PlinkCommandHelp;
/**
 * Extend commander, check commander API at https://www.npmjs.com/package/commander
 */
class PlinkCommand extends commander_1.default.Command {
    constructor(ctx, name) {
        super(name);
        this.ctx = ctx;
        this.subCmds = [];
        /** value is file path for pkg name */
        this.loadedCmdMap = new Map();
        this.pkgName = '';
    }
    addGlobalOptionsToSubCmds() {
        if (this.subCmds == null)
            return;
        for (const subCmd of this.subCmds) {
            withGlobalOptions(subCmd);
        }
    }
    createCommand(cmdName) {
        const pk = this.ctx.currCliCreatorPkg;
        const filePath = this.ctx.currClieCreatorFile;
        if (cmdName && cmdName !== 'help') {
            if (this.loadedCmdMap.has(cmdName)) {
                if (filePath)
                    throw new Error(`Conflict command name "${cmdName}" from extensions "${filePath}" and "${this.loadedCmdMap.get(cmdName)}"`);
                else
                    throw new Error(`Conflict with existing Plink command name ${cmdName}`);
            }
            this.loadedCmdMap.set(cmdName, filePath ? filePath : '@wfh/plink');
        }
        const subCmd = new PlinkCommand(this.ctx, cmdName);
        subCmd.nameStyler = this.ctx.nameStyler;
        subCmd.pkgName = pk != null ? pk.name : '';
        this.subCmds.push(subCmd);
        // subCmd.setContextData(this.currClieCreatorFile, this.currCliCreatorPkg, this.metaMap, this);
        const meta = {
            pkgName: pk ? pk.name : '@wfh/plink',
            name: cmdName,
            options: [],
            desc: ''
        };
        this.ctx.metaMap.set(subCmd, meta);
        this.ctx.currCliPkgMataInfos.push(meta);
        // subCmd.description(meta.desc!);
        return subCmd;
    }
    description(str, argsDescription) {
        if (str !== undefined) {
            const plinkMeta = this.ctx.metaMap.get(this);
            plinkMeta.desc = str;
            if (argsDescription) {
                plinkMeta.argDesc = argsDescription;
            }
            return super.description(str, argsDescription);
        }
        return super.description();
    }
    alias(alias) {
        if (alias) {
            const plinkMeta = this.ctx.metaMap.get(this);
            plinkMeta.alias = alias;
        }
        return super.alias(alias);
    }
    createOption(flags, description, ...remaining) {
        let defaultValue;
        if (remaining.length > 1) {
            defaultValue = remaining[remaining.length - 1];
        }
        const plinkMeta = this.ctx.metaMap.get(this);
        plinkMeta.options.push({
            flags, desc: description || '', defaultValue, isRequired: false
        });
        const opt = new PlinkCmdOption(flags, description);
        opt.optionStyler = this.optionStyler;
        return opt;
    }
    option(...args) {
        this._saveOptions(false, ...args);
        return super.option(...args);
    }
    requiredOption(...args) {
        this._saveOptions(true, ...args);
        return super.requiredOption(...args);
    }
    action(fn) {
        function actionCallback() {
            try {
                const { initConfig } = require('../utils/bootstrap-process');
                initConfig(this.opts());
                return fn.apply(this, arguments);
            }
            catch (e) {
                log.error(e);
            }
        }
        return super.action(actionCallback);
    }
    createHelp() {
        return Object.assign(new PlinkCommandHelp(), this.configureHelp());
    }
    _saveOptions(isRequired, flags, desc, ...remaining) {
        let defaultValue;
        if (remaining.length > 1) {
            defaultValue = remaining[remaining.length - 1];
        }
        const plinkMeta = this.ctx.metaMap.get(this);
        plinkMeta.options.push({
            flags, desc, defaultValue, isRequired
        });
    }
}
exports.PlinkCommand = PlinkCommand;
class PlinkCmdOption extends commander_1.default.Option {
}
class CommandOverrider {
    constructor(program, ws) {
        this.program = program;
        // nameStyler: PlinkCommand['nameStyler'];
        // private currClieCreatorFile: string;
        // private currCliCreatorPkg: PackageInfo | null = null;
        // private currCliPkgMataInfos: OurCommandMetadata[];
        // private allSubCmds: OurAugmentedCommander[] = [];
        // private metaMap = new WeakMap<commander.Command, Partial<OurCommandMetadata>>();
        this.pkgMetasMap = new Map();
        this.ctx = {
            metaMap: new WeakMap()
        };
        this.program.createCommand = PlinkCommand.prototype.createCommand;
        this.program.ctx = this.ctx;
        this.program.subCmds = [];
        this.program.loadedCmdMap = new Map();
        this.program.addGlobalOptionsToSubCmds = PlinkCommand.prototype.addGlobalOptionsToSubCmds;
        this.program.createHelp = PlinkCommand.prototype.createHelp;
    }
    set nameStyler(v) {
        this.ctx.nameStyler = v;
    }
    forPackage(pk, pkgFilePath, funcName) {
        const commandMetaInfos = this.ctx.currCliPkgMataInfos = [];
        this.ctx.currCliCreatorPkg = pk;
        let filePath = null;
        if (typeof pkgFilePath === 'function') {
            pkgFilePath(this.program);
            this.pkgMetasMap.set('@wfh/plink', commandMetaInfos);
        }
        else if (pk) {
            try {
                filePath = require.resolve(pk.name + '/' + pkgFilePath);
                this.ctx.currClieCreatorFile = filePath;
                const subCmdFactory = funcName ? require(filePath)[funcName] :
                    require(filePath);
                subCmdFactory(this.program);
                this.pkgMetasMap.set(pk.name, commandMetaInfos);
            }
            catch (e) {
                // eslint-disable-next-line no-console
                log.warn(`Failed to load command line extension in package ${pk.name}: "${e.message}"`, e);
            }
            finally {
                filePath = null;
            }
        }
        this.ctx.currCliCreatorPkg = null;
    }
    appendGlobalOptions(saveToStore) {
        this.program.addGlobalOptionsToSubCmds();
        // for (const cmd of this.allSubCmds) {
        //   withGlobalOptions(cmd);
        // }
        if (!saveToStore)
            return;
        process.nextTick(() => {
            for (const [pkg, metas] of this.pkgMetasMap.entries()) {
                cli_slice_1.cliActionDispatcher.addCommandMeta({ pkg, metas });
            }
        });
    }
}
exports.CommandOverrider = CommandOverrider;
function withCwdOption(cmd) {
    return cmd.option('--cwd <working dir>', 'Run command in a different worktree directory: [' +
        [...package_mgr_1.getState().workspaces.keys()].join(', ') + ']');
}
exports.withCwdOption = withCwdOption;
function withGlobalOptions(cmd) {
    if (package_mgr_1.getState().workspaces == null)
        console.log(package_mgr_1.getState());
    withCwdOption(cmd);
    if (cmd instanceof PlinkCommand)
        cmd.optionStyler = str => chalk_1.default.gray(str);
    cmd.option('-c, --config <config-file>', 'Read config files, if there are multiple files, the latter one overrides previous one', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
        // return prev.concat(value.split(','));
    }, []);
    cmd.option('--prop <expression>', '<property path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string. e.g. ' +
        '--prop port=8080 --prop devMode=false --prop @wfh/foobar.api=http://localhost:8080 ' +
        '--prop arraylike.prop[0]=foobar ' +
        '--prop ["@wfh/foo.bar","prop",0]=true', utils_1.arrayOptionFn, [])
        .option('--verbose', 'Specify log level as "debug"', false)
        .option('--dev', 'By turning on this option,' +
        ' Plink setting property "devMode" will automatcially set to `true`,' +
        ' and process.env.NODE_ENV will also being updated to \'developement\' or \'production correspondingly. ', false)
        .option('--env <setting environment>', 'A string denotes runtime environment name, package setting file may return different values based on its value (cliOptions.env)');
    if (cmd instanceof PlinkCommand)
        cmd.optionStyler = undefined;
    return cmd;
}
exports.withGlobalOptions = withGlobalOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnJpZGUtY29tbWFuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvY21kL292ZXJyaWRlLWNvbW1hbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxrR0FBa0c7QUFDbEcsMERBQWtDO0FBQ2xDLGdEQUFxRTtBQUNyRSxrREFBMEI7QUFDMUIsbUNBQXNDO0FBR3RDLDJDQUFnRDtBQUNoRCxvREFBNEI7QUFDNUIsNERBQW1DO0FBRW5DLE1BQU0sR0FBRyxHQUFHLGdCQUFNLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFVekQsTUFBYSxnQkFBaUIsU0FBUSxtQkFBUyxDQUFDLElBQUk7SUFDbEQsY0FBYyxDQUFDLEdBQXNCO1FBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsSUFBSSxHQUFHLFlBQVksWUFBWSxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDakQsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRUQsVUFBVSxDQUFDLE1BQXNCO1FBQy9CLE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDaEYsQ0FBQztJQUVELGtDQUFrQyxDQUFDLEdBQXNCLEVBQUUsTUFBd0I7UUFDakYsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN6RCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLG9CQUFTLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMs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RyxDQUFDO0FBQ2IsQ0FBQztBQTlCRCw4Q0E4QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFzc2lnbm1lbnQsICBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLXJldHVybiAqL1xuaW1wb3J0IGNvbW1hbmRlciBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IHtXb3Jrc3BhY2VTdGF0ZSwgUGFja2FnZUluZm8sIGdldFN0YXRlfSBmcm9tICcuLi9wYWNrYWdlLW1ncic7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHthcnJheU9wdGlvbkZufSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCAqIGFzIF9ib290c3RyYXAgZnJvbSAnLi4vdXRpbHMvYm9vdHN0cmFwLXByb2Nlc3MnO1xuaW1wb3J0IHsgR2xvYmFsT3B0aW9ucywgT3VyQ29tbWFuZE1ldGFkYXRhIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2NsaUFjdGlvbkRpc3BhdGNoZXJ9IGZyb20gJy4vY2xpLXNsaWNlJztcbmltcG9ydCBsb2c0anMgZnJvbSAnbG9nNGpzJztcbmltcG9ydCBzdHJpcEFuc2kgZnJvbSAnc3RyaXAtYW5zaSc7XG5cbmNvbnN0IGxvZyA9IGxvZzRqcy5nZXRMb2dnZXIoJ3BsaW5rLm92ZXJyaWRlLWNvbW1hbmRlcicpO1xuXG5pbnRlcmZhY2UgQ29tbWFuZENvbnRleHQge1xuICBjdXJyQ2xpZUNyZWF0b3JGaWxlOiBzdHJpbmc7XG4gIGN1cnJDbGlDcmVhdG9yUGtnOiBQYWNrYWdlSW5mbyB8IG51bGw7XG4gIG1ldGFNYXA6IFdlYWtNYXA8UGxpbmtDb21tYW5kLCBQYXJ0aWFsPE91ckNvbW1hbmRNZXRhZGF0YT4+O1xuICBjdXJyQ2xpUGtnTWF0YUluZm9zOiBPdXJDb21tYW5kTWV0YWRhdGFbXTtcbiAgbmFtZVN0eWxlcj86IChjbWROYW1lOiBzdHJpbmcpID0+IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFBsaW5rQ29tbWFuZEhlbHAgZXh0ZW5kcyBjb21tYW5kZXIuSGVscCB7XG4gIHN1YmNvbW1hbmRUZXJtKGNtZDogY29tbWFuZGVyLkNvbW1hbmQpOiBzdHJpbmcge1xuICAgIGNvbnN0IHN0ciA9IHN1cGVyLnN1YmNvbW1hbmRUZXJtKGNtZCk7XG4gICAgaWYgKGNtZCBpbnN0YW5jZW9mIFBsaW5rQ29tbWFuZCAmJiBjbWQubmFtZVN0eWxlcikge1xuICAgICAgcmV0dXJuIGNtZC5uYW1lU3R5bGVyKHN0cik7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICBvcHRpb25UZXJtKG9wdGlvbjogUGxpbmtDbWRPcHRpb24pIHtcbiAgICByZXR1cm4gb3B0aW9uLm9wdGlvblN0eWxlciA/IG9wdGlvbi5vcHRpb25TdHlsZXIob3B0aW9uLmZsYWdzKSA6IG9wdGlvbi5mbGFncztcbiAgfVxuXG4gIGxvbmdlc3RTdWJjb21tYW5kVGVybUxlbmd0aEZvclJlYWwoY21kOiBjb21tYW5kZXIuQ29tbWFuZCwgaGVscGVyOiBQbGlua0NvbW1hbmRIZWxwKSB7XG4gICAgcmV0dXJuIGhlbHBlci52aXNpYmxlQ29tbWFuZHMoY21kKS5yZWR1Y2UoKG1heCwgY29tbWFuZCkgPT4ge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KG1heCwgc3RyaXBBbnNpKGhlbHBlci5zdWJjb21tYW5kVGVybShjb21tYW5kKSkubGVuZ3RoKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIGxvbmdlc3RPcHRpb25UZXJtTGVuZ3RoRm9yUmVhbChjbWQ6IGNvbW1hbmRlci5Db21tYW5kLCBoZWxwZXI6IFBsaW5rQ29tbWFuZEhlbHApIHtcbiAgICByZXR1cm4gaGVscGVyLnZpc2libGVPcHRpb25zKGNtZCkucmVkdWNlKChtYXgsIG9wdGlvbikgPT4ge1xuICAgICAgcmV0dXJuIE1hdGgubWF4KG1heCwgc3RyaXBBbnNpKGhlbHBlci5vcHRpb25UZXJtKG9wdGlvbikpLmxlbmd0aCk7XG4gICAgfSwgMCk7XG4gIH1cblxuICAvLyBzdWJjb21tYW5kRGVzY3JpcHRpb24oY21kOiBjb21tYW5kZXIuQ29tbWFuZCkge1xuICAvLyAgIHJldHVybiBzdHJpcEFuc2koc3VwZXIuc3ViY29tbWFuZERlc2NyaXB0aW9uKGNtZCkpO1xuICAvLyB9XG5cbiAgcmVhbFBhZFdpZHRoKGNtZDogY29tbWFuZGVyLkNvbW1hbmQsIGhlbHBlcjogUGxpbmtDb21tYW5kSGVscCkge1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIGhlbHBlci5sb25nZXN0T3B0aW9uVGVybUxlbmd0aEZvclJlYWwoY21kLCBoZWxwZXIpLFxuICAgICAgaGVscGVyLmxvbmdlc3RTdWJjb21tYW5kVGVybUxlbmd0aEZvclJlYWwoY21kLCBoZWxwZXIpLFxuICAgICAgaGVscGVyLmxvbmdlc3RBcmd1bWVudFRlcm1MZW5ndGgoY21kLCBoZWxwZXIpXG4gICAgKTtcbiAgfVxuXG4gIGZvcm1hdEhlbHAoY21kOiBjb21tYW5kZXIuQ29tbWFuZCwgaGVscGVyOiBQbGlua0NvbW1hbmRIZWxwKSB7XG4gICAgLy8gY29uc3QgdGVybVdpZHRoID0gaGVscGVyLnBhZFdpZHRoKGNtZCwgaGVscGVyKTsgLy8gSXQgaXMgYmlnZ2VyIHRoYW4gYWN0dWFsIHdpZHRoIGR1ZSB0byBjb2xvcmZ1bCBjaGFyYWN0ZXJcbiAgICBjb25zdCByZWFsVGVybVdpZHRoID0gaGVscGVyLnJlYWxQYWRXaWR0aChjbWQsIGhlbHBlcik7XG4gICAgLy8gY29uc29sZS5sb2coJ3Rlcm1XaWR0aD0nLCB0ZXJtV2lkdGgpO1xuICAgIGNvbnN0IGhlbHBXaWR0aCA9IGhlbHBlci5oZWxwV2lkdGggfHwgODA7XG4gICAgY29uc3QgaXRlbUluZGVudFdpZHRoID0gMjtcbiAgICBjb25zdCBpdGVtU2VwYXJhdG9yV2lkdGggPSAyOyAvLyBiZXR3ZWVuIHRlcm0gYW5kIGRlc2NyaXB0aW9uXG4gICAgZnVuY3Rpb24gZm9ybWF0SXRlbSh0ZXJtOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcsIHN0eWxlcj86IFBsaW5rQ29tbWFuZFsnbmFtZVN0eWxlciddKSB7XG4gICAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgICAgLy8gU3VwcG9ydCBjb2xvcmZ1bCBjaGFyYWN0ZXJzXG4gICAgICAgIGNvbnN0IGZ1bGxUZXh0ID0gYCR7dGVybX0keycgJy5yZXBlYXQocmVhbFRlcm1XaWR0aCArIGl0ZW1JbmRlbnRXaWR0aCAtIHN0cmlwQW5zaSh0ZXJtKS5sZW5ndGgpfSR7ZGVzY3JpcHRpb259YDtcbiAgICAgICAgcmV0dXJuIGhlbHBlci53cmFwKGZ1bGxUZXh0LCBoZWxwV2lkdGggLSBpdGVtSW5kZW50V2lkdGgsIHJlYWxUZXJtV2lkdGggKyBpdGVtU2VwYXJhdG9yV2lkdGgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRlcm07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcm1hdExpc3QodGV4dEFycmF5OiBzdHJpbmdbXSkge1xuICAgICAgcmV0dXJuIHRleHRBcnJheS5qb2luKCdcXG4nKS5yZXBsYWNlKC9eL2dtLCAnICcucmVwZWF0KGl0ZW1JbmRlbnRXaWR0aCkpO1xuICAgIH1cblxuICAgIC8vIFVzYWdlXG4gICAgY29uc3Qgb3V0cHV0ID0gW2BVc2FnZTogJHtoZWxwZXIuY29tbWFuZFVzYWdlKGNtZCl9YCwgJyddO1xuXG4gICAgLy8gRGVzY3JpcHRpb25cbiAgICBjb25zdCBjb21tYW5kRGVzY3JpcHRpb24gPSBoZWxwZXIuY29tbWFuZERlc2NyaXB0aW9uKGNtZCk7XG4gICAgaWYgKGNvbW1hbmREZXNjcmlwdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICBvdXRwdXQucHVzaChjb21tYW5kRGVzY3JpcHRpb24sICcnKTtcbiAgICB9XG5cbiAgICAvLyBBcmd1bWVudHNcbiAgICBjb25zdCBhcmd1bWVudExpc3QgPSBoZWxwZXIudmlzaWJsZUFyZ3VtZW50cyhjbWQpLm1hcCgoYXJndW1lbnQpID0+IHtcbiAgICAgIHJldHVybiBmb3JtYXRJdGVtKGFyZ3VtZW50LnRlcm0sIGFyZ3VtZW50LmRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgICBpZiAoYXJndW1lbnRMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIG91dHB1dC5wdXNoKCdBcmd1bWVudHM6JywgZm9ybWF0TGlzdChhcmd1bWVudExpc3QpLCAnJyk7XG4gICAgfVxuXG4gICAgLy8gT3B0aW9uc1xuICAgIGNvbnN0IG9wdGlvbkxpc3QgPSBoZWxwZXIudmlzaWJsZU9wdGlvbnMoY21kKS5tYXAoKG9wdGlvbikgPT4ge1xuICAgICAgcmV0dXJuIGZvcm1hdEl0ZW0oaGVscGVyLm9wdGlvblRlcm0ob3B0aW9uKSwgaGVscGVyLm9wdGlvbkRlc2NyaXB0aW9uKG9wdGlvbiksXG4gICAgICAgIChvcHRpb24gYXMgUGxpbmtDbWRPcHRpb24pLm9wdGlvblN0eWxlcik7XG4gICAgfSk7XG4gICAgaWYgKG9wdGlvbkxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgb3V0cHV0LnB1c2goJ09wdGlvbnM6JywgZm9ybWF0TGlzdChvcHRpb25MaXN0KSwgJycpO1xuICAgIH1cblxuICAgIC8vIENvbW1hbmRzXG4gICAgbGV0IHBrZ05hbWUgPSAnJztcbiAgICBjb25zdCBjb21tYW5kTGlzdCA9IGhlbHBlci52aXNpYmxlQ29tbWFuZHMoY21kKS5tYXAoKGNtZCkgPT4ge1xuICAgICAgbGV0IGhlYWRlciA9ICcnO1xuICAgICAgaWYgKHBrZ05hbWUgIT09IChjbWQgYXMgUGxpbmtDb21tYW5kKS5wa2dOYW1lKSB7XG4gICAgICAgIHBrZ05hbWUgPSAoY21kIGFzIFBsaW5rQ29tbWFuZCkucGtnTmFtZTtcbiAgICAgICAgaGVhZGVyID0gcGtnTmFtZSA/IGBcXG4ke2NoYWxrLmludmVyc2UoY2hhbGsuZ3JheSgnUHJvdmlkZWQgYnkgcGFja2FnZSAnICsgcGtnTmFtZSArICc6ICcpKX1cXG5gIDpcbiAgICAgICAgICAnXFxuJztcbiAgICAgIH1cbiAgICAgIHBrZ05hbWUgPSAoY21kIGFzIFBsaW5rQ29tbWFuZCkucGtnTmFtZTtcbiAgICAgIHJldHVybiBoZWFkZXIgKyBmb3JtYXRJdGVtKGhlbHBlci5zdWJjb21tYW5kVGVybShjbWQpLCBoZWxwZXIuc3ViY29tbWFuZERlc2NyaXB0aW9uKGNtZCksXG4gICAgICAgIChjbWQgYXMgUGxpbmtDb21tYW5kKS5uYW1lU3R5bGVyKTtcbiAgICB9KTtcbiAgICBpZiAoY29tbWFuZExpc3QubGVuZ3RoID4gMCkge1xuICAgICAgb3V0cHV0LnB1c2goJ0NvbW1hbmRzOicsIGZvcm1hdExpc3QoY29tbWFuZExpc3QpLCAnJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dC5qb2luKCdcXG4nKTtcbiAgfVxuXG4gIC8vIHdyYXAoc3RyOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIsIGluZGVudDogbnVtYmVyLCBtaW5Db2x1bW5XaWR0aCA9IDQwKSB7XG4gIC8vICAgLy8gRGV0ZWN0IG1hbnVhbGx5IHdyYXBwZWQgYW5kIGluZGVudGVkIHN0cmluZ3MgYnkgc2VhcmNoaW5nIGZvciBsaW5lIGJyZWFrc1xuICAvLyAgIC8vIGZvbGxvd2VkIGJ5IG11bHRpcGxlIHNwYWNlcy90YWJzLlxuICAvLyAgIGlmIChzdHIubWF0Y2goL1tcXG5dXFxzKy8pKSByZXR1cm4gc3RyO1xuICAvLyAgIC8vIERvIG5vdCB3cmFwIGlmIG5vdCBlbm91Z2ggcm9vbSBmb3IgYSB3cmFwcGVkIGNvbHVtbiBvZiB0ZXh0IChhcyBjb3VsZCBlbmQgdXAgd2l0aCBhIHdvcmQgcGVyIGxpbmUpLlxuICAvLyAgIGNvbnN0IGNvbHVtbldpZHRoID0gd2lkdGggLSBpbmRlbnQ7XG4gIC8vICAgaWYgKGNvbHVtbldpZHRoIDwgbWluQ29sdW1uV2lkdGgpIHJldHVybiBzdHI7XG5cbiAgLy8gICBjb25zdCBsZWFkaW5nU3RyID0gc3RyLnN1YnN0cigwLCBpbmRlbnQpO1xuICAvLyAgIGNvbnN0IGNvbHVtblRleHQgPSBzdHIuc3Vic3RyKGluZGVudCk7XG5cbiAgLy8gICBjb25zdCBpbmRlbnRTdHJpbmcgPSAnICcucmVwZWF0KGluZGVudCk7XG4gIC8vICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKCcuezEsJyArIChjb2x1bW5XaWR0aCAtIDEpICsgJ30oW1xcXFxzXFx1MjAwQl18JCl8W15cXFxcc1xcdTIwMEJdKz8oW1xcXFxzXFx1MjAwQl18JCknLCAnZycpO1xuXG4gIC8vICAgY29uc3QgbGluZXMgPSBjb2x1bW5UZXh0Lm1hdGNoKHJlZ2V4KSB8fCBbXTtcbiAgLy8gICByZXR1cm4gbGVhZGluZ1N0ciArIGxpbmVzLm1hcCgobGluZSwgaSkgPT4ge1xuICAvLyAgICAgaWYgKGxpbmUuc2xpY2UoLTEpID09PSAnXFxuJykge1xuICAvLyAgICAgICBsaW5lID0gbGluZS5zbGljZSgwLCBsaW5lLmxlbmd0aCAtIDEpO1xuICAvLyAgICAgfVxuICAvLyAgICAgcmV0dXJuICgoaSA+IDApID8gaW5kZW50U3RyaW5nIDogJycpICsgbGluZS50cmltUmlnaHQoKTtcbiAgLy8gICB9KS5qb2luKCdcXG4nKTtcbiAgLy8gfVxufVxuLyoqXG4gKiBFeHRlbmQgY29tbWFuZGVyLCBjaGVjayBjb21tYW5kZXIgQVBJIGF0IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2NvbW1hbmRlclxuICovXG5leHBvcnQgY2xhc3MgUGxpbmtDb21tYW5kIGV4dGVuZHMgY29tbWFuZGVyLkNvbW1hbmQge1xuICBuYW1lU3R5bGVyPzogKGNtZE5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xuICBvcHRpb25TdHlsZXI/OiAoY21kTmFtZTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIHN1YkNtZHM6IFBsaW5rQ29tbWFuZFtdID0gW107XG4gIC8qKiB2YWx1ZSBpcyBmaWxlIHBhdGggZm9yIHBrZyBuYW1lICovXG4gIGxvYWRlZENtZE1hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIHBrZ05hbWUgPSAnJztcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgY3R4OiBDb21tYW5kQ29udGV4dCwgbmFtZT86IHN0cmluZykge1xuICAgIHN1cGVyKG5hbWUpO1xuICB9XG5cbiAgYWRkR2xvYmFsT3B0aW9uc1RvU3ViQ21kcygpIHtcbiAgICBpZiAodGhpcy5zdWJDbWRzID09IG51bGwpXG4gICAgICByZXR1cm47XG4gICAgZm9yIChjb25zdCBzdWJDbWQgb2YgdGhpcy5zdWJDbWRzKSB7XG4gICAgICB3aXRoR2xvYmFsT3B0aW9ucyhzdWJDbWQpO1xuICAgIH1cbiAgfVxuXG4gIGNyZWF0ZUNvbW1hbmQoY21kTmFtZT86IHN0cmluZyk6IGNvbW1hbmRlci5Db21tYW5kIHtcbiAgICBjb25zdCBwayA9IHRoaXMuY3R4LmN1cnJDbGlDcmVhdG9yUGtnO1xuICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5jdHguY3VyckNsaWVDcmVhdG9yRmlsZTtcbiAgICBpZiAoY21kTmFtZSAmJiBjbWROYW1lICE9PSAnaGVscCcpIHtcbiAgICAgIGlmICh0aGlzLmxvYWRlZENtZE1hcC5oYXMoY21kTmFtZSkpIHtcbiAgICAgICAgaWYgKGZpbGVQYXRoKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29uZmxpY3QgY29tbWFuZCBuYW1lIFwiJHtjbWROYW1lfVwiIGZyb20gZXh0ZW5zaW9ucyBcIiR7ZmlsZVBhdGh9XCIgYW5kIFwiJHt0aGlzLmxvYWRlZENtZE1hcC5nZXQoY21kTmFtZSkhfVwiYCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmZsaWN0IHdpdGggZXhpc3RpbmcgUGxpbmsgY29tbWFuZCBuYW1lICR7Y21kTmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubG9hZGVkQ21kTWFwLnNldChjbWROYW1lLCBmaWxlUGF0aCA/IGZpbGVQYXRoIDogJ0B3ZmgvcGxpbmsnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzdWJDbWQgPSBuZXcgUGxpbmtDb21tYW5kKHRoaXMuY3R4LCBjbWROYW1lKTtcbiAgICBzdWJDbWQubmFtZVN0eWxlciA9IHRoaXMuY3R4Lm5hbWVTdHlsZXI7XG4gICAgc3ViQ21kLnBrZ05hbWUgPSBwayAhPSBudWxsID8gcGsubmFtZSA6ICcnO1xuICAgIHRoaXMuc3ViQ21kcy5wdXNoKHN1YkNtZCk7XG5cbiAgICAvLyBzdWJDbWQuc2V0Q29udGV4dERhdGEodGhpcy5jdXJyQ2xpZUNyZWF0b3JGaWxlLCB0aGlzLmN1cnJDbGlDcmVhdG9yUGtnLCB0aGlzLm1ldGFNYXAsIHRoaXMpO1xuXG4gICAgY29uc3QgbWV0YTogUGFydGlhbDxPdXJDb21tYW5kTWV0YWRhdGE+ID0ge1xuICAgICAgcGtnTmFtZTogcGsgPyBway5uYW1lIDogJ0B3ZmgvcGxpbmsnLFxuICAgICAgbmFtZTogY21kTmFtZSxcbiAgICAgIG9wdGlvbnM6IFtdLFxuICAgICAgZGVzYzogJydcbiAgICB9O1xuICAgIHRoaXMuY3R4Lm1ldGFNYXAuc2V0KHN1YkNtZCwgbWV0YSk7XG4gICAgdGhpcy5jdHguY3VyckNsaVBrZ01hdGFJbmZvcy5wdXNoKG1ldGEgYXMgT3VyQ29tbWFuZE1ldGFkYXRhKTtcbiAgICAvLyBzdWJDbWQuZGVzY3JpcHRpb24obWV0YS5kZXNjISk7XG4gICAgcmV0dXJuIHN1YkNtZDtcbiAgfVxuXG4gIGRlc2NyaXB0aW9uKHN0cj86IHN0cmluZyxcbiAgICBhcmdzRGVzY3JpcHRpb24/OiB7IFthcmdOYW1lOiBzdHJpbmddOiBzdHJpbmc7IH0pIHtcbiAgICBpZiAoc3RyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHBsaW5rTWV0YSA9IHRoaXMuY3R4Lm1ldGFNYXAuZ2V0KHRoaXMpITtcbiAgICAgIHBsaW5rTWV0YS5kZXNjID0gc3RyO1xuICAgICAgaWYgKGFyZ3NEZXNjcmlwdGlvbikge1xuICAgICAgICBwbGlua01ldGEuYXJnRGVzYyA9IGFyZ3NEZXNjcmlwdGlvbjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdXBlci5kZXNjcmlwdGlvbihzdHIsIGFyZ3NEZXNjcmlwdGlvbik7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5kZXNjcmlwdGlvbigpIGFzIGFueTtcbiAgfVxuXG4gIGFsaWFzKGFsaWFzPzogc3RyaW5nKSB7XG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICBjb25zdCBwbGlua01ldGEgPSB0aGlzLmN0eC5tZXRhTWFwLmdldCh0aGlzKSE7XG4gICAgICBwbGlua01ldGEuYWxpYXMgPSBhbGlhcztcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLmFsaWFzKGFsaWFzIGFzIGFueSkgYXMgYW55O1xuICB9XG5cbiAgY3JlYXRlT3B0aW9uKGZsYWdzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nLCAuLi5yZW1haW5pbmc6IGFueVtdKSB7XG4gICAgbGV0IGRlZmF1bHRWYWx1ZTogYW55O1xuICAgIGlmIChyZW1haW5pbmcubGVuZ3RoID4gMSkge1xuICAgICAgZGVmYXVsdFZhbHVlID0gcmVtYWluaW5nW3JlbWFpbmluZy5sZW5ndGggLSAxXTtcbiAgICB9XG4gICAgY29uc3QgcGxpbmtNZXRhID0gdGhpcy5jdHgubWV0YU1hcC5nZXQodGhpcykhO1xuICAgIHBsaW5rTWV0YS5vcHRpb25zIS5wdXNoKHtcbiAgICAgIGZsYWdzLCBkZXNjOiBkZXNjcmlwdGlvbiB8fCAnJywgZGVmYXVsdFZhbHVlLCBpc1JlcXVpcmVkOiBmYWxzZVxuICAgIH0pO1xuICAgIGNvbnN0IG9wdCA9IG5ldyBQbGlua0NtZE9wdGlvbihmbGFncywgZGVzY3JpcHRpb24pO1xuICAgIG9wdC5vcHRpb25TdHlsZXIgPSB0aGlzLm9wdGlvblN0eWxlcjtcbiAgICByZXR1cm4gb3B0O1xuICB9XG4gIG9wdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICh0aGlzLl9zYXZlT3B0aW9ucyBhcyBhbnkpKGZhbHNlLCAuLi5hcmdzKTtcbiAgICByZXR1cm4gKHN1cGVyLm9wdGlvbiBhcyBhbnkpKC4uLmFyZ3MpO1xuICB9XG4gIHJlcXVpcmVkT3B0aW9uKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgKHRoaXMuX3NhdmVPcHRpb25zIGFzIGFueSkodHJ1ZSwgLi4uYXJncyk7XG4gICAgcmV0dXJuIChzdXBlci5yZXF1aXJlZE9wdGlvbiBhcyBhbnkpKC4uLmFyZ3MpO1xuICB9XG4gIGFjdGlvbihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPikge1xuICAgIGZ1bmN0aW9uIGFjdGlvbkNhbGxiYWNrKHRoaXM6IGNvbW1hbmRlci5Db21tYW5kKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7aW5pdENvbmZpZ30gPSByZXF1aXJlKCcuLi91dGlscy9ib290c3RyYXAtcHJvY2VzcycpIGFzIHR5cGVvZiBfYm9vdHN0cmFwO1xuICAgICAgICBpbml0Q29uZmlnKHRoaXMub3B0cygpIGFzIEdsb2JhbE9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgbG9nLmVycm9yKGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3VwZXIuYWN0aW9uKGFjdGlvbkNhbGxiYWNrKTtcbiAgfVxuICBjcmVhdGVIZWxwKCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKG5ldyBQbGlua0NvbW1hbmRIZWxwKCksIHRoaXMuY29uZmlndXJlSGVscCgpKTtcbiAgfVxuICBfc2F2ZU9wdGlvbnMoaXNSZXF1aXJlZDogYm9vbGVhbiwgZmxhZ3M6IHN0cmluZywgZGVzYzogc3RyaW5nLCAuLi5yZW1haW5pbmc6IGFueVtdKSB7XG4gICAgbGV0IGRlZmF1bHRWYWx1ZTogYW55O1xuICAgIGlmIChyZW1haW5pbmcubGVuZ3RoID4gMSkge1xuICAgICAgZGVmYXVsdFZhbHVlID0gcmVtYWluaW5nW3JlbWFpbmluZy5sZW5ndGggLSAxXTtcbiAgICB9XG4gICAgY29uc3QgcGxpbmtNZXRhID0gdGhpcy5jdHgubWV0YU1hcC5nZXQodGhpcykhO1xuICAgIHBsaW5rTWV0YS5vcHRpb25zIS5wdXNoKHtcbiAgICAgIGZsYWdzLCBkZXNjLCBkZWZhdWx0VmFsdWUsIGlzUmVxdWlyZWRcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBDbGlFeHRlbnNpb24gPSAocHJvZ3JhbTogY29tbWFuZGVyLkNvbW1hbmQpID0+IHZvaWQ7XG5cbmNsYXNzIFBsaW5rQ21kT3B0aW9uIGV4dGVuZHMgY29tbWFuZGVyLk9wdGlvbiB7XG4gIG9wdGlvblN0eWxlcj86IChjbWROYW1lOiBzdHJpbmcpID0+IHN0cmluZztcbn1cbmV4cG9ydCBjbGFzcyBDb21tYW5kT3ZlcnJpZGVyIHtcbiAgLy8gbmFtZVN0eWxlcjogUGxpbmtDb21tYW5kWyduYW1lU3R5bGVyJ107XG4gIC8vIHByaXZhdGUgY3VyckNsaWVDcmVhdG9yRmlsZTogc3RyaW5nO1xuICAvLyBwcml2YXRlIGN1cnJDbGlDcmVhdG9yUGtnOiBQYWNrYWdlSW5mbyB8IG51bGwgPSBudWxsO1xuICAvLyBwcml2YXRlIGN1cnJDbGlQa2dNYXRhSW5mb3M6IE91ckNvbW1hbmRNZXRhZGF0YVtdO1xuICAvLyBwcml2YXRlIGFsbFN1YkNtZHM6IE91ckF1Z21lbnRlZENvbW1hbmRlcltdID0gW107XG4gIC8vIHByaXZhdGUgbWV0YU1hcCA9IG5ldyBXZWFrTWFwPGNvbW1hbmRlci5Db21tYW5kLCBQYXJ0aWFsPE91ckNvbW1hbmRNZXRhZGF0YT4+KCk7XG4gIHByaXZhdGUgcGtnTWV0YXNNYXAgPSBuZXcgTWFwPHN0cmluZywgT3VyQ29tbWFuZE1ldGFkYXRhW10+KCk7XG4gIHByaXZhdGUgY3R4OiBQYXJ0aWFsPENvbW1hbmRDb250ZXh0PiA9IHtcbiAgICBtZXRhTWFwOiBuZXcgV2Vha01hcDxjb21tYW5kZXIuQ29tbWFuZCwgUGFydGlhbDxPdXJDb21tYW5kTWV0YWRhdGE+PigpXG4gIH07XG5cbiAgc2V0IG5hbWVTdHlsZXIodjogUGxpbmtDb21tYW5kWyduYW1lU3R5bGVyJ10pIHtcbiAgICB0aGlzLmN0eC5uYW1lU3R5bGVyID0gdjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvZ3JhbTogY29tbWFuZGVyLkNvbW1hbmQsIHdzPzogV29ya3NwYWNlU3RhdGUpIHtcbiAgICB0aGlzLnByb2dyYW0uY3JlYXRlQ29tbWFuZCA9IFBsaW5rQ29tbWFuZC5wcm90b3R5cGUuY3JlYXRlQ29tbWFuZDtcblxuICAgICh0aGlzLnByb2dyYW0gYXMgUGxpbmtDb21tYW5kKS5jdHggPSB0aGlzLmN0eCBhcyBDb21tYW5kQ29udGV4dDtcbiAgICAodGhpcy5wcm9ncmFtIGFzIFBsaW5rQ29tbWFuZCkuc3ViQ21kcyA9IFtdO1xuICAgICh0aGlzLnByb2dyYW0gYXMgUGxpbmtDb21tYW5kKS5sb2FkZWRDbWRNYXAgPSBuZXcgTWFwKCk7XG4gICAgKHRoaXMucHJvZ3JhbSBhcyBQbGlua0NvbW1hbmQpLmFkZEdsb2JhbE9wdGlvbnNUb1N1YkNtZHMgPSBQbGlua0NvbW1hbmQucHJvdG90eXBlLmFkZEdsb2JhbE9wdGlvbnNUb1N1YkNtZHM7XG4gICAgdGhpcy5wcm9ncmFtLmNyZWF0ZUhlbHAgPSBQbGlua0NvbW1hbmQucHJvdG90eXBlLmNyZWF0ZUhlbHA7XG4gIH1cblxuICBmb3JQYWNrYWdlKHBrOiBQYWNrYWdlSW5mbywgcGtnRmlsZVBhdGg6IHN0cmluZywgZnVuY05hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIGZvclBhY2thZ2UocGs6IG51bGwsIGNvbW1hbmRDcmVhdGlvbjogKHByb2dyYW06IGNvbW1hbmRlci5Db21tYW5kKSA9PiB2b2lkKTogdm9pZDtcbiAgZm9yUGFja2FnZShwazogUGFja2FnZUluZm8gfCBudWxsLFxuICAgIHBrZ0ZpbGVQYXRoOiBzdHJpbmcgfCAoKHByb2dyYW06IGNvbW1hbmRlci5Db21tYW5kKSA9PiB2b2lkKSxcbiAgICBmdW5jTmFtZT86IHN0cmluZykge1xuICAgIGNvbnN0IGNvbW1hbmRNZXRhSW5mb3M6IE91ckNvbW1hbmRNZXRhZGF0YVtdID0gdGhpcy5jdHguY3VyckNsaVBrZ01hdGFJbmZvcyA9IFtdO1xuICAgIHRoaXMuY3R4LmN1cnJDbGlDcmVhdG9yUGtnID0gcGs7XG5cbiAgICBsZXQgZmlsZVBhdGg6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHR5cGVvZiBwa2dGaWxlUGF0aCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcGtnRmlsZVBhdGgodGhpcy5wcm9ncmFtKTtcbiAgICAgIHRoaXMucGtnTWV0YXNNYXAuc2V0KCdAd2ZoL3BsaW5rJywgY29tbWFuZE1ldGFJbmZvcyk7XG4gICAgfSBlbHNlIGlmIChwaykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZmlsZVBhdGggPSByZXF1aXJlLnJlc29sdmUocGsubmFtZSArICcvJyArIHBrZ0ZpbGVQYXRoKTtcbiAgICAgICAgdGhpcy5jdHguY3VyckNsaWVDcmVhdG9yRmlsZSA9IGZpbGVQYXRoO1xuICAgICAgICBjb25zdCBzdWJDbWRGYWN0b3J5OiBDbGlFeHRlbnNpb24gPSBmdW5jTmFtZSA/IHJlcXVpcmUoZmlsZVBhdGgpW2Z1bmNOYW1lXSA6XG4gICAgICAgICAgcmVxdWlyZShmaWxlUGF0aCk7XG4gICAgICAgIHN1YkNtZEZhY3RvcnkodGhpcy5wcm9ncmFtIGFzIFBsaW5rQ29tbWFuZCk7XG4gICAgICAgIHRoaXMucGtnTWV0YXNNYXAuc2V0KHBrLm5hbWUsIGNvbW1hbmRNZXRhSW5mb3MpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICBsb2cud2FybihgRmFpbGVkIHRvIGxvYWQgY29tbWFuZCBsaW5lIGV4dGVuc2lvbiBpbiBwYWNrYWdlICR7cGsubmFtZX06IFwiJHtlLm1lc3NhZ2UgYXMgc3RyaW5nfVwiYCwgZSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBmaWxlUGF0aCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY3R4LmN1cnJDbGlDcmVhdG9yUGtnID0gbnVsbDtcbiAgfVxuXG4gIGFwcGVuZEdsb2JhbE9wdGlvbnMoc2F2ZVRvU3RvcmU6IGJvb2xlYW4pIHtcbiAgICAodGhpcy5wcm9ncmFtIGFzIFBsaW5rQ29tbWFuZCkuYWRkR2xvYmFsT3B0aW9uc1RvU3ViQ21kcygpO1xuICAgIC8vIGZvciAoY29uc3QgY21kIG9mIHRoaXMuYWxsU3ViQ21kcykge1xuICAgIC8vICAgd2l0aEdsb2JhbE9wdGlvbnMoY21kKTtcbiAgICAvLyB9XG4gICAgaWYgKCFzYXZlVG9TdG9yZSlcbiAgICAgIHJldHVybjtcbiAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgW3BrZywgbWV0YXNdIG9mIHRoaXMucGtnTWV0YXNNYXAuZW50cmllcygpKSB7XG4gICAgICAgIGNsaUFjdGlvbkRpc3BhdGNoZXIuYWRkQ29tbWFuZE1ldGEoe3BrZywgbWV0YXN9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd2l0aEN3ZE9wdGlvbihjbWQ6IGNvbW1hbmRlci5Db21tYW5kKTogY29tbWFuZGVyLkNvbW1hbmQge1xuICByZXR1cm4gY21kLm9wdGlvbignLS1jd2QgPHdvcmtpbmcgZGlyPicsICdSdW4gY29tbWFuZCBpbiBhIGRpZmZlcmVudCB3b3JrdHJlZSBkaXJlY3Rvcnk6IFsnICtcbiAgICBbLi4uZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmtleXMoKV0uam9pbignLCAnKSArICddJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3aXRoR2xvYmFsT3B0aW9ucyhjbWQ6IGNvbW1hbmRlci5Db21tYW5kIHwgUGxpbmtDb21tYW5kKTogY29tbWFuZGVyLkNvbW1hbmQge1xuICBpZiAoZ2V0U3RhdGUoKS53b3Jrc3BhY2VzID09IG51bGwpXG4gICAgY29uc29sZS5sb2coZ2V0U3RhdGUoKSk7XG4gIHdpdGhDd2RPcHRpb24oY21kKTtcblxuICBpZiAoY21kIGluc3RhbmNlb2YgUGxpbmtDb21tYW5kKVxuICAgIGNtZC5vcHRpb25TdHlsZXIgPSBzdHIgPT4gY2hhbGsuZ3JheShzdHIpO1xuICAoY21kLm9wdGlvbiBhcyBjb21tYW5kZXIuQ29tbWFuZFsnb3B0aW9uJ10pKCctYywgLS1jb25maWcgPGNvbmZpZy1maWxlPicsXG4gICAgJ1JlYWQgY29uZmlnIGZpbGVzLCBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgZmlsZXMsIHRoZSBsYXR0ZXIgb25lIG92ZXJyaWRlcyBwcmV2aW91cyBvbmUnLFxuICAgICh2YWx1ZSwgcHJldikgPT4ge1xuICAgICAgcHJldi5wdXNoKC4uLnZhbHVlLnNwbGl0KCcsJykpO1xuICAgICAgcmV0dXJuIHByZXY7XG4gICAgICAvLyByZXR1cm4gcHJldi5jb25jYXQodmFsdWUuc3BsaXQoJywnKSk7XG4gICAgfSwgW10gYXMgc3RyaW5nW10pO1xuXG4gIChjbWQub3B0aW9uIGFzIGNvbW1hbmRlci5Db21tYW5kWydvcHRpb24nXSkoJy0tcHJvcCA8ZXhwcmVzc2lvbj4nLFxuICAgICc8cHJvcGVydHkgcGF0aD49PHZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPiAuLi4gZGlyZWN0bHkgc2V0IGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcywgcHJvcGVydHkgbmFtZSBpcyBsb2Rhc2guc2V0KCkgcGF0aC1saWtlIHN0cmluZy4gZS5nLiAnICtcbiAgICAnLS1wcm9wIHBvcnQ9ODA4MCAtLXByb3AgZGV2TW9kZT1mYWxzZSAtLXByb3AgQHdmaC9mb29iYXIuYXBpPWh0dHA6Ly9sb2NhbGhvc3Q6ODA4MCAnICtcbiAgICAnLS1wcm9wIGFycmF5bGlrZS5wcm9wWzBdPWZvb2JhciAnICtcbiAgICAnLS1wcm9wIFtcIkB3ZmgvZm9vLmJhclwiLFwicHJvcFwiLDBdPXRydWUnLFxuICAgIGFycmF5T3B0aW9uRm4sIFtdIGFzIHN0cmluZ1tdKVxuICAub3B0aW9uKCctLXZlcmJvc2UnLCAnU3BlY2lmeSBsb2cgbGV2ZWwgYXMgXCJkZWJ1Z1wiJywgZmFsc2UpXG4gIC5vcHRpb24oJy0tZGV2JywgJ0J5IHR1cm5pbmcgb24gdGhpcyBvcHRpb24sJyArXG4gICAgJyBQbGluayBzZXR0aW5nIHByb3BlcnR5IFwiZGV2TW9kZVwiIHdpbGwgYXV0b21hdGNpYWxseSBzZXQgdG8gYHRydWVgLCcgK1xuICAgICcgYW5kIHByb2Nlc3MuZW52Lk5PREVfRU5WIHdpbGwgYWxzbyBiZWluZyB1cGRhdGVkIHRvIFxcJ2RldmVsb3BlbWVudFxcJyBvciBcXCdwcm9kdWN0aW9uIGNvcnJlc3BvbmRpbmdseS4gJyxcbiAgICBmYWxzZSlcbiAgLm9wdGlvbignLS1lbnYgPHNldHRpbmcgZW52aXJvbm1lbnQ+JywgJ0Egc3RyaW5nIGRlbm90ZXMgcnVudGltZSBlbnZpcm9ubWVudCBuYW1lLCBwYWNrYWdlIHNldHRpbmcgZmlsZSBtYXkgcmV0dXJuIGRpZmZlcmVudCB2YWx1ZXMgYmFzZWQgb24gaXRzIHZhbHVlIChjbGlPcHRpb25zLmVudiknKTtcbiAgaWYgKGNtZCBpbnN0YW5jZW9mIFBsaW5rQ29tbWFuZClcbiAgICBjbWQub3B0aW9uU3R5bGVyID0gdW5kZWZpbmVkO1xuICByZXR1cm4gY21kO1xufVxuIl19