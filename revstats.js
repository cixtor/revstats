#!/usr/bin/env node
/* jshint maxdepth: 6 */
/* jshint forin: false */

/**
 * Revision Control Statistics
 *
 * http://cixtor.com/
 * https://github.com/cixtor/revstats
 * https://en.wikipedia.org/wiki/Revision_control
 * https://en.wikipedia.org/wiki/Git_(software)
 * https://en.wikipedia.org/wiki/Mercurial
 * https://en.wikipedia.org/wiki/Apache_Subversion
 *
 * A component of software configuration management, revision control, also
 * known as version control or source control, is the management of changes to
 * documents, computer programs, large web sites, and other collections of
 * information. Changes are usually identified by a number or letter code, each
 * revision is associated with a timestamp and the person making the change.
 *
 * The profile contributions graph is a record of contributions you have made to
 * VCS (Version Control System) repositories but they are only counted if they
 * meet certain criteria. Commits will appear on your contributions graph if
 * they meet all of the following conditions:
 *
 * - The commits were made within the past year.
 * - The commits were made in a standalone repository, not a fork.
 * - The commits were made in the repository's default branch.
 */

var fsys = require('fs');
var exec = require('child_process').spawnSync;

Math.maxInArray = function (list) {
    return Math.max.apply(null, list);
};

var println = function(text) {
    process.stdout.write(text + '\n');
};

var printUsageAndOptions = function() {
    println('Revision Control Statistics');
    println('  http://cixtor.com/');
    println('  https://github.com/cixtor/revstats');
    println('  https://en.wikipedia.org/wiki/Revision_control');
    println('  https://en.wikipedia.org/wiki/Git_(software)');
    println('  https://en.wikipedia.org/wiki/Mercurial');
    println('  https://en.wikipedia.org/wiki/Apache_Subversion');
    println('Usage:');
    println('  -help      Displays this message.');
    println('  -details   Displays streak and productivity data.');
    println('  -missing   Displays empty days between the calendar.');
    println('  -color     Colors for the calendar: yellow, blue, red, green, purple, mixed');
    println('  -repo      Displays the contributions in a specific repository');
    println('  -year      Displays the contributions in a specific year');
    process.exit(2);
};

var defaultColorScheme = function () {
    return 'green';
};

var availableColorSchemes = function () {
    return {
        'mixed':  ['001', '003', '005', '004', '002'],
        'yellow': ['226', '220', '214', '208', '202'],
        'blue':   ['045', '039', '033', '027', '021'],
        'red':    ['196', '197', '198', '199', '200'],
        'green':  ['047', '041', '035', '029', '023'],
        'purple': ['117', '111', '105', '099', '093'],
    };
};

var secondsPerDay = function() {
    return 86400 /* 60 secs * 60 mins * 24 hours */;
};

var homeDirectory = function() {
    return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
};

var nextFlag = function (pos) {
    var npos = parseInt(pos) + 1;

    if (process.argv.hasOwnProperty(npos)) {
        return process.argv[npos];
    }

    return null;
};

