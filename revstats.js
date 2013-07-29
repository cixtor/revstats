#!/usr/bin/env node
var exec = require('child_process').spawnSync;

var projects = [process.argv[2]];

var secondsPerDay = function() {
    return 86400 /* 60 secs * 60 mins * 24 hours */;
};

var yyyymmdd = function(ts, gmt) {
    var dref = new Date(ts * 1000);

    if (gmt === true) {
        return dref.toString();
    }

    var year = dref.getFullYear();
    var month = ('0' + (dref.getMonth() + 1)).slice(-2);
    var day = ('0' + dref.getDate()).slice(-2);

    return (year + '-' + month + '-' + day);
};

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
