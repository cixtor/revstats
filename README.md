### Revision Control Statistics

GitHub introduced a [calendar with the contributions](https://github.com/blog/1360-introducing-contributions) associated to each user account back in 2013. The contributions calendar shows how frequently you've been contributing over the past year. However, this only applies to contributions to public repositories hosted on GitHub, and as of May 19, 2016 they [allowed private repositories](https://github.com/blog/2173-more-contributions-on-your-profile) too. This also makes it easier to see what others are working on in your Organization. Any repositories you have in common with the profile you're viewing are shown in this list.

But what about your contributions in private projects hosted in other services? This project aims to allow people to see their contributions int he same format as GitHub pointing the script to the directories where the private repositories reside in your computer's disk.

### Features

The script can process multiple repositories at the same time, you just need to include a hidden JSON file in your home directory named `.revstats.json` with a list of the directories that you want to analyze. Currently the script supports Git, Mercurial, and Subversion repositories; more may be added in the future.

- [x] Git — https://en.wikipedia.org/wiki/Git_(software)
- [x] Mercurial — https://en.wikipedia.org/wiki/Mercurial
- [x] Subversion — https://en.wikipedia.org/wiki/Apache_Subversion

```shell
$ cat ~/.revstats.json
[
  "/home/username/projects/git-repository",
  "/home/username/projects/mercurial-repo",
  "/home/username/projects/subversion-repo"
]
```

- [x] `-help` — Displays usage and copyright information.
- [x] `-details` — Displays streak and productivity data.
- [x] `-missing` — Displays empty days between the calendar.
- [x] `-color` — Colors for the calendar: yellow, blue, red, green, purple, mixed
- [x] `-repo` — Displays the contributions in a specific repository
- [x] `-year` — Displays the contributions in a specific year

![Contribution Calendar](screenshot.png)

### Public Non-Code Contributions

GitHub not only counts the number commits and pull-requests but also when you open an issue. If you are using this tool offline it is be a good idea to include references to public issues that you have open so far.

- [x] _(2013-06-24)_ gbrindisi/xsssniper/issues/4
- [x] _(2013-06-24)_ RandomStorm/DVWA/issues/3
- [x] _(2013-06-24)_ RandomStorm/DVWA/issues/2
- [x] _(2013-06-24)_ RandomStorm/DVWA/issues/1
- [x] _(2013-06-24)_ wpscanteam/wpscan/issues/234
- [x] _(2013-06-24)_ wpscanteam/wpscan/issues/233
- [x] _(2013-07-27)_ Kindari/laravel-markdown/issues/1
- [x] _(2013-08-14)_ nwjs/nw.js/issues/993
- [x] _(2013-08-15)_ appjs/appjs/issues/381
- [x] _(2013-08-30)_ cixtor/mamutools/issues/1
- [x] _(2013-10-04)_ laravel/laravel/issues/2341
- [x] _(2013-10-25)_ jfmatt/twittertron-interface/issues/1
- [x] _(2013-10-25)_ proimond/formularios_cnc/issues/1
- [x] _(2013-10-25)_ epan/gmaps/issues/1
- [x] _(2013-10-27)_ fundar/itdp/issues/1
- [x] _(2013-10-27)_ moonhj00/scripts/issues/1
- [x] _(2013-10-27)_ jrodwell/ballball/issues/1
- [x] _(2013-10-27)_ mattoliveirabsb/socialdev/issues/1
- [x] _(2013-10-27)_ RemanenceStudio/intuisens/issues/1
- [x] _(2013-10-27)_ mchogithub/opencrm/issues/1
- [x] _(2013-10-27)_ jonarrien/BackboneExample/issues/1
- [x] _(2013-10-27)_ artisanchurch/prototype/issues/1
- [x] _(2013-10-27)_ NightWoo/ams/issues/1
- [x] _(2013-10-27)_ virusvn/iMeeting/issues/1
- [x] _(2014-03-02)_ spadgos/sublime-jsdocs/issues/254
- [x] _(2014-03-03)_ spadgos/sublime-jsdocs/issues/255
- [x] _(2014-03-30)_ sayakb/sticky-notes/issues/99
- [x] _(2016-06-16)_ sucuri/sucuri-wordpress-plugin/pull/9
- [x] _(2016-06-16)_ sucuri/sucuri-wordpress-plugin/pull/10
- [x] _(2016-07-05)_ sucuri/sucuri-wordpress-plugin/pull/12
- [x] _(2016-07-05)_ sucuri/sucuri-wordpress-plugin/pull/13
- [x] _(2016-07-05)_ sucuri/sucuri-wordpress-plugin/pull/14
- [x] _(2016-07-05)_ sucuri/sucuri-wordpress-plugin/pull/15
- [x] _(2016-07-06)_ sucuri/sucuri-wordpress-plugin/pull/16
- [x] _(2016-07-06)_ sucuri/sucuri-wordpress-plugin/pull/17
- [x] _(2016-10-01)_ dz0ny/gobu/commit/8b5162f
- [x] _(2016-10-01)_ dz0ny/gobu/commit/b154a53
- [x] _(2016-10-01)_ dz0ny/gobu/commit/7f34e4f

### License

```
The MIT License (MIT)

Copyright (c) 2016 CIXTOR

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
