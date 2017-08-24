/**
 *
 * 更多文件匹配规则
 * @see https://github.com/isaacs/node-glob
 */
'use strict';

var path = require('path');
var fs = require('fs');
var util = require('util');
var url = require('url');
var endsWith = require('lodash.endswith');
var packingGlob = require('packing-glob');
var mkdirp = require('mkdirp');

function ReplaceHashPlugin(options) {
    // search
    this.options = options || {};
    if (!this.options.exts) {
        this.options.exts = ['js'];
    }
}

ReplaceHashPlugin.prototype.apply = function (compiler) {
    var self = this;
    self.options.cwd = self.options.cwd ? (path.isAbsolute(self.options.cwd) ? self.options.cwd : path.resolve(compiler.options.context, self.options.cwd)) : compiler.options.context;
    self.options.dest = path.isAbsolute(self.options.dest) ? self.options.dest : path.resolve(process.cwd(), self.options.dest);

    compiler.plugin('done', function (stats) {

        var publicPath = compiler.options.output.publicPath;
        var jsChunkFileName = compiler.options.output.filename;

        var patterns = self.options.src;
        packingGlob(patterns, self.options)
            .forEach(function (file) {
                var fullpath = path.join(self.options.cwd, file);
                var data = fs.readFileSync(fullpath, 'utf8');

                Object.keys(stats.compilation.assets)
                    .filter(function (item) {
                        return self.options.exts.some(function (e) {
                            return endsWith(item, e);
                        });
                    })
                    .forEach(function (item) {
                        var ext = path.extname(item); //.js
                        var name = path.basename(item, ext); //main-e1bb26
                        var filename = jsChunkFileName;
                        data = self.doReplace(self.options.search, item, data);
                    });


                var dest = path.resolve(self.options.dest, file);
                var destDir = path.dirname(dest);
                if (!fs.existsSync(destDir)) {
                    mkdirp.sync(destDir);
                }
                fs.writeFileSync(dest, data);
                console.log('%s created.', dest);

            });
    });
};

ReplaceHashPlugin.prototype.doReplace = function (oldPath, newPath, data) {
    data = data.replace(oldPath, newPath);
    return data;
}

module.exports = ReplaceHashPlugin;
