#!/usr/bin/env node
var exec = require('child_process').spawnSync;

var projects = [process.argv[2]];

var getAllCommits = function (projects, callback) {
    var folder;
    var gitstats;
    var lines = [];
    var history = [];
    var timestamps = '';

    for (var key in projects) {
        if (projects.hasOwnProperty(key)) {
            folder = projects[key] + '/.git';
            gitstats = exec('git', ['--git-dir=' + folder, 'log', '--format=%at']);

            if (gitstats.status === 0) {
                timestamps = gitstats.stdout.toString();
                lines = timestamps.split('\n');
                history = history.concat(lines);
            }
        }
    }

    callback(history);
};