var flag = function (name, next) {
    var present = false;
    var double = '--' + name;
    var single = '-' + name;

    for (var arg in process.argv) {
        if (process.argv.hasOwnProperty(arg)) {
            if (process.argv[arg] === double ||
                process.argv[arg] === single
            ) {
                if (next === true) {
                    return nextFlag(arg);
                }

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

var getWeekdays = function () {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
};

var getMonthAbbrs = function () {
    return [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ];
};

var yearFromTime = function (ts) {
    return new Date(ts * 1000).getFullYear();
};

var weekdayFromTime = function (ts) {
    var weekdays = getWeekdays();
    var dref = new Date(ts * 1000);

    return weekdays[dref.getDay()];
};

var getEmptyCalendar = function () {
    var weekdays = getWeekdays();
    var calendar = {/* Empty object */};

    for (var idx in weekdays) {
        if (weekdays.hasOwnProperty(idx)) {
            calendar[weekdays[idx]] = [/* Empty list */];
        }
    }

    return calendar;
};

var fileExists = function (path) {
    try {
        fsys.accessSync(path, fsys.F_OK);
    } catch (e) {
        return false;
    }

    return true;
};

var isGit = function (folder) {
    return fileExists(folder + '/.git/config');
};

var isMercurial = function (folder) {
    return fileExists(folder + '/.hg/hgrc');
};

var isSubversion = function (folder) {
    return fileExists(folder + '/.svn/wc.db');
};

var extractTimestamps = function (output, fixTimes) {
    var maxTimeLength = 13;
    var lines = output.split('\n');

    if (fixTimes && lines.hasOwnProperty(0)) {
        var diff = (lines[0].length - maxTimeLength);
        var power = Math.pow(10, diff);

        lines = lines.map(function (value) {
            return (value / power);
        });
    }

    return lines;
};

var getAllCommits = function (projects, callback) {
    var folder;
    var gitstats;
    var lines = [];
    var output = '';
    var history = [];
    var fixTimes = false;

    for (var key in projects) {
        if (!projects.hasOwnProperty(key)) {
            continue;
        }

        folder = projects[key];

        if (isGit(folder)) {
            fixTimes = false /* [0-9]{10} */;
            gitstats = exec('git', [
                '--git-dir=' + folder + '/.git',
                'log',
                '--format=%at'
            ]);
        } else if (isMercurial(folder)) {
            fixTimes = false /* [0-9]{10}\.[0-9]{6} */;
            gitstats = exec('hg', [
                'log',
                '--template={date}\n',
                folder
            ]);
        } else if (isSubversion(folder)) {
            fixTimes = true /* [0-9]{16} */;
            gitstats = exec('sqlite3', [
                folder + '/.svn/wc.db',
                'SELECT changed_date FROM NODES;'
            ]);
        }

        if (gitstats !== undefined && gitstats.status === 0) {
            output = gitstats.stdout.toString();
            lines = extractTimestamps(output, fixTimes);
            history = history.concat(lines);
        }
    }

    callback(history);
};

var countCommits = function (commits) {
    if (commits.length < 1) {
        return false;
    }

    var thisYear = '0000'; /* date:yyyy */
    var filterYear = flag('year', true);
    var oldest = commits[0];
    var newest = commits[0];
    var history = {};
    var line, date;

    for (var key in commits) {
        if (!commits.hasOwnProperty(key) || commits[key] === '') {
            continue;
        }

        line = commits[key];
        date = yyyymmdd(commits[key]);
        thisYear = date.substring(0, 4);

        /* Do not count commits from other years */
        if (filterYear !== null &&
            filterYear !== false &&
            filterYear !== thisYear) {
            continue;
        }

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

    var oneday = secondsPerDay();
    var inidate = new Date(oldest * 1000);
    var initial = inidate.getTime() / 1000;
    var maximum = Math.ceil((newest - oldest) / oneday);
    var final = initial + (oneday * maximum);

    /**
     * Fix initial date of the oldest commit.
     *
     * If the oldest commit starts in the middle of the year we have to
     * recalculate the initial date to start from Jan 01 of the same year,
     * this will give us the ability to render a full calendar as we will
     * have access to all days.
     */
    var oldYear = new Date(initial * 1000).getFullYear();
    var oldDate = (oldYear).toString() + '-01-01 00:00:01';
    initial = new Date(oldDate).getTime();

    /**
     * Fix final date of the newest commit.
     *
     * If the newest commit finishes in the middle of the year we have to
     * recalculate the final date to end at Dec 31 of the same year, this
     * will give us the ability to render a full calendar as we will have
     * access to all days.
     */
    var newYear = new Date(final * 1000).getFullYear();
    var newDate = (newYear).toString() + '-12-31 23:59:59';
    final = new Date(newDate).getTime();

    // Mark today as the last contribution.
    var today = new Date();
    var todayTime = (today.getTime() / 1000);
    var todayDate = yyyymmdd(todayTime);

    // Calculate total years.
    var years = (newYear - oldYear);
    initial = (initial / 1000);
    final = (final / 1000);

    return {
        todayDate: todayDate,
        todayTime: todayTime,
        history: history,
        initial: initial,
        oldest: oldest,
        newest: newest,
        final: final,
        years: years
    };
};

var populateCalendar = function (commits) {
    var calendar = {/* Empty object */};
    var unified = getEmptyCalendar();
    var data = {/* Empty object */};
    var weekdays = getWeekdays();
    var oneday = secondsPerDay();
    var quantity = 0;
    var counter = 0;
    var weekday = 0;
    var weeks = 0;
    var year = 0;
    var date;

    for (var ts = commits.initial; ts < commits.final; ts += oneday) {
        date = yyyymmdd(ts);
        year = yearFromTime(ts);
        weekday = weekdayFromTime(ts);

        // Append weekdays in empty year.
        if (!calendar.hasOwnProperty(year)) {
            calendar[year] = getEmptyCalendar();
            weeks = 1 /* Reset first year week */;
        }

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
                if (weekdays[wday] === weekday) {
                    break;
                }

                data = {date: null, commits: -1};
                calendar[year][weekdays[wday]].push(data);

                if (counter === 0) { /* Only first week */
                    unified[weekdays[wday]].push(data);
                }
            }
        }

        if (commits.history.hasOwnProperty(date)) {
            quantity = commits.history[date];
        } else {
            quantity = 0;
        }

        data = {date: date, commits: quantity};
        calendar[year][weekday].push(data);
        unified[weekday].push(data);
        counter++;
        weeks++;
    }

    commits.calendar = calendar;
    commits.weekdays = weekdays;
    commits.unified = unified;

    return commits;
};

var getProductivityStats = function (commits) {
    var total = 0;
    var quantity = 0;
    var mostProdDay = 0;
    var lessProdDay = 1;

    for (var key in commits.history) {
        if (!commits.history.hasOwnProperty(key)) {
            continue;
        }

        quantity = commits.history[key];

        if (quantity < 1) {
            continue;
        }

        total += quantity;

        if (quantity > mostProdDay) {
            mostProdDay = quantity;
        }

        if (quantity < lessProdDay) {
            lessProdDay = quantity;
        }
    }

    return {
        most: mostProdDay,
        less: lessProdDay,
        total: total
    };
};

var getColorScheme = function () {
    var color = flag('color', true);
    var schemes = availableColorSchemes();

    if (!schemes.hasOwnProperty(color)) {
        color = defaultColorScheme();
    }

    return schemes[color];
};

var getCalendarColors = function () {
    var colors = getColorScheme();
    var template = '\u001b[48;5;{{COLOR}}m\u0020\u001b[0m';

    colors = colors.map(function (color) {
        return template.replace('{{COLOR}}', color);
    });

    return colors;
};

var colorizeCommits = function (colors, quantity, most) {
    if (quantity === -1) {
        process.stdout.write('\u0020');
        return;
    }

    var percentage = Math.ceil((quantity * 5) / most);
    var highlight = colors[percentage - 1];

    process.stdout.write(highlight);
};

var weeksInCalendar = function (calendar) {
    var total = 0;
    var weeks = 0;

    for (var key in calendar) {
        if (!calendar.hasOwnProperty(key)) {
            continue;
        }

        weeks = calendar[key].length;

        if (weeks > total) {
            total = weeks;
        }
    }

    return total;
};

var longestStreak = function (commits) {
    var weekday, weeks, data;
    var started = false;
    var finished = false;
    var streak = {days: 0, marks: 0};
    var history = {days: [], marks: []};
    var printMissing = flag('missing');
    var filterYear = flag('year', true);
    var thisYear = '0000'; /* missing commits*/

    weeks = weeksInCalendar(commits.unified);

    for (var week = 0; week < weeks; week++) {
        for (var day in commits.weekdays) {
            weekday = commits.weekdays[day];

            if (!commits.unified[weekday].hasOwnProperty(week)) {
                continue;
            }

            data = commits.unified[weekday][week];

            if (data.date === commits.todayDate) {
                finished = true;
            }

            if (data.commits === 0) {
                history.marks.push(streak.marks);
                history.days.push(streak.days);
                streak.marks = 0;
                streak.days = 0;

                if (printMissing && started && !finished) {
                    thisYear = data.date.substring(0, 4);

                    /* Skip if commits are from different year */
                    if (filterYear !== null &&
                        filterYear !== false &&
                        filterYear !== thisYear) {
                        continue;
                    }

                    console.log(
                        '\x20\x20\x20\x20\x20',
                        'Missing commit:',
                        data.date
                    );
                }
            } else if (data.commits > 0) {
                started = true; /* Started contributions */
                streak.days += 1; /* Count contributions */
                streak.marks += data.commits; /* Count commits */
            }
        }
    }

    // Append most recent streak.
    history.days.push(streak.days);
    history.marks.push(streak.marks);

    return {
        days: Math.maxInArray(history.days),
        marks: Math.maxInArray(history.marks)
    };
};

var printCalendarHeader = function (year, calendar) {
    var months = getMonthAbbrs();
    var header = [];
    var month = null;
    var counter = -1;
    var lastMonth = null;
    var partLength = 0;
    var partDiff = 0;

    if (calendar !== undefined) {
        for (var index in calendar.Sun) {
            if (calendar.Sun.hasOwnProperty(index) && index > 0) {
                month = new Date(calendar.Sun[index].date).getMonth();

                if (month !== lastMonth) {
                    lastMonth = month;
                    header.push(months[month]);
                    counter++;
                } else {
                    header[counter] += '\u0020';
                }
            }
        }

        process.stdout.write(year);
        process.stdout.write('\u0020\u0020');

        for (var part in header) {
            if (!header.hasOwnProperty(part)) {
                continue;
            }

            partLength = header[part].length;

            if (partLength >= 5) {
                partDiff = (partLength - 2);
                process.stdout.write(header[part].slice(0, partDiff));
            } else {
                process.stdout.write('\u0020');
            }
        }

        process.stdout.write('\n');
    }
};

var renderCalendar = function (commits) {
    var productivity = getProductivityStats(commits);
    var yearCommits = {/* Empty object */};
    var filterYear = flag('year', true);
    var colors = getCalendarColors();
    var commitsPerDay = 0;

    // Convert filtered year into a valid integer.
    filterYear = parseInt(filterYear);

    for (var year in commits.calendar) {
        if ((!filterYear || parseInt(year) === filterYear)) {
            yearCommits = commits.calendar[year];

            printCalendarHeader(year, yearCommits);

            for (var weekday in yearCommits) {
                if (!yearCommits.hasOwnProperty(weekday)) {
                    continue;
                }

                var todalDays = yearCommits[weekday].length;

                process.stdout.write(weekday + '\u0020\u0020\u0020');

                for (var key = 0; key < todalDays; key++) {
                    commitsPerDay = yearCommits[weekday][key].commits;

                    if (commitsPerDay === 0) {
                        process.stdout.write('\u001b[0;90m\u2591\u001b[0m');
                    } else {
                        colorizeCommits(colors, commitsPerDay, productivity.most);
                    }
                }

                process.stdout.write('\n');
            }

            process.stdout.write('\n');
        }
    }

    if (commits.calendar && (flag('details') || flag('missing'))) {
        var colorScale = '';
        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        for (var idx = 0; idx < 5; idx++) {
            colorScale += colors[idx] + colors[idx];
        }
        process.stdout.write('Less ' + colorScale + ' More\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Oldest: ' + new Date(commits.oldest * 1000).toString() + '\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Newest: ' + new Date(commits.newest * 1000).toString() + '\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Most Productive Day: ' + productivity.most + ' commits\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Less Productive Day: ' + productivity.less + ' commits\n');

        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Total Commits: ' + productivity.total + ' commits\n');

        var streak = longestStreak(commits);
        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Longest Streak: ' + streak.marks + ' commits\n');
        process.stdout.write('\x20\x20\x20\x20\x20\x20');
        process.stdout.write('Longest Streak: ' + streak.days + ' days\n');
    }
};

var settings = homeDirectory() + '/.revstats.json';

if (flag('help')) {
    printUsageAndOptions();
}

fsys.readFile(settings, 'utf8', function (err, content) {
    if (err) {
        println('Missing ~/.revstats.json file');
        printUsageAndOptions();
        return;
    }

    var projects = [/* Empty list */];
    var repo = flag('repo', true);

    if (fileExists(repo)) {
        projects = [repo];
    } else {
        projects = JSON.parse(content);
    }

    getAllCommits(projects, function (commits) {
        var stats = countCommits(commits);
        var calendar = populateCalendar(stats);

        renderCalendar(calendar);
    });
});
