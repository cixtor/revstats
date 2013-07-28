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

var countCommits = function (commits) {
    if (commits.length > 0) {
        var oldest = commits[0];
        var newest = commits[0];
        var history = {};
        var line, date;

        for (var key in commits) {
            if (commits.hasOwnProperty(key) && commits[key] !== '') {
                line = commits[key];
                date = yyyymmdd(commits[key]);

                if (line >= newest) {
                    newest = line;
                }

                if (line <= oldest) {
                    oldest = line;
                }

                if (history.hasOwnProperty(date)) {
                    history[date]++;
                } else {
                    history[date] = 1;
                }
            }
        }

        var oneday = secondsPerDay();
        var current = new Date(oldest * 1000);
        var initial = current.getTime() / 1000;
        var maximum = Math.ceil((newest - oldest) / oneday);
        var final = initial + (oneday * maximum);
        var today = Math.floor(new Date().getTime() / 1000);
        var lastYear = today - (365 * oneday);

        if (lastYear < initial) {
            initial = lastYear;
        }

        if (today > final) {
            final = today;
        }

        return {
            history: history,
            initial: initial,
            oldest: oldest,
            newest: newest,
            final: final
        };
    }

    return false;
};
