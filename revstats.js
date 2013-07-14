#!/usr/bin/env node
var fsys = require('fs');
var exec = require('child_process').spawnSync;

Math.maxInArray = function (list) {
    return Math.max.apply(null, list);
};

var secondsPerDay = function() {
    return 86400 /* 60 secs * 60 mins * 24 hours */;
};

var homeDirectory = function() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

var flag = function (name) {
    var present = false;
    var double = '--' + name;
    var single = '-' + name;

    for (var arg in process.argv) {
        if (process.argv.hasOwnProperty(arg)) {
            if (process.argv[arg] === double ||
                process.argv[arg] === single
            ) {
                present = true;
                break;
            }
        }
    }

    return present;
};

var yyyymmdd = function (ts, gmt) {
    var dref = new Date(ts * 1000);

    if (gmt === true) {
        return dref.toString();
    }

    var year = dref.getFullYear();
    var month = ('0' + (dref.getMonth() + 1)).slice(-2);
    var day = ('0' + dref.getDate()).slice(-2);

    return (year + '-' + month + '-' + day);
};

var weekdayFromTime = function (ts) {
    var dref = new Date(ts * 1000);
    var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var weekday = weekdays[dref.getDay()];

    return weekday;
};

var isGit = function (folder) {
    var path = folder + '/.git/config';

    try {
        fsys.accessSync(path, fsys.F_OK);
    } catch (e) {
        return false;
    }

    return true;
};

var isMercurial = function (folder) {
    var path = folder + '/.hg/hgrc';

    try {
        fsys.accessSync(path, fsys.F_OK);
    } catch (e) {
        return false;
    }

    return true;
};

var getAllCommits = function (projects, callback) {
    var folder;
    var gitstats;
    var lines = [];
    var history = [];
    var timestamps = '';

    for (var key in projects) {
        if (projects.hasOwnProperty(key)) {
            folder = projects[key];

            if (isGit(folder)) {
                gitstats = exec('git', [
                    '--git-dir=' + folder + '/.git',
                    'log',
                    '--format=%at'
                ]);
            } else if (isMercurial(folder)) {
                gitstats = exec('hg', [
                    'log',
                    '--template={date}\n',
                    folder
                ]);
            }

            if (gitstats !== undefined && gitstats.status === 0) {
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
    var weekdays = Object.keys(calendar);
    var oneday = secondsPerDay();
    var quantity = 0;
    var counter = 0;
    var weekday = 0;
    var weeks = 0;
    var date;

    for (var ts = commits.initial; ts < commits.final; ts += oneday) {
        weeks++;
        counter++;

        date = yyyymmdd(ts);
        weekday = weekdayFromTime(ts);

        /**
         * Add padding on first calendar week.
         *
         * The first week in the calendar might contain empty days, not
         * days without commits but days that are not part of the analysis.
         * For this we have to adding a padding if the calendar starts a
         * different day than Sunday.
         */
        if (weeks === 1) {
            for (var wday in weekdays) {
                if (weekdays.hasOwnProperty(wday)) {
                    if (weekdays[wday] === weekday) {
                        break;
                    }

                    calendar[weekdays[wday]].push({date: null, commits: -1});
                }
            }
        }

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
        '\u001b[48;5;051m\u0020\u001b[0m',
        '\u001b[48;5;045m\u0020\u001b[0m',
        '\u001b[48;5;039m\u0020\u001b[0m',
        '\u001b[48;5;033m\u0020\u001b[0m',
        '\u001b[48;5;027m\u0020\u001b[0m',
    ];

    if (quantity === -1) {
        process.stdout.write('\u0020');
    } else {
        var percentage = Math.ceil((quantity * 5) / most);
        var highlight = colors[percentage - 1];

        process.stdout.write(highlight);
    }
};

var weeksInCalendar = function (calendar) {
    var total = 0;
    var weeks = 0;

    for (var key in calendar) {
        if (calendar.hasOwnProperty(key)) {
            weeks = calendar[key].length;

            if (weeks > total) {
                total = weeks;
            }
        }
    }

    return total;
};

var longestStreak = function (commits) {
    var abbr;
    var streak = 0;
    var quantity = 0;
    var streakHistory = [];
    var weeks = weeksInCalendar(commits.calendar);

    for (var week = 0; week < weeks; week++) {
        for (var day in commits.weekdays) {
            if (commits.weekdays.hasOwnProperty(day)) {
                abbr = commits.weekdays[day];

                if (commits.calendar[abbr].hasOwnProperty(week)) {
                    quantity = commits.calendar[abbr][week].commits;

                    if (quantity === 0) {
                        streakHistory.push(streak);
                        console.log(
                            '\x20\x20\x20\x20\x20',
                            'Missing commit:',
                            commits.calendar[abbr][week].date
                        );
                        streak = 0;
                    } else {
                        streak += quantity; /* Count commits */
                        // streak++; /* Count contributions */
                    }
                }
            }
        }
    }

    // Append most recent streak.
    streakHistory.push(streak);

    return Math.maxInArray(streakHistory);
};

var printCalendarHeader = function (calendar) {
    var date, month, lastMonth;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
    'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (calendar !== undefined) {
        process.stdout.write('\x20\x20\x20\x20\x20\x20');

        for (var key in calendar.Sun) {
            if (calendar.Sun.hasOwnProperty(key)) {
                date = new Date(calendar.Sun[key].date);
                month = date.getMonth();

                if (month !== lastMonth) {
                    lastMonth = month;
                    process.stdout.write(months[month] + '\x20');
                }
            }
        }

        process.stdout.write('\n');
    }
};

var renderCalendar = function (commits) {
    var productivity = getProductivityStats(commits);
    var commitsPerDay = 0;

    printCalendarHeader(commits.calendar);

    for (var abbr in commits.calendar) {
        if (commits.calendar.hasOwnProperty(abbr)) {
            var todalDays = commits.calendar[abbr].length;

            process.stdout.write(abbr + '\x20\x20\x20');

            for (var key = 0; key < todalDays; key++) {
                commitsPerDay = commits.calendar[abbr][key].commits;

                if (commitsPerDay === 0) {
                    process.stdout.write('\u001b[0;90m\u2591\u001b[0m');
                } else {
                    colorizeCommits(commitsPerDay, productivity.most);
                }
            }

            process.stdout.write('\n');
        }
    }

    if (commits.calendar && flag('details')) {
        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Oldest: ' + new Date(commits.oldest * 1000).toString() + '\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Newest: ' + new Date(commits.newest * 1000).toString() + '\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Most Productive Day: ' + productivity.most + ' commits\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Less Productive Day: ' + productivity.less + ' commits\n');

        var streak = longestStreak(commits);
        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Longest Streak: ' + streak + '\n');
    }
};

var settings = homeDirectory() + '/.revstats.json';

fsys.readFile(settings, 'utf8', function (err, content) {
    if (err) {
        throw err;
    } else {
        var projects = JSON.parse(content);

        getAllCommits(projects, function (commits) {
            var stats = countCommits(commits);
            var calendar = populateCalendar(stats);

            renderCalendar(calendar);
        });
    }
});
