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

var populateCalendar = function (commits) {
    var calendar = {
        'Sun': [],
        'Mon': [],
        'Tue': [],
        'Wed': [],
        'Thu': [],
        'Fri': [],
        'Sat': [],
    };
    var daysPerWeek = 7; /* Number of days per week */
    var weekdays = Object.keys(calendar);
    var oneday = secondsPerDay();
    var position = 0;
    var quantity = 0;
    var modulus = 0;
    var counter = 0;
    var weekday = 0;
    var date;

    for (var ts = commits.initial; ts < commits.final; ts += oneday) {
        counter++;
        modulus = (counter % daysPerWeek);

        if (modulus === 0) {
            modulus = daysPerWeek;
        }

        date = yyyymmdd(ts);
        position = (modulus - 1);
        weekday = weekdays[position];

        if (commits.history.hasOwnProperty(date)) {
            quantity = commits.history[date];
        } else {
            quantity = 0;
        }

        calendar[weekday].push({date: date, commits: quantity});
    }

    commits.calendar = calendar;
    commits.weekdays = weekdays;

    return commits;
};

var getProductivityStats = function (commits) {
    var quantity = 0;
    var mostProdDay = 0;
    var lessProdDay = 1;

    for (var key in commits.history) {
        if (commits.history.hasOwnProperty(key)) {
            quantity = commits.history[key];

            if (quantity > 0) {
                if (quantity > mostProdDay) {
                    mostProdDay = quantity;
                }

                if (quantity < lessProdDay) {
                    lessProdDay = quantity;
                }
            }
        }
    }

    return {most: mostProdDay, less: lessProdDay};
};

var colorizeCommits = function (quantity, most) {
    var colors = [
        '\u001b[48;5;046m\u0020\u001b[0m',
        '\u001b[48;5;040m\u0020\u001b[0m',
        '\u001b[48;5;034m\u0020\u001b[0m',
        '\u001b[48;5;028m\u0020\u001b[0m',
        '\u001b[48;5;022m\u0020\u001b[0m',
    ];

    var percentage = Math.ceil((quantity * 5) / most);
    var highlight = colors[percentage - 1];

    process.stdout.write(highlight);
};
