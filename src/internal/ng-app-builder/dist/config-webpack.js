"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable no-console */
const chunk_info_1 = require("./plugins/chunk-info");
/* tslint:disable max-line-length */
const gzip_size_1 = require("./plugins/gzip-size");
const _ = require("lodash");
const fs = require("fs");
const util_1 = require("util");
const Path = require("path");
const webpack = require('webpack');
function changeWebpackConfig(param, webpackConfig, drcpConfig) {
    // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    console.log('>>>>>>>>>>>>>>>>> changeWebpackConfig >>>>>>>>>>>>>>>>>>>>>>');
    if (param.browserOptions.drcpArgs.report || (param.browserOptions.drcpArgs.openReport)) {
        // webpackConfig.plugins.unshift(new BundleAnalyzerPlugin({
        // 	analyzerMode: 'static',
        // 	reportFilename: 'bundle-report.html',
        // 	openAnalyzer: options.drcpArgs.openReport
        // }));
        webpackConfig.plugins.push(new chunk_info_1.default());
    }
    if (_.get(param, 'builderConfig.options.hmr'))
        webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    if (!drcpConfig.devMode) {
        console.log('Build in production mode');
        webpackConfig.plugins.push(new gzip_size_1.default());
    }
    changeLoaders(webpackConfig);
    fs.writeFileSync('dist/ng-webpack-config.js', printConfig(webpackConfig));
    console.log('If you are wondering what kind of Webapck config file is used internally, checkout dist/ng-webpack-config.js');
    return webpackConfig;
}
exports.default = changeWebpackConfig;
function changeLoaders(webpackConfig) {
    let devMode = webpackConfig.mode === 'development';
    webpackConfig.resolveLoader = {
        modules: ['node_modules']
    };
    webpackConfig.module.rules.forEach((rule) => {
        let test = rule.test;
        if (rule.test instanceof RegExp && rule.test.toString() === '/\\.html$/') {
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, {
                test,
                use: [
                    { loader: 'raw-loader' },
                    { loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader') },
                    // {loader: '@dr/translate-generator'},
                    { loader: '@dr/template-builder' }
                ]
            });
        }
        else if (rule.loader === 'file-loader') {
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, {
                test: /\.(eot|woff2|woff|ttf|svg|cur)$/,
                use: [{ loader: 'lib/dr-file-loader' }]
            });
        }
        else if (rule.loader === 'url-loader') {
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, {
                test,
                use: [{
                        loader: 'url-loader',
                        options: {
                            limit: !devMode ? 10000 : 1,
                            fallback: '@dr-core/webpack2-builder/lib/dr-file-loader'
                        }
                    }
                ]
            });
        }
        else if (rule.use) {
            for (let useItem of rule.use) {
                if (useItem.loader === 'less-loader' && _.has(useItem, 'options.paths')) {
                    delete useItem.options.paths;
                    break;
                }
            }
        }
    });
    webpackConfig.module.rules.unshift({
        test: /\.jade$/,
        use: [
            { loader: 'html-loader', options: { attrs: 'img:src' } },
            { loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader') },
            // {loader: '@dr/translate-generator'},
            { loader: '@dr-core/webpack2-builder/lib/jade-to-html-loader' }
        ]
    }, {
        test: /\.md$/,
        use: [
            { loader: 'html-loader', options: { attrs: 'img:src' } },
            { loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader') },
            { loader: '@dr-core/webpack2-builder/lib/markdown-loader' }
        ]
    }, {
        test: /\.txt$/,
        use: { loader: 'raw-loader' }
    }, {
        test: /\.(yaml|yml)$/,
        use: [
            { loader: 'json-loader' },
            { loader: 'yaml-loader' }
        ]
    });
}
function printConfig(c, level = 0) {
    var indent = _.repeat('  ', level);
    var out = '{\n';
    _.forOwn(c, (value, prop) => {
        out += indent + `  ${JSON.stringify(prop)}: ${printConfigValue(value, level)},\n`;
    });
    out += indent + '}';
    return out;
}
function printConfigValue(value, level) {
    var out = '';
    var indent = _.repeat('  ', level);
    if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
        out += JSON.stringify(value) + '';
    }
    else if (Array.isArray(value)) {
        out += '[\n';
        value.forEach((row) => {
            out += indent + '    ' + printConfigValue(row, level + 1);
            out += ',\n';
        });
        out += indent + '  ]';
    }
    else if (_.isFunction(value)) {
        out += value.name + '()';
    }
    else if (util_1.isRegExp(value)) {
        out += `${value.toString()}`;
    }
    else if (_.isObject(value)) {
        let proto = Object.getPrototypeOf(value);
        if (proto && proto.constructor !== Object) {
            out += `new ${proto.constructor.name}()`;
        }
        else {
            out += printConfig(value, level + 1);
        }
    }
    else {
        out += ' unknown';
    }
    return out;
}

//# sourceMappingURL=config-webpack.js.map