# Liturgy of the Hours

This a a digital liturgy of the hours. It is an attempt to help us mine the vast resources of prayers in the book of common prayer and elsewhere, and practice the patterns of prayer that Christians have practiced for millenia in a format that accounts for our habit of checking our phones too often.

The project is live [here](https://dev.infopanel.org), and you can get reminders throughout the day by following [@ctpbot](https://twitter.com/ctpbot) on twitter.

## Features

* 7 sets of 3-5 minute daily prayers every day
* prayers are pseudo-randomly generated so they're always different
* there's currently a database nearly 500 prayers, so there's usually something new
* prayers are currently very roughly organized around 7 themes
  1. Praise
  2. Petition
  3. Wisdom
  4. Hope
  5. Thanksgiving
  6. Penitence
  7. Rest
* Daily calls to prayer from a twitter bot
* Seasonal color changes
* Little indicator dots that indicate how many people have accessed these prayers lately
* offline cache

## Hidden Features
* see all the back-end parts at /list/
* access the bible at /bible/
* tap anything 5 times fast and you can edit it!

## Details
* Data is stored in mongodb
* Everything is done in NodeJS, served with ExpressJS because I have a day job and I don't have enough time to keep multiple programming languages straight.
* prayers are cached for an hour, so we don't have to hit the database every time someone accesses the same prayer,
* scriptures are also cached the first time they're accessed so I don't unnecessarily call the ESV API too much, also for speed.
* access to bible text is through the [ESV API](https://api.esv.org/v3/docs/) v3, which is fantastic.
* using the [Bulma](https://bulma.io/) stylesheet, which is also fantastic.
* touch events with [hammer.js](https://hammerjs.github.io/)
* using the [jade/pug](https://pugjs.org/api/getting-started.html) template engine which I only used because it was included with express, but it makes html so darn clean I don't know what I ever did without it.

## Formatting

For the most part, text is markdown formatted, but I've made some special custom notations for formatting that comes up a lot in these sorts of prayers

```
>   Indented Line
>*  Indented Italic Line
>** Indented Bold Line
```

## To Do
* better logic for picking parts - need priority/fallback options
* better part tagging
* multiple time zone support, right now anyone more than an hour off of CST is SOL.
* implement localized/occasional prayers/of the people
* animations?
* get the twitter bot to respond to DMs and let people get custom DMs for personalized schedules
* better offline cache update system, browser push notifications (which don't work in mobile safari)
* native app - because of aforesaid Safari limitation
* better password protection

## Disclaimer

This is very much a work in progress, both philosophically and technologically. Comments and suggestions very welcome: root at/@ infopanel.org or @ctpbot.

I'm a total novice programmer. The fact that this thing works at all is miraculous.
